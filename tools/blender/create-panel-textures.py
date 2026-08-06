from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "textures" / "device-fronts"


COLORS = {
    "panel": "#f3f8fc",
    "panel_shadow": "#cbd9e8",
    "ink": "#0d1f33",
    "muted": "#5c6f85",
    "screen": "#061520",
    "screen_2": "#0b2033",
    "grid": "#123750",
    "green": "#58e586",
    "cyan": "#41d9ef",
    "white": "#ecf7ff",
    "amber": "#f6a21a",
    "orange": "#f06c22",
    "blue": "#1565c0",
    "teal": "#009688",
    "red": "#d43f2f",
    "steel": "#8ea3b8",
    "dark": "#172536",
}


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size, fill, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold=bold), fill=fill, anchor=anchor)


def trace_points(box, beats=4, amp=1.0, kind="ecg", steps=180):
    x1, y1, x2, y2 = box
    width = x2 - x1
    height = y2 - y1
    mid = y1 + height * 0.5
    points = []
    for i in range(steps + 1):
        t = i / steps
        phase = (t * beats) % 1.0
        x = x1 + width * t
        if kind == "ecg":
            y = mid + math.sin(t * math.tau * beats) * height * 0.045
            if 0.20 < phase < 0.235:
                y -= height * 0.38
            elif 0.235 <= phase < 0.255:
                y += height * 0.28
            elif 0.50 < phase < 0.62:
                y -= math.sin((phase - 0.50) / 0.12 * math.pi) * height * 0.12
        elif kind == "pleth":
            y = mid - math.sin(phase * math.pi) ** 2 * height * 0.38 + math.sin(t * 45) * height * 0.018
        elif kind == "resp":
            y = mid + math.sin(t * math.tau * beats) * height * 0.23
        else:
            y = mid + math.sin(t * math.tau * beats) * height * 0.22 * amp
        points.append((x, y))
    return points


def draw_screen(draw, box, title, values=None, traces=None):
    x1, y1, x2, y2 = box
    rounded(draw, box, 28, COLORS["screen"], outline="#19364f", width=4)
    for gx in range(x1 + 28, x2, 48):
        draw.line([(gx, y1 + 12), (gx, y2 - 12)], fill=COLORS["grid"], width=1)
    for gy in range(y1 + 28, y2, 48):
        draw.line([(x1 + 12, gy), (x2 - 12, gy)], fill=COLORS["grid"], width=1)
    text(draw, (x1 + 34, y1 + 28), title, 28, "#d7ecff", bold=True)

    if traces:
        rows = len(traces)
        usable_h = y2 - y1 - 120
        for index, item in enumerate(traces):
            top = y1 + 82 + index * (usable_h / rows)
            row = (x1 + 42, int(top), x2 - 42, int(top + usable_h / rows - 20))
            draw.line([(row[0], row[3] + 8), (row[2], row[3] + 8)], fill="#163047", width=2)
            draw.line(trace_points(row, beats=item.get("beats", 4), kind=item.get("kind", "ecg")), fill=item["color"], width=item.get("width", 5))
            text(draw, (row[0], row[1] - 20), item["label"], 18, item["color"], bold=True)

    if values:
        vx1 = x2 - 250
        rounded(draw, (vx1, y1 + 72, x2 - 28, y2 - 34), 20, "#08111b", outline="#274259", width=2)
        row_h = (y2 - y1 - 122) / len(values)
        for index, value in enumerate(values):
            top = int(y1 + 92 + index * row_h)
            if index:
                draw.line([(vx1 + 16, top - 12), (x2 - 44, top - 12)], fill="#21364b", width=2)
            text(draw, (vx1 + 24, top), value["label"], 18, value["color"], bold=True)
            text(draw, (vx1 + 24, top + 30), value["value"], value.get("size", 54), value["color"], bold=True)


def membrane_keys(draw, start, count, size, gap, labels=None):
    x, y = start
    w, h = size
    for index in range(count):
        box = (x + index * (w + gap), y, x + index * (w + gap) + w, y + h)
        rounded(draw, box, 12, "#e3edf6", outline="#b5c6d8", width=2)
        if labels and index < len(labels):
            text(draw, (box[0] + w / 2, box[1] + h / 2), labels[index], 16, COLORS["muted"], bold=True, anchor="mm")


