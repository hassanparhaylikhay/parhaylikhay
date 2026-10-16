// Scripted play-through. Every step waits for the phrase it expects, so a
// beat that fails shows as a mismatch instead of desyncing what follows.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-triangle")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/angles-in-a-triangle?debug"
const W = +(process.env.W || 1440), H = +(process.env.H || 900)
const TOUCH = !!process.env.TOUCH
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, isMobile: TOUCH, hasTouch: TOUCH, deviceScaleFactor: TOUCH ? 2 : 1 })
  const logs = []
  page.on("pageerror", e => logs.push("PAGEERROR " + e.message))
  page.on("console", m => { if (m.type() === "error") logs.push(m.text()) })
  await page.goto(URL, { waitUntil: "load", timeout: 60000 })
  await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0, { timeout: 60000 })
  await sleep(2000)

  let n = 0, misses = 0
  const timeline = []
  const t0 = Date.now()
  const shot = async name => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, "0")}-${name}.png` }) }
  const scene = () => page.evaluate(() => { const S = window.__beatScene; return { D: S.D, P: S.P, apex: S.apex } })
  const phrase = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className))
    return els.length ? els[els.length - 1].textContent : null
  })
  const want = async (prefix, ms = 9000) => {
    const start = Date.now()
    while (Date.now() - start < ms) {
      const p = await phrase()
      if (p && p.startsWith(prefix)) { timeline.push([((Date.now() - t0) / 1000).toFixed(1), prefix]); await sleep(450); return true }
      await sleep(100)
    }
    misses++
    console.log("!! wanted", JSON.stringify(prefix), "but phrase is", JSON.stringify(await phrase()))
    return false
  }
  const drag = async (a, b, steps = 16) => {
    if (TOUCH) {
      await page.touchscreen.touchStart(a[0], a[1])
      for (let i = 1; i <= steps; i++) { await page.touchscreen.touchMove(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps); await sleep(14) }
      await page.touchscreen.touchEnd(); await sleep(150); return
    }
    await page.mouse.move(a[0], a[1]); await page.mouse.down()
    for (let i = 1; i <= steps; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps); await sleep(14) }
    await page.mouse.up(); await sleep(150)
  }
  const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y) }
  const dragV = async (i, to) => { const s = await scene(); await drag(s.D[i], to) }
  const setTri = async pts => { for (let i = 0; i < 3; i++) await dragV(i, pts[i]) }
  const tapSel = async sel => { const el = await page.$(sel); if (!el) { console.log("!! no element", sel); return } const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  // Waits for the arrow, as a student would, then taps it.
  const next = async (ms = 20000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { misses++; console.log("!! no continue button on", JSON.stringify(await phrase())); return }
    await sleep(200)
    await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const type = async str => {
    if (TOUCH) { for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(70) } await tapSel('button[aria-label="Check"]'); await sleep(450); return }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(70) } await page.keyboard.press("Enter"); await sleep(450)
  }
  const cen = P => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]
  const tapAngle = async i => { const s = await scene(); const c = cen(s.D); await tap(s.D[i][0] + (c[0] - s.D[i][0]) * 0.15, s.D[i][1] + (c[1] - s.D[i][1]) * 0.15) }
  const K = Math.min(W / 880, H / 900, 1)
  const cx = W / 2, cy = H / 2 + 40 * K
  const P = (dx, dy) => [cx + dx * K, cy + dy * K]
  // Move corner i out and back, the way a student plays.
  const wiggle = async i => { const s = await scene(); const a = s.D[i]; const c = cen(s.D); const out = [a[0] + (a[0] - c[0]) * 0.45, a[1] + (a[1] - c[1]) * 0.45]; await drag(a, out); await drag(out, a) }

  await want("Draw a triangle"); await shot("draw-empty")
  const A = P(-160, 120), B = P(180, 140), C = P(-30, -120)
  await drag(A, B); await drag(B, C); await drag(C, A); await sleep(250); await shot("draw-closed")
  await want("Move the corners"); await wiggle(0); await wiggle(1); await wiggle(2); await shot("move-playing"); await next()
  await want("Make it long"); await setTri([P(-330, 100), P(330, 100), P(0, 30)]); await shot("flat"); await next()
  await want("Now make it tall"); await setTri([P(-45, 190), P(45, 190), P(0, -170)]); await shot("tall"); await next()
  await want("Each corner"); await sleep(1200); await shot("angles"); await next()
  await want("Move a corner"); await wiggle(2); await wiggle(0); await wiggle(1); await shot("watch-angles"); await next()
  await want("Each angle has"); await sleep(1200); await shot("sizes"); await next()
  await want("Make one angle"); await setTri([P(-260, 100), P(260, 100), P(10, 20)]); await shot("big"); await next()
  await want("Now make one"); await setTri([P(-25, 190), P(25, 190), P(0, -160)]); await shot("small"); await next()
  await want("One thing"); await setTri([P(-180, 120), P(200, 110), P(-40, -120)]); await next(); await want("Add the", 3000)
  await sleep(2600); await shot("add-landed"); await next()
  await want("Move the corners again"); await wiggle(2); await wiggle(0); await wiggle(1); await shot("again"); await next()
  await want("The total"); await sleep(1200); await shot("always"); await next()
  await want("Tap each"); await sleep(900); await tapAngle(0); await sleep(1300); await tapAngle(2); await sleep(1300); await tapAngle(1); await sleep(1400); await shot("tear-done")
  await want("Together"); await next(); await want("A straight line"); await next(); await want("So the angles"); await shot("rule"); await next()
  await want("Make two sides")
  {
    const s = await scene()
    const m = [(s.P[0][0] + s.P[1][0]) / 2, (s.P[0][1] + s.P[1][1]) / 2]
    const d = [s.P[1][0] - s.P[0][0], s.P[1][1] - s.P[0][1]]
    const L = Math.hypot(...d); const nr = [-d[1] / L, d[0] / L]
    const sg = Math.sign((s.P[2][0] - m[0]) * nr[0] + (s.P[2][1] - m[1]) * nr[1]) || 1
    await dragV(2, [m[0] + nr[0] * 220 * K * sg + 6, m[1] + nr[1] * 220 * K * sg]); await shot("iso-made")
  }
  await want("These marks"); await next(); await want("It is called"); await next()
  await want("Look at these"); await sleep(1500); await shot("iso-angles"); await next()
  await want("Move the glowing")
  // the top corner to set base angles: low, high, low, back up
  for (const b of [25, 70, 35, 62]) {
    const s = await scene(); const j = (s.apex + 1) % 3, k = (s.apex + 2) % 3
    const m = [(s.P[j][0] + s.P[k][0]) / 2, (s.P[j][1] + s.P[k][1]) / 2]; const ap = s.P[s.apex]
    const half = Math.hypot(s.P[k][0] - s.P[j][0], s.P[k][1] - s.P[j][1]) / 2
    const u = [ap[0] - m[0], ap[1] - m[1]]; const ul = Math.hypot(...u)
    const h = half * Math.tan(b * Math.PI / 180)
    await dragV(s.apex, [m[0] + u[0] / ul * h, m[1] + u[1] / ul * h])
  }
  await shot("iso-move"); await next()
  await want("Those two"); await next(); await want("They still"); await sleep(2600); await shot("iso-sum"); await next()
  await want("Now make all"); await sleep(1200)
  {
    const s = await scene(); const j = (s.apex + 1) % 3, k = (s.apex + 2) % 3
    const m = [(s.P[j][0] + s.P[k][0]) / 2, (s.P[j][1] + s.P[k][1]) / 2]
    const base = Math.hypot(s.P[k][0] - s.P[j][0], s.P[k][1] - s.P[j][1])
    const ap = s.P[s.apex]; const u = [ap[0] - m[0], ap[1] - m[1]]; const ul = Math.hypot(...u)
    const h = base * Math.sqrt(3) / 2 * 1.04
    await dragV(s.apex, [m[0] + u[0] / ul * h, m[1] + u[1] / ul * h]); await shot("equi-made")
  }
  await want("This is an equi"); await next(); await want("Every angle"); await next(); await want("Three equal"); await next()
  await want("Move any"); { const s = await scene(); const c = cen(s.D); await dragV(0, [c[0] - 60 * K, c[1] + 200 * K]); await dragV(0, [c[0] - 220 * K, c[1] - 40 * K]); await dragV(0, [c[0] + 40 * K, c[1] - 200 * K]) } await shot("equi-move"); await next()
  await want("Each angle stays"); await next()
  await want("This angle is"); await next(); await want("This one is"); await next()
  await want("What is the third"); await type("60"); await type("80"); await shot("p1-wrong2"); await type("70"); await shot("p1-right")
  await want("Find the missing"); await type("65")
  await want("This square"); await next()
  await want("Find the missing"); await type("55")
  await want("Two sides are equal"); await type("70"); await shot("p4-right")
  await want("Which angle"); await tapAngle(2); await sleep(500); await tapAngle(1)
  await want("Now find the top"); await type("50")
  const apexAt = (s, a, b) => {
    const Pj = s.P[0], Pk = s.P[1]
    const L = Math.hypot(Pk[0] - Pj[0], Pk[1] - Pj[1]); const ub = [(Pk[0] - Pj[0]) / L, (Pk[1] - Pj[1]) / L]
    let nr = [-ub[1], ub[0]]; if ((s.P[2][0] - Pj[0]) * nr[0] + (s.P[2][1] - Pj[1]) * nr[1] < 0) nr = [-nr[0], -nr[1]]
    const Ar = a * Math.PI / 180, Br = b * Math.PI / 180; const sl = L * Math.sin(Br) / Math.sin(Ar + Br)
    return [Pj[0] + ub[0] * sl * Math.cos(Ar) + nr[0] * sl * Math.sin(Ar) + 2, Pj[1] + ub[1] * sl * Math.cos(Ar) + nr[1] * sl * Math.sin(Ar) + 1]
  }
  await want("Make a triangle with"); { const s = await scene(); await dragV(2, apexAt(s, 41, 31)); await sleep(200); await shot("make-1-done") }
  await want("Now make these"); { const s = await scene(); await dragV(2, apexAt(s, 31, 89)); await sleep(200); await shot("make-2-done") }
  await want("Now try these"); { const s = await scene(); await dragV(2, apexAt(s, 50, 60)) } await shot("make-3")
  await next(); await want("Do you know why"); await shot("why-not"); await next()
  await want("Because a triangle"); await shot("cannot-exist"); await next()
  await want("These angles add"); await sleep(800); await shot("adds-210"); await next()
  await want("A triangle's angles"); await sleep(2400); await shot("always-180"); await next()
  await want("Move it however"); await sleep(4200); await shot("end")
  console.log(`done, ${misses} mismatches, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  console.log("logs:", logs.length ? logs.slice(0, 10) : "none")
  fs.writeFileSync(OUT + "/timeline.txt", timeline.map(t => t.join("  ")).join("\n"))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
