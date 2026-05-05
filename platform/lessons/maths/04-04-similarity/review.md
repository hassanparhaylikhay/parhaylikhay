---
title: Review and practice
checks:
  - q: 'Two similar triangles. The smaller has a side of $5$ cm and area $20$ cm$^2$. The larger has the corresponding side $15$ cm. Find the area of the larger.'
    options: ["$60$ cm$^2$", "$120$ cm$^2$", "$180$ cm$^2$", "$540$ cm$^2$"]
    correct: 2
    explain: '$k = \dfrac{15}{5} = 3$. Area scale factor $= k^2 = 9$. New area $= 9 \times 20 = 180$ cm$^2$.'
  - q: 'Two similar cones have volumes $54$ cm$^3$ and $128$ cm$^3$. What is the length scale factor (small to large)?'
    options: ["$\\dfrac{27}{64}$", "$\\dfrac{3}{4}$", "$\\dfrac{4}{3}$", "$\\dfrac{9}{16}$"]
    correct: 2
    explain: 'Volume ratio $= \dfrac{128}{54} = \dfrac{64}{27}$. Length scale factor $= \sqrt[3]{\dfrac{64}{27}} = \dfrac{4}{3}$.'
  - q: 'In triangle $ABC$, $D$ is on $AB$ and $E$ is on $AC$ with $DE \parallel BC$. $AD = 6$, $DB = 4$, $DE = 9$. Find $BC$.'
    options: ["$15$", "$13.5$", "$6$", "$22.5$"]
    correct: 0
    explain: '$AB = AD + DB = 10$. $k = \dfrac{AB}{AD} = \dfrac{10}{6} = \dfrac{5}{3}$. $BC = k \times DE = \dfrac{5}{3} \times 9 = 15$.'
  - q: 'Two similar bottles. The small one holds $200$ ml; the large one holds $1\,600$ ml. The small one needs $80$ cm$^2$ of label paper. How much for the large?'
    options: ["$160$ cm$^2$", "$320$ cm$^2$", "$640$ cm$^2$", "$5\\,120$ cm$^2$"]
    correct: 1
    explain: 'Volume ratio $= 8$, so $k = 2$. Area ratio $= k^2 = 4$. Label area $= 4 \times 80 = 320$ cm$^2$.'
  - q: 'Two similar triangles have angles in the same set. Triangle $X$ has perimeter $12$ cm; triangle $Y$ has perimeter $30$ cm. The largest side of $Y$ is $13$ cm. Find the largest side of $X$.'
    options: ["$3.9$ cm", "$5.2$ cm", "$5$ cm", "$32.5$ cm"]
    correct: 1
    explain: 'Perimeter is a length, so $k = \dfrac{12}{30} = \dfrac{2}{5}$. Largest side of $X = \dfrac{2}{5} \times 13 = 5.2$ cm.'
  - q: 'A real bus is $10$ m long. A scale model is $25$ cm long. The model uses $0.05$ litres of paint. How many litres for the real bus?'
    options: ["$2$", "$40$", "$80$", "$8\\,000$"]
    correct: 2
    explain: 'Length scale factor real:model $= 1\,000 : 25 = 40$. Paint scales like area, so paint factor $= 40^2 = 1\,600$. Real paint $= 0.05 \times 1\,600 = 80$ litres.'
  - q: 'Triangles $PQR$ and $XYZ$ are similar with $\angle P = \angle X$ and $\angle Q = \angle Y$. Which side corresponds to $PQ$?'
    options: ["$XY$", "$YZ$", "$XZ$", "Cannot be determined"]
    correct: 0
    explain: '$PQ$ is the side between $\angle P$ and $\angle Q$. The matching pair $\angle X$ and $\angle Y$ is between sides $XY$, so $PQ \leftrightarrow XY$.'
---

You have now seen the two skills in this topic: identifying corresponding sides on similar shapes and using the right scale factor for length, area, and volume. Cambridge questions almost always combine both. A typical 4 to 6 mark question has a similar shapes setup, a hidden $k$, and a switch between length, area, or volume.

<iframe src="/widgets/similarity-scaler.html" style="width:100%;max-width:696px;height:540px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

Move the slider one more time before the practice. Track length, area and volume together so the $k$, $k^2$, $k^3$ rule is fresh.

## What you should know by now

- Similar shapes have **equal corresponding angles** and **sides in the same ratio**.
- The **length scale factor** $k$ comes from one pair of matching sides: $k = \dfrac{\text{new}}{\text{old}}$.
- New length $= k \times$ old length.
- Area scale factor $= k^2$. Volume scale factor $= k^3$.
- Going backward: take a square root for length from area, a cube root for length from volume.
- Two pairs of equal angles is enough to prove triangles are similar (AA).
- When parallel lines cut a triangle, the smaller triangle is similar to the whole.

