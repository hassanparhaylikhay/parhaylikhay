// Scripted play-through of "Line and rotational symmetry", beat by beat: the
// house folded, a line turned to each line of symmetry (and to a diagonal
// that is not one), shapes turned round their middles to each fit, squares
// shaded on grids (a shaded one and a wrong one first), and counts typed
// with a slip each. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("symmetry", "play-sym")
  const { page, next, tap, tapSel, path, expect, fail } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], locked: [...s.locked], pts: Object.fromEntries(Object.entries(s.pts).map(([k, v]) => [k, v.p])), input: s.input && s.input.state, typed: s.input && s.input.typed, mem: s.mem }
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
  const waitFor = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(100) } return false }
  const noted = async what => expect((await st()).note, "no note after " + what)
  const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n])
  const scr = w => api("projAt", w)

  /** Drag a point to a world place, in a straight line. */
  const dragTo = async (pt, w) => { await sleep(300); await path(line(await api("ptS", pt), await scr(w))); await sleep(450) }
  /** Turn a line's end round its pivot to an angle (degrees, world), the short way. */
  const turnTo = async (grab, pivot, deg) => {
    await sleep(400)
    const s = await st(), c = s.pts[pivot], g = s.pts[grab]
    const r = Math.hypot(g[0] - c[0], g[1] - c[1]), a0 = Math.atan2(g[1] - c[1], g[0] - c[0]) * 180 / Math.PI
    const d = ((deg - a0) % 360 + 540) % 360 - 180, pts = []
    for (let i = 0; i <= 24; i++) { const a = (a0 + d * i / 24) * Math.PI / 180; pts.push(await scr([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])) }
    await path(pts)
    await sleep(450)
  }
  /** Draw from a point to a place on the circle (radius 3 about O), at an angle. */
  const drawTo = async (from, deg) => { await sleep(400); await path(line(await api("ptS", from), await scr([3 * Math.cos(deg * Math.PI / 180), 3 * Math.sin(deg * Math.PI / 180)]), 24)); await sleep(500) }
  /** Move corners on the grid one at a time, stopping once the beat has moved on. */
  const corners = async (id, moves) => {
    for (const [pt, w] of moves) {
      if ((await idNow()) !== id) return
      await dragTo(pt, w)
    }
    await expect((await st()).got.includes("done") || (await idNow()) !== id, `${id}: not made`)
  }
  const tapId = async id => { const p = await api("tapAt", id); if (!p) return fail("no tap target " + id); await tap(...p); await sleep(400) }
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  const reason = async (wrong, right) => { await pickIdx(wrong); await noted("picking " + wrong); await sleep(500); await pickIdx(right) }
  const plus = async n => { for (let i = 0; i < n; i++) { await tapSel('button[aria-label="More sides"]'); await sleep(450) } }

  const type = async str => {
    if (T.TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async () => { await type((await st()).typed); await expect((await st()).input === "right", "answer not taken") }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  /** Turn the line to an angle and hold it there while the copy folds. */
  const lineTo = async deg => { await turnTo("Lb", "C", deg); await sleep(1300) }
  /** Turn a shape round its middle by its first corner, to its start angle plus `by`. */
  const shapeBy = async by => {
    const s = await st(), c = s.pts.C, g = s.pts.f0_0
    const now = Math.atan2(g[1] - c[1], g[0] - c[0]) * 180 / Math.PI
    await turnTo("f0_0", "C", now + by)
    await sleep(500)
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "fold") { await dragTo("Fg", [1.5, -0.35]); continue }
    if (id === "rect-1") { await lineTo(90); continue }
    if (id === "rect-2") { await lineTo((await st()).mem.rect === 0 ? 90 : 0); continue }
    if (id === "rect-diag") { await lineTo(Math.atan2(2.4, 4) * 180 / Math.PI); continue }
    if (id === "square-all") { for (const d of [0, 45, 90, 135]) await lineTo(d); continue }
    if (id === "para") { await lineTo(70); await lineTo(150); await next(); continue }
    if (id === "w19-line") { await lineTo(27); continue }
    if (id === "tri-lines") { await slip("1", /corner/); await right(); continue }
    if (id === "hex-lines") { await slip("3", /middles/); await right(); continue }
    if (id === "hex-order") { await slip("3", /more often/); await right(); continue }
    if (id === "s22a") { await slip("2", /little ends/); await right(); continue }
    if (id === "s22b") { await slip("6", /cross/); await right(); continue }
    if (id === "s21h-l") { await slip("6", /shading/); await right(); continue }
    if (id === "s21h-o") { await slip("6", /shading/); await right(); continue }
    if (id === "s21s-l") { await slip("1", /diagonal/); await right(); continue }
    if (id === "s21s-o") { await slip("1", /half way/); await right(); continue }
    if (id === "s25b") {
      await tapId("0_0"); await noted("tapping a shaded square")
      await sleep(400); await tapId("1_0"); await noted("a wrong square")
      await sleep(400); await tapId("1_0"); await sleep(300); await tapId("0_3"); continue
    }
    if (id === "w21") { await tapId("2_0"); continue }
    if (id === "s25a") { await tapId("0_2"); await noted("a wrong square"); await sleep(400); await tapId("0_2"); await sleep(300); await tapId("2_0"); continue }
    if (id === "rect-turn") { await shapeBy(180); await next(); continue }
    if (id === "tri-turn") { await shapeBy(120); await shapeBy(120); continue }
    if (id === "square-turn") { await shapeBy(90); await shapeBy(90); await shapeBy(90); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
