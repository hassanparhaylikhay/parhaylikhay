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

## What you should know by now

- Similar shapes have **equal corresponding angles** and **sides in the same ratio**.
- The **length scale factor** $k$ comes from one pair of matching sides: $k = \dfrac{\text{new}}{\text{old}}$.
- New length $= k \times$ old length.
- Area scale factor $= k^2$. Volume scale factor $= k^3$.
- Going backward: take a square root for length from area, a cube root for length from volume.
- Two pairs of equal angles is enough to prove triangles are similar (AA).
- When parallel lines cut a triangle, the smaller triangle is similar to the whole.

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

## Comprehensive worked example

Two solid metal cones are mathematically similar. The smaller cone has slant height $9$ cm and total surface area $135$ cm$^2$. The larger cone has volume $1\,000$ cm$^3$. The smaller cone has volume $216$ cm$^3$. Both cones are made of the same metal.

**(a)** Find the slant height of the larger cone.

**(b)** Find the surface area of the larger cone.

**Step 1: Find the length scale factor from the volumes.**

$$\dfrac{V_{\text{large}}}{V_{\text{small}}} \;=\; \dfrac{1\,000}{216} \;=\; \dfrac{125}{27}$$

$$k = \sqrt[3]{\dfrac{125}{27}} = \dfrac{5}{3}$$

**[M1 for the volume ratio; M1 for cube-rooting]**

**Step 2: Apply $k$ to the slant height for part (a).**

$$\text{new slant height} = k \times 9 = \dfrac{5}{3} \times 9 = 15$$

**Answer (a):** Slant height of the larger cone $= 15$ cm. **[A1]**

**Step 3: Find the area scale factor and apply it for part (b).**

$$k^2 = \left(\dfrac{5}{3}\right)^2 = \dfrac{25}{9}$$

$$\text{new surface area} = k^2 \times 135 = \dfrac{25}{9} \times 135 = 375$$

**[M1 for using $k^2$ on the area]**

**Answer (b):** Surface area of the larger cone $= 375$ cm$^2$. **[A1]**

Full marks $= 6$.

## Final check

Seven mixed questions covering AA similarity, missing sides, parallel-line setups, area scaling, volume scaling, and going forward and backward between $k$, $k^2$, and $k^3$.

<iframe src="/widgets/geometry-trainer.html?topic=similarity" style="width:100%;max-width:696px;height:540px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>