def save_patient_monitor():
    img = Image.new("RGBA", (1600, 1000), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (40, 45, 1560, 955), 82, COLORS["panel"], outline="#c7d8e8", width=8)
    rounded(draw, (122, 122, 1188, 770), 38, "#101b28", outline="#d9e6f2", width=8)
    draw_screen(
        draw,
        (150, 148, 1160, 742),
        "BioMedTools MX",
        traces=[
            {"label": "ECG I", "color": COLORS["green"], "kind": "ecg", "beats": 5, "width": 5},
            {"label": "ECG II", "color": COLORS["green"], "kind": "ecg", "beats": 5, "width": 5},
            {"label": "SpO2", "color": COLORS["cyan"], "kind": "pleth", "beats": 4, "width": 5},
            {"label": "RESP", "color": COLORS["white"], "kind": "resp", "beats": 2, "width": 4},
        ],
    )
    rounded(draw, (1198, 148, 1468, 742), 30, "#111a27", outline="#d3e2ef", width=5)
    values = [
        {"label": "HR", "value": "60", "color": COLORS["green"], "size": 76},
        {"label": "NIBP", "value": "120/80", "color": COLORS["white"], "size": 42},
        {"label": "SpO2", "value": "98", "color": COLORS["cyan"], "size": 70},
        {"label": "RR", "value": "20", "color": COLORS["white"], "size": 62},
    ]
    row_h = 136
    for index, value in enumerate(values):
        top = 178 + index * row_h
        if index:
            draw.line([(1222, top - 18), (1444, top - 18)], fill="#2b3c4d", width=3)
        text(draw, (1228, top), value["label"], 22, value["color"], bold=True)
        text(draw, (1228, top + 36), value["value"], value["size"], value["color"], bold=True)
    rounded(draw, (150, 800, 1110, 910), 24, "#e7f0f8", outline="#bdccdb", width=3)
    membrane_keys(draw, (190, 826), 8, (76, 52), 24, ["NIBP", "ECG", "SpO2", "TEMP", "RESP", "MENU", "ALM", "REC"])
    draw.ellipse((1210, 790, 1360, 940), fill=COLORS["orange"], outline="#d75b17", width=6)
    draw.ellipse((1252, 832, 1318, 898), fill="#ff9b46")
    text(draw, (1248, 782), "SELECT", 20, COLORS["muted"], bold=True)
    text(draw, (160, 100), "MONITOR MULTIPARAMETRICO", 24, "#60748a", bold=True)
    img.save(OUT_DIR / "patient-monitor-front.png")


def save_infusion_pump():
    img = Image.new("RGBA", (1000, 1600), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (55, 45, 945, 1555), 70, COLORS["panel"], outline="#c4d5e6", width=8)
    rounded(draw, (130, 130, 865, 420), 28, COLORS["screen_2"], outline="#cde2f4", width=5)
    text(draw, (174, 168), "INFUSION PUMP", 32, COLORS["white"], bold=True)
    text(draw, (174, 246), "125.0", 96, COLORS["cyan"], bold=True)
    text(draw, (568, 288), "mL/h", 36, COLORS["cyan"], bold=True)
    text(draw, (174, 364), "VTBI 250 mL   TIME 02:00", 28, COLORS["green"], bold=True)
    rounded(draw, (170, 500, 830, 1165), 36, "#dde8f1", outline="#a9bfd5", width=5)
    rounded(draw, (240, 570, 760, 1080), 30, "#1a2837", outline="#b6c9dc", width=4)
    draw.line([(500, 500), (500, 1165)], fill="#7a8fa4", width=6)
    draw.line([(286, 600), (725, 1035)], fill=COLORS["teal"], width=16)
    for cy in [690, 900]:
        draw.ellipse((370, cy - 95, 560, cy + 95), fill="#9eafbf", outline="#64778b", width=5)
        draw.ellipse((423, cy - 42, 507, cy + 42), fill="#e8f2fa")
    rounded(draw, (160, 1215, 840, 1450), 28, "#e9f2fa", outline="#bfd0e0", width=4)
    membrane_keys(draw, (210, 1260), 3, (150, 70), 58, ["RUN", "STOP", "BOLUS"])
    membrane_keys(draw, (210, 1360), 4, (100, 58), 42, ["1", "2", "3", "ENT"])
    text(draw, (184, 470), "LINE CASSETTE", 24, COLORS["muted"], bold=True)
    img.save(OUT_DIR / "infusion-pump-front.png")


