---
title: 'Review and practice'
checks:
  - q: '$AB$ is a diameter and $C$ is on the circle. Angle $BAC = 35°$. What is angle $ABC$?'
    options: ["$35°$", "$45°$", "$55°$", "$90°$"]
    correct: 2
    explain: 'Angle $ACB = 90°$ (semicircle). Triangle sum: $180 - 90 - 35 = 55°$.'
  - q: 'Tangent meets a circle at $T$. The radius is $OT$ and the tangent passes through $P$. Angle $OTP$ is...'
    options: ["$0°$", "$45°$", "$90°$", "$180°$"]
    correct: 2
    explain: 'Tangent perpendicular to radius at the point of contact.'
  - q: 'An arc subtends $58°$ at the centre. Angle at the circumference (major arc) is...'
    options: ["$29°$", "$58°$", "$116°$", "$122°$"]
    correct: 0
    explain: 'Halve: $58 \div 2 = 29°$.'
  - q: 'Angles $APB$ and $AQB$ are in the same segment. If angle $APB = 47°$, then angle $AQB$ is...'
    options: ["$47°$", "$94°$", "$133°$", "Cannot tell"]
    correct: 0
    explain: 'Angles in the same segment are equal.'
  - q: '$ABCD$ is a cyclic quadrilateral. Angle $A = 102°$. Angle $C$ is...'
    options: ["$102°$", "$78°$", "$48°$", "$258°$"]
    correct: 1
    explain: '$A + C = 180°$, so $C = 180 - 102 = 78°$.'
  - q: 'Tangent at $T$ meets chord $TQ$ at $34°$. The angle in the alternate segment is...'
    options: ["$17°$", "$34°$", "$56°$", "$146°$"]
    correct: 1
    explain: 'Alternate segment theorem: the two angles are equal.'
  - q: 'Why is writing the reason ("angle in semicircle is $90°$" etc.) so important?'
    options: ["It is not", "Cambridge often gives a separate B mark for the reason", "It just looks nice", "Required only when angle is $90°$"]
    correct: 1
    explain: 'A correct value with no reason loses the B mark for reason. Always state the theorem.'
  - q: 'In cyclic quadrilateral $ABCD$, which pair are opposite?'
    options: ["$A$ and $B$", "$A$ and $C$", "$B$ and $A$", "$D$ and $A$"]
    correct: 1
    explain: '$A$ and $C$ are opposite, $B$ and $D$ are opposite. Adjacent pairs ($A$-$B$, $B$-$C$, etc.) do NOT sum to $180°$.'
---

## What you should know by now

If you have worked through P1 to P3 you can:

- Spot a diameter and write angle in semicircle is $90°$.
- Spot a tangent meeting a radius and mark the right angle.
- Use angle at centre = $2 \times$ angle at circumference, in either direction.
- Use angles in the same segment are equal to copy an angle to a new vertex on the same arc.
- Use opposite angles of a cyclic quadrilateral sum to $180°$.
- Use the alternate segment theorem on a tangent-chord pair.

## Visual recap

The semicircle and tangent-radius rules: both produce a $90°$ at the action point.

