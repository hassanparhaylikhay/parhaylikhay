// "Show me how" on every question that has it: three wrong answers bring
// the button; each step changes the phrase and shows its picture; at the
// end the keypad comes back and the right answer moves the lesson on.
// One question also waits out the 30 seconds with no answer at all.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const BASE = process.env.BASE || `${HOST}/learn/${process.env.LESSON || "angles"}`
const OUT = outDir("walk")
fs.mkdirSync(OUT, { recursive: true })
const W = +(process.env.W || 1280), H = +(process.env.H || 800)
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H })
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  const bad = []
  const phrase = () => page.evaluate(() => { const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)); return els.length ? els[els.length - 1].textContent : null })
  const btn = () => page.evaluate(() => { const b = document.querySelector("[class*=ctaWrap] button"); return b ? b.textContent.trim() : null })
  const click = async () => { const el = await page.$("[class*=ctaWrap] button"); const b = await el.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2) }
  const waitBtn = async (want, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { const b = await btn(); if (b !== null && (want === undefined || b === want)) return true; await sleep(100) } return false }
  const type = async str => { for (const ch of str) { await page.keyboard.press(ch); await sleep(50) } await page.keyboard.press("Enter"); await sleep(500) }
  const open = async n => {
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0 && window.__beatApi)
    await sleep(1200)
  }
  await open(1)
  const beats = await page.evaluate(() => window.__beatApi.beats)
  const qs = beats.map((b, i) => ({ ...b, n: i + 1 })).filter(b => b.walk > 0)
  console.log(`${qs.length} questions with a walkthrough`)
  let first = true
  for (const q of qs) {
    await open(q.n)
    const answer = await page.evaluate(() => window.__beatScene.input && window.__beatScene.input.answer)
    // what answers it, when that is a calculation rather than the answer's digits
    const typed = await page.evaluate(() => window.__beatScene.input && window.__beatScene.input.typed)
    if (answer == null) { bad.push(`${q.id}: no input`); continue }
    if (first) {
      // nothing typed at all: the button comes by itself after 30 seconds
      first = false
      const early = await btn()
      if (early !== null) bad.push(`${q.id}: a button before 30s (${early})`)
      if (!(await waitBtn("Show me how", 33000))) bad.push(`${q.id}: no "Show me how" after 30s`)
    } else {
      for (const k of [1, 2, 3]) await type(String(answer + k))
      if (!(await waitBtn("Show me how", 3000))) { bad.push(`${q.id}: no "Show me how" after 3 wrong answers`); continue }
    }
    const asked = await phrase()
    await click(); await sleep(300)
    const seen = [asked]
    for (let k = 0; k < q.walk; k++) {
      const p = await phrase()
      if (seen.includes(p)) bad.push(`${q.id}: step ${k + 1} did not change the phrase ("${p}")`)
      seen.push(p)
      const keypad = await page.$('button[aria-label="Check"]')
      if (keypad) bad.push(`${q.id}: keypad showing during step ${k + 1}`)
      await sleep(900)
      await page.screenshot({ path: `${OUT}/${String(q.n).padStart(3, "0")}-${q.id}-${k + 1}.png` })
      if (!(await waitBtn("", 4000))) { bad.push(`${q.id}: no arrow on step ${k + 1}`); break }
      await click(); await sleep(250)
    }
    await sleep(700)
    const endP = await phrase()
    if (endP !== "Now you type it in.") bad.push(`${q.id}: end phrase "${endP}"`)
    const keypad = await page.$('button[aria-label="Check"]')
    if (!keypad) bad.push(`${q.id}: no keypad after the walkthrough`)
    await type(typed || String(answer))
    const st = await page.evaluate(() => window.__beatScene.input && window.__beatScene.input.state)
    if (st !== "right" && st !== "guessed") bad.push(`${q.id}: answer not taken (${st})`)
    const t = Date.now(); let moved = false
    while (Date.now() - t < 9000) { const p = await phrase(); if (p !== endP) { moved = true; break } await sleep(100) }
    if (!moved) bad.push(`${q.id}: did not move on after the right answer`)
  }
  console.log(`problems: ${bad.length ? "\n  " + bad.join("\n  ") : "none"}`)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
