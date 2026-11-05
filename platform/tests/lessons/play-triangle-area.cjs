// Scripted play-through of "Area of a triangle", beat by beat, the way a
// student would do it, with a wrong attempt at each kind of task. FROM=n
// starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("triangle-area", "play-triangle-area")
  const { page, next, tap, tapSel, drag, shot, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, locked: s.locked, got: [...s.got], mode: s.mode, chips: s.chips.map(c => c.id),
      solve: s.solve && { done: s.solve.done, crossed: s.solve.crossed }, fill: s.fill && Object.keys(s.fill.filled), choice: s.choice && s.choice.options }
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

  // ── doing things on the board ──
  // an angle with a label is tapped on its label, one without on its arc
  const tapAng = async c => { const has = await page.evaluate(c => !!window.__beatScene.labD["ang-" + c], c); await tap(...(await api(has ? "angAt" : "arcAt", c))) }
  const tapSide = async c => tap(...(await api("sideAt", c)))
  const tapSquare = async c => tap(...(await api("squareAt", c)))
  const tapRegion = async id => { const p = await api("regionAt", id); if (!p) return fail("no region " + id); await tap(...p) }
  const atomAt = id => api("atomAt", id)
  const tapAtom = async id => { const p = await atomAt(id); if (!p) return fail("no piece " + id); await tap(...p) }
  const chipAt = async id => {
    const L = await api("layout")
    const r = (await page.evaluate(L => window.__beatApi.chipRects(window.__beatScene, L), L)).find(c => c.id === id)
    return r ? [(r.r.x0 + r.r.x1) / 2, (r.r.y0 + r.r.y1) / 2] : null
  }
  const dropChip = async id => {
    const a = await chipAt(id)
    if (!a) return fail(`no chip ${id}`)
    await drag(a, await atomAt("eq"), 16)
  }
  /** Turn B about C to this angle (B is 6 from C at the origin). */
  const turnTo = async deg => {
    const from = await page.evaluate(() => window.__beatApi.ptS(window.__beatScene, "B"))
    const to = await page.evaluate(d => window.__beatApi.toScreen(window.__beatScene, [6 * Math.cos(d * Math.PI / 180), 6 * Math.sin(d * Math.PI / 180)]), deg)
    await drag(from, to, 24)
    await sleep(400)
  }
  /** Drag a label off the triangle into a place in the rule. */
  const place = async (key, slot) => {
    const a = await api("labAt", key), b = await atomAt(slot)
    if (!a || !b) return fail(`can't drag ${key} to ${slot}`)
    await drag(a, b, 18)
    await sleep(450)
  }
  /** Drag a piece of the equation over the = (or not, to see the note). */
  const cross = async (id, over = true) => {
    const a = await atomAt(id), e = await atomAt("eq")
    if (!a || !e) return fail(`no piece ${id} to move`)
    const to = over ? [e[0] + (a[0] < e[0] ? 1 : -1) * 70, e[1]] : [a[0], a[1] - 60]
    await drag(a, to, 16)
    await sleep(500)
  }
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  const pickText = async text => {
    await waitFor(async () => (await page.$$("[class*=choices] button")).length > 0, 5000)
    const bs = await page.$$("[class*=choices] button")
    for (const b of bs) if ((await page.evaluate(e => e.textContent, b)).trim() === text) { const r = await b.boundingBox(); await tap(r.x + r.width / 2, r.y + r.height / 2); await sleep(500); return }
    fail("no choice " + text)
  }
  /** Type on the calculator: ^ is x², r is √, a is Ans, - is −, S C T are SHIFT then sin cos tan. */
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
  const crossDone = () => waitFor(async () => (await st()).solve?.done, 6000)

  /** Pull the height down from its corner, short of the base first (the note), then all the way. */
  const dropIt = async (short) => {
    const from = await page.evaluate(() => { const S = window.__beatScene; return window.__beatApi.ptS(S, S.height?.from ?? "C") })
    const foot = await api("footAt")
    if (short) { await drag(from, [from[0] + (foot[0] - from[0]) * 0.4, from[1] + (foot[1] - from[1]) * 0.4], 10); await sleep(300); await noted("a short pull") }
    await drag(from, [foot[0], foot[1] + 12], 22)
    await sleep(400)
  }
  /** The ids of the pieces that multiply the unknown, read from the board. */
  const tapAll = async (ids, wrong) => { if (wrong) { await tapAtom(wrong); await noted("the unknown itself") } for (const id of ids) { await tapAtom(id); await sleep(250) } }
  const slideTo = async x => {
    const from = await page.evaluate(() => window.__beatApi.ptS(window.__beatScene, "P"))
    const to = await page.evaluate(x => window.__beatApi.toScreen(window.__beatScene, [x, 0]), x)
    await drag(from, to, 18); await sleep(400)
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    const pre = id.split("-")[0]
    if (id === "drop-top") { await dropIt(true); continue }
    if (id === "drop-B" || id === "ex5-drop") { await dropIt(false); continue }
    if (id === "type-20") { await slip("8*5", /half/); await right(); continue }
    if (id === "tap-hyp") { await tapSide("B"); await noted("a leg"); await sleep(300); await tapSide("A"); continue }
    if (id === "tap-across-h") { await tapAng("B"); await noted("angle B"); await sleep(300); await tapAng("C"); continue }
    if (id === "move-a") { await cross("a"); await pickIdx(1); await noted("÷ a"); await pickIdx(0); await expect(await crossDone(), "a did not land"); continue }
    if (id === "put-in") { await place("X-BH", "h"); await expect(await waitFor(async () => (await st()).got.includes("in"), 4000), "a sin C not put in"); continue }
    if (id === "turn") { await turnTo(75); await turnTo(45); await next(); continue }
    if (id === "biggest") { await turnTo(70); await noted("not the biggest"); await turnTo(90); await expect((await st()).locked, "C did not lock at 90"); continue }
    if (id === "past-90") { await turnTo(122); await next(); continue }
    if (id === "make-30") { await turnTo(48); await noted("too big"); await turnTo(30); await expect((await st()).locked, "C did not lock at 30"); continue }
    if (id === "make-150") { await turnTo(150); await expect((await st()).locked, "C did not lock at 150"); continue }
    if (/-angle$/.test(id) && /^(q1|q2|ex1)$/.test(pre)) { await tapAng("A"); await noted("an angle at one end"); await sleep(300); await tapAng("C"); continue }
    if (id === "q2-fill") { await place("ang-A", "ang"); await noted("the angle not between"); }
    if (/-fill$/.test(id)) { await place("side-A", "s1"); await place("side-B", "s2"); await place("ang-C", "ang"); await expect(await waitFor(async () => ((await st()).fill ?? []).length >= 3, 3000), id + " not filled"); continue }
    if (id === "q1-calc") { await slip("7*9*s50", /half/); await right(); continue }
    if (/-calc$/.test(id) && pre !== "ex4") { await right(); continue }
    if (id === "q3-angle") { await slip("70+45", /away/); await right(); continue }
    if (/-tap$/.test(id) && pre !== "ex5") {
      const ids = await page.evaluate(() => window.__beatScene.tapAtoms)
      const x = ids[ids.length - 2], want = ids.slice(0, ids.length - 2).filter(i => i !== "angv")
      await tapAll(want, x); continue
    }
    if (/-cross$/.test(id) && id !== "ex4-cos-cross" && id !== "ex5-cross" && id !== "move-a") {
      const ids = await page.evaluate(() => window.__beatScene.dragAtoms)
      await cross(ids[0]); if (id === "back-cross") { await pickIdx(1); await noted("− the block") } await pickIdx(0); await expect(await crossDone(), id + " did not land"); continue
    }
    if (/-bottom$/.test(id)) { if (id === "back-bottom") await slip("8*s40", /half/); await right(); continue }
    if (/-divide$/.test(id)) { if (id === "back-divide") await slip("a/30", /divided/); await right(); continue }
    if (id === "slide-P") { await slideTo(8.6); await noted("not the shortest"); const f = await page.evaluate(() => window.__beatApi.footAt(window.__beatScene)); const fw = await page.evaluate(f => { const S = window.__beatScene; const v = S.viewD; return [v.wx + (f[0] - v.cx) / v.u, 0] }, f); await slideTo(fw[0]); await expect((await st()).locked, "P did not click at the foot"); continue }
    if (id === "ex1-ab" || id === "ex1-ac" || id === "ex2-trap" || id === "ex2-total" || id === "ex4-qsr" || id === "ex5-bottom") { await right(); continue }
    if (id === "ex2-tri") { await tapRegion("EBCD"); await noted("the trapezium"); await tapRegion("EAB"); continue }
    if (id === "ex4-psq") { await slip("67+74", /away/); await right(); continue }
    if (id === "ex4-tri") { await tapRegion("PQS"); await noted("triangle PQS"); await tapRegion("QRS"); continue }
    if (id === "ex4-fill-cos") { await place("side-C", "sx"); await place("ang-C", "ang"); await place("side-A", "s1"); await place("side-B", "s2"); await waitFor(async () => ((await st()).fill ?? []).includes("p2"), 3000); continue }
    if (id === "ex4-cos-calc" || id === "ex4-cos-root") { await right(); continue }
    if (id === "ex4-cos-cross") { await cross("xq"); await pickIdx(0); await expect(await crossDone(), "the square did not land"); continue }
    if (id === "ex5-tap") { await tapAll(["half", "bc"], "h"); continue }
    if (id === "ex5-cross") { await cross("half"); await pickIdx(0); await expect(await crossDone(), "½ × 124.3 did not land"); continue }
    if (id === "ex5-divide") { await right(); continue }
    if (id === "end") { await turnTo(110); await sleep(2500); await shot("end"); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Start again"); break }
    await next()
  }
  await T.finish()
})()