<div class="diagram">
<div class="diagram-caption">RECAP: SEMICIRCLE + TANGENT-RADIUS</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:500px;height:220px;max-width:100%">

  <!-- Left: angle in semicircle. Circle O₁ = (120, 120), r = 70.
       AB diameter from (50, 120) to (190, 120). C on the upper arc at
       math angle 290°: C ≈ (144, 54). ∠ACB = 90°. -->

  <div style="position:absolute;left:50px;top:50px;width:140px;height:140px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <div style="position:absolute;left:50px;top:118.75px;width:140px;height:2.5px;background:#00abfa"></div>
  <!-- AC: A(50,120)→C(144,54), length 114.9, rotate −35°. -->
  <div style="position:absolute;left:50px;top:118.75px;width:114.9px;height:2.5px;background:#00abfa;transform-origin:0 50%;transform:rotate(-35deg)"></div>
  <!-- CB: C(144,54)→B(190,120), length 80.4, rotate 55.1°. -->
  <div style="position:absolute;left:144px;top:52.75px;width:80.4px;height:2.5px;background:#00abfa;transform-origin:0 50%;transform:rotate(55.1deg)"></div>

  <!-- 90° wedge at C between CB (conic 145°) and CA (conic 235°). -->
  <div style="position:absolute;left:144px;top:54px;width:30px;height:30px;border-radius:50%;background:conic-gradient(from 145deg, #ff4670 0deg 90deg, transparent 90deg);-webkit-mask:radial-gradient(circle, transparent 11px, #000 12px, #000 13px, transparent 14px);mask:radial-gradient(circle, transparent 11px, #000 12px, #000 13px, transparent 14px);transform:translate(-50%,-50%);pointer-events:none"></div>
  <div style="position:absolute;left:140px;top:80px;font:700 11px 'Geist Mono',monospace;color:#ff4670">90°</div>

  <div style="position:absolute;left:120px;top:120px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>

  <div style="position:absolute;left:50px;top:120px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:34px;top:128px;font:700 14px 'Geist Mono',monospace;color:#fff067">A</div>

  <div style="position:absolute;left:190px;top:120px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:200px;top:128px;font:700 14px 'Geist Mono',monospace;color:#fff067">B</div>

  <div style="position:absolute;left:144px;top:54px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:152px;top:38px;font:700 14px 'Geist Mono',monospace;color:#fff067">C</div>

  <!-- Right: tangent perpendicular to radius. Circle O₂ = (370, 120), r = 60.
       Tangent point T = (430, 120) at the rightmost point. Tangent is
       vertical (perpendicular to horizontal radius OT). -->

  <div style="position:absolute;left:310px;top:60px;width:120px;height:120px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Radius OT (horizontal, length 60). -->
  <div style="position:absolute;left:370px;top:118.75px;width:60px;height:2.5px;background:#00abfa"></div>
  <!-- Tangent at T (vertical, y=40 to y=200). -->
  <div style="position:absolute;left:428.75px;top:40px;width:2.5px;height:160px;background:#ff822c"></div>

  <!-- 90° wedge at T: between OT (toward O₂, conic 270°) and tangent going up (conic 0°). -->
  <div style="position:absolute;left:430px;top:120px;width:30px;height:30px;border-radius:50%;background:conic-gradient(from 270deg, #ff4670 0deg 90deg, transparent 90deg);-webkit-mask:radial-gradient(circle, transparent 11px, #000 12px, #000 13px, transparent 14px);mask:radial-gradient(circle, transparent 11px, #000 12px, #000 13px, transparent 14px);transform:translate(-50%,-50%);pointer-events:none"></div>
  <div style="position:absolute;left:402px;top:104px;font:700 11px 'Geist Mono',monospace;color:#ff4670">90°</div>

  <div style="position:absolute;left:370px;top:120px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:354px;top:114px;font:700 13px 'Geist Mono',monospace;color:#7a7875">O</div>

  <div style="position:absolute;left:430px;top:120px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:440px;top:114px;font:700 14px 'Geist Mono',monospace;color:#fff067">T</div>

</div>
</div>
</div>

The centre rule and the same-segment rule: doubling and equality.

<div class="diagram">
<div class="diagram-caption">RECAP: ANGLE AT CENTRE + SAME SEGMENT</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:18px;color:#f0eeea;text-align:center;line-height:1.9">
<div><span style="color:#fff067;font-weight:700">angle AOB</span> = 2 x <span style="color:#0fee89;font-weight:700">angle APB</span></div>
<div><span style="color:#0fee89;font-weight:700">angle APB</span> = <span style="color:#0fee89;font-weight:700">angle AQB</span></div>
<div style="color:#7a7875;font-size:13px">centre rule (yellow=2 x green) and same segment (green=green)</div>
</div>
</div>

