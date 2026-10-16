// Random drags on Circle theorems I at random screen sizes. After every
// drag the numbers on screen must obey the theorems.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/circle-theorems-1"
const ROUNDS = +(process.env.ROUNDS || 4)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const BEATS = null
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 11)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let checks = 0
  const bad = []
  const check = async (n, what) => {
    const r = await page.evaluate(() => {
      const S = window.__beatScene, A = window.__beatApi
      const L = A.layout(S)
      const list = A.angleList(S, L)
      const v = Object.fromEntries(list.map(a => [a.id, a.value]))
      const out = []
      const t = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d }
      const p = S.pts
      const diam = p.A !== undefined && p.B !== undefined && Math.abs(t(p.A + Math.PI, p.B)) < 1e-6
      if (v.P !== undefined && diam && S.showPts.includes("P")) { if (v.P !== 90) out.push("semicircle " + v.P) }
      if (v.P !== undefined && v.C0 !== undefined && S.angles.find(a => a.id === "C0")?.avoid === "P" && v.C0 !== 2 * v.P) out.push(`centre ${v.C0} vs P ${v.P}`)
      if (v.P !== undefined && v.Q !== undefined) {
        const same = (() => { const len = ((p.B - p.A) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); const inP = ((p.P - p.A) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) < len; const inQ = ((p.Q - p.A) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) < len; return inP === inQ })()
        if (same && v.P !== v.Q) out.push(`same segment P ${v.P} Q ${v.Q}`)
        if (!same && v.P + v.Q !== 180) out.push(`other segment P ${v.P} Q ${v.Q}`)
      }
      if (v.aP !== undefined && (v.aP !== v.aA || v.bP !== v.bB || v.gapA !== 2 * v.aP || v.gapB !== 2 * v.bP || v.third !== 180 - 2 * v.aP)) out.push("proof " + JSON.stringify(v))
      // points never sit on top of each other
      const shown = S.showPts.filter(n => !S.derived[n])
      for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
        if (Math.abs(t(p[shown[i]], p[shown[j]])) < 4 * Math.PI / 180) out.push(`${shown[i]} on ${shown[j]}`)
      }
      for (const a of list) {
        if (!Number.isFinite(a.value)) out.push("bad value " + a.id)
        if ((S.show === "all" || S.show.has(a.id)) && (a.label[0] < -5 || a.label[0] > S.w + 5 || a.label[1] < 0 || a.label[1] > S.h)) out.push(`label ${a.id} off screen`)
      }
      if (S.OD && (S.OD[0] - S.RD < 0 || S.OD[0] + S.RD > S.w || S.OD[1] - S.RD < 100)) out.push("circle off the board")
      return out
    })
    checks++
    for (const m of r) bad.push(`beat ${n} ${what}: ${m}`)
  }
  // every beat where something can be dragged, found from the lesson itself
  await page.setViewport({ width: 1280, height: 800 })
  await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const ids = ["radius-play", "move-P-90", "try-break", "semicircle", "move-A", "chord-P", "B-then-P", "move-Q", "Q-across", "move-B-both", "still-twice", "into-minor", "proof-play", "make-diameter", "make-both", "end"]
  const list = await page.evaluate(ids => ids.map(id => window.__beatApi.beats.findIndex(b => b.id === id) + 1), ids)
  for (let round = 0; round < ROUNDS; round++) {
    for (const n of list) {
      const [W, H] = SIZES[Math.floor(rnd() * SIZES.length)]
      await page.setViewport({ width: W, height: H })
      await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0 && window.__beatApi)
      await sleep(1300)
      await check(n, `open ${W}x${H}`)
      for (let k = 0; k < 5; k++) {
        const g = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          const m = S.movable[Math.floor(Math.random() * S.movable.length)]
          return m ? { name: m, O: S.OD, R: S.RD, a: S.ptsD[m] } : null
        })
        if (!g) break
        const by = (rnd() - 0.5) * 2 * Math.PI * 0.8
        const steps = 30
        await page.mouse.move(g.O[0] + Math.cos(g.a) * g.R, g.O[1] + Math.sin(g.a) * g.R); await page.mouse.down()
        for (let s = 1; s <= steps; s++) { const t = g.a + by * s / steps; await page.mouse.move(g.O[0] + Math.cos(t) * g.R, g.O[1] + Math.sin(t) * g.R); await sleep(8) }
        await page.mouse.up()
        await sleep(650)
        await check(n, `drag ${g.name} ${W}x${H}`)
      }
    }
  }
  console.log(`${checks} checks, ${bad.length} problems`)
  for (const b of [...new Set(bad)].slice(0, 30)) console.log("  ", b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
