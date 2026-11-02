// Scripted play-through of "The cosine rule", beat by beat, the way a student
// would do it, with a wrong attempt at each kind of task. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("cosine-rule", "play-cosine-rule")
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
  /** Turn B about C to this angle (B is 3 from C at the origin). */
  const turnTo = async deg => {
    const from = await page.evaluate(() => window.__beatApi.ptS(window.__beatScene, "B"))
    const to = await page.evaluate(d => window.__beatApi.toScreen(window.__beatScene, [3 * Math.cos(d * Math.PI / 180), 3 * Math.sin(d * Math.PI / 180)]), deg)
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

  // what each kind of beat is in this lesson
  const SIDEQ = { x: 1, y: 1, ex1: 1, ex2: 1 }
  const ANGQ = { t: 1, u: 1, ex3: 1, ex4: 1, ex5: 1 }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    const pre = id.split("-")[0]
    // ── part 1: no full pair ──
    if (id === "no-pair" || id === "no-pair-2") { await tapSide("A"); await noted("a side with no angle"); await sleep(300); await pickText("No pair"); continue }
    // ── part 2 and 3: the squares ──
    if (id === "right") { await turnTo(72); await noted("too small"); await turnTo(90); await expect((await st()).locked, "C did not lock at 90"); continue }
    if (id === "areas") { for (const k of ["A", "B", "C"]) { await tapSquare(k); await sleep(300) } continue }
    if (id === "bigger") { await turnTo(118); await next(); continue }
    if (id === "smaller") { await turnTo(68); await next(); continue }
    if (id === "gap-play") { await turnTo(110); await turnTo(62); await next(); continue }
    if (id === "make-60") { await turnTo(76); await noted("too big"); await turnTo(60); await expect((await st()).locked, "C did not lock at 60"); continue }
    if (id === "type-gap") { await type("12"); await noted("a bare number"); await right("2*3*4*c60"); continue }
    if (id === "fits") { await turnTo(80); await next(); continue }
    // ── using the rule ──
    if ((SIDEQ[pre] || ANGQ[pre]) && /-angle$/.test(id) && SIDEQ[pre]) { await tapAng("A"); await noted("a touching angle"); await sleep(300); await tapAng("C"); continue }
    if (SIDEQ[pre] && /-sides$/.test(id)) { await tapSide("C"); await noted("the unknown side"); await sleep(300); await tapSide("B"); await sleep(300); await tapSide("A"); continue }
    if (ANGQ[pre] && /-side$/.test(id)) { await tapSide("A"); await noted("a touching side"); await sleep(300); await tapSide("C"); continue }
    if (/-tri$/.test(id)) {
      const wrongR = { ex3: "DBCE", ex4: "EBCD" }[pre]
      if (wrongR) { await tapRegion(wrongR); await noted("the wrong part") }
      await tapRegion({ ex3: "ADE", ex4: "EAB", ex5: "ABD" }[pre]); continue
    }
    if (id === "x-fill") { await place("side-A", "sx"); await noted("a side on the left"); await place("side-C", "sx"); await place("ang-C", "ang"); continue }
    if (id === "x-fill-2" || id === "t-fill-2") { await place("side-B", "s1"); await place("side-A", "s2"); await waitFor(async () => ((await st()).fill ?? []).includes("p2"), 3000); continue }
    if (id === "t-fill") { await place("side-A", "sx"); await noted("the wrong side taken away"); await place("ang-C", "ang"); await place("side-C", "sx"); continue }
    if (/-fill$/.test(id) && (SIDEQ[pre] || ANGQ[pre])) { await place("ang-C", "ang"); await place("side-C", "sx"); await place("side-A", "s1"); await place("side-B", "s2"); await waitFor(async () => ((await st()).fill ?? []).includes("p2"), 3000); continue }
    if (SIDEQ[pre] && /-calc$/.test(id)) {
      if (id === "x-calc") await slip("4*c40", /first/)
      await right(); continue
    }
    if (/-cross$/.test(id)) {
      if (id === "x-cross") { await cross("xq", false); await noted("not across") }
      const piece = ANGQ[pre] ? "cos" : "xq"
      await cross(piece)
      if (id === "x-cross" || id === "t-cross") { await pickIdx(1); await noted("the wrong one") }
      await pickIdx(0); await expect(await crossDone(), id + " did not land"); continue
    }
    if (SIDEQ[pre] && /-root$/.test(id)) { if (id === "x-root") await slip("a", /square root/); await right(); continue }
    if (ANGQ[pre] && /-top$/.test(id)) { if (id === "t-top") await slip("5^+6^+7^", /away/); await right(); continue }
    if (ANGQ[pre] && /-bottom$/.test(id)) { if (id === "t-bottom") await slip("5*6", /2/); await right(); continue }
    if (ANGQ[pre] && /-divide$/.test(id)) { if (id === "t-divide") await slip("60/12", /top divided/); await right(); continue }
    if (ANGQ[pre] && /-angle$/.test(id)) { if (id === "t-angle") await slip("ca", /SHIFT/); await right(); continue }
    if (id === "y-cos") { await right("c120"); continue }
    // ── rearranging, by moving across ──
    if (id === "why-across") { await dropChip("add-T"); await expect(await waitFor(async () => (await st()).got.includes("both"), 5000), "both sides did not get it"); continue }
    if (id === "cancel-T") { await tapAtom("mT"); await expect(await waitFor(async () => (await st()).got.includes("gone"), 6000), "the pair did not cancel"); continue }
    if (id === "move-c2") { await cross("c2", false); await noted("not across"); await cross("c2"); await pickIdx(1); await noted("+ c²"); await pickIdx(0); await expect(await crossDone(), "c² did not land"); continue }
    if (id === "multiplying") { await tapAtom("Lcos"); await noted("cos itself"); await sleep(300); await tapAtom("La"); continue }
    if (id === "move-2ab") { await cross("L2"); await pickIdx(1); await noted("− 2ab"); await pickIdx(0); await expect(await crossDone(), "2ab did not land"); continue }
    // ── which rule ──
    if (id === "which-1") { await pickText("No pair"); await noted("no pair when there is one"); await tapSide("B"); await sleep(300); await tapAng("B"); await pickText("Cosine rule"); await noted("the wrong rule"); await pickText("Sine rule"); continue }
    if (id === "which-2") { await tapSide("A"); await noted("a side with no angle"); await pickText("No pair"); await pickText("Cosine rule"); continue }
    if (id === "which-3") { await pickText("No pair"); await pickText("Cosine rule"); continue }
    if (id === "which-4") { await tapAng("B"); await sleep(300); await tapSide("B"); await pickText("Sine rule"); continue }
    // ── exam questions ──
    if (id === "ex2-perimeter") { await slip("150+187", /AC/); await right(); continue }
    if (id === "ex2-divide") { await right(); continue }
    if (id === "ex2-buy") { await pickIdx(0); await noted("30 rolls"); await pickIdx(1); continue }
    if (id === "ex5-bac") { await right(); continue }
    if (id === "ex5-abc") { await slip("180-56.5", /48/); await right(); continue }
    if (id === "ex5-pair") { await tapSide("B"); await noted("AC"); await sleep(300); await tapAng("C"); await sleep(300); await tapSide("C"); continue }
    if (id === "ex5-fill-sine") { await place("side-B", "sL"); await place("ang-B", "aL"); await place("side-C", "sR"); await place("ang-C", "aR"); continue }
    if (id === "ex5-move") { await cross("ang-B"); await pickIdx(1); await noted("÷ sin"); await pickIdx(0); await expect(await crossDone(), "sin did not land"); continue }
    if (id === "ex5-calc") { await right(); continue }
    if (id === "end") { await turnTo(110); await sleep(2500); await shot("end"); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Start again"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
