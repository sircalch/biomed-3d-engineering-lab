"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Focus,
  Gauge,
  Layers3,
  ListChecks,
  Maximize2,
  PanelRight,
  Home,
  Rotate3D,
  Search,
  ShieldAlert,
  Target,
  Workflow,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { DeviceScene } from "@/components/device-scene";
import {
  buildCaseUrl,
  buildQuizUrl,
  buildReportUrl,
  equipmentCatalog,
  externalReferenceResources,
  labMetrics,
  moduleLinks,
  workflowSteps,
  type EquipmentId,
  type EquipmentItem,
  type LayerMode,
} from "@/lib/biomed-data";

type PanelTab = "overview" | "signals" | "safety" | "maintenance";

interface LabAttempt {
  equipmentId: EquipmentId;
  equipmentName: string;
  action: string;
  timestamp: string;
}

interface StoredLabState {
  selectedId?: EquipmentId;
  notes?: string;
  attempts?: LabAttempt[];
}

const storageKey = "biomed-3d-engineering-lab:v1";

const layerModes: Array<{
  id: LayerMode;
  label: string;
  icon: LucideIcon;
  text: string;
}> = [
  {
    id: "surface",
    label: "Rotar",
    icon: Rotate3D,
    text: "Modelo externo",
  },
  {
    id: "layers",
    label: "Capas",
    icon: Layers3,
    text: "Subensambles",
  },
  {
    id: "cross-section",
    label: "Corte",
    icon: Focus,
    text: "Interior visible",
  },
  {
    id: "compare",
    label: "Comparar",
    icon: Maximize2,
    text: "Referencia",
  },
];

const panelTabs: Array<{ id: PanelTab; label: string }> = [
  { id: "overview", label: "Ficha" },
  { id: "signals", label: "Senales" },
  { id: "safety", label: "Riesgos" },
  { id: "maintenance", label: "Mantenimiento" },
];

