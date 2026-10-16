// Scripted play-through of the polygon lesson. Waits for each phrase.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-polygons")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/angles-in-polygons?debug"
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
  const t0 = Date.now()
  const shot = async name => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, "0")}-${name}.png` }) }
  const scene = () => page.evaluate(() => { const S = window.__beatScene; return { D: S.D, P: S.P, walk: S.walk && { ...S.walk } } })
  const phrase = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className))
    return els.length ? els[els.length - 1].textContent : null
  })
  const want = async (prefix, ms = 10000) => {
    const start = Date.now()
    while (Date.now() - start < ms) {
      const p = await phrase()
      if (p && p.startsWith(prefix)) { await sleep(450); return true }
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
  const tapSel = async sel => { const el = await page.$(sel); if (!el) { console.log("!! no element", sel); misses++; return } const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  const dragV = async (i, to) => { const s = await scene(); await drag(s.D[i], to) }
  const next = async (ms = 22000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { misses++; console.log("!! no continue button on", JSON.stringify(await phrase())); return }
    await sleep(200); await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const type = async str => {
    if (TOUCH) { for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(70) } await tapSel('button[aria-label="Check"]'); await sleep(450); return }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(70) } await page.keyboard.press("Enter"); await sleep(450)
  }
  const cen = P => { let x = 0, y = 0; for (const p of P) { x += p[0]; y += p[1] } return [x / P.length, y / P.length] }
  // move a corner out from the middle and back, the way a student plays
  const wiggle = async i => { const s = await scene(); const a = s.D[i]; const c = cen(s.D); const out = [a[0] + (a[0] - c[0]) * 0.5, a[1] + (a[1] - c[1]) * 0.5]; await drag(a, out); await drag(out, a) }
  const K = Math.min(W / 880, H / 900, 1)
  const cx = W / 2, cy = H / 2 + 40 * K
  const P = (dx, dy) => [cx + dx * K, cy + dy * K]

  // 1. four corners
  await want("Draw a shape"); await shot("draw-empty")
  const Q = [P(-160, 130), P(170, 140), P(150, -110), P(-120, -120)]
  for (let k = 0; k < 4; k++) await drag(Q[k], Q[(k + 1) % 4])
  await sleep(250); await shot("drawn")
  await want("A shape with four straight sides"); await shot("quad-name"); await next()
  await want("Move the corners"); for (const i of [0, 1, 2, 3]) await wiggle(i); await next()
  await want("Make it long"); { await dragV(0, P(-330, 60)); await dragV(1, P(330, 60)); await dragV(2, P(320, 0)); await dragV(3, P(-320, 0)) } await shot("thin"); await next()
  await want("Each corner"); await sleep(800); await next()
  await want("Each angle has"); await sleep(800); await shot("sizes"); await next()
  await want("Move a corner"); await wiggle(1); await wiggle(3); await next()
  await want("Guess: what"); await type("300"); await shot("guessed")
  await want("Add the four"); await sleep(2700); await shot("sum-360"); await next()
  await want("Move the corners again"); for (const i of [0, 2, 1, 3]) await wiggle(i); await shot("again"); await next()
  await want("A quadrilateral's angles"); await next()
  // 2. why
  await want("Draw a line to the opposite"); { const s = await scene(); await drag(s.D[0], s.D[1]); await sleep(300); await shot("diag-wrong"); await drag(s.D[0], s.D[2]) }
  await want("One line makes"); await shot("two-tris"); await next()
  await want("Each triangle's"); await next()
  await want("Two triangles"); await next()
  await want("Together their"); await sleep(1000); await shot("split"); await next()
  await want("Move a corner. It's always"); await wiggle(1); await wiggle(3); await wiggle(2); await next()
  // 3. more corners
  await want("Tap a side"); { const s = await scene(); const m = [(s.D[0][0] + s.D[1][0]) / 2, (s.D[0][1] + s.D[1][1]) / 2]; await tap(m[0], m[1]) } await sleep(600); await shot("added-5")
  await want("It has five sides"); await next()
  await want("From this corner"); { const s = await scene(); await drag(s.D[0], s.D[2]); await drag(s.D[0], s.D[3]) } await sleep(300); await shot("diags-5")
  await want("That makes three"); await next()
  await want("So the angles add up"); await next()
  await want("Check it"); await sleep(2700); await shot("check-540"); await next()
  await want("Add one more"); { const s = await scene(); const m = [(s.D[2][0] + s.D[3][0]) / 2, (s.D[2][1] + s.D[3][1]) / 2]; await tap(m[0], m[1]) }
  await want("It has six sides"); await next()
  await want("Guess: how many"); await type("5"); await sleep(1500); await shot("guess-tris")
  await want("Four triangles"); await next()
  await want("Look at the sides"); await sleep(2800); await shot("table"); await next()
  await want("There are always two"); await next()
  await want("A shape has"); await type("12"); await shot("ten-wrong"); await type("8"); await sleep(2500); await shot("ten-right")
  await want("So its angles"); await next()
  await want("Any shape with"); await next()
  await want("With "); await shot("rule"); await next()
  await want("Here are some of their names"); await sleep(3000); await shot("names"); await next()
  // 4. regular
  await want("Watch this hexagon"); await sleep(2000); await shot("regular"); await next()
  await want("All six sides"); await next()
  await want("All six angles"); await next()
  await want("The six angles share"); await shot("share"); await next()
  await want("Find each angle"); await type("120"); await shot("each-120")
  await want("Turn it or resize"); { const s = await scene(); const c = cen(s.D); const a = s.D[0]; await drag(a, [c[0] + (a[0] - c[0]) * 0.6 + 60 * K, c[1] + (a[1] - c[1]) * 0.6]); await sleep(200); await shot("turned"); const s2 = await scene(); await drag(s2.D[0], [c[0] - 30 * K, c[1] - 160 * K]) } await next()
  await want("This is a regular pentagon"); await type("108")
  // 5. exterior
  await want("Now a pentagon that"); await next()
  await want("Stretch one side"); { const s = await scene(); const a = s.D[0], b = s.D[1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; await drag(b, [b[0] + u[0] * 100 * K, b[1] + u[1] * 100 * K]) } await shot("stretched")
  await want("This outside angle"); await next()
  await want("The angle inside is"); await shot("interior"); await next()
  await want("The interior and exterior"); await shot("straight"); await next()
  await want("So the exterior angle is"); await shot("ext-rule"); await next()
  await want("Here are all five"); await shot("all-ext"); await next()
  await want("Now walk"); await tap(cx, cy); await sleep(1200)
  await want("At each corner"); await tap(cx, cy); await sleep(1000); await shot("first-turn")
  await want("Keep walking")
  for (let k = 0; k < 8; k++) { await tap(cx, cy); await sleep(1000) }
  await shot("walked")
  await want("You turned"); await shot("once-round"); await next()
  await want("One full turn"); await next()
  await want("So the exterior"); await next()
  await want("Move the corners. Watch the turns"); for (const i of [0, 2, 3, 1, 4]) await wiggle(i); await shot("turns-live"); await next()
  // 6. regular, quick way
  await want("In a regular hexagon"); await shot("equal-turns"); await next()
  await want("Find each turn"); await type("60")
  await want("Each angle inside"); await type("120"); await shot("same-120")
  await want("This is a regular decagon"); await type("36")
  await want("Now each interior"); await type("144")
  await want("Every turn is"); await sleep(4200); await shot("fill-30"); await type("12"); await sleep(600); await shot("twelve")
  await want("Every inside angle is"); await type("40")
  await want("So how many sides"); await type("9")
  // 7. missing angles
  await want("Find the missing angle"); await shot("missing-quad"); await type("105")
  await want("What do a pentagon"); await type("540")
  await want("Find the missing angle"); await shot("missing-pent"); await type("115")
  await want("Here are a regular pentagon"); await shot("pent-hex"); await next()
  await want("What is each angle of the pentagon"); await type("108")
  await want("What is each angle of the hexagon"); await type("120")
  await want("Angles round a point"); await next()
  await want("Find")
  await type("132"); await sleep(500); await shot("x-132")
  // 8. build to order
  await want("Make a regular polygon"); for (let k = 0; k < 2; k++) { await tapSel('button[aria-label="More sides"]'); await sleep(500) } await shot("built-120")
  await want("Now one with angles of 140"); for (let k = 0; k < 3; k++) { await tapSel('button[aria-label="More sides"]'); await sleep(500) } await shot("built-140")
  await want("Now one with angles of 100"); for (let k = 0; k < 4; k++) { await tapSel('button[aria-label="Fewer sides"]'); await sleep(500) } await shot("tried-100"); await next()
  await want("Do you know"); await next()
  await want("Each turn would"); await next()
  await want("The turns must"); await sleep(4600); await shot("impossible-dial"); await next()
  await want("Four turns make"); await next()
  await want("You can't have"); await shot("half-side"); await next()
  await want("So a regular"); await next()
  await want("In any polygon"); await sleep(4200); await shot("end")
  console.log(`done, ${misses} mismatches, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  console.log("logs:", logs.length ? [...new Set(logs)].slice(0, 10) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
