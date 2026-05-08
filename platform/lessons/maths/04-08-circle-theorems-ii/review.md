---
title: 'Review and practice'
checks:
  - q: 'Two chords in a circle are each $14$ cm long. Their distances from the centre are...'
    options: ["unequal in general", "equal", "always $7$ cm", "always equal to the radius"]
    correct: 1
    explain: 'Equal chords are equidistant from the centre.'
  - q: 'A chord is $16$ cm long and the circle has radius $10$ cm. The perpendicular distance from the centre to the chord is...'
    options: ["$3$ cm", "$6$ cm", "$8$ cm", "$12$ cm"]
    correct: 1
    explain: 'Half-chord $= 8$. $r^2 = d^2 + 8^2 \Rightarrow 100 = d^2 + 64 \Rightarrow d = 6$ cm.'
  - q: 'The perpendicular bisector of a chord passes through which point?'
    options: ["the chord midpoint only", "the centre of the circle", "a tangent contact point", "any external point"]
    correct: 1
    explain: 'It passes through the centre. This is the basis for finding the centre from three points.'
  - q: 'Tangents $PA$ and $PB$ from $P$ to a circle have $PA = 11$ cm. What is $PB$?'
    options: ["$5.5$ cm", "$11$ cm", "$22$ cm", "Cannot tell"]
    correct: 1
    explain: 'Tangents from external point are equal: $PB = 11$ cm.'
  - q: 'Tangents from $P$ touch a circle at $A$ and $B$ with centre $O$. Triangle $OAP$ has the right angle at...'
    options: ["$P$", "$A$", "$O$", "the midpoint of $AP$"]
    correct: 1
    explain: 'Tangent perpendicular to radius at the point of contact - so the right angle is at $A$.'
  - q: 'Tangents from $P$ to a circle make angle $APB = 70°$. The line $OP$ bisects this angle, giving angle $OPA = $...'
    options: ["$20°$", "$35°$", "$70°$", "$110°$"]
    correct: 1
    explain: 'Bisected: $70 \div 2 = 35°$.'
  - q: 'In tangents-from-external-point setup, triangle $PAB$ is...'
    options: ["scalene", "right-angled", "isosceles", "equilateral always"]
    correct: 2
    explain: '$PA = PB$, so $PAB$ is isosceles. Equilateral only when angle $APB = 60°$.'
  - q: 'You are asked to find the centre of a circle from three points $A$, $B$, $C$ on it. The minimum work is to draw...'
    options: ["one tangent", "one perpendicular bisector", "two perpendicular bisectors", "three angle bisectors"]
    correct: 2
    explain: 'Two perpendicular bisectors meet at the centre. A third is a useful check but not strictly needed.'
---

## What you should know by now

If you have worked through P1 and P2 you can:

- Use "equal chords are equidistant from the centre" both directions.
- Drop a perpendicular from the centre to a chord and apply Pythagoras with the half-chord.
- Find the centre of a circle given three points on it (intersect two perpendicular bisectors).
- Use "tangents from an external point are equal" to mark $PA = PB$.
- Spot the two right-angled triangles $OAP$ and $OBP$ inside a two-tangent diagram.
- Use the bisecting property of $OP$ to find angles inside the kite-shaped configuration.

## Visual recap

The chord-distance relationship and the perpendicular bisector both come from circle symmetry.

