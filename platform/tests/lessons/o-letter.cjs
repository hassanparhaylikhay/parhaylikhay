// Where the letter O sits, frame by frame: while A is dragged round, and on
// still question figures. It may move when a line comes through it, but it
// must never flick back and forth.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/circle-theorems-1"
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: +(process.env.W || 1280), height: +(process.env.H || 800) })
  const oDir = () => page.evaluate(() => {
    const S = window.__beatScene
    const el = [...document.querySelectorAll("[class*=label]")].find(e => e.textContent === "O")
    if (!el) return null
    const r = el.getBoundingClientRect()
    return Math.atan2(r.y + r.height / 2 - S.OD[1], r.x + r.width / 2 - S.OD[0]) * 180 / Math.PI
  })
  const flips = arr => { let n = 0; for (let i = 2; i < arr.length; i++) { const a = arr[i - 2], b = arr[i - 1], c = arr[i]; if (a == null || b == null || c == null) continue; const d1 = Math.abs(((b - a) % 360 + 540) % 360 - 180), d2 = Math.abs(((c - a) % 360 + 540) % 360 - 180); if (d1 > 40 && d2 < 15) n++ } return n }
  const moves = arr => { let n = 0; for (let i = 1; i < arr.length; i++) { if (arr[i] == null || arr[i - 1] == null) continue; if (Math.abs(((arr[i] - arr[i - 1]) % 360 + 540) % 360 - 180) > 40) n++ } return n }
  const report = []
  const open = async id => {
    await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatApi)
    const n = await page.evaluate(id => window.__beatApi.beats.findIndex(b => b.id === id) + 1, id)
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
    await sleep(1500)
  }
  // A dragged round, B following opposite it
  await open("move-A")
  const g = await page.evaluate(() => { const S = window.__beatScene; return { O: S.OD, R: S.RD, a: S.ptsD.A } })
  const samples = []
  await page.mouse.move(g.O[0] + Math.cos(g.a) * g.R, g.O[1] + Math.sin(g.a) * g.R); await page.mouse.down()
  for (let k = 1; k <= 120; k++) {
    const t = g.a + (k <= 60 ? k : 120 - k) * 0.012
    await page.mouse.move(g.O[0] + Math.cos(t) * g.R, g.O[1] + Math.sin(t) * g.R)
    await sleep(25)
    samples.push(await oDir())
  }
  await page.mouse.up()
  report.push(`move-A: ${moves(samples)} moves, ${flips(samples)} flicks over ${samples.length} frames`)
  // still figures
  for (const id of ["semi-q", "seg-q", "centre-q1", "centre-q2", "use-semi", "use-bowtie", "use-reflex", "use-OAB", "use-exam", "straight", "share", "proof-play", "fill"]) {
    await open(id)
    const s = []
    for (let k = 0; k < 40; k++) { s.push(await oDir()); await sleep(40) }
    report.push(`${id}: ${moves(s)} moves, ${flips(s)} flicks`)
  }
  console.log(report.join("\n"))
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
