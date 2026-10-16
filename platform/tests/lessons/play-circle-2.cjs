// Scripted play-through of Circle theorems II, the way a student would do it.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-circle-2")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/circle-theorems-2?debug"
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
    for (const n of new Set([...Object.keys(S.pts), ...Object.keys(S.free), ...S.showPts])) pts[n] = { a: S.ptsD[n], p: A.posOf(S, n) }
    return { O: S.OD, R: S.RD, L, pts, note: S.note && S.note.text, input: S.input && S.input.state, locked: S.locked, free: Object.keys(S.free), tline: S.tlineD, showPts: S.showPts }
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


  const sumOK = async (x, y) => { const v = await vals(); await expect(v[x] + v[y] === 180, `${x}+${y} = ${v[x]}+${v[y]}`) }
  // ── 1. circle ──
  await want("Tap to place"); await tap(W / 2 - 10, H / 2 + 20)
  await want("Now drag out"); { const g = await geo(); const R = g.L.Rmax * 0.95; await drag(g.O, [g.O[0] + R * 0.8, g.O[1] - R * 0.6], 24); await sleep(700) }
  // ── 2. cyclic quadrilateral ──
  await want("Tap the circle to put four")
  { const g = await geo(); for (const d of [-120, -30, 50, 150]) await tap(...at(g, d)); await sleep(300); const g2 = await geo(); await expect(["A", "B", "C", "D"].every(n => g2.showPts.includes(n)), "four points not placed"); await shot("four") }
  await want("Join them in order")
  { const g = await geo(); await drag(g.pts.A.p, g.pts.C.p); await expect((await geo()).note, "no note for a diagonal"); await sleep(300)
    for (const [a, b] of [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]]) await drag(g.pts[a].p, g.pts[b].p) }
  await want("All four corners"); await shot("cyclic"); await next()
  await want("Each corner"); await sumOK("A", "C"); await sumOK("B", "D"); await next()
  await want("Move the corners"); for (const [n, by] of [["A", 20], ["C", -25], ["B", 15], ["D", -20], ["A", -40]]) { await slide(n, by); await sumOK("A", "C"); await sumOK("B", "D") } await next()
  await want(""); await next()
  await want("Guess"); await type("200")
  await want("Add them"); await sumOK("A", "C"); await shot("sum"); await next()
  await want("Move the corners. Is it"); for (const [n, by] of [["B", 25], ["D", -30], ["A", 20]]) { await slide(n, by); await sumOK("A", "C") } await next()
  await want(""); await sumOK("B", "D"); await next()
  await want("Opposite angles of a cyclic"); await next()
  await want("Pull")
  { const g = await geo(); const d = [g.pts.D.p[0] - g.O[0], g.pts.D.p[1] - g.O[1]]; const pts = []; for (let k = 0; k <= 16; k++) { const t = 1 - 0.3 * k / 16; pts.push([g.O[0] + d[0] * t, g.O[1] + d[1] * t]) } await path(pts)
    const g2 = await geo(); await expect(g2.free.includes("D"), "D did not come off"); const v = await vals(); await expect(v.A + v.C !== 180, `off the circle but A+C = ${v.A + v.C}`); await shot("off") }
  await want("Off the circle"); await next()
  await want("Put")
  { const g = await geo(); const p = g.pts.D.p; const d = [p[0] - g.O[0], p[1] - g.O[1]], l = Math.hypot(...d); const pts = []; for (let k = 0; k <= 16; k++) { const r = l + (g.R - l) * k / 16; pts.push([g.O[0] + d[0] / l * r, g.O[1] + d[1] / l * r]) } await path(pts)
    const g2 = await geo(); await expect(!g2.free.includes("D"), "D did not go back on"); await sumOK("A", "C") }
  await want("Find the missing"); await type("60"); await shot("cyclic-help"); await type("58")
  // ── 3. why ──
  await want(""); await next()
  await want("They're in different"); await next()
  await want("Join"); { const g = await geo(); await drag(g.pts.B.p, g.O); await drag(g.pts.D.p, g.O) }
  await want(""); { const v = await vals(); await expect(v.cA === 2 * v.A, "cA " + JSON.stringify(v)) } await next()
  await want(""); await next()
  await want("Together"); { const v = await vals(); await expect(v.cA + v.cC === 360, "ring " + JSON.stringify(v)) } await shot("ring"); await next()
  await want("So "); await next()
  await want("Move"); for (const [n, by] of [["B", 20], ["D", -25]]) { await slide(n, by); const v = await vals(); await expect(v.cA + v.cC === 360 && v.A + v.C === 180, "why " + JSON.stringify(v)) } await next()
  // ── 4. tangents ──
  await want("Drag this line")
  { const g = await geo(); const F = [g.O[0], g.O[1] - g.tline.d * g.R]; await drag(F, [g.O[0], g.O[1] - 0.6 * g.R], 20); await shot("cut") }
  await want("Now it cuts"); await next()
  await want("Slide it back")
  { const g = await geo(); const F = [g.O[0], g.O[1] - g.tline.d * g.R]; await drag(F, [g.O[0], g.O[1] - 1.01 * g.R], 20); await expect((await geo()).locked, "line did not click onto the circle") }
  await want("It touches"); await next()
  await want("Join"); { const g = await geo(); await drag(g.pts.T.p, g.O) }
  await want("Guess"); await type("90")
  await want("Slide"); for (const by of [50, -110, 40]) { await slide("T", by); const v = await vals(); await expect(v.rt === 90, "radius-tangent " + v.rt) } await shot("ride"); await next()
  await want("A tangent meets"); await next()
  await want("Tilt")
  { const g = await geo(); const T = g.pts.T.p; const a0 = g.tline.t + Math.PI / 2 + g.tline.tilt; const r = 0.85 * g.R; const pts = []; for (let k = 0; k <= 14; k++) { const a = a0 + 0.16 * k / 14; pts.push([T[0] + Math.cos(a) * r, T[1] + Math.sin(a) * r]) } await path(pts); await shot("tilt") }
  await want("If you tilt"); await next()
  await want("Find the missing"); await type("40"); await type("38")
  // ── 5. two tangents ──
  await want("Here's a point"); await next()
  await want("Draw a line from")
  { let g = await geo(); const P = g.pts.P.p; await drag(P, [P[0] + (g.O[0] - P[0]) * 1.2, P[1] + (g.O[1] - P[1]) * 1.2]); await expect((await geo()).note, "no note for a line through the circle"); await sleep(400)
    g = await geo(); const A = g.pts.A.p; await drag(P, [P[0] + (A[0] - P[0]) * 1.25, P[1] + (A[1] - P[1]) * 1.25]); await shot("tan1") }
  await want("Now the other"); { const g = await geo(); const P = g.pts.P.p, B = g.pts.B.p; await drag(P, [P[0] + (B[0] - P[0]) * 1.25, P[1] + (B[1] - P[1]) * 1.25]) }
  await want("Move")
  { const g = await geo(); const P = g.pts.P.p; await drag(P, [P[0] + g.R * 0.15, P[1] + g.R * 0.45], 20); await sleep(500)
    const t = await page.evaluate(() => [...document.querySelectorAll("[class*=label]")].map(e => e.textContent).filter(x => /cm/.test(x)))
    await expect(t.length === 2 && t[0] === t[1], "lengths " + JSON.stringify(t)); await shot("lengths") }
  await next()
  await want("They're always"); await next()
  await want("Tangents from"); await next()
  await want("Join"); { const g = await geo(); await drag(g.O, g.pts.A.p); await drag(g.O, g.pts.B.p); await drag(g.O, g.pts.P.p) }
  await want("OA and OB are both"); await expect((await geo()).note, "no note saying what radii means"); await shot("radii"); await next()
  await want("Each tangent meets"); { const v = await vals(); await expect(v.OAP === 90 && v.OBP === 90, "right angles " + JSON.stringify(v)) } await next()
  await want("The two triangles share"); await next()
  await want("Fold"); await sleep(1600); await shot("fold"); await next()
  await want("So triangle"); { const v = await vals(); await expect(v.PAB === v.PBA, "isosceles " + JSON.stringify(v)) } await next()
  await want("Find angle"); await type("70"); await type("71")
  await want("Now find"); await type("142")
  await want("Now find the angle at"); await type("71")
  // ── 6. alternate segment ──
  await want("Here's a tangent")
  { const g = await geo(); await tap(...at(g, 75)); await expect((await geo()).note, "no note tapping next to T"); await sleep(300); await tap(...at(g, -20)) }
  await want("Join"); { const g = await geo(); await drag(g.pts.T.p, g.pts.A.p) }
  await want("The tangent and the chord"); { const v = await vals(); await expect(v.tc === 55, "tc " + v.tc) } await next()
  await want("Tap the circle on the other side")
  { const g = await geo(); await tap(...at(g, 35)); await expect((await geo()).note, "no note for the same side"); await sleep(300); await tap(...at(g, -150)) }
  await want("Join"); { const g = await geo(); await drag(g.pts.C.p, g.pts.T.p); await drag(g.pts.C.p, g.pts.A.p) }
  await want("Move"); for (const by of [25, -40]) { await slide("C", by); const v = await vals(); await expect(v.tc === v.C, `tc ${v.tc} C ${v.C}`) } await shot("alt"); await next()
  await want("They're always"); await next()
  await want("Move"); for (const by of [-20, 30]) { await slide("A", by); const v = await vals(); await expect(v.tc === v.C, `tc ${v.tc} C ${v.C}`) } await next()
  await want(""); await next()
  await want("The angle between"); await next()
  await want("This is the alternate"); await next()
  await want("Slide")
  { const g = await geo(); const c = g.pts.C.a * 180 / Math.PI, t = g.pts.T.a * 180 / Math.PI; let d = ((t - c) % 360 + 540) % 360 - 180; const a = g.pts.A.a * 180 / Math.PI
    // go the way that does not pass A
    const passes = (from, by) => { const r = ((a - from) % 360 + 540) % 360 - 180; return Math.sign(r) === Math.sign(by) && Math.abs(r) < Math.abs(by) }
    if (passes(c, d)) d = d - Math.sign(d) * 360
    await slide("C", d - Math.sign(d) * 5); const v = await vals(); await expect(v.tc === v.C, `limit tc ${v.tc} C ${v.C}`); await shot("limit") }
  await want("As "); await next()
  await want("The angle at"); await next()
  await want("So it was"); await next()
  // ── 8. use it ──
  await want("Find"); await type("50")
  await want("Find angle"); await type("37")
  await want("Now find"); await shot("pqrs"); await type("122")
  // ── 9. build ──
  await want("Make the tangent"); await slideTo("A", 12); await expect((await geo()).locked, "40 not locked"); { const v = await vals(); await expect(v.tc === 40, "tc " + v.tc) }
  await want("Move"); await slideTo("D", 131); { const v = await vals(); await expect(v.A === 110 && v.C === 70, "110: " + JSON.stringify(v)) }
  // ── 10. can't ──
  await want("Make "); { await slide("B", 20); await slide("D", -25); const lit = await page.evaluate(() => document.querySelectorAll("[class*=chipLit]").length); await expect(lit < 2, "both chips lit") } await next()
  await want("Do you know"); await next()
  await want(""); await next()
  await want("Opposite angles"); await next()
  await want("Move anything"); await slide("A", 15); await sumOK("A", "C"); await sleep(3500); await shot("end")
  const restart = await page.evaluate(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Start again"))
  await expect(restart, "no Start again button")

  console.log(`done, ${misses} mismatches, ${Math.round((Date.now() - t0) / 1000)}s`)
  console.log("logs:", logs.length ? [...new Set(logs)].slice(0, 10) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