def save_defibrillator():
    img = Image.new("RGBA", (1600, 900), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (52, 80, 1548, 820), 68, COLORS["panel"], outline="#c6d7e6", width=8)
    rounded(draw, (120, 170, 720, 565), 34, COLORS["screen_2"], outline="#d3e3f1", width=5)
    draw_screen(
        draw,
        (145, 195, 695, 540),
        "SYNC",
        traces=[{"label": "ECG", "color": COLORS["green"], "kind": "ecg", "beats": 4, "width": 5}],
    )
    draw.ellipse((820, 205, 1060, 445), fill="#e8f0f7", outline="#aebfd0", width=6)
    text(draw, (940, 286), "ENERGY", 26, COLORS["muted"], bold=True, anchor="mm")
    text(draw, (940, 338), "150 J", 58, COLORS["amber"], bold=True, anchor="mm")
    rounded(draw, (1115, 200, 1430, 342), 28, COLORS["blue"], outline="#0b4da0", width=4)
    text(draw, (1272, 271), "CHARGE", 40, "#ffffff", bold=True, anchor="mm")
    rounded(draw, (1115, 385, 1430, 545), 36, COLORS["red"], outline="#9d231b", width=5)
    text(draw, (1272, 465), "SHOCK", 52, "#ffffff", bold=True, anchor="mm")
    rounded(draw, (136, 620, 595, 745), 28, "#dbe7f1", outline="#aebfd0", width=4)
    text(draw, (365, 685), "PRINTER / EVENT MARK", 28, COLORS["muted"], bold=True, anchor="mm")
    text(draw, (108, 128), "DEFIBRILLATOR", 28, "#61768d", bold=True)
    img.save(OUT_DIR / "defibrillator-front.png")


