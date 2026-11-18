// Scripted play-through of "Bearings in triangles", beat by beat, the way a
// student would do it, with a wrong attempt at each kind of task: taps on the
// figure (corners, sides, a bearing's arc), the rules' fills and moves, D slid
// round its circle, and every bearing typed. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("bearings-triangles", "play-bearings-triangles")
  const { page, next, tap, tapSel, drag, path, shot, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, locked: s.locked, got: [...s.got], mode: s.mode, chips: s.chips.map(c => c.id),
      solve: s.solve && { done: s.solve.done, busy: s.solve.busy, pulse: s.solve.pulse ? [...s.solve.pulse] : [] }, fill: s.fill && Object.keys(s.fill.filled), C: s.P.C, B: s.P.B }
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

  // ── on the board ──
  const tapAng = async c => { const has = await page.evaluate(c => !!window.__beatScene.labD["ang-" + c], c); await tap(...(await api(has ? "angAt" : "arcAt", c))) }
  const tapSide = async c => tap(...(await api("sideAt", c)))
  const tapBrg = async id => { const p = await api("brgAt", id); if (!p) return fail("no bearing arc " + id); await tap(...p) }
  const atomAt = id => api("atomAt", id)
  const tapAtom = async id => { const p = await atomAt(id); if (!p) return fail("no piece " + id); await tap(...p) }
  const chipAt = async id => {
    const L = await api("layout")
    const r = (await page.evaluate(L => window.__beatApi.chipRects(window.__beatScene, L), L)).find(c => c.id === id)
    return r ? [(r.r.x0 + r.r.x1) / 2, (r.r.y0 + r.r.y1) / 2] : null
  }
  const dropChip = async id => {
    const a = await chipAt(id)
    if (!a) return fail(`no chip ${id} (have ${(await st()).chips.join(",")})`)
    await drag(a, await atomAt("eq"), 16)
  }
  const tapCancel = async () => {
    const ok = await waitFor(async () => ((await st()).solve?.pulse ?? []).length > 0, 6000)
    if (!ok) return fail("nothing to cancel")
    await tapAtom((await st()).solve.pulse[0])
  }
  const solveDone = () => waitFor(async () => { const s = await st(); return s.solve && s.solve.done && !s.solve.busy }, 9000)
  /** Drag a label off the triangle into a place in the rule. */
  const place = async (key, slot) => {
    const a = await api("labAt", key), b = await atomAt(slot)
    if (!a || !b) return fail(`can't drag ${key} to ${slot}`)
    await drag(a, b, 18)
    await sleep(450)
  }
  /** Drag a piece of the equation over the =. */
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

  /** Slide D round its circle (centre B, radius 145) from where it is to a bearing from B, through the points between. */
  const slideD = async toBrg => {
    const s = await st()
    const B = s.B, C = s.C
    const from = ((Math.atan2(C[0] - B[0], C[1] - B[1]) * 180) / Math.PI + 360) % 360
    const d = ((toBrg - from) % 360 + 540) % 360 - 180
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const b = (from + (d * i) / 24) * Math.PI / 180
      pts.push(await page.evaluate(w => window.__beatApi.toScreen(window.__beatScene, w), [B[0] + 145 * Math.sin(b), B[1] + 145 * Math.cos(b)]))
    }
    await path(pts)
    await sleep(500)
  }
  // where D's two places are, as bearings from B (worked out as the lesson does)
  const RAD = Math.PI / 180, DEG = 180 / Math.PI
  const DAB = Math.asin((145 * Math.sin(120 * RAD)) / 300) * DEG
  const AD = (300 * Math.sin((60 - DAB) * RAD)) / Math.sin(120 * RAD)
  const Bp = [300 * Math.sin(72 * RAD), 300 * Math.cos(72 * RAD)]
  const brgFromB = b => { const D = [AD * Math.sin(b * RAD), AD * Math.cos(b * RAD)]; return ((Math.atan2(D[0] - Bp[0], D[1] - Bp[1]) * DEG) + 360) % 360 }
  const D1B = brgFromB(72 + DAB), D2B = brgFromB(72 - DAB)

  // each question: the rule and its corners
  const COS_SIDE = { b1: 1, x1: 1 }
  const COS_ANG = { b2: 1, b5: 1 }
  const SINE = { b3: { want: "B", pair: "A" }, x2: { want: "A", pair: "C" } }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    const pre = id.split("-")[0]
    // ── taps on the figure ──
    if (id === "b1-tap") { await tapAng("A"); await noted("a touching angle"); await sleep(300); await tapAng("C"); continue }
    if (id === "b2-tap") { await tapBrg("C:0:620"); await noted("the 62° arc"); await sleep(300); await tapAng("A"); await noted("another corner"); await sleep(300); await tapAng("C"); continue }
    if (id === "b5-tap") { await tapAng("A"); await noted("a corner not at Q"); await sleep(300); await tapAng("C"); continue }
    if (id === "x4-tap") { await tapBrg("C:0:1800"); await noted("the 180° arc"); await sleep(300); await tapAng("C"); continue }
    // ── angles and bearings typed ──
    const TYPED = {
      "b1-ang": ["299", /added/], "b2-brg": ["66", /BLA/], "b3-270": ["90", /east/], "b3-ang": ["410", /both/], "b3-r": ["157.2", /130/],
      "b4-320": ["40", /half turn/], "b4-297": ["342.8", /before/], "b5-232": ["128", /half turn/], "b5-brg": ["313.5", /before/],
      "x1-a": ["30", /half turn/], "x1-ang": ["222", /added/], "x2-b1": ["47.3", /Add/], "x2-b2": ["96.7", /first one/],
      "x3-c": ["81", /Add/], "x3-a": ["11", /half turn/], "x4-dac": ["T210/450", /upside down/], "x4-brg": ["115.02", /Add/],
    }
    if (TYPED[id]) { await slip(...TYPED[id]); await right(); continue }
    if (id === "x4-ratio") { await pickIdx(0); await noted("sin"); await pickIdx(2); continue }
    // ── D round its circle ──
    if (id === "x2-drag") {
      // let go short: told the angle and to keep going; then on to the first place
      await slideD(D1B - 30); await noted("let go short")
      await slideD(D1B); await expect((await st()).locked, "D did not click onto a place")
      continue
    }
    if (id === "x2-other") {
      const s = await st()
      const onD1 = Math.abs((((Math.atan2(s.C[0] - s.B[0], s.C[1] - s.B[1]) * DEG) + 360) % 360) - D1B) < 1
      await slideD(onD1 ? D2B : D1B); await expect((await st()).locked, "D did not click onto the second place")
      continue
    }
    // ── the cosine rule ──
    if (COS_SIDE[pre] && /-sides$/.test(id)) { await tapSide("C"); await noted("the unknown side"); await sleep(300); await tapSide("B"); await sleep(300); await tapSide("A"); continue }
    if (COS_ANG[pre] && /-side$/.test(id)) { await tapSide("A"); await noted("a touching side"); await sleep(300); await tapSide("C"); continue }
    if ((COS_SIDE[pre] || COS_ANG[pre]) && /-fill$/.test(id)) { await place("ang-C", "ang"); await place("side-C", "sx"); await place("side-A", "s1"); await place("side-B", "s2"); await waitFor(async () => ((await st()).fill ?? []).includes("p2"), 3000); continue }
    if (COS_SIDE[pre] && /-calc$/.test(id)) { await right(); continue }
    if ((COS_SIDE[pre] || COS_ANG[pre]) && /-cross$/.test(id)) { await cross(COS_ANG[pre] ? "cos" : "xq"); await pickIdx(0); await expect(await crossDone(), id + " did not land"); continue }
    if (COS_SIDE[pre] && /-root$/.test(id)) { await right(); continue }
    if (COS_ANG[pre] && /-(top|bottom|divide|angle)$/.test(id)) { await right(); continue }
    // ── the sine rule ──
    const Q = SINE[pre]
    if (Q && /-pair$/.test(id)) { await tapAng(Q.want); await noted("the unknown angle"); await sleep(300); await tapAng(Q.pair); await sleep(400); await tapSide(Q.pair); continue }
    if (Q && /-fill$/.test(id)) {
      await place(`ang-${Q.want}`, "sL"); await noted("an angle on top")
      await place(`side-${Q.want}`, "sL"); await place(`ang-${Q.want}`, "aL"); await place(`side-${Q.pair}`, "sR"); await place(`ang-${Q.pair}`, "aR")
      await expect(await waitFor(async () => ((await st()).fill ?? []).length >= 4, 3000), "the rule did not fill")
      continue
    }
    if (Q && /-flip$/.test(id)) { await tapAtom("eq"); continue }
    if (Q && /-mul$/.test(id)) { await dropChip(`mul-s-${Q.want}`); await tapCancel(); await expect(await solveDone(), id + " not solved"); continue }
    if (Q && /-sin$/.test(id)) { await right(); continue }
    if (Q && /-undo$/.test(id)) { await dropChip("inv-sin"); await tapCancel(); await expect(await solveDone(), id + " not undone"); continue }
    if (Q && /-th$/.test(id)) { await right("Sa"); continue }
    if (id === "end") { await sleep(3500); await shot("end"); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
