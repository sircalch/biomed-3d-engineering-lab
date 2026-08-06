import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "models"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.unit_settings.system = "METRIC"


def mat(name, color, roughness=0.55, metallic=0.05, emission=None, emission_strength=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return material


MATS = {}


def build_materials():
    global MATS
    MATS = {
        "shell": mat("warm clinical shell", (0.82, 0.9, 0.96, 1), 0.5, 0.08),
        "shell_dark": mat("deep blue shell", (0.05, 0.16, 0.29, 1), 0.48, 0.08),
        "screen": mat(
            "active screen",
            (0.015, 0.08, 0.13, 1),
            0.25,
            0.0,
            (0.0, 0.8, 0.55, 1),
            0.45,
        ),
        "screen_blue": mat(
            "blue diagnostic screen",
            (0.02, 0.12, 0.22, 1),
            0.24,
            0.0,
            (0.0, 0.45, 1.0, 1),
            0.35,
        ),
        "screen_green": mat(
            "monitor phosphor green",
            (0.05, 0.9, 0.42, 1),
            0.28,
            0.0,
            (0.05, 0.9, 0.42, 1),
            0.75,
        ),
        "screen_cyan": mat(
            "monitor cyan trace",
            (0.0, 0.78, 0.92, 1),
            0.28,
            0.0,
            (0.0, 0.78, 0.92, 1),
            0.7,
        ),
        "screen_white": mat(
            "monitor white trace",
            (0.9, 0.95, 1.0, 1),
            0.3,
            0.0,
            (0.9, 0.95, 1.0, 1),
            0.55,
        ),
        "teal": mat("sterile teal", (0.0, 0.55, 0.5, 1), 0.42, 0.12),
        "blue": mat("clinical blue", (0.04, 0.28, 0.63, 1), 0.42, 0.12),
        "steel": mat("brushed steel", (0.52, 0.6, 0.67, 1), 0.28, 0.55),
        "dark": mat("graphite", (0.08, 0.1, 0.13, 1), 0.36, 0.25),
        "amber": mat("warning amber", (0.95, 0.55, 0.08, 1), 0.5, 0.05),
        "orange": mat("rotary encoder orange", (1.0, 0.34, 0.08, 1), 0.42, 0.04),
        "red": mat("emergency red", (0.78, 0.13, 0.1, 1), 0.45, 0.04),
        "glass": mat("clear blue polycarbonate", (0.65, 0.9, 1.0, 0.32), 0.08, 0.0),
        "rubber": mat("soft rubber", (0.02, 0.025, 0.03, 1), 0.72, 0.0),
        "soft_gray": mat("medical side panel gray", (0.62, 0.68, 0.7, 1), 0.58, 0.03),
        "bezel": mat("molded white front bezel", (0.92, 0.96, 0.98, 1), 0.48, 0.06),
    }
    MATS["glass"].blend_method = "BLEND"
    MATS["glass"].use_screen_refraction = True


def cube(name, loc, scale, material, bevel=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if bevel:
        bevel_mod = obj.modifiers.new("soft industrial bevel", "BEVEL")
        bevel_mod.width = bevel
        bevel_mod.segments = 8
        bevel_mod.affect = "EDGES"
        normal_mod = obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
        normal_mod.keep_sharp = True
    return obj


def cyl(name, loc, radius, depth, material, rotation=(0, 0, 0), vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation
    )
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    normal_mod = obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    normal_mod.keep_sharp = True
    return obj


def torus(name, loc, major, minor, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=96,
        minor_segments=12,
        location=loc,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj


def cable(name, points, material, bevel=0.025):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 18
    curve.bevel_depth = bevel
    curve.bevel_resolution = 5
    spl = curve.splines.new("BEZIER")
    spl.bezier_points.add(len(points) - 1)
    for point, coord in zip(spl.bezier_points, points):
        point.co = Vector(coord)
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    return obj


def panel(name, loc, size, label, material=None):
    screen = cube(name, loc, (size[0], size[1], 0.025), material or MATS["screen"], bevel=0.02)
    screen.rotation_euler[0] = 0
    add_label(label, (loc[0] - size[0] * 0.35, loc[1] + size[1] * 0.18, loc[2] + 0.018), 0.12)
    draw_waveform(loc, size)
    return screen


def front_panel(name, loc, size, label, material=None):
    screen = cube(name, loc, (size[0], 0.028, size[1]), material or MATS["screen"], bevel=0.02)
    front_label(
        label,
        (loc[0] - size[0] * 0.35, loc[1] - 0.026, loc[2] + size[1] * 0.18),
        0.1,
        material=MATS["screen_white"],
    )
    monitor_trace_front(
        f"{name} waveform",
        loc[0] - size[0] * 0.34,
        loc[2] - size[1] * 0.1,
        loc[1] - 0.03,
        size[0] * 0.68,
        size[1] * 0.08,
        MATS["screen_cyan"] if material else MATS["screen_green"],
        beats=2,
    )
    return screen


def add_label(text, loc, size=0.11, align="LEFT", material=None):
    bpy.ops.object.text_add(location=loc, rotation=(0, 0, 0))
    obj = bpy.context.object
    obj.name = f"label {text}"
    obj.data.body = text
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.002
    obj.data.materials.append(material or MATS["screen"])
    return obj


def front_label(text, loc, size=0.11, align="LEFT", material=None, face="-Y"):
    rotation = (math.radians(90), 0, 0) if face == "-Y" else (math.radians(-90), 0, 0)
    bpy.ops.object.text_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = f"front label {text}"
    obj.data.body = text
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.002
    obj.data.materials.append(material or MATS["screen"])
    return obj


def draw_waveform(loc, size):
    points = []
    steps = 18
    x0 = loc[0] - size[0] * 0.38
    y0 = loc[1] - size[1] * 0.08
    z = loc[2] + 0.03
    for i in range(steps + 1):
        x = x0 + size[0] * 0.76 * (i / steps)
        spike = 0.16 if i % 6 == 3 else 0
        y = y0 + math.sin(i * 1.6) * 0.035 + spike
        points.append((x, y, z))
    cable("screen waveform", points, MATS["teal"], bevel=0.008)


def monitor_trace(name, x0, y0, z, width, amp, material, beats=4, jagged=False):
    points = []
    steps = 64
    for i in range(steps + 1):
        t = i / steps
        x = x0 + width * t
        if jagged:
            y = y0 + math.sin(t * math.tau * beats) * amp * 0.8 + math.sin(t * math.tau * beats * 2.7) * amp * 0.38
        else:
            spike = amp * 1.55 if (i % 16) in {5, 6} else 0
            dip = -amp * 0.7 if (i % 16) == 8 else 0
            y = y0 + math.sin(t * math.tau * beats) * amp * 0.35 + spike + dip
        points.append((x, y, z))
    cable(name, points, material, bevel=0.006)


def monitor_number(text, x, y, z, material, size=0.12):
    add_label(text, (x, y, z), size=size, material=material)


def monitor_trace_front(name, x0, z0, y, width, amp, material, beats=4, jagged=False):
    points = []
    steps = 64
    for i in range(steps + 1):
        t = i / steps
        x = x0 + width * t
        if jagged:
            z = z0 + math.sin(t * math.tau * beats) * amp * 0.8 + math.sin(t * math.tau * beats * 2.7) * amp * 0.38
        else:
            spike = amp * 1.55 if (i % 16) in {5, 6} else 0
            dip = -amp * 0.7 if (i % 16) == 8 else 0
            z = z0 + math.sin(t * math.tau * beats) * amp * 0.35 + spike + dip
        points.append((x, y, z))
    cable(name, points, material, bevel=0.006)


def monitor_number_front(text, x, z, y, material, size=0.12):
    front_label(text, (x, y, z), size=size, material=material)


def port(name, loc, radius, ring_material, inner_material=None, rotation=(0, math.pi / 2, 0)):
    cyl(f"{name} socket", loc, radius, 0.045, inner_material or MATS["dark"], rotation=rotation, vertices=48)
    torus(
        f"{name} color ring",
        (loc[0] - 0.028, loc[1], loc[2]),
        radius * 1.08,
        0.01,
        ring_material,
        rotation=rotation,
    )


def screws(x_values, y_values, z):
    for x in x_values:
        for y in y_values:
            cyl("recessed screw", (x, y, z), 0.035, 0.018, MATS["steel"], rotation=(math.pi / 2, 0, 0), vertices=32)


def front_screws(x_values, z_values, y):
    for x in x_values:
        for z in z_values:
            cyl("front recessed screw", (x, y, z), 0.035, 0.018, MATS["steel"], rotation=(math.pi / 2, 0, 0), vertices=32)


def patient_monitor():
    # Generic bedside multiparameter monitor, modeled from common real device proportions:
    # deep rear housing, thick molded front bezel, active screen, side I/O panel and bottom controls.
    front_y = -0.68
    detail_y = -0.82

    cube("deep rear electronics housing", (-0.18, 0.04, 0.02), (2.58, 1.18, 1.42), MATS["soft_gray"], bevel=0.1)
    cube("molded front bezel", (0.12, front_y, 0.02), (2.78, 0.22, 1.72), MATS["bezel"], bevel=0.13)
    cube("inner shadow gasket", (0.12, detail_y, 0.1), (2.16, 0.05, 1.18), MATS["dark"], bevel=0.04)
    cube("active waveform display", (-0.07, detail_y - 0.018, 0.14), (1.58, 0.022, 1.02), MATS["screen"], bevel=0.025)
    cube("numeric parameter strip", (0.96, detail_y - 0.022, 0.14), (0.46, 0.024, 1.02), MATS["shell_dark"], bevel=0.018)
    cube("top manufacturer badge area", (-0.16, detail_y - 0.035, 0.76), (1.92, 0.016, 0.1), MATS["steel"], bevel=0.012)
    front_label("BioMed", (-0.92, detail_y - 0.052, 0.76), size=0.06, material=MATS["screen_white"])

    # Screen separators and traces.
    for z in [0.46, 0.21, -0.04, -0.29]:
        cube("screen grid divider", (-0.07, detail_y - 0.045, z), (1.5, 0.008, 0.006), MATS["dark"], bevel=0.0)
    monitor_trace_front("ecg trace upper", -0.78, 0.56, detail_y - 0.06, 1.25, 0.06, MATS["screen_green"], beats=4)
    monitor_trace_front("ecg trace middle", -0.78, 0.32, detail_y - 0.06, 1.25, 0.05, MATS["screen_green"], beats=4)
    monitor_trace_front("pleth trace cyan", -0.78, 0.04, detail_y - 0.06, 1.25, 0.08, MATS["screen_cyan"], beats=3, jagged=True)
    monitor_trace_front("resp trace white", -0.78, -0.24, detail_y - 0.06, 1.25, 0.06, MATS["screen_white"], beats=2, jagged=True)

    # Numeric vitals column: HR, NIBP, SpO2, RR.
    for z in [0.5, 0.22, -0.06, -0.34]:
        cube("vital value compartment", (0.96, detail_y - 0.055, z), (0.42, 0.018, 0.22), MATS["dark"], bevel=0.01)
    monitor_number_front("60", 0.86, 0.51, detail_y - 0.076, MATS["screen_green"], 0.15)
    monitor_number_front("120/80", 0.82, 0.24, detail_y - 0.076, MATS["screen_white"], 0.07)
    monitor_number_front("98", 0.86, -0.05, detail_y - 0.076, MATS["screen_cyan"], 0.14)
    monitor_number_front("20", 0.88, -0.33, detail_y - 0.076, MATS["screen_white"], 0.12)

    # Bottom control strip and rotary knob.
    cube("lower control fascia", (0.08, detail_y - 0.04, -0.73), (2.15, 0.05, 0.18), MATS["bezel"], bevel=0.035)
    for i in range(7):
        x = -0.76 + i * 0.22
        cube("membrane control key", (x, detail_y - 0.07, -0.72), (0.13, 0.035, 0.1), MATS["steel"], bevel=0.018)
    cyl("orange rotary encoder", (1.16, detail_y - 0.085, -0.68), 0.12, 0.09, MATS["orange"], rotation=(math.pi / 2, 0, 0), vertices=64)
    torus("encoder grip ring", (1.16, detail_y - 0.13, -0.68), 0.095, 0.012, MATS["amber"], rotation=(math.pi / 2, 0, 0))

    # Side connector panel, visible from the left like common patient monitors.
    cube("left side recessed connector plate", (-1.54, -0.16, 0.06), (0.06, 0.82, 1.14), MATS["bezel"], bevel=0.035)
    cube("left side blue labeling plate", (-1.575, -0.16, 0.06), (0.025, 0.7, 1.0), MATS["soft_gray"], bevel=0.02)
    for z in [0.43, 0.23, 0.03, -0.17]:
        port("small blue auxiliary port", (-1.6, -0.42, z), 0.055, MATS["blue"])
    port("large red nibp port", (-1.6, -0.42, -0.42), 0.13, MATS["red"])
    port("spo2 blue port", (-1.6, -0.08, 0.34), 0.1, MATS["blue"])
    port("ecg black port", (-1.6, -0.08, 0.04), 0.09, MATS["dark"])
    port("temperature orange port", (-1.6, -0.08, -0.27), 0.1, MATS["orange"])

    # Back taper and small feet.
    cube("rear chamfer impression", (-0.92, 0.62, -0.55), (1.2, 0.28, 0.12), MATS["shell"], bevel=0.05)
    cube("left front foot", (-0.72, -0.86, -0.92), (0.32, 0.24, 0.08), MATS["rubber"], bevel=0.035)
    cube("right front foot", (0.86, -0.86, -0.92), (0.32, 0.24, 0.08), MATS["rubber"], bevel=0.035)
    front_screws([-1.08, 1.25], [-0.74, 0.78], detail_y - 0.07)


def infusion_pump():
    front_y = -0.42
    cube("pump upright body", (-0.34, 0.0, 0.0), (1.18, 0.66, 1.86), MATS["shell"], bevel=0.11)
    cube("rear battery housing", (-0.34, 0.32, -0.04), (1.02, 0.22, 1.55), MATS["soft_gray"], bevel=0.06)
    cube("top carry handle", (-0.34, 0.0, 1.03), (0.74, 0.56, 0.16), MATS["bezel"], bevel=0.06)
    front_panel("flow screen", (-0.68, front_y, 0.48), (0.48, 0.36), "125")
    cube("cassette dark well", (0.1, front_y - 0.015, 0.08), (0.58, 0.04, 1.08), MATS["dark"], bevel=0.04)
    cube("transparent pump door", (0.1, front_y - 0.04, 0.08), (0.48, 0.035, 0.92), MATS["glass"], bevel=0.035)
    cyl("upper roller", (0.1, front_y - 0.06, 0.34), 0.13, 0.56, MATS["steel"], rotation=(math.pi / 2, 0, math.pi / 2))
    cyl("lower roller", (0.1, front_y - 0.06, -0.24), 0.11, 0.54, MATS["steel"], rotation=(math.pi / 2, 0, math.pi / 2))
    cube("line inlet clamp", (-0.22, front_y - 0.06, 0.66), (0.12, 0.07, 0.18), MATS["blue"], bevel=0.025)
    cube("line outlet clamp", (0.42, front_y - 0.06, -0.58), (0.12, 0.07, 0.18), MATS["teal"], bevel=0.025)
    cable("infusion line through pump", [(-0.7, front_y - 0.08, 0.76), (-0.2, front_y - 0.12, 0.56), (0.18, front_y - 0.12, 0.02), (0.46, front_y - 0.12, -0.62), (0.98, front_y - 0.08, -0.48)], MATS["teal"], 0.017)
    cyl("syringe barrel", (0.88, front_y - 0.11, 0.02), 0.105, 0.5, MATS["glass"], rotation=(0, math.pi / 2, 0))
    cyl("syringe plunger", (1.18, front_y - 0.11, 0.02), 0.055, 0.18, MATS["steel"], rotation=(0, math.pi / 2, 0))
    cube("syringe cradle", (0.88, front_y - 0.06, -0.16), (0.54, 0.08, 0.12), MATS["bezel"], bevel=0.035)
    cube("start button", (-0.64, front_y - 0.035, -0.5), (0.24, 0.035, 0.12), MATS["teal"], bevel=0.03)
    cube("stop button", (-0.34, front_y - 0.035, -0.5), (0.24, 0.035, 0.12), MATS["red"], bevel=0.03)
    cube("left rubber foot", (-0.74, -0.16, -1.02), (0.32, 0.18, 0.08), MATS["rubber"], bevel=0.025)
    cube("right rubber foot", (0.06, -0.16, -1.02), (0.32, 0.18, 0.08), MATS["rubber"], bevel=0.025)


def defibrillator():
    front_y = -0.55
    cube("defib body", (0, -0.02, 0), (2.18, 1.0, 0.72), MATS["shell"], bevel=0.11)
    cube("front rubber bumper", (0, front_y - 0.03, 0), (2.02, 0.08, 0.58), MATS["soft_gray"], bevel=0.05)
    torus("integrated handle", (0, -0.02, 0.56), 0.72, 0.055, MATS["steel"], rotation=(math.pi / 2, 0, 0))
    cube("handle left post", (-0.72, -0.02, 0.5), (0.16, 0.2, 0.34), MATS["bezel"], bevel=0.045)
    cube("handle right post", (0.72, -0.02, 0.5), (0.16, 0.2, 0.34), MATS["bezel"], bevel=0.045)
    front_panel("sync display", (-0.58, front_y - 0.04, 0.12), (0.78, 0.32), "SYNC")
    cube("energy selector", (0.32, front_y - 0.05, 0.16), (0.38, 0.05, 0.18), MATS["amber"], bevel=0.04)
    cube("charge key", (0.84, front_y - 0.05, 0.22), (0.24, 0.05, 0.14), MATS["blue"], bevel=0.035)
    cube("shock key", (0.84, front_y - 0.05, -0.02), (0.24, 0.05, 0.14), MATS["red"], bevel=0.035)
    cube("paddle dock left", (1.02, -0.06, -0.18), (0.5, 0.4, 0.08), MATS["bezel"], bevel=0.035)
    cube("paddle dock right", (1.02, -0.06, -0.42), (0.5, 0.4, 0.08), MATS["bezel"], bevel=0.035)
    cube("paddle left", (1.08, -0.2, -0.08), (0.42, 0.24, 0.16), MATS["dark"], bevel=0.04)
    cube("paddle right", (1.08, -0.2, -0.36), (0.42, 0.24, 0.16), MATS["dark"], bevel=0.04)
    cable("paddle cable", [(0.64, front_y - 0.06, -0.18), (1.02, -0.34, 0.0), (1.1, -0.28, -0.36)], MATS["rubber"], 0.025)
    cube("printer slot", (-0.34, front_y - 0.05, -0.24), (0.58, 0.05, 0.06), MATS["dark"], bevel=0.012)


def ventilator():
    front_y = -0.46
    cube("ventilator body", (-0.24, 0.0, 0.12), (1.62, 0.72, 1.18), MATS["shell"], bevel=0.11)
    cube("rear gas module", (-1.0, 0.28, 0.0), (0.2, 0.22, 0.94), MATS["soft_gray"], bevel=0.05)
    front_panel("vent display", (-0.58, front_y - 0.03, 0.38), (0.68, 0.34), "FLOW")
    cyl("flow turbine", (0.34, front_y - 0.05, 0.3), 0.17, 0.46, MATS["steel"], rotation=(math.pi / 2, 0, math.pi / 2))
    cyl("exp valve", (0.34, front_y - 0.05, -0.08), 0.13, 0.42, MATS["teal"], rotation=(math.pi / 2, 0, math.pi / 2))
    cyl("inspiratory outlet coupler", (0.74, front_y - 0.08, 0.28), 0.1, 0.14, MATS["blue"], rotation=(math.pi / 2, 0, 0))
    cyl("expiratory inlet coupler", (0.74, front_y - 0.08, -0.08), 0.1, 0.14, MATS["teal"], rotation=(math.pi / 2, 0, 0))
    cable("inspiratory limb", [(0.74, front_y - 0.1, 0.28), (1.12, front_y - 0.3, 0.42), (1.52, front_y - 0.18, 0.2), (1.78, front_y - 0.08, 0.02)], MATS["blue"], 0.04)
    cable("expiratory limb", [(0.74, front_y - 0.1, -0.08), (1.16, front_y - 0.32, -0.22), (1.52, front_y - 0.18, -0.12), (1.78, front_y - 0.08, 0.02)], MATS["teal"], 0.04)
    cube("patient y piece", (1.86, front_y - 0.06, 0.02), (0.22, 0.16, 0.12), MATS["bezel"], bevel=0.03)
    cube("rolling base", (-0.24, -0.02, -0.78), (1.28, 0.58, 0.16), MATS["steel"], bevel=0.05)
    cube("cart mast", (-0.86, 0.0, -0.34), (0.1, 0.1, 0.78), MATS["steel"], bevel=0.025)
    cyl("wheel left", (-0.8, -0.24, -0.94), 0.14, 0.08, MATS["dark"], rotation=(math.pi / 2, 0, 0))
    cyl("wheel right", (0.32, -0.24, -0.94), 0.14, 0.08, MATS["dark"], rotation=(math.pi / 2, 0, 0))


def autoclave():
    cube("autoclave cabinet base", (0.12, 0.02, -0.56), (2.08, 0.9, 0.42), MATS["soft_gray"], bevel=0.08)
    cyl("pressure chamber", (0.0, 0.0, 0.08), 0.64, 1.78, MATS["shell"], rotation=(0, math.pi / 2, 0))
    cyl("front door", (-0.9, -0.02, 0.08), 0.56, 0.08, MATS["steel"], rotation=(0, math.pi / 2, 0))
    torus("door gasket", (-0.96, -0.02, 0.08), 0.49, 0.025, MATS["rubber"], rotation=(0, math.pi / 2, 0))
    cube("door latch handle", (-0.98, -0.5, 0.18), (0.08, 0.08, 0.42), MATS["dark"], bevel=0.02)
    cyl("door hinge upper", (-0.92, 0.54, 0.28), 0.05, 0.22, MATS["steel"], rotation=(math.pi / 2, 0, 0))
    cyl("door hinge lower", (-0.92, 0.54, -0.12), 0.05, 0.22, MATS["steel"], rotation=(math.pi / 2, 0, 0))
    cyl("gauge", (0.92, -0.48, 0.5), 0.14, 0.055, MATS["screen_blue"], rotation=(math.pi / 2, 0, 0))
    front_panel("cycle panel", (0.92, -0.48, 0.12), (0.46, 0.24), "121C", MATS["screen_blue"])
    cube("drain rail", (0.1, -0.46, -0.52), (1.25, 0.12, 0.14), MATS["steel"], bevel=0.04)
    cable("drain tube", [(0.52, -0.5, -0.2), (0.96, -0.66, -0.34), (1.2, -0.54, -0.58)], MATS["teal"], 0.027)
    cube("left autoclave foot", (-0.62, -0.24, -0.84), (0.34, 0.18, 0.12), MATS["rubber"], bevel=0.03)
    cube("right autoclave foot", (0.82, -0.24, -0.84), (0.34, 0.18, 0.12), MATS["rubber"], bevel=0.03)


def incubator():
    front_y = -0.5
    cube("base warmer", (0, -0.02, -0.36), (2.35, 0.78, 0.42), MATS["shell"], bevel=0.09)
    cube("integrated equipment drawer", (0, front_y, -0.5), (2.1, 0.08, 0.24), MATS["soft_gray"], bevel=0.05)
    cube("polycarbonate canopy", (0, -0.02, 0.22), (2.08, 0.76, 0.86), MATS["glass"], bevel=0.12)
    cube("canopy top rail", (0, -0.02, 0.68), (1.82, 0.68, 0.08), MATS["bezel"], bevel=0.035)
    cube("left access port", (-0.72, front_y - 0.035, 0.28), (0.28, 0.05, 0.28), MATS["bezel"], bevel=0.04)
    cube("right access port", (0.0, front_y - 0.035, 0.28), (0.28, 0.05, 0.28), MATS["bezel"], bevel=0.04)
    front_panel("temperature console", (0.9, front_y - 0.04, -0.18), (0.58, 0.28), "TEMP", MATS["screen_blue"])
    cyl("skin probe", (-0.86, front_y - 0.06, 0.24), 0.07, 0.26, MATS["teal"], rotation=(math.pi / 2, 0, 0))
    cable("probe cable", [(-0.88, front_y - 0.06, 0.24), (-1.22, front_y - 0.22, 0.05), (-1.42, front_y - 0.12, -0.24)], MATS["teal"], 0.016)
    cyl("heater element", (0.52, -0.2, -0.28), 0.12, 0.62, MATS["amber"], rotation=(0, math.pi / 2, 0))
    cube("mattress", (-0.1, -0.18, 0.0), (1.36, 0.42, 0.12), MATS["teal"], bevel=0.04)
    cube("cart crossbar", (0, -0.02, -0.88), (1.92, 0.1, 0.12), MATS["steel"], bevel=0.025)
    cyl("incubator caster left", (-0.78, -0.18, -1.02), 0.11, 0.08, MATS["dark"], rotation=(math.pi / 2, 0, 0))
    cyl("incubator caster right", (0.78, -0.18, -1.02), 0.11, 0.08, MATS["dark"], rotation=(math.pi / 2, 0, 0))


def electrosurgery():
    front_y = -0.48
    cube("esu body", (-0.18, 0.0, 0), (2.02, 0.82, 0.58), MATS["shell"], bevel=0.11)
    cube("esu front fascia", (-0.18, front_y - 0.02, 0.0), (1.86, 0.05, 0.46), MATS["bezel"], bevel=0.055)
    front_panel("esu display", (-0.76, front_y - 0.04, 0.12), (0.62, 0.24), "CUT", MATS["screen_blue"])
    cyl("cut output", (0.14, front_y - 0.06, 0.12), 0.08, 0.08, MATS["blue"], rotation=(math.pi / 2, 0, 0))
    cyl("coag output", (0.48, front_y - 0.06, 0.12), 0.08, 0.08, MATS["amber"], rotation=(math.pi / 2, 0, 0))
    cyl("return port", (0.92, front_y - 0.06, -0.12), 0.062, 0.08, MATS["steel"], rotation=(math.pi / 2, 0, 0))
    cube("mode knob", (-0.18, front_y - 0.05, -0.18), (0.16, 0.05, 0.16), MATS["amber"], bevel=0.03)
    cable("active pencil cable", [(-0.96, front_y - 0.06, -0.1), (-1.36, front_y - 0.22, -0.12), (-1.66, front_y - 0.16, -0.32)], MATS["rubber"], 0.023)
    cyl("active pencil handpiece", (-1.78, front_y - 0.18, -0.34), 0.045, 0.38, MATS["dark"], rotation=(0, math.pi / 2, 0))
    cable("return pad cable", [(0.92, front_y - 0.06, -0.12), (1.28, front_y - 0.18, -0.2), (1.52, front_y - 0.12, -0.36)], MATS["teal"], 0.023)
    cube("return electrode pad", (1.68, front_y - 0.12, -0.38), (0.34, 0.18, 0.05), MATS["teal"], bevel=0.03)
    cube("foot pedal", (0.62, -0.28, -0.56), (0.46, 0.24, 0.12), MATS["dark"], bevel=0.04)
    cable("foot pedal cable", [(0.54, -0.28, -0.5), (0.26, -0.36, -0.26), (0.12, front_y - 0.06, -0.1)], MATS["rubber"], 0.018)


MODELS = {
    "patient-monitor": patient_monitor,
    "infusion-pump": infusion_pump,
    "defibrillator": defibrillator,
    "ventilator": ventilator,
    "autoclave": autoclave,
    "neonatal-incubator": incubator,
    "electrosurgery": electrosurgery,
}


def add_lighting():
    bpy.ops.object.light_add(type="AREA", location=(0, -4, 5))
    key = bpy.context.object
    key.name = "large studio softbox"
    key.data.energy = 520
    key.data.size = 5
    bpy.ops.object.light_add(type="POINT", location=(-3, 2, 2.5))
    rim = bpy.context.object
    rim.name = "cyan rim light"
    rim.data.color = (0.55, 0.86, 1.0)
    rim.data.energy = 90


def export_model(model_id, builder):
    reset_scene()
    build_materials()
    add_lighting()
    builder()

    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type in {"MESH", "CURVE", "FONT"})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / f"{model_id}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
    )
    print(f"exported {output}")


def main():
    for model_id, builder in MODELS.items():
        export_model(model_id, builder)


if __name__ == "__main__":
    main()