<div class="diagram">
<div class="diagram-caption">SCALE-FACTOR RECAP - LENGTH, AREA, VOLUME</div>
<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
<div style="border:2px solid #00abfa;border-radius:8px;padding:14px 12px;text-align:center;width:130px">
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;font-weight:700;color:#00abfa">LENGTH</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:15px;font-weight:700;color:#00abfa;margin:6px 0">k</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:10px;color:#7a7875">side, height,<br/>radius, perimeter</div>
</div>
<div style="border:2px solid #fff067;border-radius:8px;padding:14px 12px;text-align:center;width:130px">
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;font-weight:700;color:#fff067">AREA</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:15px;font-weight:700;color:#fff067;margin:6px 0">k squared</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:10px;color:#7a7875">surface area,<br/>paint coverage</div>
</div>
<div style="border:2px solid #0fee89;border-radius:8px;padding:14px 12px;text-align:center;width:130px">
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;font-weight:700;color:#0fee89">VOLUME</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:15px;font-weight:700;color:#0fee89;margin:6px 0">k cubed</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:10px;color:#7a7875">capacity, mass<br/>(same material)</div>
</div>
</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;font-weight:700;color:#ff4670;text-align:center">backward: sqrt for area, cube root for volume</div>
</div>

## Marking patterns at a glance

| Question style | Marks | What earns the marks |
|---|---|---|
| "Find the missing side, given similar triangles" | 2 | M1 for $k$, A1 for the length |
| "Show triangles are similar using parallel lines" | 2 | B1 + B1 for two correct angle reasons; conclusion AA |
| "Find the area of the larger, given lengths and one area" | 3 | M1 for $k$, M1 for $k^2$, A1 for the area |
| "Find the height, given two volumes and one height" | 3 | M1 for the volume ratio, M1 for cube-rooting, A1 for the length |
| "Find the volume of the larger, given a length ratio and one volume" | 3 | M1 for $k$, M1 for $k^3$, A1 for the volume |

## The single biggest mistake

Forgetting to **square** the scale factor for area or **cube** it for volume. If a Cambridge question gives volumes and asks for a length, you must take the cube root of the volume ratio to get $k$. Skip that step and the entire question is wrong. This single error costs marks every year.

## Recap diagram: parallel lines inside a triangle

<div class="diagram">
<div class="diagram-caption">DE PARALLEL TO BC - APPLY LENGTH SCALE FACTOR</div>
<div style="display:flex;justify-content:center">
<svg viewBox="0 0 500 320" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;max-width:560px;height:auto" xmlns="http://www.w3.org/2000/svg">
<polygon points="250,40 80,260 420,260" fill="#00abfa18" stroke="#00abfa" stroke-width="2.5"/>
<line stroke="#fff067" stroke-width="3" x1="148" y1="172" x2="352" y2="172"/>
<circle cx="250" cy="40" r="5" fill="#0fee89"/>
<circle cx="80" cy="260" r="5" fill="#0fee89"/>
<circle cx="420" cy="260" r="5" fill="#0fee89"/>
<circle cx="148" cy="172" r="5" fill="#0fee89"/>
<circle cx="352" cy="172" r="5" fill="#0fee89"/>
<text x="250" y="30" font-family="Geist Mono,monospace" font-size="13" font-weight="700" fill="#0fee89" text-anchor="middle">A</text>
<text x="68" y="280" font-family="Geist Mono,monospace" font-size="13" font-weight="700" fill="#0fee89">B</text>
<text x="424" y="280" font-family="Geist Mono,monospace" font-size="13" font-weight="700" fill="#0fee89">C</text>
<text x="138" y="166" font-family="Geist Mono,monospace" font-size="13" font-weight="700" fill="#fff067" text-anchor="end">D</text>
<text x="362" y="166" font-family="Geist Mono,monospace" font-size="13" font-weight="700" fill="#fff067">E</text>
<text x="250" y="160" font-family="Geist Mono,monospace" font-size="11" fill="#fff067" text-anchor="middle">DE = 9</text>
<text x="250" y="280" font-family="Geist Mono,monospace" font-size="11" fill="#00abfa" text-anchor="middle">BC = 15</text>
<text x="40" y="220" font-family="Geist Mono,monospace" font-size="11" fill="#ff822c">AD = 6, DB = 4</text>
<text x="250" y="310" font-family="Geist Mono,monospace" font-size="12" font-weight="700" fill="#ff4670" text-anchor="middle">k = AB/AD = 10/6  =&gt;  BC = 9 x 5/3 = 15</text>
</svg>
</div>
</div>

## Comprehensive worked example

Two solid metal cones are mathematically similar. The smaller cone has slant height $9$ cm and total surface area $135$ cm$^2$. The larger cone has volume $1\,000$ cm$^3$. The smaller cone has volume $216$ cm$^3$. Both cones are made of the same metal.

**Step a: Slant height of the larger cone.** Length scale factor $k$ comes from the volume ratio:

$$\dfrac{V_{\text{large}}}{V_{\text{small}}} = \dfrac{1\,000}{216} = \dfrac{125}{27}, \qquad k = \sqrt[3]{\dfrac{125}{27}} = \dfrac{5}{3}$$

Apply $k$ to the slant height: new slant $= k \times 9 = \dfrac{5}{3}\times 9 = \boxed{15}$ cm. **[M1 for volume ratio; M1 for cube root; A1 for $15$]**

**Step b: Surface area of the larger cone.** Area scale factor is $k^2 = \left(\dfrac{5}{3}\right)^2 = \dfrac{25}{9}$. Apply to the smaller surface area:

$$\text{new SA} = k^2 \times 135 = \dfrac{25}{9}\times 135 = \boxed{375}\;\text{cm}^2$$

**[M1 for $k^2$ on the area; A1 for $375$]**

Full marks $= 6$.