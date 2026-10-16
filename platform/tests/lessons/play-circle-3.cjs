// Scripted play-through of Circle theorems III, the way a student would do it.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-circle-3")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/circle-theorems-3?debug"
const W = +(process.env.W || 1440), H = +(process.env.H || 900)
const TOUCH = !!process.env.TOUCH
const sleep = ms => new Promise(r => setTimeout(r, ms))
const D2R = Math.PI / 180

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, isMobile: TOUCH, hasTouch: TOUCH, deviceScaleFactor: TOUCH ? 2 : 1 })
  const logs = []
  page.on("pageerror", e => logs.push("PAGEERROR " + e.message))
  page.on("console", m => { if (m.type() === "error") logs.push(m.text()) })
  await page.goto(URL, { waitUntil: "load", timeout: 60000 })
  await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0, { timeout: 60000 })
  await sleep(1200)

  let n = 0, misses = 0, lastStart = -1
  const t0 = Date.now()
  const fail = msg => { misses++; console.log("!!", msg) }
  const shot = async name => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(3, "0")}-${name}.png` }) }
  const phrase = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className))
    return els.length ? els[els.length - 1].textContent : null
  })
  const want = async (prefix, ms = 12000) => {
    const start = Date.now()
    while (Date.now() - start < ms) {
      const p = await phrase()
      const bs = await page.evaluate(() => window.__beatScene.beatStart)
      if (p && p.startsWith(prefix) && bs !== lastStart) { lastStart = bs; await sleep(700); return true }
      await sleep(100)
    }
    fail(`wanted ${JSON.stringify(prefix)} but phrase is ${JSON.stringify(await phrase())}`)
    return false
  }
  const press = async (x, y) => { if (TOUCH) await page.touchscreen.touchStart(x, y); else { await page.mouse.move(x, y); await page.mouse.down() } }
  const moveTo = async (x, y) => { if (TOUCH) await page.touchscreen.touchMove(x, y); else await page.mouse.move(x, y) }
  const release = async () => { if (TOUCH) await page.touchscreen.touchEnd(); else await page.mouse.up() }
  const path = async pts => { await press(...pts[0]); for (const p of pts.slice(1)) { await moveTo(...p); await sleep(12) } await release(); await sleep(300) }
  const drag = async (a, b, steps = 18) => { const pts = []; for (let i = 0; i <= steps; i++) pts.push([a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await path(pts) }
  const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await sleep(300) }
  const tapSel = async sel => { const el = await page.$(sel); if (!el) return fail("no element " + sel); const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  const next = async (ms = 24000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { return fail("no continue button on " + JSON.stringify(await phrase())) }
    await sleep(250); await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const type = async str => {
    if (TOUCH) { for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(70) } await tapSel('button[aria-label="Check"]'); await sleep(650); return }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(70) } await page.keyboard.press("Enter"); await sleep(650)
  }
  const expect = async (cond, msg) => { if (!cond) fail(msg + " on " + JSON.stringify(await phrase())) }

  const geo = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    const L = A.layout(S)
    const pts = {}
    for (const n of new Set([...Object.keys(S.pts), ...Object.keys(S.at), ...S.showPts])) pts[n] = { a: S.ptsD[n], p: A.posOf(S, n) }
    return { O: S.OD, R: S.RD, L, pts, note: S.note && S.note.text, input: S.input && S.input.state, locked: S.locked, showPts: S.showPts, oVis: S.oVis.t, oRing: S.oRing, slider: S.slider }
  })
  const vals = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    return Object.fromEntries(A.angleList(S, A.layout(S)).map(a => [a.id, a.value]))
  })
  const at = (g, deg) => [g.O[0] + Math.cos(deg * D2R) * g.R, g.O[1] + Math.sin(deg * D2R) * g.R]
  /** Slide a point round the circle by `by` degrees, in small steps. */
  const slide = async (name, by) => {
    const g = await geo()
    const a0 = g.pts[name].a / D2R
    const steps = Math.max(6, Math.ceil(Math.abs(by) / 3))
    const pts = []
    for (let i = 0; i <= steps; i++) pts.push(at(g, a0 + by * i / steps))
    await path(pts); await sleep(400)
  }
  /** Slide a point to an angle (degrees), going the short way unless told. */
  const slideTo = async (name, deg, dir) => {
    const g = await geo()
    const a0 = g.pts[name].a / D2R
    let d = ((deg - a0) % 360 + 540) % 360 - 180
    if (dir && Math.sign(d) !== dir) d += dir * 360
    await slide(name, d)
  }
  const tapAngle = async id => {
    const p = await page.evaluate(id => {
      const S = window.__beatScene, A = window.__beatApi
      const a = A.angleList(S, A.layout(S)).find(x => x.id === id)
      if (!a) return null
      const m = a.start + a.sweep / 2
      return [a.c[0] + Math.cos(m) * a.r * 0.6, a.c[1] + Math.sin(m) * a.r * 0.6]
    }, id)
    if (!p) return fail("no angle " + id)
    await tap(...p)
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const twice = async () => { const v = await vals(); await expect(v.C0 === 2 * v.P, `centre ${v.C0} is not twice ${v.P}`) }
  const cm = (X, Y) => page.evaluate((X, Y) => { const S = window.__beatScene, A = window.__beatApi; return { len: A.chordCm(S, X, Y), dist: A.distCm(S, X, Y) } }, X, Y)
  const near = (a, b, e = 0.02) => Math.abs(a - b) < e
  /** Drag the point on the chord to t of the way from A to B. */
  const slideX = async t => { const g = await geo(); const A = g.pts.A.p, B = g.pts.B.p, X = g.pts.X.p; const to = lerp(A, B, t); await drag(X, to, 24); await sleep(400) }
  /** Where the end of chord `name`-`other` must go for a centre angle of `arc` (deg), on its own side. */
  const arcTarget = (name, other, arc) => page.evaluate((name, other, arc) => {
    const S = window.__beatScene
    let d = (S.pts[name] - S.pts[other]) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI
    return (S.pts[other] + Math.sign(d || 1) * arc * Math.PI / 180) * 180 / Math.PI
  }, name, other, arc)

  // ── 1. the middle of a chord ──
  await want("Tap to place"); await tap(W / 2 - 10, H / 2 + 20)
  await want("Now drag out"); { const g = await geo(); const R = g.L.Rmax * 0.95; await drag(g.O, [g.O[0] + R * 0.8, g.O[1] - R * 0.6], 24); await sleep(700) }
  await want("Draw a line across the circle")
  {
    let g = await geo()
    await drag([g.O[0] - g.R * 0.9, g.O[1] - g.R * 0.05], [g.O[0] + g.R * 0.9, g.O[1] + g.R * 0.05]); await expect((await geo()).note, "no note for a line through the centre")
    await sleep(400); g = await geo()
    await drag([g.O[0] - g.R * 0.95, g.O[1] + g.R * 0.5], [g.O[0] + g.R * 0.95, g.O[1] + g.R * 0.38]); await shot("chord")
  }
  await want("That's a chord"); await next()
  await want("Tap the middle")
  { const g = await geo(); await tap(...lerp(g.pts.A.p, g.pts.B.p, 0.25)); await expect((await geo()).note, "no note for a tap off the middle"); await shot("tap-wrong"); await sleep(300); await tap(...lerp(g.pts.A.p, g.pts.B.p, 0.52)) }
  await want("This is the"); await shot("midpoint"); await next()
  await want("Draw a line through")
  {
    let g = await geo(); const M = g.pts.M.p, A = g.pts.A.p, B = g.pts.B.p
    const d = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(...d), n = [-d[1] / l, d[0] / l], u = [d[0] / l, d[1] / l]
    const off = [M[0] + u[0] * g.R * 0.4, M[1] + u[1] * g.R * 0.4]
    await drag([off[0] + n[0] * 60, off[1] + n[1] * 60], [off[0] - n[0] * 60, off[1] - n[1] * 60]); await expect((await geo()).note, "no note for a line missing M"); await sleep(400)
    const slant = [n[0] + u[0] * 0.6, n[1] + u[1] * 0.6]
    await drag([M[0] + slant[0] * 70, M[1] + slant[1] * 70], [M[0] - slant[0] * 70, M[1] - slant[1] * 70]); await expect((await geo()).note, "no note for a slanted line"); await sleep(400)
    g = await geo()
    await drag([M[0] + n[0] * 70, M[1] + n[1] * 70], [M[0] - n[0] * 70, M[1] - n[1] * 70]); await shot("perp")
  }
  await want("Watch where"); await sleep(2200); { const g = await geo(); await expect(g.oRing !== null, "the centre did not light up") } await shot("through"); await next()
  await want("It goes through"); await next()
  await want("Move"); { await slide("A", 25); await slide("B", -30); const g = await geo(); await expect(near(Math.hypot(g.pts.A.p[0] - g.pts.M.p[0], g.pts.A.p[1] - g.pts.M.p[1]), Math.hypot(g.pts.B.p[0] - g.pts.M.p[0], g.pts.B.p[1] - g.pts.M.p[1]), 1), "M is not the middle") } await shot("moved"); await next()
  await want("It meets the chord"); await next()
  await want("It cuts the chord"); await expect((await geo()).note, "no note saying what bisect means"); await next()
  await want("So it's the"); await next()
  await want("The perpendicular bisector of a chord"); await next()
  // ── 2. why ──
  await want("Join"); { const g = await geo(); await drag(g.pts.A.p, g.pts.B.p); await expect((await geo()).note, "no note for joining A to B"); await sleep(300); await drag(g.O, g.pts.A.p); await drag(g.O, g.pts.B.p) }
  await want("OA and OB are both"); await expect((await geo()).note, "no note saying what radii means"); await next()
  await want("So triangle"); await next()
  await want("Fold it"); await sleep(1200); await shot("fold"); await next()
  await want("A lands on"); await next()
  await want("So OM meets"); await next()
  await want("Move"); await slide("A", -20); await slide("B", 25); await next()
  await want("Here's a point"); await next()
  await want("Slide X"); { await slideX(0.44); await slideX(0.5); const g = await geo(); await expect(g.locked, "X did not click to the middle"); const v = await vals(); await expect(v.X === 90, "angle at X is " + v.X) } await shot("x-90")
  await want("At 90"); await next()
  await want("A line from O at"); await next()
  await want("A line from O to the middle"); await next()
  await want("M is the midpoint"); await type("45"); await shot("oma-wrong"); await type("90")
  await want("Angle OAB"); await type("60"); await type("56")
  // ── 3. lost centre ──
  await want("Let's hide"); await expect((await geo()).oVis === 0, "the centre is not hidden"); await next()
  await want("Draw a chord"); { const g = await geo(); await drag([g.O[0] - g.R * 0.9, g.O[1] - g.R * 0.3], [g.O[0] + g.R * 0.5, g.O[1] - g.R * 0.85]) }
  await want("The centre is somewhere"); await sleep(1500); await shot("bis-1"); await next()
  await want("Draw another")
  {
    const g = await geo()
    await drag([g.O[0] - g.R * 0.5, g.O[1] + g.R * 0.7], [g.O[0] + g.R * 0.9, g.O[1] - g.R * 0.1]); await expect((await geo()).note, "no note for a parallel chord"); await sleep(400)
    await drag([g.O[0] + g.R * 0.6, g.O[1] - g.R * 0.75], [g.O[0] + g.R * 0.3, g.O[1] + g.R * 0.92])
  }
  await want("The centre is on this line"); await sleep(1500); await next()
  await want("So the centre is where"); await sleep(800); await expect((await geo()).oVis === 1, "the centre did not come back"); await shot("found"); await next()
  await want("Move the chords")
  {
    await slide("E", 20); await slide("G", -25)
    const off = await page.evaluate(() => {
      const S = window.__beatScene, A = window.__beatApi
      const line = (a, b) => { const p = A.posOf(S, a, false), q = A.posOf(S, b, false); const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; const d = [q[0] - p[0], q[1] - p[1]]; return { m, n: [-d[1], d[0]] } }
      const l1 = line("E", "F"), l2 = line("G", "H")
      const det = l1.n[0] * -l2.n[1] - l1.n[1] * -l2.n[0]
      const rx = l2.m[0] - l1.m[0], ry = l2.m[1] - l1.m[1]
      const s = (rx * -l2.n[1] - ry * -l2.n[0]) / det
      const X = [l1.m[0] + l1.n[0] * s, l1.m[1] + l1.n[1] * s]
      return Math.hypot(X[0] - S.O[0], X[1] - S.O[1])
    })
    await expect(off < 0.5, "bisectors cross " + off.toFixed(2) + "px from the centre")
  }
  await shot("moved-chords"); await next()
  // ── 4. distance ──
  await want("Here's a chord. How far"); await next()
  await want("Slide X along"); await slideX(0.75); await slideX(0.3); await next()
  await want("Make OX as short"); { await slideX(0.45); await slideX(0.5); const g = await geo(); await expect(g.locked, "X did not click to the middle") }
  await want("The shortest is"); await next()
  await want("That's the chord's distance"); await expect((await geo()).note, "no note on distance"); await next()
  await want("Make the chord longer"); { const g = await geo(); const dir = (await page.evaluate(() => { const S = window.__beatScene; let d = (S.pts.A - S.pts.B) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return Math.sign(d) })); await slide("A", dir * 20) } await next()
  await want("Make it as long"); { const t = await arcTarget("A", "B", 180); await slideTo("A", t + 3); await slideTo("A", t); const g = await geo(); await expect(g.locked, "no diameter lock"); const c = await cm("A", "B"); await expect(near(c.len, 10, 0.01), "longest is " + c.len) }
  await want("The longest chord"); await next()
  await want("Now make it really short"); { const t = await arcTarget("A", "B", 16); await slideTo("A", t) } await sleep(400)
  await want("Longer chords"); await sleep(2500); await shot("breathe"); await next()
  // ── 5. equal chords ──
  await want("Here's a second"); await next()
  await want("Make it the same"); { const ab = (await cm("A", "B")).len; const arc = 2 * Math.asin(ab / 10) * 180 / Math.PI; const t = await arcTarget("D", "C", arc); await slideTo("D", t + 4); await slideTo("D", t); const g = await geo(); await expect(g.locked, "no lock on equal length"); const c1 = await cm("A", "B"), c2 = await cm("C", "D"); await expect(near(c1.len, c2.len, 0.001), `lengths ${c1.len} ${c2.len}`) }
  await want("Now look at their"); { const c1 = await cm("A", "B"), c2 = await cm("C", "D"); await expect(near(c1.dist, c2.dist, 0.001), "distances differ") } await shot("distances"); await next()
  await want("Slide it round"); { await slide("C", 40); const c1 = await cm("A", "B"), c2 = await cm("C", "D"); await expect(near(c1.len, c2.len, 0.001), "CD changed length while sliding") } await next()
  await want("Its distance never"); await next()
  await want("Equal chords are the same"); await next()
  await want("We say they are"); await expect((await geo()).note, "no note on equidistant"); await next()
  await want("Turn the second chord")
  {
    const land = await page.evaluate(() => { const S = window.__beatScene; const t = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d }; const same = Math.sign(t(S.pts.C, S.pts.D)) === Math.sign(t(S.pts.A, S.pts.B)); return (same ? S.pts.A : S.pts.B) * 180 / Math.PI })
    await slideTo("C", land + 8); await slideTo("C", land)
    const g = await geo(); await expect(g.locked, "CD did not land on AB")
  }
  await shot("landed")
  await want("It fits exactly"); await next()
  await want("Turning round"); await sleep(1200); await next()
  await want("Equal chords make equal angles"); { const v = await vals(); await expect(v.AOB === v.COD, `centre angles ${v.AOB} ${v.COD}`) } await next()
  await want("Half the chord"); await next()
  await want("By Pythagoras"); await shot("pyth"); await next()
  // ── 6. questions ──
  await want("The radius is 5"); await type("4"); await shot("dist-help"); await type("3")
  await want("X is the midpoint"); await next()
  await want("OX=6"); await type("8"); await expect((await geo()).note, "no note for typing PX"); await shot("pq-help"); await type("16")
  await want("D and E"); await next()
  await want("Angle ABC"); await type("80"); await type("72")
  await want("A, B and C"); await next()
  await want("Angle COA"); await type("140"); await type("110")
  await want("Now find angle QCO"); await type("55"); await type("35")
  await want("These two chords")
  {
    const s = await page.evaluate(() => { const S = window.__beatScene; return { O: S.OD, R: S.RD, d: S.symWant } })
    const u = [Math.cos(s.d), Math.sin(s.d)], v = [-u[1], u[0]]
    await drag([s.O[0] + v[0] * 40 - u[0] * s.R, s.O[1] + v[1] * 40 - u[1] * s.R], [s.O[0] + v[0] * 40 + u[0] * s.R, s.O[1] + v[1] * 40 + u[1] * s.R]); await expect((await geo()).note, "no note for a line missing the centre"); await sleep(400)
    await drag([s.O[0] - u[0] * s.R, s.O[1] - u[1] * s.R], [s.O[0] + u[0] * s.R, s.O[1] + u[1] * s.R]); await shot("sym")
  }
  await want("It goes through the centre, halfway"); await next()
  // ── 7. build ──
  await want("Make a chord 8"); { const t = await arcTarget("A", "B", 2 * Math.asin(0.8) * 180 / Math.PI); await slideTo("A", t + 5); await slideTo("A", t); const g = await geo(); await expect(g.locked, "no 8 cm lock"); const c = await cm("A", "B"); await expect(near(c.len, 8, 0.01) && near(c.dist, 3, 0.01), `8 cm chord ${c.len} at ${c.dist}`) } await shot("eight")
  await want("Now make this chord 4"); { const t = await arcTarget("C", "D", 2 * Math.acos(0.8) * 180 / Math.PI); await slideTo("C", t + 5); await slideTo("C", t); const g = await geo(); await expect(g.locked, "no 4 cm lock"); const c = await cm("C", "D"); await expect(near(c.dist, 4, 0.01) && near(c.len, 6, 0.01), `chord ${c.len} at ${c.dist}`) }
  await want("Make this chord 8")
  {
    const t = await arcTarget("C", "D", 2 * Math.asin(0.8) * 180 / Math.PI); await slideTo("C", t)
    const lit = await page.evaluate(() => [...document.querySelectorAll("[class*=chip]")].map(e => /chipLit/.test(e.className)))
    await expect(lit.length === 2 && !(lit[0] && lit[1]), "both chips lit " + JSON.stringify(lit)); await shot("impossible")
  }
  await next()
  await want("Do you know"); await next()
  await want("An 8 cm chord"); await sleep(800); { const c = await cm("C", "D"); await expect(near(c.len, 8, 0.01) && near(c.dist, 3, 0.01), `CD ${c.len} at ${c.dist}`) } await next()
  await want("Equal chords are always"); await next()
  await want("Move anything"); await slide("C", 30); await slide("A", -20); await shot("end")
  console.log(`done, ${misses} mismatches, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  if (logs.length) console.log("logs:", logs.slice(0, 5))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
