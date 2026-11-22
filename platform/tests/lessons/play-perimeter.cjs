// Scripted play-through of "Perimeter and area", beat by beat: sides tapped
// (a wrong one first), a rectangle made by dragging its corner (stood on its
// end first, which gets a note), two rectangles of 12, the top corner of a
// triangle slid, a triangle slid off a parallelogram, a trapezium's copy
// turned half a turn, pieces of the equation moved across the = (a wrong
// pick first), and every typed answer with a slip, some typed as a
// calculation. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("perimeter-and-area", "play-perimeter")
  const { page, next, tap, path, expect, fail, TOUCH, tapSel } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], locked: [...s.locked], input: s.input && s.input.state, typed: s.input && s.input.typed, pts: Object.fromEntries(Object.entries(s.pts).map(([k, v]) => [k, v.p])), done: !!(s.solve && s.solve.done) }
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
  const moves = async (id, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await idNow()) !== id) return true; await sleep(150) } return false }
  const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n])
  const scr = w => api("projAt", w)
  /** Drag a point to a world place, in a straight line. */
  const dragTo = async (pt, w) => { await sleep(300); await path(line(await api("ptS", pt), await scr(w))); await sleep(500) }
  /** Turn a point round a centre by `deg` (world degrees, anticlockwise), along the arc. */
  const turnBy = async (pt, cen, deg) => {
    await sleep(400)
    const s = await st(), c = s.pts[cen], g = s.pts[pt]
    const r = Math.hypot(g[0] - c[0], g[1] - c[1]), a0 = Math.atan2(g[1] - c[1], g[0] - c[0])
    const pts = []
    for (let i = 0; i <= 30; i++) { const a = a0 + (deg * Math.PI / 180) * i / 30; pts.push(await scr([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])) }
    await path(pts)
    await sleep(500)
  }
  const tapId = async id => { const p = await api("tapAt", id); if (!p) return fail("no tap target " + id); await tap(...p); await sleep(400) }
  const KEY = { "*": "×", "/": "÷", "^": "x²", r: "√", "+": "+", "-": "−" }
  const type = async str => {
    if (TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${KEY[ch] ?? ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  const pickIdx = async k => {
    const t0 = Date.now()
    while (Date.now() - t0 < 5000 && (await page.$$("[class*=choices] button")).length <= k) await sleep(100)
    const bs = await page.$$("[class*=choices] button")
    if (!bs[k]) return fail("no choice " + k)
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(600)
  }
  /** Carry a piece of the equation over the = (to its far side), then pick what it becomes: a wrong pick first. */
  const across = async (piece, wrong, rightK) => {
    await sleep(500)
    const a = await api("atomAt", piece), e = await api("atomAt", "eq")
    if (!a || !e) return fail("no piece " + piece)
    await path(line(a, [e[0] + 70, e[1]], 18))
    await sleep(600)
    await pickIdx(wrong)
    await expect(/opposite|dividing|take-away/.test((await st()).note || ""), "no note for the wrong pick")
    await pickIdx(rightK)
    const t0 = Date.now()
    while (Date.now() - t0 < 5000 && !(await st()).done) await sleep(150)
    await expect((await st()).done, "the move did not finish")
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "q5a-11") { await tapId("top"); await expect(/top itself/.test((await st()).note || ""), "no note for the top"); await tapId("bot"); continue }
    if (id === "q5a-6") { await tapId("rgt"); continue }
    if (id === "q5a") { await slip("17", /two sides/); await right("11+6+11+6"); continue }
    if (id === "make") {
      // the view eases in from the question before; let it settle so the corner lands where it is aimed
      await sleep(1500)
      await dragTo("C", [3, 5])
      await expect(/5\$? long/.test((await st()).note || "") || /Make it/.test((await st()).note || ""), "no note for a tall rectangle")
      await dragTo("C", [5, 3])
      await expect(await moves(id, 6000), "5 by 3 did not move on")
      continue
    }
    if (id === "count") { await slip("16", /perimeter/); await right("15"); continue }
    if (id === "make12") {
      await dragTo("C", [4, 3])
      await expect(/works/.test((await st()).note || ""), "no word for 4 by 3")
      await dragTo("C", [6, 2])
      await expect(/too/.test((await st()).note || ""), "no word for a second one")
      await next()
      continue
    }
    if (id === "half") { await slip("24", /half/); await right("12"); continue }
    if (id === "slide") {
      const T0 = (await st()).pts.T
      await dragTo("T", [T0[0] + 5, 4]); await dragTo("T", [T0[0] - 3, 4])
      await next()
      continue
    }
    if (id === "w24-bc") { await slip("5", /axis/); await right("10"); continue }
    if (id === "w24-tap") { await tapId("ab"); await expect(/side/.test((await st()).note || ""), "no note for a side"); await tapId("h"); continue }
    if (id === "w24-h") { await right("4"); continue }
    if (id === "w24") { await slip("40", /half/); await right("10*4/2"); continue }
    if (id === "pg-slide") {
      const g = (await st()).pts.TG
      await dragTo("TG", [g[0] + 6, g[1]])
      await expect(await moves(id, 6000), "the triangle did not click into place")
      continue
    }
    if (id === "s14-perim") { await slip("26.6", /height/); await right("29.2"); continue }
    if (id === "s14-tap") { await tapId("slope"); await expect(/sloping/.test((await st()).note || ""), "no note for the sloping side"); await tapId("h"); continue }
    if (id === "s14-area") { await slip("50.4", /sloping/); await right("9*4.3"); continue }
    if (id === "tz-turn") {
      await turnBy("A2", "M", 90)
      await expect((await idNow()) === id, "a quarter turn counted")
      await turnBy("A2", "M", 90)
      await expect(await moves(id, 6000), "the copy did not lock after half a turn")
      continue
    }
    if (id === "tz-b12") { await slip("8", /copy/); await right("12"); continue }
    if (id === "tz-36") { await right("36"); continue }
    if (id === "tz-18") { await slip("36", /half/); await right("18"); continue }
    if (id === "s25-area") { await slip("60", /half/); await right("30"); continue }
    if (id === "s25-gap") { await slip("9", /take away/i); await right("3"); continue }
    if (id === "s25-slope") { await slip("7", /square/); await right("r3^+4^"); continue }
    if (id === "s25-perim") { await slip("19", /sloping/); await right("24"); continue }
    if (id === "s24-half") { await right("2"); continue }
    if (id === "s24-cross2") { await across("two", 1, 0); continue }
    if (id === "s24-18") { await right("18"); continue }
    if (id === "s24-cross13") { await across("n13", 1, 0); continue }
    if (id === "s24-y") { await slip("31", /take-away/); await right("5"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
