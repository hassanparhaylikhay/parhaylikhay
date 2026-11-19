// Scripted play-through of "Naming shapes", beat by beat: a line turned
// until parallel and then perpendicular, a line slid to cut AB in half,
// triangle corners dragged until they click into each special triangle,
// quadrilateral corners moved on the grid into each special shape, sides
// and shapes tapped, words picked, sides added, a corner pulled out, and
// lines drawn on the circle (with a wrong one first where there can be
// one). FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("naming-shapes", "play-terms")
  const { page, next, tap, tapSel, path, expect, fail } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], locked: [...s.locked], pts: Object.fromEntries(Object.entries(s.pts).map(([k, v]) => [k, v.p])), n: s.stepper && s.stepper.n }
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

  // WATCH=1: if the page stops answering, pause it and print where it is stuck
  if (process.env.WATCH) {
    const cdp = await page.target().createCDPSession()
    await cdp.send("Debugger.enable")
    setInterval(async () => {
      const r = await Promise.race([page.evaluate(() => 1), sleep(6000).then(() => "STUCK")])
      if (r !== "STUCK") return
      const paused = new Promise(res => cdp.once("Debugger.paused", e => res(e)))
      await cdp.send("Debugger.pause")
      const e = await Promise.race([paused, sleep(5000).then(() => null)])
      console.log("STUCK in", e ? e.callFrames.slice(0, 10).map(f => `${f.functionName}@${f.url.split("/").pop()}:${f.location.lineNumber}:${f.location.columnNumber}`).join(" < ") : "(no pause)")
      process.exit(1)
    }, 8000)
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "par-turn") { await turnTo("L2", "M", 0); await expect((await st()).locked.includes("turn"), "not parallel"); continue }
    if (id === "perp-turn") {
      // short of a right angle it does not click on
      await turnTo("L2", "M", 70)
      await expect(!(await st()).locked.includes("turn"), "clicked on at 70")
      await turnTo("L2", "M", 90)
      await expect((await st()).locked.includes("turn"), "not perpendicular")
      continue
    }
    if (id === "bis-slide") { await dragTo("V2", [0, 3.2]); await expect((await st()).locked.includes("slide"), "not cut in half"); continue }
    if (id === "tri") { await dragTo("TC", [3, 5]); await dragTo("TC", [2.2, 4.5]); await next(); continue }
    if (id === "tri-equi") { await dragTo("TC", [3.5, 6.06]); continue }
    if (id === "tri-iso") { await dragTo("TC", [3.5, 3.2]); continue }
    if (id === "tri-right") { await dragTo("TC", [0.05, 4]); continue }
    if (id === "tri-tap") { await tapId("equi"); await noted("tapping the equilateral one"); await sleep(400); await tapId("iso"); continue }
    if (id === "quad-drag") { await dragTo("Q4", [-2, 3]); await dragTo("Q4", [-1, 3]); await next(); continue }
    if (id === "q-square") { await corners(id, [["Q1", [-2, -2]], ["Q2", [2, -2]], ["Q3", [2, 2]], ["Q4", [-2, 2]]]); continue }
    if (id === "q-rect") { await corners(id, [["Q1", [-3, -2]], ["Q2", [3, -2]], ["Q3", [3, 2]], ["Q4", [-3, 2]]]); continue }
    if (id === "q-para") { await corners(id, [["Q2", [2, -2]], ["Q4", [-2, 2]]]); continue }
    if (id === "q-rhom") { await corners(id, [["Q1", [0, -3]], ["Q2", [2, 0]], ["Q3", [0, 3]], ["Q4", [-2, 0]]]); continue }
    if (id === "q-trap") { await corners(id, [["Q1", [-3, -2]], ["Q2", [3, -2]], ["Q3", [1, 2]], ["Q4", [-1, 2]]]); continue }
    if (id === "q-kite") { await corners(id, [["Q1", [0, -3]], ["Q2", [2, 1]], ["Q3", [0, 3]], ["Q4", [-2, 1]]]); continue }
    if (id === "s20-par") { await tapId("QR"); await noted("tapping QR"); await sleep(400); await tapId("RS"); await tapId("PQ"); continue }
    if (id === "s20-name") { await reason(0, 2); continue }
    if (id === "s20b-pick") { await reason(0, 2); continue }
    if (id === "poly-add") { await plus(3); await next(); continue }
    if (id === "poly-8" || id === "poly-10") { await plus(2); continue }
    if (id === "poly-pull") { const v = (await st()).pts.V0; await dragTo("V0", [v[0] + 1, v[1] + 1.2]); continue }
    if (id === "rad") { await drawTo("O", 60); continue }
    if (id === "dia") { await drawTo("D1", 70); await noted("a line not through O"); await sleep(500); await drawTo("D1", 25); continue }
    if (id === "chord") { await drawTo("C1", 334); await noted("a chord through O"); await sleep(500); await drawTo("C1", 30); continue }
    if (id === "seg-tap") { await tapId("major"); await noted("tapping the bigger segment"); await sleep(400); await tapId("minor"); continue }
    if (id === "arc-tap") { await tapId("minor"); await noted("tapping the minor arc"); await sleep(400); await tapId("major"); continue }
    if (id === "tan") { await dragTo("Tt", [0, 3]); await expect((await st()).locked.includes("slide"), "not touching"); continue }
    if (id === "s23-shade") { await reason(0, 1); continue }
    if (id === "s23-line") { await reason(0, 3); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
