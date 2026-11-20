// Open every beat of one lesson cold: no page errors, no KaTeX errors,
// no NaN/undefined on screen, a phrase on screen, no title card, and
// something drawn on the board (never a blank board under a phrase).
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
      // the board: shapes drawn in the stage's SVG that can be seen (not in defs, not faded out, not a speck)
      const drawn = [...document.querySelectorAll("svg[class*=svg] :is(line, polygon, path, circle, ellipse, polyline, rect)")].filter(el => {
        if (el.closest("defs")) return false
        const b = el.getBoundingClientRect()
        if (b.width < 6 && b.height < 6) return false
        let op = 1
        for (let e = el; e && e.tagName.toLowerCase() !== "body"; e = e.parentElement) {
          const o = e.getAttribute("opacity") ?? e.style.opacity
          if (o !== null && o !== "") op *= +o
        }
        return op > 0.15
      }).length
      // anything else on the board: a working line, labels, a keypad, a card or display of the lesson's own
      // (any visible text below the phrase that is not the phrase, a note, a button or the words to pick from)
      const shown = el => { let op = 1; for (let e = el; e && e.tagName.toLowerCase() !== "body"; e = e.parentElement) { const o = e.style.opacity; if (o !== "") op *= +o } return op > 0.15 && el.textContent.trim() }
      const phraseBottom = Math.max(0, ...[...document.querySelectorAll("[class*=phrase]")].map(e => e.getBoundingClientRect().bottom))
      const own = [...document.querySelectorAll("body *")].filter(el => !el.children.length && el.textContent.trim() && !el.closest("[class*=phrase], [class*=note], [class*=ctaWrap], [class*=choices], button, svg, script, style"))
        .some(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left < innerWidth && r.right > 0 && r.top > phraseBottom && r.bottom < innerHeight && getComputedStyle(el).visibility !== "hidden" && shown(el) })
      const other = own || [...document.querySelectorAll(".pl-eq-atom, [data-k]")].some(shown) || !!document.querySelector("[class*=keypad] button")
      // a beat to look at (an arrow) or to answer by picking a word must have something on the board;
      // a beat where the student draws the first shape may open on an empty board
      const b = window.__beatApi.beats[window.__beatIdx ?? 0]
      const looking = (b.cta !== undefined && !b.done) || !!document.querySelector("[class*=choices] button")
      return { phrase, nan: /NaN|undefined|Infinity/.test(document.body.innerText), katex: !!document.querySelector(".katex-error"), card: !!document.querySelector("[class*=cardInner]"), star: /\*/.test(phrase || ""), blank: looking && drawn === 0 && !other }
    })
    if (!st.phrase || st.nan || st.katex || st.card || st.star || st.blank || errs.length > before) bad.push(`${n} ${JSON.stringify(st)} ${errs.slice(before).join(" | ")}`)
  }
  console.log(`${N} beats; problems:`, bad.length ? bad : "none")
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 8) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
