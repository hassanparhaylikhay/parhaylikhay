---
title: 'Review and practice'
checks:
  - q: 'A cuboid is $4 \times 5 \times 6$ cm. Volume is...'
    options: ["$15$ cm³", "$60$ cm²", "$120$ cm³", "$120$ cm²"]
    correct: 2
    explain: '$V = 4 \times 5 \times 6 = 120$ cm³.'
  - q: 'A triangular prism: cross-section is a $5$ cm by $12$ cm right triangle, length $10$ cm. Volume...'
    options: ["$150$ cm³", "$300$ cm³", "$600$ cm³", "$60$ cm³"]
    correct: 1
    explain: 'Cross-section area $= \tfrac{1}{2} \times 5 \times 12 = 30$. Volume $= 30 \times 10 = 300$ cm³.'
  - q: 'A cylinder has radius $5$ cm and height $8$ cm. Volume in terms of π is...'
    options: ["$40\\pi$ cm³", "$80\\pi$ cm³", "$200\\pi$ cm³", "$25\\pi$ cm³"]
    correct: 2
    explain: '$V = \pi r^2 h = \pi \times 25 \times 8 = 200\pi$ cm³.'
  - q: 'A sphere has radius $6$ cm. Volume in terms of π is...'
    options: ["$72\\pi$ cm³", "$144\\pi$ cm³", "$216\\pi$ cm³", "$288\\pi$ cm³"]
    correct: 3
    explain: '$V = \tfrac{4}{3}\pi r^3 = \tfrac{4}{3}\pi \times 216 = 288\pi$ cm³.'
  - q: 'A cone has radius $5$ cm and height $12$ cm. Slant height is...'
    options: ["$13$ cm", "$15$ cm", "$\\sqrt{17}$ cm", "$17$ cm"]
    correct: 0
    explain: '$l = \sqrt{r^2 + h^2} = \sqrt{25 + 144} = \sqrt{169} = 13$. The 5-12-13 Pythagorean triple.'
  - q: 'For the same cone ($r = 5$, $l = 13$), curved SA in terms of π is...'
    options: ["$25\\pi$ cm²", "$60\\pi$ cm²", "$65\\pi$ cm²", "$78\\pi$ cm²"]
    correct: 2
    explain: 'Curved $= \pi r l = \pi \times 5 \times 13 = 65\pi$ cm². Note: uses slant $l$, not perpendicular $h$.'
  - q: 'A solid hemisphere (with flat base) of radius $r$. Total SA is...'
    options: ["$2\\pi r^2$", "$3\\pi r^2$", "$4\\pi r^2$", "$\\pi r^2$"]
    correct: 1
    explain: 'Curved $2\pi r^2$ + flat base $\pi r^2$ = $3\pi r^2$.'
  - q: 'A composite hemisphere + cone, same radius. Total SA is...'
    options: ["$3\\pi r^2 + \\pi r l$", "$2\\pi r^2 + \\pi r l$", "$2\\pi r^2 + \\pi r l + \\pi r^2$", "$4\\pi r^2 + \\pi r l$"]
    correct: 1
    explain: 'The hemisphere''s flat side and the cone''s base are joined (cancel). What''s left: $2\pi r^2$ (curved hemisphere) + $\pi r l$ (curved cone).'
  - q: 'For a typical Cambridge mensuration question, which annotation appears?'
    options: ["nfww (not from wrong working)", "FT (follow through)", "cao (correct answer only)", "all three are common"]
    correct: 3
    explain: '"cao" for in-terms-of-π values; "FT" for parts where you can use a wrong earlier answer; "nfww" for "show that" parts where the method must be valid. Read the mark scheme carefully.'
---

## What you should know by now

If you've worked through P1 to P6 you can:

- Compute volume and surface area for cuboid, prism, cylinder, sphere, hemisphere, pyramid, and cone.
- Apply $V = A_\text{cross} \times L$ for any prism, after finding the cross-section.
- Use Pythagoras to switch between cone perpendicular height $h$ and slant height $l$.
- Add volumes and carefully count surface areas for composite solids, cancelling hidden faces.
- Set up the geometry when a sector is rolled into a cone.

## All formulas at a glance

