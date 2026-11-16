// Scripted play-through of "Pythagoras in 3D", beat by beat, the way a student
// would do it, with a wrong attempt at each kind of task. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("pythagoras-3d", "play-pythagoras-3d")
  const { page, next, tap, tapSel, drag, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, got: [...s.got], mode: s.mode, box: s.box, pyr: s.pyr,
      solve: s.solve && { done: s.solve.done, crossed: s.solve.crossed }, choice: s.choice && s.choice.state, turned: s.turned, flats: s.flats.map(f => f.id) }
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
  const pt = n => api("ptS", n)
  /** Turn the figure: drag across empty board (to the side of the figure). */
  const turn = async (px = 180) => {
    const L = await api("layout")
    const y = (L.board.y0 + L.board.y1) / 2, x = L.board.x0 + 20
    await drag([x, y], [x + px, y + 10], 24)
    await sleep(400)
  }
  /** Drag a handle along its axis by this many world units. */
  const pull = async (id, units) => {
    await sleep(500)
    const p = await api("handleAt", id), ax = await api("handleAxis", id)
    if (!p || !ax) return fail("no handle " + id)
    await drag(p, [p[0] + ax[0] * units, p[1] + ax[1] * units], 26)
    await sleep(500)
  }
  const join = async (a, b) => { await tap(...(await pt(a))); await sleep(200); await tap(...(await pt(b))); await sleep(500) }
  const tapArc = async i => { const p = await api("arcAt", i); if (!p) return fail("no arc " + i); await tap(...p) }
  const tapRegion = async id => { const p = await api("regionAt", id); if (!p) return fail("no region " + id); await tap(...p) }
  const tapFlat = async (flat, a, b) => { const p = await api("flatSide", flat, a, b); if (!p) return fail(`no side ${a}${b} on ${flat}`); await tap(...p) }
  const atomAt = id => api("atomAt", id)
  const cross = async id => {
    const a = await atomAt(id), e = await atomAt("eq")
    if (!a || !e) return fail(`no piece ${id} to move`)
    await drag(a, [e[0] + (a[0] < e[0] ? 1 : -1) * 70, e[1]], 16)
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
  /** Type on the calculator: ^ is x², r is √, a is Ans, - is −. */
  const type = async str => {
    if (TOUCH) {
      const fn = { "*": "×", "/": "÷", a: "Ans", "^": "x²", r: "√", "-": "−", "+": "+" }
      for (const ch of str) { await tapSel(`button[aria-label="${fn[ch] || ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str ?? "typed"}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong" || /Nearly/.test(s.note || ""), `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  const crossDone = () => waitFor(async () => (await st()).solve?.done, 6000)

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    // ── making things ──
    if (id === "make") { await pull("top", 5); await expect((await st()).box.h >= 2, "the box did not rise"); continue }
    if (id === "turn" || id === "dashed" || id === "inside") { await turn(220); await turn(160); await next(); continue }
    // putting the flats back plays by itself, then moves on
    if (id === "back" || id.endsWith("-back")) { await expect(await waitFor(async () => (await idNow()) !== id, 16000), `${id} never moved on`); continue }
    if (id === "build") {
      const b = (await st()).box
      await pull("len", (12 - b.l) / 2)
      await pull("wid", (9 - b.w) / 2)
      await pull("hgt", 8 - b.h)
      const c = (await st()).box
      await expect(c.l === 12 && c.w === 9 && c.h === 8, `box is ${c.l} × ${c.w} × ${c.h}`)
      continue
    }
    if (id === "change") { await pull("hgt", 2); await expect((await st()).got.includes("changed"), "box did not change"); await next(); continue }
    if (id === "pyr-make") { await pull("top", 5); await sleep(900); await pull("top", 3); await expect((await st()).pyr.h === 8, "pyramid not 8 high"); continue }
    // ── joining corners ──
    if (id === "join-EC") { await join("E", "G"); await noted("a wrong join"); await sleep(300); await join("E", "C"); continue }
    if (id === "join-EG" || id === "x1-join") { await join("E", "H"); await noted("a wrong join"); await sleep(300); await join("E", "G"); continue }
    if (id === "diags") { await join("A", "B"); await noted("a side, not a diagonal"); await sleep(300); await join("A", "C"); await sleep(400); await join("B", "D"); continue }
    if (id === "join-XM") { await join("X", "M"); continue }
    // ── right angles ──
    if (id === "tap-right" || id === "pyr-right") { await tapArc(2); await noted("a wrong corner"); await sleep(300); await tapArc(1); continue }
    if (id === "face-right") { await tapArc(1); continue }
    // ── triangles to tap and lift ──
    if (id === "lift" || id === "x1-lift") { await tapRegion("EGC"); continue }
    if (id === "floor-tri" || id === "x1-floor") { await tapRegion("EHG"); continue }
    if (id === "pyr-tri" || id === "x2-tri") { await tapRegion("EBC"); await noted("a face"); await sleep(300); await tapRegion("EXC"); continue }
    if (id === "pyr-lift" || id === "x3-tri") { await tapRegion("EXC"); continue }
    if (id === "pyr-floor" || id === "x2-floor" || id === "x3-floor") { await tapRegion("ABC"); continue }
    if (id === "face-lift") { await tapRegion("EXM"); continue }
    if (id === "x4-tri") { await tapRegion("CMB"); continue }
    // ── the OB part ──
    if (id === "x4-join") { await join("M", "A"); await noted("a wrong join"); await sleep(300); await join("M", "B"); continue }
    if (id === "x4-fold") {
      await sleep(1800)
      const h = await api("handleAt", "fold"), C = await pt("C")
      if (!h) { fail("no fold handle"); continue }
      await drag(h, C, 30)
      await sleep(600)
      await expect((await page.evaluate(() => window.__beatScene.vals.phi)) === Math.PI, "the fold did not land on C")
      continue
    }
    if (id === "x4-slide") {
      // the marks' true places on the screen (a third of the way along MB in the world)
      const at = f => page.evaluate(f => { const S = window.__beatScene, M = S.P3.M, B = S.P3.B; return window.__beatApi.projAt(S, [0, 1, 2].map(i => M[i] + (B[i] - M[i]) * f)) }, f)
      let h = await api("handleAt", "O")
      await drag(h, await at(2 / 3), 20); await sleep(400)
      await noted("O at two thirds")
      h = await api("handleAt", "O")
      await drag(h, await at(1 / 3), 20); await sleep(400)
      await expect((await page.evaluate(() => window.__beatScene.vals.t)) === 1 / 3, "O did not click onto the first mark")
      continue
    }
    if (id === "x4-frac") { await pickIdx(0); await noted("a third"); await sleep(400); await pickIdx(2); continue }
    if (id === "x4-cross") { await cross("t17"); await pickIdx(0); await expect(await crossDone(), "17² did not land"); continue }
    if (id === "x4-ob") { await slip("29.4*2/3", /rounded/); await right(); continue }
    if (id === "x4-ninety") { await slip("180", /half/); await right(); continue }
    // ── the missing side ──
    if (id === "missing") { await tapFlat("up", "E", "C"); await noted("the side we want"); await sleep(300); await tapFlat("up", "E", "G"); continue }
    if (id === "pyr-missing") { await tapFlat("up", "E", "C"); await noted("the side we want"); await sleep(300); await tapFlat("up", "X", "C"); continue }
    // ── choices ──
    if (id === "four-q") { await pickIdx(1); await sleep(1600); continue }
    if (id === "x4-frac") { await pickIdx(0); await noted("half"); await sleep(400); await pickIdx(2); continue }
    // ── moving across ──
    if (id === "q3-12") { await cross("t12"); await pickIdx(1); await noted("÷"); await pickIdx(0); await expect(await crossDone(), "12² did not land"); continue }
    if (id === "q3-4") { await cross("t4"); await pickIdx(0); await expect(await crossDone(), "4² did not land"); continue }
    if (id === "x2-cross") { await cross("t17"); await pickIdx(0); await expect(await crossDone(), "17² did not land"); continue }
    if (id === "x3-cross") { await cross("ec"); await pickIdx(0); await expect(await crossDone(), "EC² did not land"); continue }
    // ── typing ──
    if (id === "eg") { await slip("12+9", /Square/); await right(); continue }
    if (id === "q1") { await slip("6+2+3", /Square/); await right(); continue }
    if (id === "pyr-xc") { await slip("8.49", /halfway/); await right(); continue }
    if (id === "face-xm") { await slip("6", /middle/); await right(); continue }
    if (id === "x1-ce") { await slip("17.1"); await slip("r15.6^+7^", /rounded/); await right(); continue }
    if (["ec", "q2", "q3-h", "pyr-ac", "pyr-ec", "face-em", "x1-eg", "x2-xc", "x2-ac", "x2-side", "x3-ac", "x3-ec", "x3-ef", "x4-mb", "x4-am"].includes(id)) { await right(); continue }
    if (id === "end-lift") { await sleep(3500); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
