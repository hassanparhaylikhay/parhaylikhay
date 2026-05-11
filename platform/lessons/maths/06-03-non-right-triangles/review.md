---
title: 'Non-right-angled triangles: review and comprehensive worked example'
checks:
  - q: 'You know two angles ($A = 40°$, $B = 70°$) and a side ($a = 6$). To find side $b$, use...'
    options: ["sine rule", "cosine rule", "Pythagoras", "area formula"]
    correct: 0
    explain: 'Two angles + a side (AAS / ASA) → sine rule. Pair side $a$ with angle $A$ and side $b$ with angle $B$.'
  - q: 'You know two sides ($b = 7$, $c = 8$) and the angle between them ($A = 60°$). To find side $a$, use...'
    options: ["sine rule", "cosine rule", "area formula", "any of these"]
    correct: 1
    explain: 'SAS → cosine rule. $a^{2} = b^{2}+c^{2}-2bc\cos A$.'
  - q: 'You know all three sides $5, 7, 8$ and want to find the largest angle. Use...'
    options: ["sine rule", "cosine rule rearranged", "area formula", "Pythagoras"]
    correct: 1
    explain: 'SSS → rearranged cosine rule: $\cos A = (b^{2}+c^{2}-a^{2})/(2bc)$, with $a$ as the longest side.'
  - q: 'Area of a triangle with sides $a=6$, $b=5$ and included angle $C=70°$ is...'
    options: ["$15$", "$15\\sin 70°$", "$30\\sin 70°$", "$\\tfrac{1}{2}(6+5)\\sin 70°$"]
    correct: 1
    explain: '$\tfrac{1}{2}(6)(5)\sin 70° = 15\sin 70° \approx 14.1$ cm².'
  - q: 'The sine rule''s ambiguous case can occur when you know...'
    options: ["two angles + a side", "two sides + the included angle", "two sides + a NON-included angle", "all three sides"]
    correct: 2
    explain: 'SSA: sin is positive in both Q1 and Q2, so two triangles may fit. Diagram or context disambiguates.'
---

## What you learned in 6.3

A short walkthrough of the unit:

- The hook: SOH-CAH-TOA only works on right triangles. The sine rule and cosine rule extend trigonometry to any triangle.
- The sine rule: $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$. Use when you have a (side, opposite-angle) pair plus one more piece.
- The ambiguous case: SSA can fit two triangles. Check the second solution $180° - \sin^{-1}(\text{value})$ and verify the angle sum.
- The cosine rule: $a^{2} = b^{2} + c^{2} - 2bc\cos A$. Use for SAS (find a side) or SSS (find an angle, rearranged).
- The area formula: $\tfrac{1}{2}ab\sin C$. Use when you have two sides and the included angle.

## Which rule for which situation, at a glance

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:20px 16px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">DECISION TREE</div>

  <!-- Root -->
  <div style="display:flex;justify-content:center;margin-bottom:6px">
    <div style="padding:8px 18px;border:1.5px solid #fff067;border-radius:6px;background:rgba(255,240,103,0.08);font-family:'Geist Mono',monospace;font-size:12px;font-weight:700;color:#fff067;letter-spacing:0.4px;text-align:center">IS THE KNOWN ANGLE OPPOSITE A KNOWN SIDE, OR BETWEEN THEM?</div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:14px;margin-bottom:4px">↓</div>

  <!-- Two big branches: OPPOSITE → sine rule | BETWEEN → cosine rule / area -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-family:'Geist Mono',monospace;font-size:12px">

    <!-- Branch 1: OPPOSITE → sine rule -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="padding:7px 12px;border:1px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.07);color:#00abfa;font-weight:600;text-align:center;width:100%">OPPOSITE pair available</div>
      <div style="color:#3a4a5a;font-size:14px">↓</div>
      <div style="display:flex;gap:6px;width:100%">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">2 angles<br/>+ 1 side<br/><span style="color:#3a4a5a">(AAS / ASA)</span></div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">sine rule<br/><span style="color:#3a4a5a;font-weight:500;font-size:10px">find a side</span></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">2 sides<br/>+ non-incl angle<br/><span style="color:#3a4a5a">(SSA)</span></div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">sine rule<br/><span style="color:#ff4670;font-weight:500;font-size:10px">check ambiguous case</span></div>
        </div>
      </div>
    </div>

    <!-- Branch 2: BETWEEN → cosine rule / area -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="padding:7px 12px;border:1px solid #ff822c;border-radius:6px;background:rgba(255,130,44,0.07);color:#ff822c;font-weight:600;text-align:center;width:100%">angle BETWEEN two known sides</div>
      <div style="color:#3a4a5a;font-size:14px">↓</div>
      <div style="display:flex;gap:6px;width:100%">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">find third side<br/><span style="color:#3a4a5a">(SAS)</span></div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">cosine rule</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">want area</div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">½ ab sin C</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Bottom: standalone SSS branch (no angle given) -->
  <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #141e2a;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875">
    <span>or</span>
    <div style="padding:6px 10px;border:1px solid #ff4670;border-radius:5px;background:rgba(255,70,112,0.07);color:#ff4670;font-weight:600">3 sides (SSS)</div>
    <span style="color:#3a4a5a">→</span>
    <div style="padding:6px 10px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;text-align:center">cosine rule<br/><span style="color:#3a4a5a;font-weight:500;font-size:10px">rearranged for cos A</span></div>
  </div>