<div class="diagram">
<div class="diagram-caption">SURFACE AREA AND VOLUME · REFERENCE</div>
<div style="font-size:14px;line-height:1.85;padding:14px 18px">

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">CUBOID</span> &nbsp;
\({\color{#0fee89}V = l \times w \times h}\) &nbsp;·&nbsp;
\({\color{#0fee89}\text{SA} = 2(lw + lh + wh)}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">volume given via prism formula · SA NOT given</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">PRISM</span> &nbsp;
\({\color{#0fee89}V = A_\text{cross} \times L}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">cross-section area × length · GIVEN on the formula sheet</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">CYLINDER</span> &nbsp;
\({\color{#0fee89}V = \pi r^{2} h}\) &nbsp;·&nbsp;
\({\color{#0fee89}\text{curved} = 2\pi r h}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">total SA = curved + 2πr² (two end-circles, you add them)</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">SPHERE</span> &nbsp;
\({\color{#0fee89}V = \tfrac{4}{3}\pi r^{3}}\) &nbsp;·&nbsp;
\({\color{#0fee89}\text{SA} = 4\pi r^{2}}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">both formulas GIVEN · hemisphere = half of each</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">HEMISPHERE</span> &nbsp;
\({\color{#0fee89}V = \tfrac{2}{3}\pi r^{3}}\) &nbsp;·&nbsp;
\({\color{#0fee89}\text{curved} = 2\pi r^{2}}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">solid hemisphere total SA = 3πr² (curved + flat base πr²)</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">PYRAMID</span> &nbsp;
\({\color{#0fee89}V = \tfrac{1}{3} \times A_\text{base} \times h}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">h is the perpendicular height (not slant) · GIVEN</div>
</div>

<div><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">CONE</span> &nbsp;
\({\color{#0fee89}V = \tfrac{1}{3}\pi r^{2} h}\) &nbsp;·&nbsp;
\({\color{#0fee89}\text{curved} = \pi r l}\) &nbsp;·&nbsp;
\({\color{#fff067}l = \sqrt{r^{2} + h^{2}}}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">total SA = πrl + πr² (closed cone) · slant from Pythagoras</div>
</div>

</div>
</div>

## Marking patterns at a glance

For a typical Cambridge mensuration question:

- **M1** for stating or substituting the formula correctly (e.g., $\tfrac{1}{3}\pi r^2 h$ with values).
- **M1** for any intermediate computation (Pythagoras for slant, or cross-section area).
- **A1** for the final value with the correct unit (cm² for SA, cm³ for volume).
- "**nfww**" appears on "show that" questions; wrong working forfeits the A.
- "**FT**" applies when an earlier wrong answer flows through correctly.

The single most expensive slip across all of 5.4: **dropping the $\tfrac{1}{3}$ on a cone or pyramid volume**. That's the M mark vanishing for one missing fraction.

## Practice

<iframe src="/widgets/volume-trainer.html" style="width:100%;max-width:696px;height:600px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

The trainer cycles through all the shapes from this unit. Pick a single shape ("cone", "cylinder", etc) for focused drill, or "mixed" to practice recognising which formula to pull out.

## Comprehensive worked example

A solid is formed by joining a cone to a hemisphere. Both have radius $r = 6$ cm. The cone's slant height is $10$ cm.

(a) Find the cone's perpendicular height.
(b) Find the volume of the solid, in terms of π.
(c) Find the total surface area of the solid, in terms of π.

**Step a: cone height (Pythagoras).**

$$h = \sqrt{l^2 - r^2} = \sqrt{10^2 - 6^2} = \sqrt{100 - 36} = \sqrt{64} = \boxed{8}\;\text{cm}$$

**[M1 for $\sqrt{l^2 - r^2}$; A1 for $8$]**

**Step b: total volume.**

$$V_\text{cone} = \tfrac{1}{3}\pi r^2 h = \tfrac{1}{3}\pi \times 36 \times 8 = 96\pi\;\text{cm}^3$$

$$V_\text{hemi} = \tfrac{2}{3}\pi r^3 = \tfrac{2}{3}\pi \times 216 = 144\pi\;\text{cm}^3$$

$$V_\text{total} = 96\pi + 144\pi = \boxed{240\pi}\;\text{cm}^3$$

**[M1 for $\tfrac{1}{3}\pi r^2 h$; M1 for $\tfrac{2}{3}\pi r^3$; A1 for $240\pi$]**

**Step c: total surface area.** The cone's flat base and hemisphere's flat side are glued together (cancel). What's left:

$$\text{curved cone} = \pi r l = \pi \times 6 \times 10 = 60\pi\;\text{cm}^2$$

$$\text{curved hemisphere} = 2\pi r^2 = 2\pi \times 36 = 72\pi\;\text{cm}^2$$

$$\text{SA} = 60\pi + 72\pi = \boxed{132\pi}\;\text{cm}^2$$

**[M1 for identifying that internal faces cancel; M1 for $\pi r l + 2\pi r^2$; A1 for $132\pi$]**

Full marks $= 8$.

The single hardest mark in this question is the SA "internal faces cancel" reasoning. The mark scheme awards it just for setting up the right two terms, with no extra $\pi r^2$ added by mistake.

## Quick reference (memorise these)

- $V_\text{cuboid} = lwh$ &nbsp; (and SA $= 2(lw + lh + wh)$)
- $V_\text{prism} = A_\text{cross} \times L$
- $V_\text{cylinder} = \pi r^2 h$ &nbsp; · &nbsp; curved SA $= 2\pi r h$
- $V_\text{sphere} = \tfrac{4}{3}\pi r^3$ &nbsp; · &nbsp; SA $= 4\pi r^2$
- $V_\text{cone} = \tfrac{1}{3}\pi r^2 h$ &nbsp; · &nbsp; curved SA $= \pi r l$ &nbsp; · &nbsp; $l = \sqrt{r^2 + h^2}$
- $V_\text{pyramid} = \tfrac{1}{3} A_\text{base} h$

The phrase that ties the whole unit together: **"cones and pyramids are one-third of their straight-walled cousin"**. A cylinder of the same radius and height has $3 \times$ the volume of the corresponding cone. A cuboid has $3 \times$ the volume of the corresponding rectangular pyramid. Knowing that, you can rebuild $\tfrac{1}{3}$ if you blank on it under exam pressure.