export function BiomedLabApp() {
  const [selectedId, setSelectedId] = useState<EquipmentId>("patient-monitor");
  const [layerMode, setLayerMode] = useState<LayerMode>("surface");
  const [activePanel, setActivePanel] = useState<PanelTab>("overview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [notes, setNotes] = useState("");
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const selected = useMemo(
    () => equipmentCatalog.find((item) => item.id === selectedId) ?? equipmentCatalog[0],
    [selectedId],
  );
  const [activeHotspotId, setActiveHotspotId] = useState(
    equipmentCatalog[0].hotspots[0].id,
  );

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(equipmentCatalog.map((item) => item.category)))],
    [],
  );

  const filteredEquipment = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return equipmentCatalog.filter((item) => {
      const categoryMatch = category === "Todos" || item.category === category;
      const queryMatch =
        cleanQuery.length === 0 ||
        `${item.name} ${item.category} ${item.summary} ${item.subsystems.join(" ")}`
          .toLowerCase()
          .includes(cleanQuery);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const activeHotspot =
    selected.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ??
    selected.hotspots[0];

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const routeEquipment = resolveEquipmentFromUrl();
      const parsed = readStoredState();
      if (routeEquipment) {
        setSelectedId(routeEquipment.id);
        setActiveHotspotId(routeEquipment.hotspots[0].id);
      } else if (
        parsed.selectedId &&
        equipmentCatalog.some((item) => item.id === parsed.selectedId)
      ) {
        const storedEquipment =
          equipmentCatalog.find((item) => item.id === parsed.selectedId) ?? equipmentCatalog[0];
        setSelectedId(parsed.selectedId);
        setActiveHotspotId(storedEquipment.hotspots[0].id);
      }
      if (typeof parsed.notes === "string") {
        setNotes(parsed.notes);
      }
      if (Array.isArray(parsed.attempts)) {
        setAttempts(parsed.attempts.slice(0, 8));
      }
      setHasLoadedStorage(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ selectedId, notes, attempts: attempts.slice(0, 8) }),
    );
  }, [attempts, hasLoadedStorage, notes, selectedId]);

  const selectEquipment = (item: EquipmentItem) => {
    setSelectedId(item.id);
    setActiveHotspotId(item.hotspots[0].id);
    setActivePanel("overview");
    writeEquipmentRoute(item);
    window.requestAnimationFrame(() => {
      document.getElementById("equipos")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const recordAction = (action: string) => {
    setAttempts((current) => [
      {
        equipmentId: selected.id,
        equipmentName: selected.name,
        action,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 8));
  };

  const exportEvidence = () => {
    const payload = {
      app: "BioMed 3D Engineering Lab",
      generatedAt: new Date().toISOString(),
      equipment: selected.name,
      category: selected.category,
      activeHotspot,
      layerMode,
      notes,
      maintenanceChecklist: selected.maintenanceChecklist,
      documentation: selected.documentation,
      relatedPractice: selected.practice,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `biomed-3d-${selected.id}-evidence.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordAction("Exporto evidencia local");
  };

  const wavePoints = useMemo(() => buildWaveform(selected.id), [selected.id]);
  const statusClass = `status-badge status-${selected.status.replace(" ", "-")}`;

  return (
    <main className="lab-app">
      <header className="topbar">
        <a className="brand-lockup" href={moduleLinks.core} target="_blank" rel="noreferrer">
          <Image
            src="/topic-tales-biomedica-logo.png"
            alt="Topic Tales Biomedica"
            width={144}
            height={64}
            priority
          />
          <span>
            <strong>BioMed 3D Engineering Lab</strong>
            <small>Aprender. Explorar. Documentar.</small>
          </span>
        </a>

        <nav className="topnav" aria-label="Navegacion principal">
          <a href="#equipos">Equipos</a>
          <a href="#laboratorio">Laboratorio</a>
          <a href="#flujo">Flujo</a>
          <a href="#recursos">Recursos</a>
          <a href="#notas">Notas</a>
        </nav>

        <label className="global-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar equipo, sensor, falla..."
          />
        </label>
      </header>

      <nav className="ecosystem-rail" aria-label="Modulos BioMedTools MX">
        <a href={moduleLinks.core} target="_blank" rel="noreferrer">
          <Home size={15} aria-hidden="true" />
          Core
        </a>
        <a href={moduleLinks.quiz} target="_blank" rel="noreferrer">
          <BookOpenCheck size={15} aria-hidden="true" />
          Quiz
        </a>
        <a className="active" href="#equipos">
          <Boxes size={15} aria-hidden="true" />
          3D Lab
        </a>
        <a href={moduleLinks.case} target="_blank" rel="noreferrer">
          <BrainCircuit size={15} aria-hidden="true" />
          Casos
        </a>
        <a href={moduleLinks.report} target="_blank" rel="noreferrer">
          <FileText size={15} aria-hidden="true" />
          Reportes
        </a>
      </nav>

      <section className="app-hero" aria-labelledby="app-title">
        <div>
          <span className="eyebrow">Laboratorio visual para Ingenieria Biomedica</span>
          <h1 id="app-title">
            Explora equipos medicos en 3D y conecta teoria, diagnostico y evidencia tecnica.
          </h1>
          <p>
            Selecciona un dispositivo, revisa subsistemas, activa capas, interpreta senales y
            envia la actividad hacia Quiz Arena, Case Simulator o Report Builder.
          </p>
        </div>
        <div className="hero-atlas" aria-label="Referencia visual de equipos biomedicos">
          <Image
            src="/biomed-equipment-atlas.png"
            alt="Atlas visual de equipos biomedicos"
            fill
            sizes="(min-width: 1240px) 360px, 100vw"
            className="object-cover"
            priority
          />
          <div>
            <strong>Referencia visual</strong>
            <span>Monitor, bomba, desfibrilador, autoclave e incubadora.</span>
          </div>
        </div>
        <div className="hero-metrics" aria-label="Metricas del laboratorio">
          {labMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="metric-tile" key={metric.label}>
                <Icon size={19} aria-hidden="true" />
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="launchpad-panel" aria-label="Ruta recomendada del equipo seleccionado">
        <div>
          <span>Ruta recomendada</span>
          <h2>{selected.practice.label}</h2>
          <p>
            Usa el equipo seleccionado como puente entre repaso, exploracion,
            diagnostico y reporte tecnico.
          </p>
        </div>
        <div className="launchpad-actions">
          <a href={buildQuizUrl(selected)} target="_blank" rel="noreferrer">
            <BookOpenCheck size={16} aria-hidden="true" />
            Quiz
          </a>
          <a className="active" href="#equipos">
            <Boxes size={16} aria-hidden="true" />
            3D Lab
          </a>
          <a href={buildCaseUrl(selected)} target="_blank" rel="noreferrer">
            <BrainCircuit size={16} aria-hidden="true" />
            Caso
          </a>
          <a href={buildReportUrl(selected)} target="_blank" rel="noreferrer">
            <FileText size={16} aria-hidden="true" />
            Reporte
          </a>
        </div>
      </section>

      <section className="workspace-grid" id="equipos">
        <aside className="library-panel" aria-label="Biblioteca de equipos">
          <div className="panel-heading">
            <div>
              <span>Biblioteca</span>
              <strong>Equipos biomedicos</strong>
            </div>
            <Boxes size={22} aria-hidden="true" />
          </div>

          <div className="category-filter" aria-label="Filtro por categoria">
            <Filter size={16} aria-hidden="true" />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="equipment-list">
            {filteredEquipment.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === selected.id;
              return (
                <button
                  type="button"
                  className={`equipment-card ${isActive ? "active" : ""}`}
                  key={item.id}
                  onClick={() => selectEquipment(item)}
                >
                  <span className="equipment-icon">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="quick-note">
            <BookOpen size={18} aria-hidden="true" />
            <p>
              Contenido educativo. Las pruebas reales deben seguir manual del fabricante,
              normativa aplicable y protocolo institucional.
            </p>
          </div>
        </aside>

        <section className="viewer-panel" aria-label="Visor 3D interactivo">
          <div className="viewer-header">
            <div>
              <span className={statusClass}>{selected.status}</span>
              <h2>{selected.name}</h2>
              <p>{selected.summary}</p>
            </div>
            <a className="secondary-link" href={buildQuizUrl(selected)} target="_blank" rel="noreferrer">
              Repasar tema
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>

          <div className="viewer-stage">
            <div className="scene-toolbar" aria-label="Controles del visor 3D">
              {layerModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    className={layerMode === mode.id ? "active" : ""}
                    onClick={() => setLayerMode(mode.id)}
                    title={mode.text}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
              <button type="button" onClick={() => setLayerMode("surface")} title="Restablecer vista">
                <ZoomIn size={18} aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <DeviceScene
              equipment={selected}
              layerMode={layerMode}
              activeHotspotId={activeHotspotId}
              onHotspotSelect={setActiveHotspotId}
            />
          </div>

          <div className="hotspot-strip" aria-label="Hotspots del equipo">
            {selected.hotspots.map((hotspot) => (
              <button
                type="button"
                key={hotspot.id}
                className={hotspot.id === activeHotspotId ? "active" : ""}
                onClick={() => setActiveHotspotId(hotspot.id)}
              >
                <span>{hotspot.subsystem}</span>
                <strong>{hotspot.label}</strong>
              </button>
            ))}
          </div>
        </section>

        <aside className="engineering-panel" aria-label="Panel de ingenieria">
          <div className="panel-heading">
            <div>
              <span>Panel tecnico</span>
              <strong>{selected.shortName}</strong>
            </div>
            <PanelRight size={22} aria-hidden="true" />
          </div>

          <div className="tab-row">
            {panelTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activePanel === tab.id ? "active" : ""}
                onClick={() => setActivePanel(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activePanel === "overview" && (
            <div className="panel-stack">
              <div className="callout-card">
                <span>Hotspot activo</span>
                <strong>{activeHotspot.label}</strong>
                <p>{activeHotspot.description}</p>
              </div>
              <div className="fact-list">
                {selected.technicalFacts.map((fact) => (
                  <div key={fact.label}>
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
              <div className="subsystem-cloud">
                {selected.subsystems.map((subsystem) => (
                  <span key={subsystem}>{subsystem}</span>
                ))}
              </div>
            </div>
          )}

          {activePanel === "signals" && (
            <div className="panel-stack">
              <div className="signal-preview">
                <svg viewBox="0 0 360 120" role="img" aria-label="Grafica simulada de senal">
                  <polyline points={wavePoints} />
                </svg>
                <div>
                  <span>Senales relacionadas</span>
                  <strong>{selected.signals.join(" / ")}</strong>
                </div>
              </div>
              <p className="technical-copy">
                Este laboratorio no simula pacientes. La grafica ayuda a ubicar que variable se
                observa y que componente tecnico puede alterar la lectura.
              </p>
            </div>
          )}

          {activePanel === "safety" && (
            <div className="risk-list">
              {selected.safetyRisks.map((item) => (
                <div className={`risk-item risk-${item.level}`} key={item.risk}>
                  <ShieldAlert size={18} aria-hidden="true" />
                  <span>{item.risk}</span>
                  <strong>{item.level}</strong>
                </div>
              ))}
            </div>
          )}

          {activePanel === "maintenance" && (
            <div className="checklist">
              {selected.maintenanceChecklist.map((item) => (
                <label key={item}>
                  <input type="checkbox" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="lower-grid" id="laboratorio">
        <article className="lab-panel signal-lab">
          <div className="section-heading">
            <div>
              <span>Signal Lab</span>
              <h2>Lectura tecnica de variables</h2>
            </div>
            <Gauge size={22} aria-hidden="true" />
          </div>
          <svg viewBox="0 0 720 190" role="img" aria-label="Senal simulada del equipo seleccionado">
            <polyline points={buildWideWaveform(selected.id)} />
          </svg>
          <div className="signal-stats">
            {selected.signals.slice(0, 4).map((signal, index) => (
              <div key={signal}>
                <span>{signal}</span>
                <strong>{signalValue(signal, index)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="lab-panel">
          <div className="section-heading">
            <div>
              <span>Fallas comunes</span>
              <h2>Hipotesis iniciales</h2>
            </div>
            <BrainCircuit size={22} aria-hidden="true" />
          </div>
          <div className="failure-list">
            {selected.commonFailures.map((failure) => (
              <div key={failure}>
                <Target size={17} aria-hidden="true" />
                <p>{failure}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="lab-panel" id="flujo">
          <div className="section-heading">
            <div>
              <span>Practica guiada</span>
              <h2>{selected.practice.label}</h2>
            </div>
            <Workflow size={22} aria-hidden="true" />
          </div>
          <div className="workflow-steps">
            {workflowSteps.map((step, index) => (
              <div key={step.title}>
                <strong>{index + 1}</strong>
                <span>{step.title}</span>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="action-row">
            <a href={buildQuizUrl(selected)} target="_blank" rel="noreferrer" onClick={() => recordAction("Abrio Quiz Arena")}>
              Quiz
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href={buildCaseUrl(selected)} target="_blank" rel="noreferrer" onClick={() => recordAction("Abrio Case Simulator")}>
              Caso
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href={buildReportUrl(selected)} target="_blank" rel="noreferrer" onClick={() => recordAction("Abrio Report Builder")}>
              Reporte
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </article>
      </section>

      <section className="resource-panel" id="recursos" aria-labelledby="resources-title">
        <div className="section-heading">
          <div>
            <span>Fuentes y assets abiertos</span>
            <h2 id="resources-title">Recursos curados para mejorar modelos, iconos y referencias.</h2>
          </div>
          <BookOpen size={22} aria-hidden="true" />
        </div>
        <div className="resource-card-grid">
          {externalReferenceResources.map((resource) => (
            <a
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="resource-card"
              key={resource.title}
            >
              <span>{resource.label}</span>
              <strong>{resource.title}</strong>
              <p>{resource.text}</p>
              <small>
                Abrir fuente
                <ExternalLink size={14} aria-hidden="true" />
              </small>
            </a>
          ))}
        </div>
      </section>

      <section className="evidence-grid" id="notas">
        <article className="lab-panel">
          <div className="section-heading">
            <div>
              <span>Evidencia local</span>
              <h2>Notas de observacion</h2>
            </div>
            <FileText size={22} aria-hidden="true" />
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ejemplo: sensor SpO2 desconectado, revisar cable, probar con simulador y documentar accion correctiva..."
          />
          <div className="action-row evidence-actions">
            <button type="button" onClick={exportEvidence}>
              <Download size={16} aria-hidden="true" />
              Exportar evidencia
            </button>
            <a href={buildReportUrl(selected)} target="_blank" rel="noreferrer">
              <ClipboardCheck size={16} aria-hidden="true" />
              Crear reporte
            </a>
          </div>
        </article>

        <article className="lab-panel">
          <div className="section-heading">
            <div>
              <span>Documentacion esperada</span>
              <h2>Salida profesional</h2>
            </div>
            <ListChecks size={22} aria-hidden="true" />
          </div>
          <div className="document-list">
            {selected.documentation.map((item) => (
              <div key={item}>
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="technical-copy">
            Guarda evidencia minima: equipo, serie, falla, pruebas, resultado, responsable y fecha.
          </p>
        </article>

        <article className="lab-panel">
          <div className="section-heading">
            <div>
              <span>Actividad reciente</span>
              <h2>Registro del navegador</h2>
            </div>
            <Eye size={22} aria-hidden="true" />
          </div>
          <div className="attempt-list">
            {attempts.length === 0 ? (
              <p className="empty-state">Aun no hay acciones registradas en este navegador.</p>
            ) : (
              attempts.map((attempt) => (
                <div key={`${attempt.timestamp}-${attempt.action}`}>
                  <span>{attempt.action}</span>
                  <strong>{attempt.equipmentName}</strong>
                  <small>{new Date(attempt.timestamp).toLocaleString("es-MX")}</small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <footer className="app-footer">
        <div>
          <strong>BioMedTools MX Core</strong>
          <span>
            Uso educativo. No sustituye protocolos clinicos, normativas institucionales,
            supervision profesional ni mantenimiento biomedico certificado.
          </span>
        </div>
        <a href={moduleLinks.core} target="_blank" rel="noreferrer">
          Volver al Core
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </footer>
    </main>
  );
}

function buildWaveform(id: EquipmentId) {
  return createWave(360, 120, id, 3.2);
}

function buildWideWaveform(id: EquipmentId) {
  return createWave(720, 190, id, 5.4);
}

function createWave(width: number, height: number, id: EquipmentId, density: number) {
  const baseline = height * 0.52;
  const points: string[] = [];
  const step = Math.max(3, Math.floor(width / 110));

  for (let x = 0; x <= width; x += step) {
    const t = x / width;
    let y = baseline;

    if (id === "patient-monitor" || id === "defibrillator") {
      const spike = Math.abs(((t * density * 8) % 1) - 0.48) < 0.035 ? -height * 0.34 : 0;
      y += Math.sin(t * density * 70) * 9 + spike;
    } else if (id === "infusion-pump" || id === "electrosurgery") {
      y += Math.sin(t * density * 44) * 22 + Math.sin(t * density * 13) * 8;
    } else if (id === "ventilator") {
      y += Math.sin(t * density * 18) * 32;
    } else {
      y += Math.sin(t * density * 9) * 14 + Math.sin(t * density * 32) * 3;
    }

    points.push(`${x.toFixed(1)},${THREEClamp(y, 14, height - 14).toFixed(1)}`);
  }

  return points.join(" ");
}

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function signalValue(signal: string, index: number) {
  const values: Record<string, string> = {
    ECG: "0.8 mV",
    SpO2: "98%",
    NIBP: "120/80",
    Temperatura: "36.8 C",
    "Presion de linea": "245 mmHg",
    "Tasa de flujo": "125 mL/h",
    "Volumen infundido": "250 mL",
    "Energia de descarga": "200 J",
    Impedancia: "48 ohm",
    Flujo: "32 L/min",
    Volumen: "480 mL",
    FiO2: "40%",
    Presion: "21 cmH2O",
    Tiempo: "30 min",
    "Indicador biologico": "Pendiente",
    Humedad: "62%",
    "Estado REM": "OK",
    "Potencia RF": "40 W",
  };

  return values[signal] ?? `${index + 1}.${index * 8 + 2} u.a.`;
}

function readStoredState(): StoredLabState {
  if (typeof window === "undefined") return {};

  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as StoredLabState) : {};
  } catch {
    window.localStorage.removeItem(storageKey);
    return {};
  }
}

function resolveEquipmentFromUrl() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const candidates = [
    params.get("equipment"),
    params.get("device"),
    params.get("category"),
    params.get("caseCategory"),
  ].filter(Boolean) as string[];

  for (const value of candidates) {
    const match = equipmentCatalog.find((item) => matchesEquipmentRoute(item, value));
    if (match) return match;
  }

  return null;
}

function matchesEquipmentRoute(item: EquipmentItem, value: string) {
  const normalizedValue = normalizeRouteValue(value);
  const routeCandidates = [
    item.id,
    item.name,
    item.shortName,
    item.category,
    item.practice.quizCategory,
    item.practice.caseCategory,
    item.practice.label,
  ];

  return routeCandidates.some((candidate) => normalizeRouteValue(candidate) === normalizedValue);
}

function normalizeRouteValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writeEquipmentRoute(item: EquipmentItem) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set("equipment", item.id);
  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams}${url.hash}`);
}