Cyclic quadrilateral and alternate segment: the harder pair.

<div class="diagram">
<div class="diagram-caption">RECAP: CYCLIC QUAD + ALTERNATE SEGMENT</div>
<div style="font-family:var(--font-geist-mono),monospace;font-size:18px;color:#f0eeea;text-align:center;line-height:1.9">
<div><span style="color:#0fee89;font-weight:700">angle A + angle C = 180°</span></div>
<div><span style="color:#ff4670;font-weight:700">angle B + angle D = 180°</span></div>
<div style="color:#7a7875;font-size:13px;margin-top:6px">cyclic quad: opposite pairs sum to 180°</div>
<div style="margin-top:14px"><span style="color:#ff822c;font-weight:700">tangent-chord angle</span> = <span style="color:#fff067;font-weight:700">angle in alternate segment</span></div>
<div style="color:#7a7875;font-size:13px">alternate segment theorem</div>
</div>
</div>

## Marking patterns at a glance

In Cambridge 4024, circle theorem questions usually award:

- **A1** for each correct angle value.
- **B1** for each correct **reason** stated using standard wording.
- **M1** for any worked angle-sum or subtraction step that uses an earlier theorem.

A typical 4-mark question gives you 2 angles to find. You earn 1 A mark and 1 B mark per angle. If you write only the values and skip reasons, you cap yourself at half marks.

The standard reason wordings to memorise:

- angle in semicircle is $90°$
- tangent perpendicular to radius at point of contact
- angle at centre is twice angle at circumference
- angles in the same segment are equal
- opposite angles of cyclic quadrilateral sum to $180°$
- alternate segment theorem

## Comprehensive worked example

In the diagram, $A$, $B$, $C$, $D$ all lie on a circle with centre $O$. $AC$ is a diameter. Angle $CAB = 28°$. The tangent to the circle at $C$ meets line $BC$ extended at point $T$. Point $D$ lies on the major arc of chord $AB$.

Find:

(a) angle $ABC$.

(b) angle $ADB$.

(c) angle $BCT$ (the angle between the tangent at $C$ and chord $CB$).

