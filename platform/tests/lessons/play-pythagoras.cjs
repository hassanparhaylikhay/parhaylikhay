// Scripted play-through of Pythagoras, the way a student would do it.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-pythagoras")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/pythagoras?debug"
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
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const st = () => page.evaluate(() => { const S = window.__beatScene; return { note: S.note && S.note.text, locked: S.locked, sq: S.squares.length, input: S.input && S.input.state, pts: S.pts, proof: S.proof && S.proof.moved } })
  const scr = (w) => page.evaluate(w => window.__beatApi.toScreen(window.__beatScene, w), w)
  const ptS = n => page.evaluate(n => window.__beatApi.posOf(window.__beatScene, n), n)
  /** Drag a point to a world spot. */
  const dragTo = async (n, w) => { const a = await ptS(n); const b = await scr(w); await drag(a, b, 22); await sleep(500) }
  const midOf = async (x, y) => { const a = await ptS(x), b = await ptS(y); return lerp(a, b, 0.5) }
  const sq2 = (x, y) => page.evaluate((x, y) => window.__beatApi.sq2(window.__beatScene, x, y), x, y)

  // ── 1. right-angled triangles ──
  await want("This corner"); await shot("corner"); await next()
  await want("Pull out"); await dragTo("A", [0, 3]); await dragTo("B", [4, 0]); await shot("pulled")
  await want("Join their"); { const c = await ptS("C"), a = await ptS("A"); await drag(a, c); await expect((await st()).note, "no note joining A to C"); await sleep(300); await drag(await ptS("A"), await ptS("B")) }
  await want("It's a"); await next()
  await want("Move the corners"); await dragTo("A", [0, 5]); await dragTo("B", [2, 0]); await next()
  await want("Make it long"); await dragTo("A", [0, 6]); await dragTo("B", [2, 0])
  await want("The longest side"); await next()
  await want("It's called the"); await next()
  for (let k = 0; k < 3; k++) {
    await want("Tap the hypotenuse")
    await tap(...(await midOf("C", "A"))); await expect((await st()).note, "no note tapping a short side"); await sleep(300)
    await tap(...(await midOf("A", "B")))
  }
  // ── 2. squares ──
  await want("Tap each side"); for (const [x, y] of [["C", "A"], ["C", "B"], ["A", "B"]]) { await tap(...(await midOf(x, y))); await sleep(500) } await shot("squares")
  await want("Each square has"); await next()
  await want("Move the corners. Watch"); await dragTo("A", [0, 2]); await dragTo("B", [5, 0]); await next()
  await want("Make the short sides"); await dragTo("A", [0, 3]); await dragTo("B", [4, 0]); await expect((await st()).locked, "3-4 did not lock")
  await want("Guess"); await type("20"); await shot("guessed")
  await want("Add them"); await sleep(2600); await shot("added"); await next()
  await want("Move the corners again"); { await dragTo("A", [0, 5]); await dragTo("B", [2, 0]); const a = await sq2("C", "A"), b = await sq2("C", "B"), c = await sq2("A", "B"); await expect(a + b === c, `${a}+${b}!=${c}`) } await next()
  await want("The two small squares"); await next()
  await want("This is"); await shot("theorem"); await next()
  // ── 3. proof ──
  await want("Here are four"); await next()
  await want("Each side of the big"); await next()
  await want("The gap in the middle"); await next()
  await want("Tap each glowing")
  for (const k of [0, 2, 3]) {
    const p = await page.evaluate(k => { const S = window.__beatScene, A = window.__beatApi; const [a, b] = A.proofAB(S); const T = A.proofAt(a, b, k, 0); const c = [(T[0][0] + T[1][0] + T[2][0]) / 3 + S.proof.at[0], (T[0][1] + T[1][1] + T[2][1]) / 3 + S.proof.at[1]]; return A.toScreen(S, c) }, k)
    await tap(...p); await sleep(400)
  }
  await sleep(1400); await shot("moved")
  await want("Now the gaps"); await next()
  await want("It's the same"); await next()
  await want("So the gaps"); await next()
  await want("It works the same"); await sleep(1500); await shot("breathe"); await next()
  // ── 4. right angle only ──
  await want("Now let corner"); await dragTo("C", [1, 1])
  await want("Make the angle at"); await dragTo("C", [1, 1]); await expect((await page.evaluate(() => window.__beatScene.drag)) === null, "still dragging")
  await want("Now the big square is more"); { const a = await sq2("C", "A"), b = await sq2("C", "B"), c = await sq2("A", "B"); await expect(a + b < c, "not more") } await shot("too-big"); await next()
  await want("Now make it smaller"); await dragTo("C", [-1, -2])
  await want("Now the big square is less"); { const a = await sq2("C", "A"), b = await sq2("C", "B"), c = await sq2("A", "B"); await expect(a + b > c, "not less") } await next()
  await want("Pythagoras only"); await next()
  // ── 5. hypotenuse ──
  await want("Here the two short"); await next()
  await want("Square them"); await sleep(2400); await next()
  await want("The hypotenuse is the side"); await next()
  await want("So it is the"); await expect((await st()).note, "no note on square root"); await next()
  await want("Find the hypotenuse"); await type("17"); await shot("hyp-help"); await type("13")
  await want("Find the hypotenuse"); await type("17")
  await want("Triangle PQR"); await type("15")
  // ── 6. shorter side ──
  await want("Now the hypotenuse is 10"); await next()
  await want("Take the small"); await next()
  await want("So the missing side"); await next()
  await want("To find a short"); await next()
  await want("Find the missing side"); await type("8"); await expect((await st()).note, "no note for 13 - 5"); await shot("slip"); await type("12")
  await want("Find the missing side"); await type("7")
  await want("Find the missing side"); await type("15")
  // ── 7. exam ──
  await want("The diagram shows"); await shot("pqrs"); await next()
  await want("The square's area"); await type("16"); await type("4")
  await want("A square ABCD"); await next()
  await want("BE="); await type("85"); await shot("pent-help"); await type("106")
  await want("B is 12 km"); await next()
  await want("Find BC"); await type("20"); await type("208")
  await want("With a calculator"); await next()
  await want("How far apart"); await next()
  await want("Go across"); await next()
  await want("Find the length AB"); await type("10")
  // ── 8. build ──
  await want("Make the hypotenuse 5"); await dragTo("A", [0, 3]); await dragTo("B", [4, 0]); await expect((await st()).locked, "5 did not lock")
  await want("Now make it 13"); await dragTo("A", [0, 5]); await dragTo("B", [12, 0]); await expect((await st()).locked, "13 did not lock"); await shot("thirteen")
  await want("Make the sides 2"); { await dragTo("A", [0, 2]); await dragTo("B", [3, 0]); const lit = await page.evaluate(() => [...document.querySelectorAll("[class*=chip]")].filter(e => /chipLit/.test(e.className)).length); await expect(lit < 3, "all three lit") } await next()
  await want("Do you know"); await next()
  await want("The short sides would"); await next()
  await want("In a right-angled"); await next()
  await want("Move anything"); await dragTo("A", [0, 4]); await shot("end")
  console.log(`done, ${misses} mismatches, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  if (logs.length) console.log("logs:", logs.slice(0, 5))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
