"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { EquipmentItem, LayerMode } from "@/lib/biomed-data";

interface DeviceSceneProps {
  equipment: EquipmentItem;
  layerMode: LayerMode;
  activeHotspotId: string;
  onHotspotSelect: (hotspotId: string) => void;
}

type HotspotMesh = THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;

const importedModelPoses: Partial<
  Record<
    EquipmentItem["id"],
    {
      rotationX: number;
      rotationY: number;
      scale: number;
      position: [number, number, number];
    }
  >
> = {
  "patient-monitor": {
    rotationX: -0.04,
    rotationY: -0.28,
    scale: 2.48,
    position: [0.04, 0.34, 0],
  },
  "infusion-pump": {
    rotationX: -0.05,
    rotationY: 0.18,
    scale: 2.62,
    position: [0.08, 0.34, 0],
  },
  defibrillator: {
    rotationX: -0.06,
    rotationY: -0.2,
    scale: 2.92,
    position: [0.02, 0.34, 0],
  },
  ventilator: {
    rotationX: -0.06,
    rotationY: -0.18,
    scale: 3.16,
    position: [-0.14, 0.34, 0],
  },
  autoclave: {
    rotationX: -0.07,
    rotationY: -0.26,
    scale: 2.78,
    position: [0.02, 0.32, 0],
  },
  "neonatal-incubator": {
    rotationX: -0.05,
    rotationY: -0.24,
    scale: 2.9,
    position: [0.04, 0.32, 0],
  },
  electrosurgery: {
    rotationX: -0.05,
    rotationY: -0.18,
    scale: 3.65,
    position: [0.02, 0.34, 0],
  },
};

