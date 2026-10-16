// Which side of the line the right-angle mark sits on, frame by frame, while T slides and the line tilts.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/circle-theorems-2"
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  const open = async id => {
    await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" }); await page.waitForFunction(() => window.__beatApi)
    const n = await page.evaluate(id => window.__beatApi.beats.findIndex(b => b.id === id) + 1, id)
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" }); await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0); await sleep(1400)
  }
  const side = () => page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi; const a = A.angleList(S, A.layout(S)).find(x => x.id === "rt"); return a ? Math.sign(a.sweep) : 0 })
  const flips = s => s.slice(1).filter((x, i) => x !== s[i]).length
  for (const id of ["ride-T", "tangent-rule", "tilt"]) {
    await open(id)
    const s = []
    if (id === "ride-T") {
      const g = await page.evaluate(() => { const S = window.__beatScene; return { O: S.OD, R: S.RD, a: S.ptsD.T } })
      await page.mouse.move(g.O[0] + Math.cos(g.a) * g.R, g.O[1] + Math.sin(g.a) * g.R); await page.mouse.down()
      for (let k = 1; k <= 80; k++) { const t = g.a - k * 0.03; await page.mouse.move(g.O[0] + Math.cos(t) * g.R, g.O[1] + Math.sin(t) * g.R); await sleep(20); s.push(await side()) }
      await page.mouse.up()
      for (let k = 0; k < 30; k++) { s.push(await side()); await sleep(20) }
    } else for (let k = 0; k < 60; k++) { s.push(await side()); await sleep(25) }
    console.log(`${id}: ${flips(s)} side changes over ${s.length} frames`)
  }
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
