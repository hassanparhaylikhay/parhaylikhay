// What the terms-board play-throughs share (built on trig-lib's open()):
// the scene's state, waiting for a beat, dragging and turning points by
// their world places, tapping targets, typing on the keypad (keyboard or
// touch), picking a chip, and carrying a piece of the equation over the =.
const { sleep } = require("./trig-lib.cjs")

function termsKit(T) {
  const { page, tap, path, expect, fail, TOUCH, tapSel } = T
  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, tone: s.note && s.note.tone, got: [...s.got], locked: [...s.locked], input: s.input && s.input.state, typed: s.input && s.input.typed, pts: Object.fromEntries(Object.entries(s.pts).map(([k, v]) => [k, v.p])), done: !!(s.solve && s.solve.done), vals: s.vals }
  })
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
  /** Drag a point to a world place, in a straight line (after the view has settled). */
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
  const KEY = { "*": "×", "/": "÷", "^": "x²", r: "√", "+": "+", "-": "−", p: "π" }
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
  /** A right-sized answer that left π out: a calm word, not taken. */
  const noPi = async str => { await type(str); const s = await st(); await expect(s.input !== "right" && /terms of/.test(s.note || ""), `"${str}" without pi: ${s.input} ${s.note}`) }
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
  return { api, st, idNow, at, moves, scr, dragTo, turnBy, tapId, type, right, slip, noPi, pickIdx, across }
}

module.exports = { termsKit }
