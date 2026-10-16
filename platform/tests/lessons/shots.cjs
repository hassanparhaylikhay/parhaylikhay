// Screenshot every beat of a lesson, opened cold.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const BASE = process.env.BASE || `${HOST}/learn/${process.env.LESSON || "angles"}`
const OUT = outDir("shots-" + (process.env.LESSON || "lesson"))
fs.mkdirSync(OUT, { recursive: true })
const W = +(process.env.W || 1280), H = +(process.env.H || 800)
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, isMobile: W < 500, hasTouch: W < 500 })
  await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const from = +(process.env.FROM || 1), to = +(process.env.TO || beats.length)
  for (let n = from; n <= to; n++) {
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(+(process.env.WAIT || 2600))
    await page.screenshot({ path: `${OUT}/${String(n).padStart(3, "0")}-${beats[n - 1]}.png` })
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
