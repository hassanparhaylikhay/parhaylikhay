---
title: 'Non-right-angled triangles: review and comprehensive worked example'
checks:
  - q: 'You know two angles ($A = 40°$, $B = 70°$) and a side ($a = 6$). To find side $b$, use...'
    options: ["sine rule", "cosine rule", "Pythagoras", "area formula"]
    correct: 0
    explain: 'Two angles and any side → sine rule. Pair side $a$ with angle $A$ and side $b$ with angle $B$.'
  - q: 'You know two sides ($b = 7$, $c = 8$) and the angle between them ($A = 60°$). To find side $a$, use...'
    options: ["sine rule", "cosine rule", "area formula", "any of these"]
    correct: 1
    explain: 'Two sides with the angle between them → cosine rule. $a^{2} = b^{2}+c^{2}-2bc\cos A$.'
  - q: 'You know all three sides $5, 7, 8$ and want to find the largest angle. Use...'
    options: ["sine rule", "cosine rule rearranged", "area formula", "Pythagoras"]
    correct: 1
    explain: 'All three sides → rearranged cosine rule: $\cos A = (b^{2}+c^{2}-a^{2})/(2bc)$, with $a$ as the longest side.'
  - q: 'Area of a triangle with sides $a=6$, $b=5$ and included angle $C=70°$ is...'
    options: ["$15$", "$15\\sin 70°$", "$30\\sin 70°$", "$\\tfrac{1}{2}(6+5)\\sin 70°$"]
    correct: 1
    explain: '$\tfrac{1}{2}(6)(5)\sin 70° = 15\sin 70° \approx 14.1$ cm².'
  - q: 'The ambiguous case can occur when you know...'
    options: ["two angles + a side", "two sides + the included angle", "two sides + the angle opposite one of them", "all three sides"]
    correct: 2
    explain: 'Sine gives the same value at any pair of angles adding to $180°$, so two triangles may fit. Diagram or context disambiguates.'
---

## What you learned in 6.3

A short walkthrough of the unit:

- The hook: SOH-CAH-TOA only works on right triangles. The sine rule and cosine rule extend trigonometry to any triangle.
- The sine rule: $\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$. Use when you have a (side, opposite-angle) pair plus one more piece.
- The ambiguous case: two sides and the angle opposite one of them can fit two different triangles. Check the second solution $180° - \sin^{-1}(\text{value})$ and verify the angle sum.
- The cosine rule: $a^{2} = b^{2} + c^{2} - 2bc\cos A$. Use it when the known angle is between the two known sides (find the third side), or when all three sides are known (find an angle, rearranged).
- The area formula: $\tfrac{1}{2}ab\sin C$. Use when you have two sides and the included angle.

## Which rule for which situation, at a glance

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 16px 24px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:16px;text-transform:uppercase;text-align:center">DECISION TREE</div>
  <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px 16px;align-items:center;font-family:'Geist Mono',monospace">
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px"><div style="padding:9px 14px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;font-size:13px;white-space:nowrap">Use SOH-CAH-TOA</div><span style="color:#00abfa;font-weight:700;font-size:11px">←Yes</span></div>
    <div style="padding:11px 16px;border:1.5px solid #fff067;border-radius:7px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;max-width:240px;line-height:1.35">Is the triangle right-angled?</div>
    <div></div>
    <div></div>
    <div style="text-align:center;color:#7a7875;font-size:12px;line-height:1"><span style="color:#3a4a5a;font-size:16px">↓</span><div style="color:#ff4670;font-weight:700;font-size:11px;margin-top:2px">No</div></div>
    <div></div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px"><div style="padding:9px 14px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;font-size:13px;white-space:nowrap">Use sine rule</div><span style="color:#00abfa;font-weight:700;font-size:11px">←Yes</span></div>
    <div style="padding:11px 16px;border:1.5px solid #fff067;border-radius:7px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;max-width:240px;line-height:1.35">Are there opposite pairs of sides and angles?</div>
    <div></div>
    <div></div>
    <div style="text-align:center;color:#7a7875;font-size:12px;line-height:1"><span style="color:#3a4a5a;font-size:16px">↓</span><div style="color:#ff4670;font-weight:700;font-size:11px;margin-top:2px">No</div></div>
    <div></div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px"><div style="padding:9px 14px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;font-size:13px;white-space:nowrap">Use area formula</div><span style="color:#00abfa;font-weight:700;font-size:11px">←Yes</span></div>
    <div style="padding:11px 16px;border:1.5px solid #fff067;border-radius:7px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;max-width:240px;line-height:1.35">Does the question involve area?</div>
    <div style="display:flex;align-items:center;justify-content:flex-start;gap:10px"><span style="color:#ff4670;font-weight:700;font-size:11px">No→</span><div style="padding:9px 14px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;font-size:13px;white-space:nowrap">Use cosine rule</div></div>
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

**Part (a): find $AC$.** Two sides ($AB = 120$ and $BC = 90$) with the angle between them at $B$. Use the cosine rule with $b$ as the side opposite $B$ (i.e. $AC = b$):

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
