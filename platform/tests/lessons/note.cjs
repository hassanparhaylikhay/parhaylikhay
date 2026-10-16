// The note must sit below the phrase's last line, never on top of it.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const OUT = outDir("note")
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  for (const [W, H, tag] of [[1440, 900, "desktop"], [390, 844, "phone"], [1024, 600, "small"]]) {
    await page.setViewport({ width: W, height: H })
    await page.goto(HOST + "/learn/circle-theorems-1?debug&beat=1", { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatApi)
    const n = await page.evaluate(() => window.__beatApi.beats.findIndex(b => b.id === "guess-twice") + 1)
    await page.goto(`${HOST}/learn/circle-theorems-1?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(1400)
    await page.keyboard.press("2"); await page.keyboard.press("Enter"); await sleep(700)
    const r = await page.evaluate(() => {
      const ph = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)).pop()
      const note = document.querySelector("[class*=note]")
      if (!ph || !note) return null
      // the phrase's own text lines (everything but the note)
      const range = document.createRange()
      range.setStartBefore(ph.firstChild); range.setEndBefore(note)
      const rects = [...range.getClientRects()]
      const textBottom = Math.max(...rects.map(x => x.bottom))
      return { textBottom, noteTop: note.getBoundingClientRect().top, lines: new Set(rects.map(x => Math.round(x.top))).size, note: note.textContent }
    })
    await page.screenshot({ path: `${OUT}/note-${tag}.png`, clip: { x: 0, y: 0, width: W, height: 240 } })
    console.log(tag, JSON.stringify(r), r && r.noteTop >= r.textBottom ? "OK" : "OVERLAP")
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
