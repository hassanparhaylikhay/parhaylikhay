// Title cards: opening a lesson shows its first title, then the beat;
// going forward into a new part shows that part's title; a tap skips it;
// ?beat=N opens without a title.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn"
const OUT = outDir("cards")
const sleep = ms => new Promise(r => setTimeout(r, ms))
const state = () => {
  const card = document.querySelector("[class*=card_]") || document.querySelector("[class*=Card]")
  const cards = [...document.querySelectorAll("div")].filter(d => /(^|_)card(_|Leaving)/.test(d.className) || /beats-module.*__card /.test(d.className))
  const c = [...document.querySelectorAll("div")].find(d => /card/.test(d.className) && !/cardInner|cardTitle|cardRule/.test(d.className))
  const ph = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)).pop()
  return { card: c ? c.textContent : null, leaving: c ? /Leaving/.test(c.className) : null, phrase: ph ? ph.textContent : null }
}
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let bad = 0
  const expect = (what, ok) => { if (!ok) bad++; console.log(ok ? "  ok " : "  BAD", what) }
  for (const [W, H, tag] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
    await page.setViewport({ width: W, height: H, isMobile: tag === "phone", hasTouch: tag === "phone" })
    for (const slug of ["angles-in-a-triangle", "angles-in-polygons", "angles", "circle-theorems-1", "circle-theorems-2"]) {
      // cold open: the lesson's first title, then its first beat
      await page.goto(`${BASE}/${slug}?debug`, { waitUntil: "load" })
      await sleep(900)
      const a = await page.evaluate(state)
      await page.screenshot({ path: `${OUT}/card-${slug}-${tag}.png` })
      await sleep(2200)
      const b = await page.evaluate(state)
      expect(`${tag} ${slug} open: card "${a.card}" then phrase "${b.phrase}"`, !!a.card && !a.phrase && !b.card && !!b.phrase)
    }
  }
  // forward into a new part (triangle: always -> tear), then tap to skip
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`${BASE}/angles-in-a-triangle?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const n = await page.evaluate(() => window.__beatApi.beats.findIndex(b => b.id === "tear"))
  await page.goto(`${BASE}/angles-in-a-triangle?debug&beat=${n}`, { waitUntil: "load" })
  await sleep(600)
  const c0 = await page.evaluate(state)
  expect(`?beat=N opens with no title: card ${c0.card}`, !c0.card)
  await sleep(1600)
  await page.keyboard.press("Enter")
  await sleep(500)
  const c1 = await page.evaluate(state)
  await page.screenshot({ path: `${OUT}/card-forward.png` })
  expect(`forward shows "${c1.card}"`, c1.card && /180/.test(c1.card))
  const t0 = Date.now()
  await page.mouse.click(640, 400)
  await sleep(150)
  const c2 = await page.evaluate(state)
  expect(`tap sends it away: leaving ${c2.leaving}`, c2.leaving === true || c2.card === null)
  await sleep(700)
  const c3 = await page.evaluate(state)
  expect(`beat starts: phrase "${c3.phrase}"`, !c3.card && /tear/i.test(c3.phrase || ""))
  // back arrow into a part's first beat: no title
  await page.keyboard.press("ArrowRight").catch(() => {})
  await page.keyboard.press("ArrowLeft")
  await sleep(300)
  const c4 = await page.evaluate(state)
  expect(`going back shows no title: ${c4.card}`, !c4.card)
  console.log(bad ? `${bad} problems` : "all good", "errors:", errs.length ? errs.slice(0, 3) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
