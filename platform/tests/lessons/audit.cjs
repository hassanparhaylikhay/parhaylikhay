// Every beat of a lesson as text, for review: its phrase, what kind of beat
// it is, and each Show me how step (its words, its line, and whether it
// changes the figure: a step that shows nothing is flagged).
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const SLUG = process.env.LESSON
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`${HOST}/learn/${SLUG}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi && window.__beatApi.beats)
  const beats = await page.evaluate(() => window.__beatApi.beats)
  let flags = 0
  beats.forEach((b, i) => {
    const kind = b.walk ? "ASK" : b.done ? "DO" : "WATCH"
    console.log(`${String(i + 1).padStart(3)} ${kind.padEnd(5)} ${b.id}: ${b.say}`)
    b.steps.forEach((s, k) => {
      const flag = s.show ? "" : "  <-- shows nothing"
      if (!s.show) flags++
      console.log(`        step ${k + 1}: ${s.say}${s.tex ? `   [${s.tex}]` : ""}${flag}`)
    })
  })
  console.log(`\n${beats.length} beats, ${beats.filter(b => b.walk).length} with Show me how, ${flags} steps that show nothing`)
  await Promise.race([browser.close(), new Promise(r => setTimeout(r, 3000))])
  process.exit(0)
})()
