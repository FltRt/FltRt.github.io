import json
import math
import re
import numpy as np
import svgwrite
from skimage import measure
from scipy.ndimage import gaussian_filter

# ==================================================
# CONFIG
# ==================================================

GRID_X = 260
GRID_Y = 220

CONTOUR_INTERVAL = 0.045
SMOOTH_SIGMA = 1.1
BASE_RELIEF = 1.0

BEND_STRENGTH = 0.18
BEND_FREQ = 2.4

KEYWORD_FREQ_LIMIT = 20000
MAX_KEYWORDS = 25
INDEX_STEP = 5

# Typography → size
PIXELS_PER_LINE = 18
BASE_CHAR_WIDTH = 6.5

MIN_WIDTH = 120
MAX_WIDTH = 400
MIN_HEIGHT = 600
MAX_HEIGHT = 3200

ROTATE_90 = True  # ✅ toggle rotation here

# ==================================================
# INPUT PATHS
# ==================================================

COCA_PATH = r"D:\RISD.4\intro\FltRt.github.io\points\coca_60000.json"
TEXT_PATH = r"D:\RISD.4\intro\FltRt.github.io\points\input.txt"

# ==================================================
# LOAD COCA
# ==================================================

with open(COCA_PATH, "r", encoding="utf-8") as f:
    COCA = json.load(f)

def freq_to_val(freq: int) -> float:
    return math.log(freq + 1)

# ==================================================
# READ RAW TEXT (TYPOGRAPHIC SHAPE)
# ==================================================

with open(TEXT_PATH, "r", encoding="utf-8") as f:
    raw_text = f.read()

lines = [l for l in raw_text.splitlines() if l.strip()]
num_lines = len(lines)
avg_line_length = np.mean([len(l) for l in lines]) if lines else 40

# ==================================================
# CANVAS SIZE FROM TYPOGRAPHY
# ==================================================

HEIGHT = int(
    np.clip(
        num_lines * PIXELS_PER_LINE,
        MIN_HEIGHT,
        MAX_HEIGHT
    )
)

WIDTH = int(
    np.clip(
        avg_line_length * BASE_CHAR_WIDTH,
        MIN_WIDTH,
        MAX_WIDTH
    )
)

# ==================================================
# SEGMENT TEXT (CONTENT ONLY)
# ==================================================

segments = [
    s.strip()
    for s in re.split(r"[,\.\n]", raw_text)
    if s.strip()
]

# ==================================================
# WORD → FREQUENCY CURVES
# ==================================================

primary_curves = []
segment_means = []
segment_mins = []
segment_spreads = []
keywords = []

for seg_idx, seg in enumerate(segments):
    words = re.findall(r"[a-zA-Z']+", seg.lower())
    vals = []

    for i, w in enumerate(words):
        if w in COCA:
            f = COCA[w]
            v = freq_to_val(f)
            vals.append(v)

            if f < KEYWORD_FREQ_LIMIT:
                x_norm = i / max(1, len(words) - 1)
                keywords.append((w, seg_idx, x_norm, f))

    if not vals:
        vals = [0.0]

    segment_means.append(float(np.mean(vals)))
    segment_mins.append(float(min(vals)))
    segment_spreads.append(float(np.std(vals)) if len(vals) > 1 else 0.0)

    curve = np.interp(
        np.linspace(0, 1, GRID_X),
        np.linspace(0, 1, len(vals)),
        vals
    )
    primary_curves.append(curve)

primary_curves = np.array(primary_curves)
keywords = sorted(keywords, key=lambda k: k[3])[:MAX_KEYWORDS]

# ==================================================
# REMOVE TEXT ORDER → RANK BY FREQUENCY
# ==================================================

ranked_indices = np.argsort(segment_means)
segment_rank = np.zeros(len(ranked_indices), dtype=int)

for r, idx in enumerate(ranked_indices):
    segment_rank[idx] = r

# ==================================================
# GLOBAL PRESSURE PARAMETERS
# ==================================================

gravity_slope, _ = np.polyfit(
    np.arange(len(segment_means)),
    segment_means,
    1
)
gravity_slope *= 0.35

relief_gain = BASE_RELIEF * (np.mean(segment_mins) / 4.2)
variability = np.mean(segment_spreads)
relief_gain *= 1.0 + 0.3 * min(variability / 2.0, 1.0)

# ==================================================
# BUILD FIELD
# ==================================================

field = np.zeros((GRID_Y, GRID_X))
N = len(primary_curves)

for y in range(GRID_Y):
    t = y / (GRID_Y - 1) * (N - 1)
    i = min(int(t), N - 2)
    alpha = t - i

    interp_curve = (
        (1 - alpha) * primary_curves[i]
        + alpha * primary_curves[i + 1]
    )

    for x in range(GRID_X):
        x_norm = x / GRID_X
        y_norm = y / GRID_Y

        curved_y = y_norm + BEND_STRENGTH * math.sin(
            x_norm * math.pi * BEND_FREQ + y_norm * math.pi
        )

        field[y, x] = interp_curve[x] * relief_gain + gravity_slope * curved_y

field -= field.min()
field /= field.max()
field = gaussian_filter(field, sigma=SMOOTH_SIGMA)

# ==================================================
# CONTOURS
# ==================================================

levels = np.arange(
    math.floor(field.min() * 20) / 20,
    math.ceil(field.max() * 20) / 20,
    CONTOUR_INTERVAL
)

# ==================================================
# SVG SETUP + ROTATION
# ==================================================

if ROTATE_90:
    dwg = svgwrite.Drawing("topography.svg", size=(HEIGHT, WIDTH))
    root = dwg.add(
        dwg.g(transform=f"translate({HEIGHT},0) rotate(90)")
    )
else:
    dwg = svgwrite.Drawing("topography.svg", size=(WIDTH, HEIGHT))
    root = dwg.add(dwg.g())

g_primary = root.add(dwg.g(
    fill="none", stroke="black", stroke_width=0.75
))
g_secondary = root.add(dwg.g(
    fill="none", stroke="#999", stroke_width=0.5
))
g_labels = root.add(dwg.g(
    fill="#555", font_size="11px", font_family="Arial"
))

# ==================================================
# DRAW CONTOURS
# ==================================================

for idx, lvl in enumerate(levels):
    for contour in measure.find_contours(field, lvl):
        contour = contour[::2]
        pts = [
            (p[1] / GRID_X * WIDTH, p[0] / GRID_Y * HEIGHT)
            for p in contour
        ]
        if len(pts) > 1:
            (g_primary if idx % INDEX_STEP == 0 else g_secondary).add(
                dwg.polyline(pts)
            )

# ==================================================
# DRAW KEYWORDS (ROTATES WITH FIELD)
# ==================================================

for word, seg_idx, x_norm, _ in keywords:
    y_norm = segment_rank[seg_idx] / max(1, N - 1)

    curved_y = y_norm + BEND_STRENGTH * math.sin(
        x_norm * math.pi * BEND_FREQ + y_norm * math.pi
    )

    x = x_norm * WIDTH
    y = curved_y * HEIGHT - 6

    g_labels.add(
        dwg.text(
            word,
            insert=(x, y),
            transform=f"rotate(-90,{x},{y})"
        )
    )

# ==================================================
# SAVE
# ==================================================

dwg.save()

print("Saved: topography.svg")
print(f"Lines: {num_lines}")
print(f"Avg line length: {avg_line_length:.1f}")
print(f"Canvas (pre-rotation): {WIDTH} × {HEIGHT}")
print(f"Rotated: {ROTATE_90}")