<div class="diagram">
<div class="diagram-caption">RECAP: EQUAL CHORDS + PERPENDICULAR FROM CENTRE</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:500px;height:220px;max-width:100%">

  <!-- Left figure: equal chords on circle O₁ = (120, 110), r = 80.
       Two horizontal chords at y = 70 and y = 150 (each at distance 40
       from O₁). Half-chord = √(80² − 40²) ≈ 69.28, so each chord runs
       from x ≈ 51 to x ≈ 189. -->

  <div style="position:absolute;left:40px;top:30px;width:160px;height:160px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Two parallel chords -->
  <div style="position:absolute;left:50.72px;top:68.75px;width:138.56px;height:2.5px;background:#00abfa"></div>
  <div style="position:absolute;left:50.72px;top:148.75px;width:138.56px;height:2.5px;background:#00abfa"></div>

  <!-- Distances from O₁ to each chord midpoint (dashed blue) -->
  <div style="position:absolute;left:119.25px;top:70px;width:1.5px;height:40px;background:repeating-linear-gradient(to bottom, #00abfa 0 4px, transparent 4px 7px)"></div>
  <div style="position:absolute;left:119.25px;top:110px;width:1.5px;height:40px;background:repeating-linear-gradient(to bottom, #00abfa 0 4px, transparent 4px 7px)"></div>

  <!-- Equal-tick marks on each chord (2 per chord, vertical) -->
  <div style="position:absolute;left:97.25px;top:64px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:103.25px;top:64px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:97.25px;top:144px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:103.25px;top:144px;width:1.5px;height:12px;background:#0fee89"></div>

  <!-- Centre O₁ -->
  <div style="position:absolute;left:120px;top:110px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:126px;top:104px;font:700 11px 'Geist Mono',monospace;color:#7a7875">O</div>

  <!-- Right figure: perpendicular from centre bisects the chord.
       Circle O₂ = (370, 110), r = 80. Chord at y = 170 (distance 60 from
       O₂). Half-chord = √(80² − 60²) ≈ 52.92, chord from x ≈ 317 to
       x ≈ 423. Foot of perpendicular at midpoint (370, 170). -->

  <div style="position:absolute;left:290px;top:30px;width:160px;height:160px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Chord -->
  <div style="position:absolute;left:317.08px;top:168.75px;width:105.83px;height:2.5px;background:#00abfa"></div>
  <!-- Perpendicular OM -->
  <div style="position:absolute;left:368.75px;top:110px;width:2.5px;height:60px;background:#00abfa"></div>

  <!-- L-marker at M = (370, 170) -->
  <div style="position:absolute;left:380px;top:169.25px;width:10px;height:1.5px;background:#ff4670;transform-origin:0 50%;transform:rotate(-90deg);pointer-events:none"></div>
  <div style="position:absolute;left:370px;top:159.25px;width:10px;height:1.5px;background:#ff4670;pointer-events:none"></div>

  <!-- Equal-tick marks on each half of the chord -->
  <div style="position:absolute;left:340.25px;top:164px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:346.25px;top:164px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:393.25px;top:164px;width:1.5px;height:12px;background:#0fee89"></div>
  <div style="position:absolute;left:399.25px;top:164px;width:1.5px;height:12px;background:#0fee89"></div>

  <!-- Centre O₂ and midpoint M -->
  <div style="position:absolute;left:370px;top:110px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:376px;top:104px;font:700 11px 'Geist Mono',monospace;color:#7a7875">O</div>

  <div style="position:absolute;left:370px;top:170px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:376px;top:184px;font:700 11px 'Geist Mono',monospace;color:#fff067">M</div>

</div>
</div>
</div>

The two-tangent picture: two right angles, two equal tangent lengths, kite shape with $OP$ as axis of symmetry.

