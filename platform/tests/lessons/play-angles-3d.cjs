// Scripted play-through of "Angles in 3D", beat by beat, the way a student
// would do it, with a wrong attempt at each kind of task. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("angles-3d", "play-angles-3d")
  const { page, next, tap, tapSel, drag, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, got: [...s.got], mode: s.mode,
      stick: s.stick && { th: s.stick.th * 180 / Math.PI, moved: s.stick.moved }, choice: s.choice && s.choice.state, turned: s.turned }
  })
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const idNow = () => page.evaluate(() => window.__beatApi.beats[window.__beatIdx ?? 0].id)
  const at = async (id, ms = 30000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      if ((await idNow()) === id && !(await page.$("[class*=card]"))) { await sleep(700); return true }
      await sleep(120)
    }
    fail(`never reached ${id} (on ${await idNow()})`)
    return false
  }
  const waitFor = async (fn, ms = 7000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(150) } return false }
  const noted = async what => expect((await st()).note, "no note after " + what)

  const pt = n => api("ptS", n)
  const turn = async (px = 180) => {
    const L = await api("layout")
    const y = (L.board.y0 + L.board.y1) / 2, x = L.board.x0 + 20
    await drag([x, y], [x + px, y + 10], 24)
    await sleep(400)
  }
  /** Tip the stick to an angle (degrees up from the floor), keeping its turn; or wave it about. */
  const tipTo = async th => {
    await sleep(600)
    const [phi] = await api("stickNow")
    const a = await api("handleAt", "top"), b = await api("stickAt", phi, th)
    await drag(a, b, 30)
    await sleep(500)
  }
  const wave = async () => {
    await sleep(600)
    const [phi, th] = await api("stickNow")
    for (const [p2, t2] of [[phi + 50, th - 15], [phi - 20, th + 20], [phi + 10, th]]) {
      const a = await api("handleAt", "top"), b = await api("stickAt", p2, t2)
      await drag(a, b, 22)
      await sleep(300)
    }
  }
  const tapPt = async n => tap(...(await pt(n)))
  const tapArc = async i => { const p = await api("arcAt", i); if (!p) return fail("no arc " + i); await tap(...p) }
  const tapRegion = async id => { const p = await api("regionAt", id); if (!p) return fail("no region " + id); await tap(...p) }
  const tapSeg = async (a, b) => tap(...(await api("segMid", a, b)))
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  /** Type on the calculator: s c t, S C T for SHIFT and the inverse, * / for × ÷, a for Ans. */
  const type = async str => {
    if (TOUCH) {
      const fn = { s: "sin", c: "cos", t: "tan", "*": "×", "/": "÷", a: "Ans", "^": "x²", r: "√", "-": "−", "+": "+" }
      const inv = { S: "sin", C: "cos", T: "tan" }
      for (const ch of str) {
        if (inv[ch]) { await tapSel('button[aria-label="SHIFT"]'); await sleep(80); await tapSel(`button[aria-label="${inv[ch]}⁻¹"]`) }
        else await tapSel(`button[aria-label="${fn[ch] || ch}"]`)
        await sleep(60)
      }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str ?? "typed"}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong" || /Nearly/.test(s.note || ""), `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    // ── the stick ──
    if (id === "tilt" || id === "tilt-shadow" || id === "between") { await wave(); await wave(); await next(); continue }
    if (id === "flat") { await tipTo(0); await expect(Math.abs((await st()).stick.th) < 1e-6, "the stick is not flat"); continue }
    if (id === "up") { await tipTo(90); await expect(Math.abs((await st()).stick.th - 90) < 1e-6, "the stick is not upright"); continue }
    if (id === "stick-right") { await tapArc(0); await noted("the angle at the foot"); await sleep(300); await tapArc(1); continue }
    if (id === "box-turn") { await turn(220); await turn(160); await next(); continue }
    // ── shadows ──
    if (id === "box-shadow" || id === "x1-shadow") { await tapPt("H"); await noted("a wrong corner"); await sleep(300); await tapPt("G"); continue }
    if (id === "ag-shadow") { await tapPt("F"); await noted("a wrong corner"); await sleep(300); await tapPt("E"); continue }
    if (id === "pyr-shadow") { await tapPt("C"); await noted("a corner"); await sleep(300); await tapPt("X"); continue }
    if (id === "x2-shadow") { await tapPt("O"); continue }
    // ── angles with the floor ──
    if (id === "box-angle") { await tapArc(0); await noted("the angle with an edge"); await sleep(300); await tapArc(2); continue }
    if (id === "ag-angle" || id === "pyr-angle" || id === "x1-angle" || id === "x2-angle") { await tapArc(0); await noted("the angle with an edge"); await sleep(300); await tapArc(1); continue }
    // ── lifting out ──
    if (id === "box-lift" || id === "x1-lift") { await tapRegion("EGC"); continue }
    if (id === "hall-lift-c") { await tapRegion("LBC"); continue }
    if (id === "hall-lift-a") { await tapRegion("LBA"); continue }
    if (id === "x2-lift") { await tapRegion("VOB"); continue }
    if (id === "x3-lift") { await tapRegion("EMB"); continue }
    if (id === "hall-share") { await tapSeg("B", "C"); await noted("a line in one triangle"); await sleep(300); await tapSeg("B", "L"); continue }
    if (id === "x3-q") { await pickIdx(0); await noted("yes"); await sleep(300); await pickIdx(1); continue }
    // ── typing ──
    if (id === "box-work") { await slip("8/15", /ratio/); await right(); continue }
    if (id === "hall-lb") { await slip("20*s25", /tan/); await right(); continue }
    if (id === "x1-work") { await right("24.1"); continue }
    if (id === "x2-work") { await right("76.2"); continue }
    if (["q1-eg", "q1-ang", "q2", "hall-ang", "x3-work", "x4-lb", "x4-ang", "x5-ak", "x5-ang"].includes(id)) { await right(); continue }
    if (id === "free") { await sleep(3500); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Start again"); break }
    await next()
  }
  await T.finish()
})()