<div class="diagram">
<div class="diagram-caption">AC DIAMETER · ∠CAB = 28° · D ON MAJOR ARC OF AB · TANGENT AT C THROUGH T</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:480px;height:280px;max-width:100%">

  <!-- Geometry: circle O = (200, 150), r = 100. AC horizontal diameter so
       A = (100, 150), C = (300, 150).
       ∠CAB = 28° → arc CB (not through A) = 56°. Place B on the lower
       arc at math angle 56°: B = (200 + 100 cos 56°, 150 + 100 sin 56°)
       ≈ (256, 233).
       D on the major arc of chord AB (the upper arc through C). Place D
       at math angle 250°: D ≈ (166, 56).
       Tangent at C is vertical (perpendicular to horizontal OC). T placed
       below C; alternate-segment angle ∠BCT = ∠BAC = 28°. -->

  <div style="position:absolute;left:100px;top:50px;width:200px;height:200px;border-radius:50%;border:1.5px solid #3a4a5a;box-sizing:border-box"></div>

  <!-- Diameter AC -->
  <div style="position:absolute;left:100px;top:148.75px;width:200px;height:2.5px;background:#00abfa"></div>

  <!-- Chord AB: A(100,150)→B(256,233), length 176.7, rotate 28°. -->
  <div style="position:absolute;left:100px;top:148.75px;width:176.7px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(28deg)"></div>

  <!-- Chord BC: B(256,233)→C(300,150), length 93.9, rotate −62.05°. -->
  <div style="position:absolute;left:256px;top:231.75px;width:93.9px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(-62.05deg)"></div>

  <!-- Chord AD: A(100,150)→D(166,56), length 114.9, rotate −54.93°. -->
  <div style="position:absolute;left:100px;top:148.75px;width:114.9px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(-54.93deg)"></div>

  <!-- Chord BD: B(256,233)→D(166,56), length 198.6, rotate −116.95°. -->
  <div style="position:absolute;left:256px;top:231.75px;width:198.6px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(-116.95deg)"></div>

  <!-- Tangent at C (vertical line x=300, y=20 to y=260). -->
  <div style="position:absolute;left:298.75px;top:20px;width:2.5px;height:240px;background:#ff822c"></div>

  <!-- 28° wedge at A between AC (conic 90°) and AB (conic 118°), fill 28°. -->
  <div style="position:absolute;left:100px;top:150px;width:60px;height:60px;border-radius:50%;background:conic-gradient(from 90deg, #fff067 0deg 28deg, transparent 28deg);-webkit-mask:radial-gradient(circle, transparent 21px, #000 22px, #000 24px, transparent 25px);mask:radial-gradient(circle, transparent 21px, #000 22px, #000 24px, transparent 25px);transform:translate(-50%,-50%);pointer-events:none"></div>
  <div style="position:absolute;left:130px;top:160px;font:700 13px 'Geist Mono',monospace;color:#fff067">28°</div>

  <!-- Centre O -->
  <div style="position:absolute;left:200px;top:150px;width:6px;height:6px;border-radius:50%;background:#7a7875;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:184px;top:138px;font:700 13px 'Geist Mono',monospace;color:#7a7875">O</div>

  <!-- Vertices -->
  <div style="position:absolute;left:100px;top:150px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:82px;top:140px;font:700 14px 'Geist Mono',monospace;color:#fff067">A</div>

  <div style="position:absolute;left:256px;top:233px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:262px;top:240px;font:700 14px 'Geist Mono',monospace;color:#fff067">B</div>

  <div style="position:absolute;left:300px;top:150px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:308px;top:140px;font:700 14px 'Geist Mono',monospace;color:#fff067">C</div>

  <div style="position:absolute;left:166px;top:56px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:148px;top:40px;font:700 14px 'Geist Mono',monospace;color:#fff067">D</div>

  <div style="position:absolute;left:300px;top:240px;width:8px;height:8px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:308px;top:248px;font:700 14px 'Geist Mono',monospace;color:#fff067">T</div>

</div>
</div>
</div>

**Step a: Angle $ABC$.** $AC$ is a diameter, so $\angle ABC$ subtends the diameter at $B$. By the angle-in-semicircle theorem $\angle ABC = \boxed{90°}$ (angle in a semicircle is $90°$). **[A1 for $90°$; B1 for the reason]**

**Step b: Angle $ADB$.** First find $\angle ACB$ from $\triangle ABC$: $\angle ACB = 180° - 90° - 28° = 62°$. Then $D$ and $C$ both lie on the major arc of chord $AB$, so $\angle ADB$ and $\angle ACB$ are in the SAME SEGMENT, giving $\angle ADB = \boxed{62°}$ (angles in the same segment are equal). **[M1 for triangle-sum to get $\angle ACB$; A1 for $62°$; B1 for the reason]**

**Step c: Angle $BCT$.** The tangent at $C$ makes an angle with chord $CB$. By the alternate segment theorem this equals the inscribed angle in the alternate segment, $\angle BAC = 28°$. So $\angle BCT = \boxed{28°}$ (alternate segment theorem). **[A1 for $28°$; B1 for the reason]**

Full marks $= 7$.

## Quick reference

- Diameter $\Rightarrow$ $90°$ at the third vertex.
- Tangent and radius at contact point $\Rightarrow$ $90°$.
- Centre angle = $2 \times$ circumference angle (same arc).
- Same segment $\Rightarrow$ equal angles.
- Cyclic quadrilateral $\Rightarrow$ opposite angles sum to $180°$.
- Tangent-chord angle = angle in alternate segment.

When you sketch the diagram, immediately:

1. Mark right angles wherever you spot a diameter or a tangent.
2. Identify any cyclic quadrilateral vertices.
3. Look for chords that have two vertices on the same side - that is your same-segment cue.
