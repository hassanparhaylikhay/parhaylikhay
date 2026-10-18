// A finger that runs on past a target must still click the point in.
// Circle theorems I, "Drag B until AB is a diameter": a fast phone flick
// carries B past the diameter in a few big jumps (and once in a single jump
// that skips the magnet altogether). B must end exactly on the diameter, and
// the beat must move on. Bug from a student on 17 Oct 2026.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const sleep = ms => new Promise(r => setTimeout(r, ms))
const BASE = HOST + "/learn/circle-theorems-1"

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let bad = 0
  const cases = [
    { name: "phone flick in big jumps", touch: true, path: [-20, -45, -80] },
    { name: "one jump straight past", touch: true, path: [-70] },
    { name: "mouse runs past and back a little", touch: false, path: [-10, -28, -40, -36] },
  ]
  for (const c of cases) {
    await page.setViewport({ width: c.touch ? 390 : 1280, height: c.touch ? 844 : 800, isMobile: c.touch, hasTouch: c.touch })
    await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatApi)
    const n = await page.evaluate(() => window.__beatApi.beats.findIndex(b => b.id === "make-diameter") + 1)
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(1500)
    const g = await page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi; return { O: S.OD, R: S.RD, B: A.posOf(S, "B") } })
    const at = d => [g.O[0] + Math.cos(d * Math.PI / 180) * g.R, g.O[1] + Math.sin(d * Math.PI / 180) * g.R]
    if (c.touch) {
      await page.touchscreen.touchStart(...g.B)
      for (const d of c.path) { await page.touchscreen.touchMove(...at(d)); await sleep(16) }
      await page.touchscreen.touchEnd()
    } else {
      await page.mouse.move(...g.B); await page.mouse.down()
      for (const d of c.path) { await page.mouse.move(...at(d)); await sleep(16) }
      await page.mouse.up()
    }
    await sleep(300)
    const r = await page.evaluate(() => { const S = window.__beatScene; return { locked: S.locked, bDeg: S.pts.B * 180 / Math.PI } })
    const onDiameter = Math.abs(((r.bDeg + 30) % 360 + 360) % 360) < 1e-6 || Math.abs(((r.bDeg + 30) % 360 + 360) % 360 - 360) < 1e-6
    await sleep(3200)
    const phrase = await page.evaluate(() => [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)).pop()?.textContent || "")
    const movedOn = /straight line/.test(phrase)
    const ok = r.locked && onDiameter && movedOn
    if (!ok) bad++
    console.log(`${ok ? "ok " : "BAD"} ${c.name}: locked ${r.locked}, B at ${r.bDeg.toFixed(3)} deg, moved on ${movedOn}`)
  }
  console.log(bad ? `overshoot: ${bad} BAD` : "overshoot: ok", "errors:", errs.length ? errs.slice(0, 3) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
