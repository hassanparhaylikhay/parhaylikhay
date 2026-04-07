from PIL import Image, ImageDraw, ImageFont
import math

img = Image.open('/Users/hassanahmad/Downloads/WhatsApp Image 2026-04-07 at 20.04.38.jpeg').copy()
draw = ImageDraw.Draw(img)
W, H = img.size  # 1200 x 1600

# --- Colours (teacher red + green) ---
RED    = (220, 30, 30)
GREEN  = (30, 160, 30)
ORANGE = (220, 120, 0)
BLACK  = (20, 20, 20)

# --- Font (use a bold system font; fall back to default if not found) ---
try:
    font_big   = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", 36)
    font_med   = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", 28)
    font_small = ImageFont.truetype("/Library/Fonts/Arial.ttf", 24)
except:
    font_big   = ImageFont.load_default()
    font_med   = ImageFont.load_default()
    font_small = ImageFont.load_default()

def tick(x, y, size=22, color=GREEN, lw=4):
    """Draw a teacher-style tick at (x, y)."""
    draw.line([(x, y + size//2), (x + size//3, y + size)], fill=color, width=lw)
    draw.line([(x + size//3, y + size), (x + size, y)], fill=color, width=lw)

def circle_word(x, y, w, h, color=RED, lw=3):
    """Draw an oval around a bounding box."""
    pad = 10
    draw.ellipse([x - pad, y - pad, x + w + pad, y + h + pad], outline=color, width=lw)

def mark_tag(x, y, text, color=GREEN):
    """Draw a mark tag (e.g. B1, M1, A1) in a small box."""
    bbox = draw.textbbox((0, 0), text, font=font_med)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 6
    draw.rectangle([x, y, x + tw + pad*2, y + th + pad*2], outline=color, width=2)
    draw.text((x + pad, y + pad), text, fill=color, font=font_med)

# ============================================================
# Q(a): f(-8) = 18/3 = 6   →  B1, correct
# Answer line is roughly at y ≈ 215 in image coords
# "= 6" ends around x ≈ 780
# ============================================================
QA_Y = 215

# Tick after "= 6"
tick(800, QA_Y - 5, size=30, color=GREEN)

# B1 tag in right margin
mark_tag(1060, QA_Y - 8, "B1", color=GREEN)

# ============================================================
# Q(b) working:
#   y = 4x+3  (first write, then crossed out) ~y ≈ 910
#   4x = y-3                                  ~y ≈ 1050
#   x = (y-3)/4                               ~y ≈ 1130
#   f(x) = (x-3)/4  (final answer)            ~y ≈ 1255
# ============================================================

# "4x = y-3" earns M1 — tick + tag
M1_Y = 1048
tick(700, M1_Y - 5, size=28, color=GREEN)
mark_tag(1060, M1_Y - 8, "M1", color=GREEN)

# "x = (y-3)/4" — correct rearrangement, leads to A1
A1_Y = 1140
tick(700, A1_Y - 5, size=28, color=GREEN)

# Final answer line — "f(x) = (x-3)/4"
# Circle the "f(x)" part (wrong notation) ~x:175-265, y:1248-1295
FINAL_Y = 1258
circle_word(175, 1248, 95, 52, color=RED, lw=3)

# A1 tag (answer is correct even if label is wrong)
mark_tag(1060, FINAL_Y - 8, "A1", color=GREEN)

# Annotation arrow + note pointing to circled f(x)
# Arrow from note → circle
arrow_start = (490, 1310)
arrow_end   = (290, 1290)
draw.line([arrow_start, arrow_end], fill=RED, width=2)
# Arrowhead
angle = math.atan2(arrow_end[1]-arrow_start[1], arrow_end[0]-arrow_start[0])
ah = 12
for da in [0.4, -0.4]:
    ax = arrow_end[0] + int(ah * math.cos(angle + math.pi + da))
    ay = arrow_end[1] + int(ah * math.sin(angle + math.pi + da))
    draw.line([arrow_end, (ax, ay)], fill=RED, width=2)

draw.text((495, 1295), "Should be g⁻¹(x)", fill=RED, font=font_small)

# ============================================================
# Total mark box — top right corner
# ============================================================
BOX_X, BOX_Y = 940, 28
draw.rectangle([BOX_X, BOX_Y, BOX_X + 220, BOX_Y + 72], outline=BLACK, width=3)
draw.text((BOX_X + 14, BOX_Y + 8), "MARKS:  3 / 3", fill=GREEN, font=font_big)

# ============================================================
# Save
# ============================================================
out_path = '/Users/hassanahmad/Desktop/ParhayLikhay/marked_answer.jpeg'
img.save(out_path, quality=95)
print(f"Saved → {out_path}")