<div class="diagram">
<div class="diagram-caption">RECAP: TWO TANGENTS, TWO RIGHT ANGLES, KITE</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:460px;height:240px;max-width:100%">

  <!-- Geometry (matches the kite diagram in p2): O = (130, 120), r = 70,
       P = (410, 120), |OP| = 280, half-tangent angle ≈ 75.52°.
       A ≈ (147.5, 52.2), B ≈ (147.5, 187.8). -->

  <div style="position:absolute;left:60px;top:50px;width:140px;height:140px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Radii OA, OB -->
  <div style="position:absolute;left:130px;top:118.75px;width:70px;height:2.5px;background:#00abfa;transform-origin:0 50%;transform:rotate(-75.52deg)"></div>
  <div style="position:absolute;left:130px;top:118.75px;width:70px;height:2.5px;background:#00abfa;transform-origin:0 50%;transform:rotate(75.52deg)"></div>

  <!-- Tangents AP, BP -->
  <div style="position:absolute;left:147.5px;top:50.95px;width:271.1px;height:2.5px;background:#ff822c;transform-origin:0 50%;transform:rotate(14.48deg)"></div>
  <div style="position:absolute;left:147.5px;top:186.55px;width:271.1px;height:2.5px;background:#ff822c;transform-origin:0 50%;transform:rotate(-14.48deg)"></div>

  <!-- OP axis (dashed yellow) -->
  <div style="position:absolute;left:130px;top:119.25px;width:280px;height:1.5px;background:repeating-linear-gradient(to right, #fff067 0 6px, transparent 6px 10px)"></div>

  <!-- L-marker at A. AO direction (-cos α, sin α), AP direction (sin α, cos α)
       where α = 75.52°. P1 = A + 10·AO ≈ (145.0, 61.9); F ≈ (154.7, 64.4);
       P2 = A + 10·AP ≈ (157.2, 54.7). -->
  <div style="position:absolute;left:144.99px;top:61.18px;width:10px;height:1.5px;background:#ff4670;transform-origin:0 50%;transform:rotate(14.48deg);pointer-events:none"></div>
  <div style="position:absolute;left:154.67px;top:63.69px;width:10px;height:1.5px;background:#ff4670;transform-origin:0 50%;transform:rotate(-75.52deg);pointer-events:none"></div>

  <!-- L-marker at B (mirror of A across OP). -->
  <div style="position:absolute;left:144.99px;top:177.07px;width:10px;height:1.5px;background:#ff4670;transform-origin:0 50%;transform:rotate(-14.48deg);pointer-events:none"></div>
  <div style="position:absolute;left:154.67px;top:174.56px;width:10px;height:1.5px;background:#ff4670;transform-origin:0 50%;transform:rotate(75.52deg);pointer-events:none"></div>

  <!-- Equal-tick marks on the two tangents (both PA and PB are equal length) -->
  <div style="position:absolute;left:283.25px;top:80px;width:1.5px;height:12px;background:#0fee89;transform-origin:50% 50%;transform:rotate(14.48deg)"></div>
  <div style="position:absolute;left:289.25px;top:78.5px;width:1.5px;height:12px;background:#0fee89;transform-origin:50% 50%;transform:rotate(14.48deg)"></div>
  <div style="position:absolute;left:283.25px;top:148px;width:1.5px;height:12px;background:#0fee89;transform-origin:50% 50%;transform:rotate(-14.48deg)"></div>
  <div style="position:absolute;left:289.25px;top:149.5px;width:1.5px;height:12px;background:#0fee89;transform-origin:50% 50%;transform:rotate(-14.48deg)"></div>

  <!-- Centre O -->
  <div style="position:absolute;left:130px;top:120px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:114px;top:124px;font:700 13px 'Geist Mono',monospace;color:#7a7875">O</div>

  <!-- Vertices A, B, P -->
  <div style="position:absolute;left:147.5px;top:52.2px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:154px;top:36px;font:700 14px 'Geist Mono',monospace;color:#fff067">A</div>

  <div style="position:absolute;left:147.5px;top:187.8px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:154px;top:198px;font:700 14px 'Geist Mono',monospace;color:#fff067">B</div>

  <div style="position:absolute;left:410px;top:120px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:418px;top:124px;font:700 14px 'Geist Mono',monospace;color:#fff067">P</div>

</div>
</div>
</div>

## Marking patterns at a glance

For chord-distance Pythagoras questions:

- **M1** for setting up the right triangle with half-chord, distance, and radius.
- **A1** for the correct value.

For "find the centre" questions:

- **M1** for finding the midpoint of a chord.
- **M1** for finding the perpendicular gradient.
- **A1** for the equation of one perpendicular bisector (and again for the second).
- **A1** for solving the two equations to give the centre coordinates.

For tangent length questions:

- **B1** for stating $PA = PB$ (with reason "tangents from external point are equal").
- **M1**, **A1** for any further trigonometry inside one of the right triangles $OAP$ or $OBP$.

## Comprehensive worked example

The points $A(2, 1)$, $B(8, 1)$, $C(8, 9)$ all lie on a circle.

(a) Find the coordinates of the centre $O$ of the circle.

(b) Find the radius.

(c) From an external point $P$, the tangent length to this circle is $12$ cm. Find $OP$.