export function DeviceScene({
  equipment,
  layerMode,
  activeHotspotId,
  onHotspotSelect,
}: DeviceSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const hotspotMeshesRef = useRef<HotspotMesh[]>([]);
  const pointerRef = useRef({ dragging: false, x: 0, y: 0 });
  const zoomRef = useRef(6.2);
  const callbackRef = useRef(onHotspotSelect);
  const activeHotspotRef = useRef(activeHotspotId);

  useEffect(() => {
    callbackRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

  useEffect(() => {
    activeHotspotRef.current = activeHotspotId;
  }, [activeHotspotId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7fbff");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0.05, 0.58, zoomRef.current);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("data-testid", "biomed-3d-canvas");
    renderer.domElement.setAttribute("aria-label", "Visor 3D de equipo biomédico");
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#ffffff", "#c4d7ed", 2.2);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#ffffff", 2.8);
    key.position.set(4, 4.5, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight("#7dd3fc", 1.35);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const fill = new THREE.PointLight("#0f766e", 0.75, 8);
    fill.position.set(0, 1.8, 2);
    scene.add(fill);

    const grid = new THREE.GridHelper(5.2, 18, "#c6d8ee", "#e4eef9");
    grid.position.y = -1.02;
    scene.add(grid);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getPointer = (event: PointerEvent | WheelEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      getPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotspotMeshesRef.current, false);
      if (hits[0]?.object.userData.hotspotId) {
        callbackRef.current(hits[0].object.userData.hotspotId as string);
        return;
      }

      pointerRef.current = { dragging: true, x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const group = modelGroupRef.current;
      if (!pointerRef.current.dragging || !group) return;

      const deltaX = event.clientX - pointerRef.current.x;
      const deltaY = event.clientY - pointerRef.current.y;
      group.rotation.y += deltaX * 0.008;
      group.rotation.x = THREE.MathUtils.clamp(
        group.rotation.x + deltaY * 0.005,
        -0.45,
        0.45,
      );

      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      pointerRef.current.dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomRef.current = THREE.MathUtils.clamp(
        zoomRef.current + event.deltaY * 0.003,
        4.2,
        8.2,
      );
      camera.position.z = zoomRef.current;
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (modelGroupRef.current && !pointerRef.current.dragging) {
        modelGroupRef.current.rotation.y += 0.00025;
      }

      hotspotMeshesRef.current.forEach((mesh) => {
        const isActive = mesh.userData.hotspotId === activeHotspotRef.current;
        const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.05;
        mesh.scale.setScalar(isActive ? 1.42 * pulse : 1);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      disposeGroup(modelGroupRef.current);
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      modelGroupRef.current = null;
      hotspotMeshesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let cancelled = false;

    disposeGroup(modelGroupRef.current);
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
    }

    loadDeviceGroup(equipment, layerMode).then((built) => {
      if (cancelled) {
        disposeGroup(built.group);
        return;
      }

      modelGroupRef.current = built.group;
      hotspotMeshesRef.current = built.hotspots;
      scene.add(built.group);
    });

    return () => {
      cancelled = true;
    };
  }, [equipment, layerMode]);

  useEffect(() => {
    hotspotMeshesRef.current.forEach((mesh) => {
      const isActive = mesh.userData.hotspotId === activeHotspotId;
      mesh.material.color.set(isActive ? "#00bcd4" : "#1565c0");
      mesh.material.emissive.set(isActive ? "#14b8a6" : "#0d47a1");
      mesh.material.emissiveIntensity = isActive ? 1.15 : 0.55;
    });
  }, [activeHotspotId]);

  return (
    <div className="scene-shell" data-testid="device-scene">
      <div ref={mountRef} className="scene-mount" />
      <div className="scene-axis" aria-hidden="true">
        <span className="axis-z">Z</span>
        <span className="axis-x">X</span>
        <span className="axis-y">Y</span>
      </div>
    </div>
  );
}

async function loadDeviceGroup(equipment: EquipmentItem, layerMode: LayerMode) {
  const glbGroup = await loadGlbDeviceGroup(equipment);
  if (glbGroup) {
    const hotspots = addHotspots(glbGroup, equipment);
    return { group: glbGroup, hotspots };
  }

  return createDeviceGroup(equipment, layerMode);
}

async function loadGlbDeviceGroup(equipment: EquipmentItem) {
  const url = `/models/${equipment.id}.glb`;

  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return null;

    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const group = new THREE.Group();
    group.name = `${equipment.id}-glb`;
    group.add(gltf.scene);

    gltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    normalizeImportedModel(group, equipment.id);
    return group;
  } catch {
    return null;
  }
}

function normalizeImportedModel(group: THREE.Group, equipmentId?: EquipmentItem["id"]) {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  group.position.sub(center);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  const pose = equipmentId ? importedModelPoses[equipmentId] : undefined;
  group.scale.setScalar((pose?.scale ?? 2.22) / maxAxis);
  group.rotation.x = -0.08;
  group.rotation.y = 0.12;
  group.position.set(0.08, 0.34, 0);

  if (pose) {
    group.rotation.x = pose.rotationX;
    group.rotation.y = pose.rotationY;
    group.position.set(...pose.position);
  }
}

function createDeviceGroup(equipment: EquipmentItem, layerMode: LayerMode) {
  const group = new THREE.Group();
  group.name = equipment.id;
  group.rotation.x = -0.08;
  group.rotation.y = 0.12;
  group.position.set(0.18, 0.62, 0);

  const isOpen = layerMode === "layers" || layerMode === "cross-section";
  const isGhost = layerMode === "compare";

  const shell = material("#dfeaf4", {
    roughness: 0.62,
    metalness: 0.12,
    transparent: isOpen,
    opacity: isOpen ? 0.38 : 0.96,
  });
  const dark = material("#0f263f", { roughness: 0.5, metalness: 0.2 });
  const blue = material("#1565c0", { roughness: 0.42, metalness: 0.16 });
  const teal = material("#009688", { roughness: 0.45, metalness: 0.18 });
  const steel = material("#8395a7", { roughness: 0.28, metalness: 0.56 });
  const amber = material("#f59e0b", { roughness: 0.55, metalness: 0.05 });
  const glass = material("#c7e9ff", {
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.36,
  });

  switch (equipment.id) {
    case "patient-monitor":
      addBox(group, [2.28, 1.42, 0.5], [0, 0, 0], shell);
      addPanel(group, [1.24, 0.78], [-0.3, 0.23, 0.34], screenMaterial("ECG"));
      addBox(group, [0.36, 0.22, 0.05], [0.68, 0.42, 0.34], blue);
      addBox(group, [0.36, 0.22, 0.05], [0.68, 0.12, 0.34], teal);
      addBox(group, [0.36, 0.22, 0.05], [0.68, -0.18, 0.34], amber);
      addBox(group, [0.78, 0.12, 0.08], [-0.24, -0.62, 0.3], steel);
      addCylinder(group, 0.07, 0.32, [1.03, 0.02, 0.34], [Math.PI / 2, 0, 0], steel);
      addCylinder(group, 0.06, 0.32, [1.03, -0.28, 0.34], [Math.PI / 2, 0, 0], steel);
      addCable(group, [[1.12, 0.02, 0.36], [1.68, 0.1, 0.26], [1.95, -0.32, 0.06]], "#0d47a1");
      addBox(group, [0.58, 0.18, 0.28], [1.98, -0.36, 0.04], teal);
      addInternalBoards(group, isOpen, dark, teal);
      break;
    case "infusion-pump":
      addBox(group, [1.35, 1.75, 0.64], [-0.54, 0, 0], shell);
      addPanel(group, [0.54, 0.58], [-0.9, 0.36, 0.37], screenMaterial("125"));
      addBox(group, [0.52, 1.28, 0.13], [0.12, 0.02, 0.42], dark);
      addCylinder(group, 0.18, 0.86, [0.12, 0.32, 0.5], [0, 0, Math.PI / 2], steel);
      addCylinder(group, 0.13, 0.82, [0.12, -0.24, 0.5], [0, 0, Math.PI / 2], steel);
      addCable(group, [[-1.2, -0.28, 0.42], [-0.28, -0.02, 0.72], [1.26, -0.1, 0.62], [1.92, 0.3, 0.32]], "#0f766e");
      addCylinder(group, 0.15, 0.56, [1.22, -0.08, 0.64], [Math.PI / 2, 0, 0], glass);
      addBox(group, [0.72, 0.22, 0.18], [-0.55, -0.75, 0.28], blue);
      addInternalBoards(group, isOpen, dark, teal);
      break;
    case "defibrillator":
      addBox(group, [2.22, 1.05, 0.64], [0, -0.05, 0], shell);
      addPanel(group, [0.82, 0.44], [-0.62, 0.18, 0.37], screenMaterial("SYNC"));
      addCylinder(group, 0.08, 1.5, [0, 0.73, 0], [0, 0, Math.PI / 2], steel);
      addBox(group, [0.5, 0.18, 0.32], [-0.86, 0.75, 0], shell);
      addBox(group, [0.5, 0.18, 0.32], [0.86, 0.75, 0], shell);
      addBox(group, [0.52, 0.48, 0.16], [1.36, -0.12, 0.32], dark);
      addBox(group, [0.52, 0.48, 0.16], [1.36, -0.64, 0.06], dark);
      addCable(group, [[0.92, -0.2, 0.24], [1.44, 0.2, 0.42], [1.68, -0.58, 0.18]], "#0f172a");
      addBox(group, [0.72, 0.3, 0.14], [0.35, 0.12, 0.38], amber);
      addInternalBoards(group, isOpen, dark, teal);
      break;
    case "ventilator":
      addBox(group, [1.8, 1.36, 0.64], [-0.24, 0.12, 0], shell);
      addPanel(group, [0.74, 0.42], [-0.66, 0.42, 0.37], screenMaterial("FLOW"));
      addCylinder(group, 0.2, 0.86, [0.36, 0.12, 0.38], [0, 0, Math.PI / 2], steel);
      addCylinder(group, 0.15, 0.74, [0.36, -0.28, 0.38], [0, 0, Math.PI / 2], teal);
      addCable(group, [[0.82, 0.18, 0.38], [1.34, 0.44, 0.6], [1.95, 0.08, 0.26]], "#1565c0");
      addCable(group, [[0.82, -0.22, 0.38], [1.45, -0.55, 0.32], [1.95, -0.22, 0.16]], "#009688");
      addCylinder(group, 0.08, 1.25, [-0.24, -0.95, 0], [0, 0, Math.PI / 2], steel);
      addCylinder(group, 0.18, 0.08, [-0.82, -1.02, 0.44], [Math.PI / 2, 0, 0], dark);
      addCylinder(group, 0.18, 0.08, [0.34, -1.02, 0.44], [Math.PI / 2, 0, 0], dark);
      addInternalBoards(group, isOpen, dark, teal);
      break;
    case "autoclave":
      addCylinder(group, 0.78, 1.75, [0.05, 0.02, 0], [0, 0, Math.PI / 2], shell);
      addCylinder(group, 0.66, 0.08, [-0.86, 0.02, 0], [0, 0, Math.PI / 2], steel);
      addCylinder(group, 0.18, 0.06, [0.95, 0.5, 0.36], [Math.PI / 2, 0, 0], screenMaterial("121"));
      addBox(group, [0.52, 0.32, 0.08], [0.96, 0.06, 0.52], dark);
      addBox(group, [1.2, 0.16, 0.2], [0.1, -0.78, 0], steel);
      addCylinder(group, 0.1, 0.9, [0.5, -0.74, 0.42], [0, 0, Math.PI / 2], teal);
      if (isOpen) {
        addCylinder(group, 0.48, 1.3, [0.16, 0.02, 0.02], [0, 0, Math.PI / 2], glass);
      }
      break;
    case "neonatal-incubator":
      addBox(group, [2.35, 0.42, 1.05], [0, -0.42, 0], shell);
      addBox(group, [2.05, 0.78, 0.88], [0, 0.16, 0.04], glass);
      addPanel(group, [0.72, 0.42], [0.92, -0.16, 0.64], screenMaterial("TEMP"));
      addCylinder(group, 0.12, 0.58, [-0.88, -0.08, 0.66], [Math.PI / 2, 0, 0], teal);
      addCable(group, [[-0.86, -0.08, 0.66], [-1.3, -0.22, 0.42], [-1.45, -0.52, 0.22]], "#009688");
      addCylinder(group, 0.16, 0.78, [0.58, -0.7, 0.2], [0, 0, Math.PI / 2], amber);
      addInternalBoards(group, isOpen, dark, teal);
      break;
    case "electrosurgery":
      addBox(group, [2.0, 1.05, 0.62], [-0.18, 0.04, 0], shell);
      addPanel(group, [0.68, 0.34], [-0.76, 0.3, 0.37], screenMaterial("CUT"));
      addCylinder(group, 0.12, 0.08, [0.18, 0.34, 0.38], [Math.PI / 2, 0, 0], blue);
      addCylinder(group, 0.12, 0.08, [0.54, 0.34, 0.38], [Math.PI / 2, 0, 0], amber);
      addCylinder(group, 0.07, 0.32, [-1.12, -0.36, 0.38], [Math.PI / 2, 0, 0], steel);
      addCylinder(group, 0.07, 0.32, [0.96, -0.2, 0.38], [Math.PI / 2, 0, 0], steel);
      addCable(group, [[-1.18, -0.36, 0.42], [-1.8, -0.18, 0.24], [-2.08, -0.5, 0.1]], "#111827");
      addCable(group, [[1.04, -0.2, 0.42], [1.52, -0.08, 0.24], [1.82, -0.34, 0.08]], "#0f766e");
      addBox(group, [0.46, 0.14, 0.34], [0.62, -0.72, 0.06], dark);
      addInternalBoards(group, isOpen, dark, teal);
      break;
  }

  if (isGhost) {
    const ghostMaterial = material("#0d47a1", {
      roughness: 0.45,
      metalness: 0.08,
      transparent: true,
      opacity: 0.12,
      wireframe: true,
    });
    addBox(group, [2.72, 1.88, 0.9], [0.28, 0.05, -0.52], ghostMaterial);
    addBox(group, [0.06, 2.2, 0.06], [-1.32, 0.02, 0.62], material("#00bcd4"));
    addBox(group, [2.7, 0.06, 0.06], [0.02, -0.96, 0.62], material("#00bcd4"));
  }

  const hotspotMeshes = addHotspots(group, equipment);

  group.scale.setScalar(0.74);
  return { group, hotspots: hotspotMeshes };
}

function addHotspots(group: THREE.Group, equipment: EquipmentItem) {
  const hotspotMeshes: HotspotMesh[] = [];

  equipment.hotspots.forEach((hotspot) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 28, 28),
      material("#1565c0", {
        roughness: 0.18,
        metalness: 0.1,
        emissive: "#0d47a1",
        emissiveIntensity: 0.55,
      }),
    ) as HotspotMesh;
    mesh.position.set(...hotspot.position);
    mesh.userData.hotspotId = hotspot.id;
    mesh.userData.label = hotspot.label;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.01, 12, 36),
      material("#dff7ff", {
        roughness: 0.2,
        metalness: 0.05,
        emissive: "#0ea5e9",
        emissiveIntensity: 0.25,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    group.add(mesh);
    hotspotMeshes.push(mesh);
  });

  return hotspotMeshes;
}

function addInternalBoards(
  group: THREE.Group,
  isVisible: boolean,
  dark: THREE.Material,
  teal: THREE.Material,
) {
  if (!isVisible) return;
  addBox(group, [0.78, 0.36, 0.04], [0.08, 0.03, -0.02], dark);
  addBox(group, [0.42, 0.12, 0.06], [0.32, 0.04, 0.12], teal);
  addCylinder(group, 0.09, 0.44, [-0.28, -0.22, 0.08], [0, 0, Math.PI / 2], dark);
  addCable(group, [[-0.35, 0.2, 0.08], [0.05, 0.48, 0.1], [0.52, 0.2, 0.1]], "#00bcd4");
}

function addBox(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  mat: THREE.Material,
) {
  const radius = Math.min(size[0], size[1], size[2]) * 0.16;
  const geometry = new RoundedBoxGeometry(size[0], size[1], size[2], 5, radius);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color: "#adc1d3",
      transparent: true,
      opacity: 0.55,
    }),
  );
  mesh.add(edges);
  group.add(mesh);
  return mesh;
}