</div>

The deciding question is: **is the known angle opposite or between the known sides?**

- Opposite → sine rule.
- Between → cosine rule (for sides) or area formula (for area).

## Comprehensive Worked example

A triangular field $ABC$ has $AB = 120$ m, $BC = 90$ m, and $\angle B = 65°$.

(a) Find the length of side $AC$ to 1 d.p.

(b) Find the angle at $A$ to 1 d.p.

(c) Find the area of the field to the nearest m².

<iframe src="/widgets/trig-non-right-step-explorer.html?preset=comprehensive-field" style="width:100%;max-width:696px;height:560px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): find $AC$.** Two sides ($AB = 120$ and $BC = 90$) with the included angle at $B$, which is SAS. Use the cosine rule with $b$ as the side opposite $B$ (i.e. $AC = b$):

$$b^{2} = AB^{2} + BC^{2} - 2(AB)(BC)\cos B$$

$$b^{2} = 120^{2} + 90^{2} - 2(120)(90)\cos 65°$$

$$b^{2} = 14400 + 8100 - 21600\cos 65° \approx 22500 - 9128.3 = 13371.7$$

$$AC = b \approx \sqrt{13371.7} \approx 115.6\;\text{m}$$

**[M1 for cosine-rule setup with $\cos 65°$; A1 for $AC = 115.6$ m]**

**Part (b): find $\angle A$.** Now we know all three sides ($AB = 120$, $BC = 90$, $AC \approx 115.6$) and want the angle at $A$. Sine rule is faster here since we have the (side, opposite-angle) pair $(BC, A) = (90, A)$ along with $(AC, B) = (115.6, 65°)$:

$$\dfrac{BC}{\sin A} = \dfrac{AC}{\sin B}$$

$$\dfrac{90}{\sin A} = \dfrac{115.6}{\sin 65°}$$

$$\sin A = \dfrac{90 \sin 65°}{115.6} \approx 0.706$$

$$A = \sin^{-1}(0.706) \approx 44.9°$$

(Sanity check: $A + B + C = 180°$, so $C \approx 180° - 65° - 44.9° = 70.1°$. The angles all look reasonable.)

**[M1 for sine-rule setup; M1 for $\sin A = 90\sin 65°/115.6$ (or ECF on $AC$); A1 for $A = 44.9°$]**

**Part (c): find the area.** Two sides + included angle at $B$ → area formula:

$$\text{Area} = \tfrac{1}{2}(AB)(BC)\sin B = \tfrac{1}{2}(120)(90)\sin 65°$$

$$= 5400 \sin 65° \approx 5400 \times 0.9063 \approx 4894\;\text{m}^{2}$$

**[M1 for area-formula setup; A1 for Area $\approx 4894$ m²]**

Full marks $= 7$.

The marking pattern: each part has a method mark for the formula setup and an accuracy mark for the numeric answer. ECF means if your $AC$ in (a) is slightly off, you still earn the (b) M1 for setting up the sine rule correctly with YOUR value.

## Common mistakes (across the unit)

- **Wrong rule for the situation.** Always identify what's known before reaching for a formula. Two angles + a side → sine. Two sides + included angle → cosine.
- **Sine-rule pair upside-down.** Side over sin-of-opposite-angle, not the other way round.
- **Ignoring the ambiguous case.** When the sine rule gives $\sin B$, check the obtuse solution too unless the diagram disambiguates.
- **Sign error on the $-2bc\cos A$ term.** Plus or minus matters.
- **Using the wrong angle in the area formula.** The angle must be the INCLUDED one.
- **Calculator in radians.** Re-check the mode at the start of every paper.

## Where this goes next

The next sub-topic of unit 6 extends these techniques into 3D: finding angles between lines and planes, working out the diagonal of a cuboid using Pythagoras and trig together. The 2D rules from this unit are the building blocks.
