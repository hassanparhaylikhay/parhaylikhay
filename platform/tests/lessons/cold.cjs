// Open every beat of one lesson cold: no page errors, no KaTeX errors,
// no NaN/undefined on screen, a phrase on screen, no title card.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || `${HOST}/learn/${process.env.LESSON || "angles"}`
const W = +(process.env.W || 1280), H = +(process.env.H || 800)
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H })
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()) })
  await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const N = await page.evaluate(() => window.__beatApi.beats.length)
  const bad = []
  for (let n = 1; n <= N; n++) {
    const before = errs.length
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(+(process.env.WAIT || 1500))
    const st = await page.evaluate(() => {
      const phrase = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)).pop()?.textContent
      return { phrase, nan: /NaN|undefined|Infinity/.test(document.body.innerText), katex: !!document.querySelector(".katex-error"), card: !!document.querySelector("[class*=cardInner]"), star: /\*/.test(phrase || "") }
    })
    if (!st.phrase || st.nan || st.katex || st.card || st.star || errs.length > before) bad.push(`${n} ${JSON.stringify(st)} ${errs.slice(before).join(" | ")}`)
  }
  console.log(`${N} beats; problems:`, bad.length ? bad : "none")
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 8) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