function addPanel(
  group: THREE.Group,
  size: [number, number],
  position: [number, number, number],
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.rotation.y = Math.PI;
  mesh.renderOrder = 20;
  group.add(mesh);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: "#d6ecff", transparent: true, opacity: 0.8 }),
  );
  mesh.add(outline);
  return mesh;
}

function addCylinder(
  group: THREE.Group,
  radius: number,
  length: number,
  position: [number, number, number],
  rotation: [number, number, number],
  mat: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 48), mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCable(group: THREE.Group, points: number[][], color: string) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(point[0], point[1], point[2])),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 36, 0.026, 12, false),
    material(color, { roughness: 0.5, metalness: 0.2 }),
  );
  group.add(mesh);
  return mesh;
}

function material(
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.12,
    ...options,
  });
}

function screenMaterial(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  if (!ctx) return material("#0f263f");

  ctx.fillStyle = "#0a1f34";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x += 18) {
    const base = canvas.height * 0.5;
    const spike = x % 108 === 0 ? -96 : Math.sin(x * 0.08) * 20;
    const y = base + spike;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#f8fbff";
  ctx.font = "700 58px Arial";
  ctx.fillText(label, 36, 92);
  ctx.font = "500 36px Arial";
  ctx.fillStyle = "#67e8f9";
  ctx.fillText("BioMedTools MX", 36, 334);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.2,
    metalness: 0.02,
    emissive: "#0a1f34",
    emissiveIntensity: 0.35,
  });
  mat.side = THREE.DoubleSide;
  mat.depthTest = false;
  mat.needsUpdate = true;
  return mat;
}

function disposeGroup(group: THREE.Group | null) {
  if (!group) return;

  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        Object.values(mat).forEach((value) => {
          if (
            value &&
            typeof value === "object" &&
            "dispose" in value &&
            typeof (value as { dispose?: unknown }).dispose === "function"
          ) {
            (value as { dispose: () => void }).dispose();
          }
        });
        mat.dispose();
      });
    }
  });
}
