// Random drags on the polygon lesson, then read what the student sees.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/angles-in-polygons"
const sleep = ms => new Promise(r => setTimeout(r, ms))
let seed = 11
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  const open = async n => {
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(1500)
  }
  const scene = () => page.evaluate(() => { const S = window.__beatScene; return { P: S.P, D: S.D } })
  const nums = () => page.evaluate(() =>
    [...document.querySelectorAll("[class*=label]")].map(e => e.textContent.replace(/[^0-9]/g, "")).filter(Boolean).map(Number))
  const convex = () => page.evaluate(() => {
    const P = window.__beatScene.P; const n = P.length; let sign = 0
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], c = P[(i + 2) % n]
      const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
      const s = Math.sign(cr); if (!s) return false
      if (!sign) sign = s; else if (s !== sign) return false
    }
    return true
  })
  const drag = async (a, b) => {
    await page.mouse.move(a[0], a[1]); await page.mouse.down()
    for (let i = 1; i <= 12; i++) await page.mouse.move(a[0] + (b[0] - a[0]) * i / 12, a[1] + (b[1] - a[1]) * i / 12)
    await page.mouse.up()
  }
  let fails = 0, checks = 0
  const fail = m => { fails++; if (fails < 20) console.log("FAIL", m) }

  // 1. four corners, free: shown angles add to 360, shape stays convex
  await open(6)
  for (let t = 0; t < 100; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 4)
    await drag(s.D[i], [150 + rnd() * 980, 170 + rnd() * 520])
    await sleep(40)
    const v = (await nums()).slice(0, 4)
    checks++
    if (v.reduce((a, b) => a + b, 0) !== 360) fail(`quad: ${v}`)
    if (!(await convex())) fail("quad: not convex")
  }
  console.log("four corners: done")

  // 2. pentagon with the turns: exterior values add to 360
  await open(53)
  for (let t = 0; t < 60; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 5)
    await drag(s.D[i], [s.D[i][0] + (rnd() - 0.5) * 300, s.D[i][1] + (rnd() - 0.5) * 300])
    await sleep(40)
    const v = (await nums()).slice(0, 5)
    checks++
    if (v.reduce((a, b) => a + b, 0) !== 360) fail(`turns: ${v}`)
    if (!(await convex())) fail("pentagon: not convex")
  }
  console.log("turns: done")

  // 3. regular hexagon turned and resized: every angle stays 120
  await open(39)
  for (let t = 0; t < 40; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 6)
    await drag(s.D[i], [300 + rnd() * 680, 200 + rnd() * 420])
    await sleep(40)
    const v = (await nums()).slice(0, 6)
    checks++
    if (v.some(x => x !== 120)) fail(`regular: ${v}`)
  }
  console.log("regular: done")

  // 4. sum line terms match the corners
  await open(9)
  for (let t = 0; t < 25; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 4)
    await drag(s.D[i], [s.D[i][0] + (rnd() - 0.5) * 260, s.D[i][1] + (rnd() - 0.5) * 260])
    await sleep(700)
    const v = await nums()
    const corners = v.slice(0, 4), terms = v.slice(4, 8)
    checks++
    if (corners.reduce((a, b) => a + b, 0) !== 360) fail(`sum beat corners: ${corners}`)
    if (terms.join() !== corners.join()) fail(`terms ${terms} vs corners ${corners}`)
  }
  console.log("sum line: done")
  console.log(`\n${checks} checks, ${fails} failures, page errors: ${errs.length}`)
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
