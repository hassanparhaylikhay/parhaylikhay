// Random drags on the Pythagoras board at random screen sizes. After every
// drag: the right angle still holds where it should, the sum line agrees
// with the squares, corners stay on whole units, labels stay on screen.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/pythagoras"
const ROUNDS = +(process.env.ROUNDS || 3)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 3)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const IDS = ["pull", "move", "thin", "move-areas", "set-34", "again", "unlock", "bigger", "smaller", "make-5", "make-13", "make-234", "end"]
;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let checks = 0
  const bad = []
  const check = async (id, what) => {
    const r = await page.evaluate(() => {
      const S = window.__beatScene, A = window.__beatApi
      const out = []
      for (const n of S.showPts) { const p = S.pts[n]; if (S.movable.includes(n) && (p[0] !== Math.round(p[0]) || p[1] !== Math.round(p[1]))) out.push(`${n} off the grid`) }
      if (S.pts.C && S.pts.A && S.pts.B && S.showPts.includes("C") && S.angles.some(a => a.mark && a.at === "C")) {
        const ca = [S.pts.A[0] - S.pts.C[0], S.pts.A[1] - S.pts.C[1]], cb = [S.pts.B[0] - S.pts.C[0], S.pts.B[1] - S.pts.C[1]]
        if (ca[0] * cb[0] + ca[1] * cb[1] !== 0) out.push("right angle lost")
        const a = A.sq2(S, "C", "A"), b = A.sq2(S, "C", "B"), c = A.sq2(S, "A", "B")
        if (a + b !== c) out.push(`pythagoras ${a}+${b}!=${c}`)
      }
      if (S.sumVals && S.vis.sum.t > 0.5) {
        const [a, b, c] = S.sumVals(S)
        // the operator turns pink (and becomes ≠) when the two sides differ
        const ne = [...document.querySelectorAll("[class*=label]")].some(e => /=|≠/.test(e.textContent) && e.textContent.length <= 3 && getComputedStyle(e).color === "rgb(255, 70, 112)")
        if ((a + b !== c) !== ne) out.push(`sum line says ${ne ? "≠" : "="} for ${a}+${b} vs ${c}`)
      }
      for (const el of document.querySelectorAll("[class*=label]")) {
        const b = el.getBoundingClientRect()
        if (b.width && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + el.textContent)
      }
      if (/NaN|undefined|Infinity/.test(document.body.innerText)) out.push("NaN on screen")
      return out
    })
    checks++
    for (const m of r) bad.push(`${id} ${what}: ${m}`)
  }
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const nums = await page.evaluate(ids => ids.map(id => window.__beatApi.beats.findIndex(b => b.id === id) + 1), IDS)
  for (let round = 0; round < ROUNDS; round++) {
    for (let i = 0; i < IDS.length; i++) {
      const [W, H] = SIZES[Math.floor(rnd() * SIZES.length)]
      await page.setViewport({ width: W, height: H })
      await page.goto(`${BASE}?debug&beat=${nums[i]}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0 && window.__beatApi)
      await sleep(1300)
      await check(IDS[i], `open ${W}x${H}`)
      for (let k = 0; k < 5; k++) {
        const g = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          const m = S.movable[Math.floor(Math.random() * S.movable.length)]
          return m ? { p: A.posOf(S, m), u: S.viewD.u } : null
        })
        if (!g) break
        const to = [g.p[0] + (rnd() - 0.5) * g.u * 8, g.p[1] + (rnd() - 0.5) * g.u * 8]
        await page.mouse.move(...g.p); await page.mouse.down()
        for (let s = 1; s <= 20; s++) { await page.mouse.move(g.p[0] + (to[0] - g.p[0]) * s / 20, g.p[1] + (to[1] - g.p[1]) * s / 20); await sleep(8) }
        await page.mouse.up()
        await sleep(900)
        await check(IDS[i], `drag ${W}x${H}`)
      }
    }
  }
  console.log(`${checks} checks, ${bad.length} problems`)
  for (const b of [...new Set(bad)].slice(0, 30)) console.log("  ", b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
