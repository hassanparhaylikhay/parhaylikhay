---
title: 'Right-angled trigonometry: review and comprehensive worked example'
checks:
  - q: 'You know the hypotenuse and an angle. To find the opposite side use...'
    options: ["sin", "cos", "tan", "Pythagoras"]
    correct: 0
    explain: 'opp + hyp pair → sin (SOH).'
  - q: 'You know two legs (opp and adj). To find the angle use...'
    options: ["$\\sin^{-1}$", "$\\cos^{-1}$", "$\\tan^{-1}$", "Pythagoras"]
    correct: 2
    explain: 'opp + adj pair → tan, so $\theta = \tan^{-1}(\text{opp}/\text{adj})$.'
  - q: 'A right triangle has hypotenuse $20$ and an angle of $25°$. The adjacent side is...'
    options: ["$20\\sin 25°$", "$20\\cos 25°$", "$20\\tan 25°$", "$20/\\cos 25°$"]
    correct: 1
    explain: '$\cos 25° = \dfrac{\text{adj}}{20}$, so adj $= 20\cos 25° \approx 18.13$.'
  - q: 'In a right triangle, $\\sin\\theta$ for an acute angle is always...'
    options: ["between 0 and 1", "greater than 1", "exactly equal to $\\cos\\theta$", "negative"]
    correct: 0
    explain: 'For $0° < \theta < 90°$, the opposite side is shorter than the hypotenuse, so $\sin\theta = \text{opp}/\text{hyp}$ is between 0 and 1.'
  - q: 'A ladder $5$ m long leans against a wall, foot $1.5$ m from the base. The angle the ladder makes with the ground (to 1 d.p.) is...'
    options: ["$72.5°$", "$17.5°$", "$30.0°$", "$60.0°$"]
    correct: 0
    explain: 'adj $= 1.5$, hyp $= 5$. $\cos\theta = 1.5/5 = 0.3$, so $\theta = \cos^{-1}(0.3) \approx 72.5°$.'
---

## What you learned in 6.2

A short walkthrough of the unit so far:

- The gap: Pythagoras handles two-sides cases but is stuck when given one side and one angle. Trigonometry fills that gap.
- sin, cos, tan are **ratios** that depend only on the angle. Naming opp/adj/hyp relative to a chosen angle is the first step.
- To find a missing side: identify the pair of sides involved → pick the ratio. If the unknown is in the denominator, divide instead of multiply.
- To find a missing angle: given two sides, recover the angle using $\sin^{-1}$, $\cos^{-1}$, or $\tan^{-1}$.

## SOH-CAH-TOA at a glance

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:10px;text-transform:uppercase;text-align:center">PICK THE RATIO BY THE PAIR</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-family:'Geist Mono',monospace;font-size:13px">
    <div style="text-align:center;padding:10px 8px;border:1px solid #1a2433;border-radius:6px"><div style="color:#ff822c;font-weight:700;font-size:14px">opp + hyp</div><div style="font-size:11px;color:#7a7875;margin-top:6px">use sin</div><div style="font-size:11px;color:#3a4a5a;margin-top:2px">SOH</div></div>
    <div style="text-align:center;padding:10px 8px;border:1px solid #1a2433;border-radius:6px"><div style="color:#00abfa;font-weight:700;font-size:14px">adj + hyp</div><div style="font-size:11px;color:#7a7875;margin-top:6px">use cos</div><div style="font-size:11px;color:#3a4a5a;margin-top:2px">CAH</div></div>
    <div style="text-align:center;padding:10px 8px;border:1px solid #1a2433;border-radius:6px"><div style="color:#fff067;font-weight:700;font-size:14px">opp + adj</div><div style="font-size:11px;color:#7a7875;margin-top:6px">use tan</div><div style="font-size:11px;color:#3a4a5a;margin-top:2px">TOA</div></div>
  </div>
</div>

