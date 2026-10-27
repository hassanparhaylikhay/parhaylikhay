// Scripted play-through of "Trigonometry: finding an angle", the way a student
// would do it, with a wrong attempt at each kind of task.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("trigonometry-angles", "play-trig-angles")
  const { page, want, next, tap, tapSel, drag, path, shot, expect, S, api, corner, turnTo, dropLine, tapCard, atomAt, tapAtom, dropChip, TOUCH } = T

  /** Type on the angle calculator: S C T for sin⁻¹ cos⁻¹ tan⁻¹ (SHIFT, then the key), s c t, / for ÷. */
  const typeA = async str => {
    if (TOUCH) {
      const fn = { s: "sin", c: "cos", t: "tan" }
      const inv = { S: "sin", C: "cos", T: "tan" }
      for (const ch of str) {
        if (inv[ch]) { await tapSel('button[aria-label="SHIFT"]'); await sleep(80); await tapSel(`button[aria-label="${inv[ch]}⁻¹"]`) }
        else await tapSel(`button[aria-label="${fn[ch] || (ch === "/" ? "÷" : ch)}"]`)
        await sleep(60)
      }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(60) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const A = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, solve: s.asolve && { stage: s.asolve.stage, busy: s.asolve.busy, inv: s.asolve.inv }, locked: s.locked, chips: s.chips.map(c => c.id), got: [...s.got] }
  })
  const waitFor = async (fn, ms = 6000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(150) } return false }
  /** Drag the line of sight's end to a point (world units). */
  const sightTo = async w => {
    const a = await api("sightEnd")
    const b = await api("toScreen", w)
    const pts = []
    for (let i = 0; i <= 20; i++) pts.push([a[0] + (b[0] - a[0]) * i / 20, a[1] + (b[1] - a[1]) * i / 20])
    await path(pts)
    await sleep(300)
  }
  const tapAng = async id => { const p = await api("angAt", id); if (!p) return T.fail("no angle " + id); await tap(...p) }
  /** Drag the sin (cos, tan) across the = : the shortcut. */
  const crossOver = async () => { const a = await atomAt("fn"), b = await atomAt("kt"); await drag(a, [b[0] + 10, b[1] + 14], 16); await sleep(1800) }
  const solved = async () => waitFor(async () => { const s = await A(); return s.solve && s.solve.stage === "done" && !s.solve.busy }, 6000)

  /** One question: which rule, get θ on its own, work it out. */
  const question = async (fn, calc, o = {}) => {
    await want(o.rule || "Which rule")
    if (o.wrongCard) { await tapCard(o.wrongCard); await expect((await A()).note, "no note on a wrong card"); await sleep(400) }
    await tapCard(fn)
    await want("Get")
    if (o.cross) await crossOver()
    else {
      if (o.wrongChip) { await dropChip(o.wrongChip); await expect((await A()).note, "no note on a wrong inverse"); await sleep(3200) }
      await dropChip(`inv-${fn}`)
    }
    await expect(await solved(), "θ not on its own")
    await want("Work it out")
    if (o.slip) { await typeA(o.slip); await expect((await A()).input === "wrong", "a slip was accepted: " + o.slip); await expect((await A()).note, "no note for a slip " + o.slip) }
    await typeA(calc)
    await expect((await A()).input === "right", "answer not right: " + calc)
  }

  // ── 1. finding an angle ──
  await want("Let's make a right-angled"); await turnTo(52); await next()
  await want("Now pull a line"); await dropLine(1.2)
  await want("So far we knew"); await sleep(1600); await shot("so-far"); await next()
  await want("What if we know two"); await next()
  await want("Let's find it by turning"); await turnTo(37); await expect(/Close/.test((await A()).note || ""), "no 'Close' at 37"); await turnTo(30.5)
  await want("When the opposite"); await next()
  await want("Now make the opposite"); await turnTo(46); await expect(/Close/.test((await A()).note || ""), "no 'Close' at 46"); await turnTo(38.9)
  await expect(/38\.7/.test((await A()).note || ""), "no 38.7 note once locked")
  await want("Your calculator can find"); await next()
  // ── 2. undoing sin ──
  await want("sin takes an angle"); await sleep(2400); await shot("machine"); await next()
  await want("Here, sin"); await next()
  await want("What if we start"); await next()
  await want("sin−1 goes"); await sleep(2600); await shot("inverse"); await next()
  await want("Let's try it"); await typeA("30"); await expect(/SHIFT/.test((await A()).note || ""), "no SHIFT note for a plain 30"); await typeA("S0.5"); await expect((await A()).input === "right", "sin⁻¹ 0.5 not right")
  await want("Now try sin"); await typeA("s5/8"); await expect((await A()).input === "wrong", "sin 5 ÷ 8 accepted"); await typeA("S5/8"); await expect((await A()).input === "right", "sin⁻¹ 5/8 not right")
  await want("That's the 38.7"); await next()
  await want("cos−1 and tan−1"); await next()
  // ── 3. getting θ on its own ──
  await want("Now the opposite is 5"); await next()
  await want("Which rule uses O and H"); await tapCard("cos"); await expect((await A()).note, "no note on a wrong card"); await sleep(400); await tapCard("sin")
  await want("Put the numbers"); await next()
  await want("To get"); await next()
  await want("sin−1 undoes"); await sleep(4200); await shot("chain"); await next()
  await want("Drag sin−1"); await dropChip("inv-sin"); await expect((await A()).solve.stage === "wrapped", "sin⁻¹ did not land on both sides")
  await want("Tap sin−1 and sin"); await sleep(300); await tapAtom("invL"); await expect(await solved(), "they did not cancel")
  await want("Now θ is on its own"); await next()
  await want("Type the right side"); await typeA("s5/11"); await expect(/SHIFT/.test((await A()).note || ""), "no SHIFT note for sin(5/11)"); await typeA("S5/11"); await expect((await A()).input === "right", "sin⁻¹ 5/11 not right")
  await want("Angles are given"); await sleep(4600); await shot("rounding"); await next()
  await want("Write 27.0"); await next()
  // ── 4. which rule ──
  await want("Now we know the adjacent"); await next()
  await question("cos", "56.9", { wrongChip: "inv-sin", slip: "S6/11" })
  await want("Now the opposite and the adjacent"); await next()
  await want("Which rule"); await tapCard("tan")
  await want("Here's a shortcut"); await next()
  await want("The tan crosses"); await sleep(2200); await shot("cross"); await next()
  await want("It gives the same line"); await next()
  await want("Get"); await crossOver(); await expect(await solved(), "the shortcut did not solve it")
  await want("Work it out"); await typeA("60"); await expect(/decimal place/.test((await A()).note || ""), "no '1 decimal place' note for 60"); await typeA("T7/4"); await expect((await A()).input === "right", "tan⁻¹ 7/4 not right")
  await want("Questions like this"); await next()
  await question("sin", "S3.2/9", { rule: "Find θ", wrongCard: "tan" })
  await question("cos", "47.2", { rule: "Find θ", cross: true })
  // ── 5. two common mistakes ──
  await want("A common mistake"); await next()
  await want("Try it"); await typeA("S5/11"); await expect((await A()).input === "wrong", "the right way up counted as the mistake"); await typeA("S11/5")
  await expect((await A()).input === "guessed", "Math ERROR not shown")
  await want("That would make"); await sleep(3800); await shot("reach"); await next()
  await want("No angle can do that"); await next()
  await want("Another mistake"); await next()
  await want("An answer this small"); await next()
  // ── 6. looking up and looking down ──
  await want("Imagine standing at P"); await next()
  await want("Now look up at the top")
  const a37 = 37 * Math.PI / 180
  await sightTo([11.66 * Math.cos(a37), 11.66 * Math.sin(a37)]); await expect(/Close/.test((await A()).note || ""), "no 'Close' looking above the top")
  await sightTo(await page.evaluate(() => { const s = window.__beatScene; const th = s.tri.th * Math.PI / 180; return [s.tri.h * Math.cos(th), s.tri.h * Math.sin(th)] }))
  await expect((await A()).locked, "the line of sight did not reach the top")
  await want("The angle you looked up"); await next()
  await want("It starts from the horizontal"); await next()
  await want("Now stand at the top"); await next()
  await want("Lower your line of sight")
  const top = await page.evaluate(() => { const s = window.__beatScene; const th = s.tri.th * Math.PI / 180; return [s.tri.h * Math.cos(th), s.tri.h * Math.sin(th)] })
  const a24 = (180 + 24) * Math.PI / 180
  await sightTo([top[0] + 11 * Math.cos(a24), top[1] + 11 * Math.sin(a24)]); await expect(/Close/.test((await A()).note || ""), "no 'Close' looking short of P")
  await sightTo([0, 0]); await expect((await A()).locked, "the line of sight did not reach P")
  await want("This is the"); await next()
  await want("Look at the two angles"); await next()
  await want("The two horizontal lines"); await next()
  await want("So these are alternate"); await sleep(2000); await shot("alternate"); await next()
  await want("Be careful not to measure"); await next()
  // ── 7. exam questions ──
  await want("A light L"); await next()
  await want("Tap the angle of elevation"); await tapAng("atL"); await expect((await A()).note, "no note tapping the angle at L"); await sleep(300); await tapAng("atP")
  await question("tan", "T8/12", { rule: "Which rule do you need", wrongCard: "sin", cross: true, slip: "56.3" })
  await want("AB is vertical"); await next()
  await want("We want the angle of depression"); await tap(...(await corner("P")))
  await want("Tap the angle of depression"); await tapAng("vert"); await expect((await A()).note, "no note tapping the angle from the vertical"); await sleep(300); await tapAng("dep")
  await want("It is the same as angle ACB"); await sleep(2200); await shot("alternate-ex2"); await next()
  await question("tan", "15.1", { slip: "74.9" })
  await want("The cliff is"); await next()
  await want("These two lengths"); await next()
  await want("How many metres"); await typeA("200"); await expect((await A()).note, "no note for 200"); await typeA("2000"); await expect((await A()).input === "right", "2000 not right")
  await question("tan", "3.0", { cross: true, slip: "88.9" })
  await want("ABCDE is a pentagon"); await next()
  await want("We want angle BAE"); await next()
  await want("It isn't in a right-angled"); await next()
  await want("Draw a line straight down"); await dropLine(1.2)
  await want("This line is 8"); await next()
  await want("How long is AX"); await typeA("37"); await expect((await A()).note, "no note for 21 + 16"); await typeA("5"); await expect((await A()).input === "right", "AX = 5 not right")
  await question("tan", "T8/5", { wrongChip: "inv-sin" })
  await want("ABCD is a trapezium"); await next()
  await want("We want angle DCB"); await next()
  await want("Draw a line straight up"); await dropLine(1.2)
  await want("This line splits"); await next()
  await want("One part is a right angle"); await next()
  await want("CX is 16"); await next()
  await want("How long is XB"); await typeA("52"); await expect((await A()).note, "no note for 28 + 24"); await typeA("4"); await expect((await A()).input === "right", "XB = 4 not right")
  await question("tan", "T4/16", { rule: "Find θ", cross: true })
  await want("So angle DCB"); await next()
  await want("Work it out"); await typeA("14.0"); await expect((await A()).note, "no note for one part only"); await typeA("104.0"); await expect((await A()).input === "right", "104.0 not right")
  await sleep(1200); await shot("ex5-done")
  // ── 8. play ──
  await want("Play with it"); await sleep(1000); await turnTo(55); await sleep(4000); await shot("end")
  const again = await page.$("[class*=ctaWrap] button")
  await expect(!!again, "no Start again")
  await T.finish()
})()
