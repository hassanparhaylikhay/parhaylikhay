// Scripted play-through of "The sine rule", beat by beat, the way a student
// would do it, with a wrong attempt at each kind of task.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("sine-rule", "play-sine-rule")
  const { page, next, tap, tapSel, drag, path, shot, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, locked: s.locked, got: [...s.got], mode: s.mode, chips: s.chips.map(c => c.id),
      solve: s.solve && { done: s.solve.done, busy: s.solve.busy, pulse: s.solve.pulse ? [...s.solve.pulse] : [] }, fill: s.fill && Object.keys(s.fill.filled) }
  })
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const idNow = () => page.evaluate(() => window.__beatApi.beats[window.__beatIdx ?? 0].id)
  /** Wait until the beat with this id is on (and its title, if any, has gone). */
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

  // ── doing things on the board ──
  const tapAng = async c => tap(...(await api("angAt", c)))
  const tapSide = async c => tap(...(await api("sideAt", c)))
  const corner = c => api("ptS", c)
  const dragTo = async (from, to, steps = 22) => drag(from, to, steps)
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
    const e = await atomAt("eq")
    await dragTo(a, e, 16)
  }
  /** Tap whichever piece is pulsing (the pair that cancels). */
  const tapCancel = async () => {
    const ok = await waitFor(async () => ((await st()).solve?.pulse ?? []).length > 0, 6000)
    if (!ok) return fail("nothing to cancel")
    const id = (await st()).solve.pulse[0]
    await tapAtom(id)
  }
  const solveDone = () => waitFor(async () => { const s = await st(); return s.solve && s.solve.done && !s.solve.busy }, 9000)
  /** Drag a label off the triangle into a place in the rule. */
  const place = async (key, slot) => {
    const a = await api("labAt", key), b = await atomAt(slot)
    if (!a || !b) return fail(`can't drag ${key} to ${slot}`)
    await dragTo(a, b, 18)
    await sleep(300)
  }
  /** Type on the sine rule calculator: S C T are SHIFT then sin cos tan; a is Ans; / is ÷; * is ×. */
  const type = async str => {
    if (TOUCH) {
      const fn = { s: "sin", c: "cos", t: "tan", "*": "×", "/": "÷", a: "Ans" }
      const inv = { S: "sin", C: "cos", T: "tan" }
      for (const ch of str) {
        if (inv[ch]) { await tapSel('button[aria-label="SHIFT"]'); await sleep(80); await tapSel(`button[aria-label="${inv[ch]}⁻¹"]`) }
        else await tapSel(`button[aria-label="${fn[ch] || ch}"]`)
        await sleep(60)
      }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(60) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str); await expect((await st()).input === "right", `"${str}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong" || /Nearly/.test(s.note || ""), `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  const pick = async text => {
    const bs = await page.$$("[class*=choices] button")
    for (const b of bs) if ((await page.evaluate(e => e.textContent, b)).trim() === text) { const r = await b.boundingBox(); await tap(r.x + r.width / 2, r.y + r.height / 2); return }
    fail("no choice " + text)
  }
  const noted = async (what) => expect((await st()).note, "no note after " + what)

  // ── each question: which corner is wanted, which is the full pair ──
  const QS = {
    x: { want: "B", pair: "A", find: "side" }, b: { want: "B", pair: "A", find: "side" }, t: { want: "B", pair: "A", find: "angle" }, u: { want: "C", pair: "A", find: "angle" },
    ex1: { want: "C", pair: "A", find: "side" }, ex2: { want: "B", pair: "A", find: "angle" }, ex3: { want: "B", pair: "A", find: "angle" }, ex4: { want: "C", pair: "A", find: "angle" }, ex5: { want: "B", pair: "A", find: "angle" },
  }
  const CALC = {
    "x-calc": ["8*s75/s40", "8*s40/s75"], "b-calc": ["7*s70/s50"], "t-sin": ["6*s70/9"], "u-sin": ["8*s105/11"], "ex1-calc": ["15*s74/s67"],
    "ex2-sin": ["6.4*s79/9.5"], "ex3-sin": ["75*s125/124.3"], "ex4-sin": ["11*s30/6.5"], "ex5-sin": ["12*s52/10"],
  }

  // FROM=n starts at beat n (open the page with &beat=n too, which trig-lib does when FROM is set)
  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    const pre = id.split("-")[0]
    const Q = QS[pre] ?? (id.startsWith("fill-") ? QS.x : undefined)
    // ── part 1 and 2 ──
    if (id === "open" || id === "grow") { const c = await corner("C"); await dragTo(c, [c[0] + 130, c[1] - 50]); await dragTo([c[0] + 130, c[1] - 50], c); await next(); continue }
    if (id === "move-big") {
      // make C's angle the biggest: pull C down towards AB
      const a = await corner("A"), b = await corner("B"), c = await corner("C")
      await dragTo(c, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 40]); await next(); continue
    }
    if (id === "tap-big" || id === "tap-small") {
      const which = id === "tap-big" ? "max" : "min"
      const ks = await page.evaluate(w => { const s = window.__beatScene; const t = ["A", "B", "C"].map(k => [k, window.__beatApi.angAt(s, k)]); return t }, which)
      const ang = await page.evaluate(() => { const s = window.__beatScene; return ["A", "B", "C"].map(k => s.labs.find(l => l.key === "ang-" + k)?.tex) })
      const vals = ang.map(t => parseFloat(t))
      const best = which === "max" ? vals.indexOf(Math.max(...vals)) : vals.indexOf(Math.min(...vals))
      // a wrong one that is not equal to it (two angles can tie)
      const wrong = [1, 2].map(d => (best + d) % 3).find(i => vals[i] !== vals[best])
      if (wrong !== undefined) { await tap(...ks[wrong][1]); await noted("a wrong angle"); await sleep(300) }
      await tap(...ks[best][1]); continue
    }
    if (id === "tap-big-side" || id === "tap-small-side") {
      const k = await page.evaluate(() => [...window.__beatScene.glowAng][0])
      const other = k === "A" ? "B" : "A"
      await tapSide(other); await noted("a side touching the angle"); await sleep(300); await tapSide(k); continue
    }
    if (id.startsWith("colour-")) { const k = id.slice(-1); if (k === "A") { await tapSide("B"); await noted("the wrong side") } await sleep(300); await tapSide(k); continue }
    if (id.startsWith("tap-side-")) { const k = id.slice(-1); await tapSide(k === "B" ? "C" : "B"); await noted("the wrong side"); await sleep(300); await tapSide(k); continue }
    if (id === "tap-ang-A") { await tapAng("B"); await noted("angle B"); await sleep(300); await tapAng("A"); continue }
    // ── part 3 ──
    if (id === "turn-30") {
      const toA = async deg => { const p = await page.evaluate(d => { const s = window.__beatScene; const l = Math.hypot(...s.P.C); return window.__beatApi.toScreen(s, [l * Math.cos(d * Math.PI / 180), l * Math.sin(d * Math.PI / 180)]) }, deg); const c = await corner("C"); await dragTo(c, p) }
      await toA(42); await expect(/big/.test((await st()).note || ""), "no 'too big' note at 42°"); await toA(30.4); await expect((await st()).locked, "A did not lock at 30°"); continue
    }
    if (id === "slide-60") {
      const toT = async t => { const p = await page.evaluate(t => { const s = window.__beatScene; return window.__beatApi.toScreen(s, [t * Math.cos(Math.PI / 6), t * Math.sin(Math.PI / 6)]) }, t); const c = await corner("C"); await dragTo(c, p) }
      await toT(6.5); await expect(/small/.test((await st()).note || ""), "no 'too small' note"); await toT(8.66); await expect((await st()).locked, "B did not lock at 60°"); continue
    }
    if (id === "double") { await pick("No"); continue }
    if (id === "what-c") { await tapSide("A"); await noted("side a for c"); await sleep(300); await tapSide("C"); await sleep(400); await tapAng("C"); continue }
    if (id === "drag-any") { const b = await corner("B"); await dragTo(b, [b[0] - 60, b[1] - 50]); await sleep(600); await shot("ratios"); await next(); continue }
    // ── part 4 ──
    if (id === "drop-h") { const c = await corner("C"), f = await api("footAt"); await dragTo(c, [f[0], f[1] + 15]); continue }
    if (id === "div-h") { await tapAtom("h"); await noted("h itself"); await sleep(300); await tapAtom("s-B"); continue }
    if (id === "mul-b") { await dropChip("div-s-B"); await noted("a wrong chip"); await sleep(3300); await dropChip("mul-s-B"); await tapCancel(); await expect(await solveDone(), "h = b sin A not reached"); continue }
    if (id === "mul-a") { await dropChip("mul-s-A"); await tapCancel(); await expect(await solveDone(), "h = a sin B not reached"); continue }
    if (id === "div-sinA") { await dropChip("div-F-A"); await tapCancel(); await expect(await solveDone(), "b = a sin B / sin A not reached"); continue }
    if (id === "div-sinB") { await dropChip("div-F-B"); await tapCancel(); await expect(await solveDone(), "the rule not reached"); await sleep(400); await shot("proof"); continue }
    // ── questions ──
    if (Q && /-(angle|side)$/.test(id)) {
      // tap the angle across from the unknown side, or the side across from the unknown angle
      if (Q.find === "side") { await tapAng(Q.pair); await noted("a touching angle"); await sleep(300); await tapAng(Q.want) }
      else { await tapSide(Q.pair); await noted("a touching side"); await sleep(300); await tapSide(Q.want) }
      continue
    }
    if (Q && /-pair$/.test(id) && !/fill/.test(id)) { await tapSide(Q.want); await noted("the unknown's side"); await sleep(300); await tapSide(Q.pair); await sleep(400); await tapAng(Q.pair); continue }
    if (Q && /fill/.test(id)) {
      const L = { s: `side-${Q.want}`, a: `ang-${Q.want}` }, R = { s: `side-${Q.pair}`, a: `ang-${Q.pair}` }
      const half = /fill-pair$/.test(id) ? "right" : /^(fill-x|b-fill-x|t-fill)$/.test(id) ? "left" : "both"
      if (half !== "right") {
        if (id === "x-fill" || id === "fill-x") { await place(R.s, "sL"); await noted("the full pair on the left") }
        await place(L.a, "sL"); await noted("an angle on top")
        await place(L.s, "sL"); await place(L.a, "aL")
      }
      if (half !== "left") { await place(R.s, "sR"); await place(R.a, "aR") }
      await expect(await waitFor(async () => ((await st()).fill ?? []).length >= (half === "left" ? 2 : 4), 3000), "the rule did not fill")
      continue
    }
    if (Q && /-flip$/.test(id)) { await tapAtom("eq"); continue }
    if (Q && /-dividing$/.test(id)) {
      const self = Q.find === "side" ? `s-${Q.want}` : `fn-${Q.want}`, ok = Q.find === "side" ? `fn-${Q.want}` : `s-${Q.want}`
      await tapAtom(self); await noted("the unknown itself"); await sleep(300); await tapAtom(ok); continue
    }
    if (Q && /-mul$/.test(id)) {
      const f = Q.find === "side" ? `F-${Q.want}` : `s-${Q.want}`
      if (id === "x-mul" || id === "t-mul") { await dropChip(`div-${f}`); await noted("a wrong chip"); await sleep(3300) }
      await dropChip(`mul-${f}`); await tapCancel(); await expect(await solveDone(), id + " not solved"); continue
    }
    if (CALC[id]) { const [ok, bad] = CALC[id]; if (bad) await slip(bad, /wrong way/); else if (id === "t-sin") await slip("9*s70/6", /upside down/); await right(ok); continue }
    if (Q && /-undo$/.test(id)) {
      if (id === "t-undo") { await dropChip("inv-cos"); await noted("cos⁻¹"); await sleep(400) }
      await dropChip("inv-sin"); await tapCancel(); await expect(await solveDone(), id + " not undone"); continue
    }
    if (Q && /-calc$/.test(id)) { if (id === "t-calc") await slip("a", /SHIFT/); await right("Sa"); continue }
    if (id === "find-B") { await slip("110", /180/); await right("70"); continue }
    // ── part 7 ──
    if (id === "sin30") { await right("s30"); continue }
    if (id === "sin150") { await right("s150"); continue }
    if (id === "swing-1" || id === "swing-2" || id === "ex5-swing" || id === "ex5-swing-2") {
      const which = await page.evaluate(() => window.__beatScene.swing.want[0])
      const land = await page.evaluate(i => window.__beatApi.toScreen(window.__beatScene, window.__beatScene.swing.lands[i]), which)
      const e = await api("swingEnd")
      // through the middle of the swing, so the end goes round, not across
      const pivot = await page.evaluate(() => window.__beatApi.ptS(window.__beatScene, window.__beatScene.swing.pivot))
      const mid = [(e[0] + land[0]) / 2, (e[1] + land[1]) / 2]
      const dm = Math.hypot(mid[0] - pivot[0], mid[1] - pivot[1]), r = Math.hypot(e[0] - pivot[0], e[1] - pivot[1])
      const arc = [pivot[0] + (mid[0] - pivot[0]) * r / dm, pivot[1] + (mid[1] - pivot[1]) * r / dm]
      await path([e, arc, land].flatMap((p, i, a) => (i ? Array.from({ length: 10 }, (_, j) => [a[i - 1][0] + (p[0] - a[i - 1][0]) * (j + 1) / 10, a[i - 1][1] + (p[1] - a[i - 1][1]) * (j + 1) / 10]) : [p])))
      await expect(await waitFor(async () => (await st()).locked, 2500), id + ": the side did not land")
      continue
    }
    // ── part 8 ──
    if (id === "ex4-obtuse") { await slip("57.8", /acute/); await right("122.2"); continue }
    if (id === "ex5-52") { await slip("128"); await right("52"); continue }
    if (id === "ex5-other") { await slip("71.0"); await right("109.0"); continue }
    if (id === "ex5-fill") { await place("side-B", "sL"); await place("ang-B", "aL"); await place("side-A", "sR"); await place("ang-A", "aR"); continue }
    if (id === "end") { const c = await corner("C"); await dragTo(c, [c[0] + 50, c[1] + 20]); await sleep(4200); await shot("end"); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Start again"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