## Decision tree for any right-triangle problem

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:20px 16px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">FROM "WHAT'S GIVEN" TO "WHAT TO USE"</div>

  <!-- Root -->
  <div style="display:flex;justify-content:center;margin-bottom:6px">
    <div style="padding:8px 18px;border:1.5px solid #fff067;border-radius:6px;background:rgba(255,240,103,0.08);font-family:'Geist Mono',monospace;font-size:12px;font-weight:700;color:#fff067;letter-spacing:0.4px">WHAT DO YOU KNOW?</div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:14px;margin-bottom:4px">↓</div>

  <!-- Three situation branches -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;font-family:'Geist Mono',monospace;font-size:12px">

    <!-- Branch 1: two sides -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="padding:7px 12px;border:1px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.07);color:#00abfa;font-weight:600;text-align:center;width:100%">2 sides</div>
      <div style="color:#3a4a5a;font-size:14px">↓</div>
      <div style="display:flex;gap:6px;width:100%">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">want<br/>third side</div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">Pythagoras<br/><span style="color:#3a4a5a;font-weight:500">(Unit 6.1)</span></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">want<br/>the angle</div>
          <div style="color:#3a4a5a;font-size:12px">↓</div>
          <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">inverse trig<br/><span style="color:#3a4a5a;font-weight:500;font-size:10px">sin⁻¹ / cos⁻¹ / tan⁻¹</span></div>
        </div>
      </div>
    </div>

    <!-- Branch 2: side + angle -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="padding:7px 12px;border:1px solid #ff822c;border-radius:6px;background:rgba(255,130,44,0.07);color:#ff822c;font-weight:600;text-align:center;width:100%">1 side + 1 angle</div>
      <div style="color:#3a4a5a;font-size:14px">↓</div>
      <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">want<br/>another side</div>
      <div style="color:#3a4a5a;font-size:12px">↓</div>
      <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">pick the trig ratio<br/><span style="color:#3a4a5a;font-weight:500;font-size:10px">by the pair (SOH-CAH-TOA)</span></div>
    </div>

    <!-- Branch 3: only an angle -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="padding:7px 12px;border:1px solid #ff4670;border-radius:6px;background:rgba(255,70,112,0.07);color:#ff4670;font-weight:600;text-align:center;width:100%">1 acute angle</div>
      <div style="color:#3a4a5a;font-size:14px">↓</div>
      <div style="font-size:11px;color:#7a7875;text-align:center;line-height:1.3">want the<br/>other angle</div>
      <div style="color:#3a4a5a;font-size:12px">↓</div>
      <div style="padding:6px 6px;border:1.5px solid #0fee89;border-radius:5px;background:rgba(15,238,137,0.08);color:#0fee89;font-weight:700;font-size:11px;text-align:center;width:100%;line-height:1.25">90° − given<br/><span style="color:#3a4a5a;font-weight:500;font-size:10px">complementary</span></div>
    </div>

  </div>
</div>

## Comprehensive Worked example

A right-angled triangle $ABC$ has the right angle at $B$. $AB = 6.2$ cm and $\angle BAC = 38°$.

(a) Find $BC$ to 2 decimal places.

(b) Find $AC$ to 2 decimal places.

(c) Find $\angle BCA$.

<iframe src="/widgets/trig-step-explorer.html?preset=triangle-abc-comprehensive" style="width:100%;max-width:696px;height:580px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): find $BC$.** From vertex $A$ (where the $38°$ is), the side $AB = 6.2$ is adjacent to the angle, and $BC$ is opposite. opp + adj → tan, so $BC = 6.2\tan 38° \approx 4.84$ cm.

**[M1 for $\tan 38° = BC/6.2$; A1 for $BC = 4.84$]**

**Part (b): find $AC$.** $AB$ is adjacent, $AC$ is hypotenuse. adj + hyp → cos. The unknown is in the denominator, so flip: $AC = 6.2/\cos 38° \approx 7.87$ cm.

**[M1 for $\cos 38° = 6.2/AC$; A1 for $AC = 7.87$]**

**Part (c): find $\angle BCA$.** The two acute angles sum to $90°$, so $\angle BCA = 90° - 38° = 52°$.

**[B1 for $\angle BCA = 52°$]**

Full marks $= 5$.

The marking sequence to notice: parts (a) and (b) each earn a method mark for writing the trig equation BEFORE evaluating, plus an accuracy mark for the value. Part (c) is a single B1 because no method is required, just recognising that the acute angles are complementary.

## Practice the trainer below

Below this lesson is the full Pythagoras + SOH-CAH-TOA trainer in mixed mode. It rotates through:

- Click-to-identify (which side is opp/adj/hyp from a chosen angle)
- Choose-the-ratio (pick the right trig ratio for the given pair)
- Find a side (numeric, with a triangle figure)
- Find an angle (numeric, using inverse trig)

Run it a few times to lock the ratio-picking habit.

## Common mistakes (across the unit)

- **Calculator in radians instead of degrees.** $\sin 30°$ should give $0.5$. If you get something else, check the mode.
- **Picking the wrong ratio.** Always identify which pair of sides is involved (the one you know + the one you want), then read off the ratio.
- **Forgetting to flip when the unknown is in the denominator.** $\sin\theta = \tfrac{5}{x}$ does NOT mean $x = 5\sin\theta$. It means $x = 5/\sin\theta$.
- **Pressing SIN instead of SIN⁻¹.** SHIFT or 2nd or INV is the gateway to the inverse functions.
- **Naming sides without picking $\theta$ first.** opp/adj depend on which acute angle you are working from. Pick first, label second.
- **Premature rounding.** Cambridge wants the full calculator value carried through; round only at the end.

## Where this goes next

The next sub-topic covers triangles that are NOT right-angled. The sine rule and cosine rule generalise sin, cos, tan to any triangle, and you'll see when to reach for each. After that, the same logic extends into 3D, where the trick is to find the right 2D triangle living inside a 3D solid.

Bearings, angles of elevation and depression, and 2D problem-solving with right triangles are coming in Parts 5 and 6 of this unit. They aren't in this review yet, so focus the trainer below on the four sub-topics covered so far.
