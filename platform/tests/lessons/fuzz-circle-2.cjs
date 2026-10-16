// Random drags on Circle theorems II at random screen sizes: points on the
// circle, D pulled off and back, the line slid and tilted, P outside.
// After every drag the numbers on screen must obey the theorems.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/circle-theorems-2"
const ROUNDS = +(process.env.ROUNDS || 3)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 5)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const IDS = ["move-quad", "still-180", "pull-D", "D-back", "why-play", "slide-on", "just-touch", "ride-T", "tilt", "move-P", "move-C", "move-A", "slide-C", "make-both", "end"]

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
      const L = A.layout(S)
      const list = A.angleList(S, L)
      const v = Object.fromEntries(list.map(a => [a.id, a.value]))
      const out = []
      const quad = ["A", "B", "C", "D"].every(n => v[n] !== undefined) && S.angles.some(a => a.id === "A" && a.from === "D")
      if (quad) {
        if (!S.free.D) { if (v.A + v.C !== 180 || v.B + v.D !== 180) out.push(`quad ${v.A},${v.B},${v.C},${v.D}`) }
        else if (v.A + v.B + v.C + v.D !== 360) out.push(`off-circle quad sums ${v.A + v.B + v.C + v.D}`)
      }
      if (v.cA !== undefined && v.cC !== undefined && v.cA + v.cC !== 360) out.push(`centre angles ${v.cA}+${v.cC}`)
      if (v.rt !== undefined && S.tline) { const want = Math.round(90 - Math.abs(S.tline.tilt) * 180 / Math.PI); if (v.rt !== want) out.push(`radius-line ${v.rt} want ${want}`) }
      if (v.tc !== undefined && v.C !== undefined && S.angles.some(a => a.id === "C" && a.at === "C" && a.from === "T") && v.tc !== v.C) out.push(`alternate segment tc ${v.tc} C ${v.C}`)
      const cm = [...document.querySelectorAll("[class*=label]")].map(e => e.textContent).filter(x => /cm/.test(x))
      if (cm.length === 2 && cm[0] !== cm[1]) out.push(`tangent lengths ${cm.join(" vs ")}`)
      const t = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d }
      const on = S.showPts.filter(n => !S.derived[n] && !S.free[n] && S.pts[n] !== undefined)
      for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) if (Math.abs(t(S.pts[on[i]], S.pts[on[j]])) < 2 * Math.PI / 180) out.push(`${on[i]} on ${on[j]}`)
      for (const a of list) {
        if (!Number.isFinite(a.value)) out.push("bad value " + a.id)
        if ((S.show === "all" || S.show.has(a.id)) && (a.label[0] < -5 || a.label[0] > S.w + 5 || a.label[1] < 0 || a.label[1] > S.h)) out.push(`label ${a.id} off screen`)
      }
      for (const n of S.showPts) { const p = A.posOf(S, n); if (p[0] < 0 || p[0] > S.w || p[1] < 60 || p[1] > S.h) out.push(`${n} off screen`) }
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
          const opts = [...S.movable]
          if (S.tlineMode !== "none" && !S.locked) opts.push("@line")
          const m = opts[Math.floor(Math.random() * opts.length)]
          if (!m) return null
          if (m === "@line") {
            const n = [Math.cos(S.tline.t), Math.sin(S.tline.t)]
            const F = [S.OD[0] + n[0] * S.tline.d * S.RD, S.OD[1] + n[1] * S.tline.d * S.RD]
            const u = [Math.cos(S.tline.t + Math.PI / 2 + S.tline.tilt), Math.sin(S.tline.t + Math.PI / 2 + S.tline.tilt)]
            const h = S.tlineMode === "tilt" ? [F[0] + u[0] * S.RD * 0.85, F[1] + u[1] * S.RD * 0.85] : F
            return { kind: S.tlineMode, h, F, n, R: S.RD }
          }
          return { kind: S.free[m] || S.offOK.has(m) ? "free" : "circle", name: m, O: S.OD, R: S.RD, p: A.posOf(S, m), a: S.ptsD[m] }
        })
        if (!g) break
        const pts = []
        if (g.kind === "circle") {
          const by = (rnd() - 0.5) * 2 * Math.PI * 0.7
          for (let s = 0; s <= 30; s++) { const t = g.a + by * s / 30; pts.push([g.O[0] + Math.cos(t) * g.R, g.O[1] + Math.sin(t) * g.R]) }
        } else if (g.kind === "free") {
          const to = [g.p[0] + (rnd() - 0.5) * g.R * 1.2, g.p[1] + (rnd() - 0.5) * g.R * 1.2]
          for (let s = 0; s <= 24; s++) pts.push([g.p[0] + (to[0] - g.p[0]) * s / 24, g.p[1] + (to[1] - g.p[1]) * s / 24])
        } else if (g.kind === "slide") {
          const dd = (rnd() - 0.5) * g.R * 1.2
          for (let s = 0; s <= 24; s++) pts.push([g.h[0] + g.n[0] * dd * s / 24, g.h[1] + g.n[1] * dd * s / 24])
        } else {
          const a0 = Math.atan2(g.h[1] - g.F[1], g.h[0] - g.F[0]), by = (rnd() - 0.5) * 1.2
          for (let s = 0; s <= 24; s++) { const t = a0 + by * s / 24; pts.push([g.F[0] + Math.cos(t) * g.R * 0.85, g.F[1] + Math.sin(t) * g.R * 0.85]) }
        }
        await page.mouse.move(...pts[0]); await page.mouse.down()
        for (const p of pts.slice(1)) { await page.mouse.move(...p); await sleep(8) }
        await page.mouse.up()
        await sleep(650)
        await check(IDS[i], `drag ${g.name ?? g.kind} ${W}x${H}`)
      }
    }
  }
  console.log(`${checks} checks, ${bad.length} problems`)
  for (const b of [...new Set(bad)].slice(0, 30)) console.log("  ", b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