<div class="diagram">
<div class="diagram-caption">A(2,1) · B(8,1) · C(8,9) ON A CIRCLE · CENTRE = INTERSECTION OF PERPENDICULAR BISECTORS</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:400px;height:320px;max-width:100%">

  <!-- Coord-geometry sketch. Display scale 20 px/unit; coord-origin in
       the diagram at (60, 270). Mapping (x, y) → (60 + 20x, 270 − 20y).
       A(2,1) → (100, 250)   B(8,1) → (220, 250)   C(8,9) → (220, 90)
       Midpoint of AB = (5,1) → (160, 250)
       Midpoint of BC = (8,5) → (220, 170)
       Centre O = (5,5) → (160, 170). Radius = 5 units → 100 px display. -->

  <!-- Subtle axes hint: short tick at coord-origin -->
  <div style="position:absolute;left:60px;top:270px;width:10px;height:1.5px;background:#3a4a5a"></div>
  <div style="position:absolute;left:58.75px;top:265px;width:1.5px;height:10px;background:#3a4a5a"></div>
  <div style="position:absolute;left:42px;top:274px;font:700 10px 'Geist Mono',monospace;color:#3a4a5a">(0,0)</div>

  <!-- Circle through A, B, C: centre O = (160, 170), r = 100. -->
  <div style="position:absolute;left:60px;top:70px;width:200px;height:200px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Triangle sides AB, BC (the two chords whose perpendicular bisectors we use). -->
  <!-- AB: A(100,250)→B(220,250), horizontal length 120. -->
  <div style="position:absolute;left:100px;top:248.75px;width:120px;height:2.5px;background:#00abfa"></div>
  <!-- BC: B(220,250)→C(220,90), vertical length 160. -->
  <div style="position:absolute;left:218.75px;top:90px;width:2.5px;height:160px;background:#00abfa"></div>

  <!-- Perpendicular bisector of AB: vertical dashed line at x = 160. -->
  <div style="position:absolute;left:159.25px;top:60px;width:1.5px;height:230px;background:repeating-linear-gradient(to bottom, #0fee89 0 5px, transparent 5px 9px)"></div>
  <!-- Perpendicular bisector of BC: horizontal dashed line at y = 170. -->
  <div style="position:absolute;left:50px;top:169.25px;width:230px;height:1.5px;background:repeating-linear-gradient(to right, #0fee89 0 5px, transparent 5px 9px)"></div>

  <!-- Vertices A, B, C with coord labels -->
  <div style="position:absolute;left:100px;top:250px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:78px;top:258px;font:700 12px 'Geist Mono',monospace;color:#fff067">A(2,1)</div>

  <div style="position:absolute;left:220px;top:250px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:228px;top:258px;font:700 12px 'Geist Mono',monospace;color:#fff067">B(8,1)</div>

  <div style="position:absolute;left:220px;top:90px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:228px;top:80px;font:700 12px 'Geist Mono',monospace;color:#fff067">C(8,9)</div>

  <!-- Centre O at intersection -->
  <div style="position:absolute;left:160px;top:170px;width:10px;height:10px;border-radius:50%;background:#ff4670;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:130px;top:158px;font:700 12px 'Geist Mono',monospace;color:#ff4670">O(5,5)</div>

  <!-- Bisector labels -->
  <div style="position:absolute;left:166px;top:46px;font:700 11px 'Geist Mono',monospace;color:#0fee89">x = 5</div>
  <div style="position:absolute;left:296px;top:164px;font:700 11px 'Geist Mono',monospace;color:#0fee89">y = 5</div>

</div>
</div>
</div>

**Step a: Coordinates of the centre.** Build the perpendicular bisector of two chords and intersect them.

$AB$ is horizontal: midpoint $\left(\tfrac{2+8}{2}, \tfrac{1+1}{2}\right) = (5, 1)$. Its perpendicular bisector is vertical: $x = 5$.

$BC$ is vertical: midpoint $\left(\tfrac{8+8}{2}, \tfrac{1+9}{2}\right) = (8, 5)$. Its perpendicular bisector is horizontal: $y = 5$.

The two bisectors meet at $\boxed{O = (5, 5)}$. **[M1 for midpoint of $AB$; M1 for midpoint of $BC$; A1 for the centre]**

**Step b: Radius.** Distance from $O(5, 5)$ to $A(2, 1)$:

$$r = \sqrt{(5-2)^2 + (5-1)^2} = \sqrt{9 + 16} = \sqrt{25} = \boxed{5}$$

**[M1 for the distance formula; A1 for $5$]**

**Step c: Length $OP$.** Tangent ⟂ radius at the contact point $T$, so $\triangle OTP$ is right-angled at $T$ with legs $OT = r = 5$ and $TP = 12$:

$$OP^2 = 5^2 + 12^2 = 169 \;\Rightarrow\; OP = \boxed{13}$$

**[M1 for the right-triangle setup; A1 for $13$]**

Full marks $= 7$.

## Quick reference

- Equal chords $\Leftrightarrow$ equidistant from centre.
- Perpendicular bisector of a chord passes through the centre.
- $r^2 = d^2 + (\text{half-chord})^2$, where $d$ is the distance from the centre to the chord.
- Tangents from an external point are equal: $PA = PB$.
- Tangent perpendicular to radius at the contact point.
- $OP$ bisects angle $APB$ (the angle between the two tangents).

When you see three points on a circle, head straight for **midpoints + perpendicular gradients**. When you see two tangents from a single external point, head straight for **two right triangles sharing hypotenuse $OP$**.