def save_ventilator():
    img = Image.new("RGBA", (1200, 1600), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (60, 55, 1140, 1545), 74, COLORS["panel"], outline="#c5d6e5", width=8)
    rounded(draw, (145, 145, 1055, 780), 42, COLORS["screen_2"], outline="#cfe0ef", width=5)
    draw_screen(
        draw,
        (175, 180, 1025, 742),
        "VENTILATOR",
        values=[
            {"label": "Vt", "value": "450", "color": COLORS["cyan"], "size": 56},
            {"label": "PEEP", "value": "5", "color": COLORS["green"], "size": 70},
            {"label": "FiO2", "value": "40", "color": COLORS["white"], "size": 66},
        ],
        traces=[
            {"label": "FLOW", "color": COLORS["cyan"], "kind": "resp", "beats": 3, "width": 5},
            {"label": "PRESS", "color": COLORS["green"], "kind": "resp", "beats": 3, "width": 5},
        ],
    )
    rounded(draw, (160, 875, 1040, 1300), 38, "#e3edf6", outline="#b4c7da", width=5)
    labels = ["Ppeak", "PEEP", "Rate", "FiO2", "I:E", "Alarm"]
    for index, label in enumerate(labels):
        cx = 260 + (index % 3) * 310
        cy = 975 + (index // 3) * 170
        draw.ellipse((cx - 55, cy - 55, cx + 55, cy + 55), fill="#f7fbff", outline="#93a8bd", width=5)
        draw.line([(cx, cy), (cx + 38, cy - 30)], fill=COLORS["blue"], width=7)
        text(draw, (cx, cy + 78), label, 24, COLORS["muted"], bold=True, anchor="mm")
    draw.ellipse((760, 1360, 880, 1480), fill=COLORS["blue"], outline="#0e509c", width=6)
    draw.ellipse((930, 1360, 1050, 1480), fill=COLORS["teal"], outline="#087d73", width=6)
    text(draw, (820, 1320), "INSP", 24, COLORS["muted"], bold=True, anchor="mm")
    text(draw, (990, 1320), "EXP", 24, COLORS["muted"], bold=True, anchor="mm")
    img.save(OUT_DIR / "ventilator-front.png")


def save_autoclave_panel():
    img = Image.new("RGBA", (900, 560), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (28, 28, 872, 532), 42, "#eef5fb", outline="#b9cadb", width=6)
    rounded(draw, (72, 78, 520, 300), 28, COLORS["screen_2"], outline="#cfdeec", width=4)
    text(draw, (112, 122), "STERILIZATION", 28, COLORS["white"], bold=True)
    text(draw, (112, 195), "121 C", 76, COLORS["cyan"], bold=True)
    text(draw, (118, 260), "15 psi   30 min", 26, COLORS["green"], bold=True)
    draw.ellipse((610, 80, 810, 280), fill="#f7fbff", outline="#8fa4b8", width=7)
    draw.arc((642, 112, 778, 248), 210, 335, fill=COLORS["amber"], width=9)
    draw.line([(710, 180), (765, 135)], fill=COLORS["red"], width=7)
    text(draw, (710, 318), "PRESSURE", 24, COLORS["muted"], bold=True, anchor="mm")
    membrane_keys(draw, (92, 372), 4, (138, 72), 40, ["START", "STOP", "DRY", "VENT"])
    img.save(OUT_DIR / "autoclave-panel.png")


def save_incubator_panel():
    img = Image.new("RGBA", (900, 520), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (30, 32, 870, 488), 42, "#eef6fb", outline="#b8cadb", width=6)
    rounded(draw, (78, 78, 470, 302), 28, COLORS["screen_2"], outline="#cedeec", width=4)
    text(draw, (112, 120), "INCUBATOR", 26, COLORS["white"], bold=True)
    text(draw, (112, 195), "36.5 C", 70, COLORS["cyan"], bold=True)
    text(draw, (112, 258), "AIR MODE   SKIN PROBE", 24, COLORS["green"], bold=True)
    labels = ["AIR", "SKIN", "HUM", "ALM", "HEAT", "LOCK"]
    for index, label in enumerate(labels):
        cx = 575 + (index % 3) * 110
        cy = 132 + (index // 3) * 130
        rounded(draw, (cx - 42, cy - 42, cx + 42, cy + 42), 18, "#e1ecf4", outline="#aebfd0", width=3)
        text(draw, (cx, cy + 70), label, 18, COLORS["muted"], bold=True, anchor="mm")
    rounded(draw, (92, 372, 808, 438), 24, "#d8f3ef", outline="#86cfc4", width=4)
    text(draw, (450, 405), "TEMPERATURE STABLE", 26, "#087d73", bold=True, anchor="mm")
    img.save(OUT_DIR / "incubator-panel.png")


def save_electrosurgery_panel():
    img = Image.new("RGBA", (1400, 620), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rounded(draw, (40, 55, 1360, 565), 56, COLORS["panel"], outline="#c5d6e6", width=7)
    rounded(draw, (105, 125, 500, 380), 30, COLORS["screen_2"], outline="#d1e0ee", width=5)
    text(draw, (140, 165), "ELECTROSURGERY", 25, COLORS["white"], bold=True)
    text(draw, (140, 242), "CUT 45", 58, COLORS["cyan"], bold=True)
    text(draw, (140, 315), "COAG 30", 48, COLORS["amber"], bold=True)
    ports = [
        (650, 225, COLORS["blue"], "CUT"),
        (830, 225, COLORS["amber"], "COAG"),
        (1010, 225, COLORS["teal"], "BIPOLAR"),
        (1190, 225, COLORS["steel"], "RETURN"),
    ]
    for cx, cy, color, label in ports:
        draw.ellipse((cx - 58, cy - 58, cx + 58, cy + 58), fill="#172536", outline=color, width=10)
        draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill="#030a12")
        text(draw, (cx, cy + 92), label, 22, COLORS["muted"], bold=True, anchor="mm")
    membrane_keys(draw, (150, 435), 5, (146, 64), 54, ["MODE", "PURE", "BLEND", "COAG", "ALARM"])
    img.save(OUT_DIR / "electrosurgery-front.png")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    save_patient_monitor()
    save_infusion_pump()
    save_defibrillator()
    save_ventilator()
    save_autoclave_panel()
    save_incubator_panel()
    save_electrosurgery_panel()
    print(f"created panel textures in {OUT_DIR}")


if __name__ == "__main__":
    main()
