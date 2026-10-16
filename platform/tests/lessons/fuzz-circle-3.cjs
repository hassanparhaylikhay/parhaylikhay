// Random drags on Circle theorems III at random screen sizes. After every
// drag: midpoints are midpoints, right angles are right, linked chords keep
// their length, lengths agree with Pythagoras, labels stay on screen.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/circle-theorems-3"
const ROUNDS = +(process.env.ROUNDS || 3)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 7)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const IDS = ["move-AB", "fold-play", "slide-X", "move-chords", "slide-OX", "shortest", "longer", "longest", "short", "same-length", "slide-round", "turn-onto", "make-8", "make-4", "make-impossible", "end"]

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
      const out = []
      const P = n => A.posOf(S, n, false)
      const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])
      for (const [m, a, b] of [["M", "A", "B"], ["N", "C", "D"], ["X", "A", "B"]]) {
        if (!S.at[m] || !S.showPts.includes(m)) continue
        if (m === "X") { const t = S.slider.t; if (t < 0.05 || t > 0.95) out.push("X off the chord " + t); continue }
        if (Math.abs(d(P(m), P(a)) - d(P(m), P(b))) > 0.01) out.push(`${m} not the middle`)
        const u = [P(a)[0] - P(m)[0], P(a)[1] - P(m)[1]], v = [S.O[0] - P(m)[0], S.O[1] - P(m)[1]]
        const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1)
        if (Math.hypot(...v) > 2 && Math.abs(cos) > 1e-6) out.push(`O${m} not at 90 (cos ${cos.toExponential(1)})`)
      }
      for (const [x, y] of [["A", "B"], ["C", "D"]]) {
        if (S.pts[x] === undefined || S.pts[y] === undefined || !S.showPts.includes(x)) continue
        const len = A.chordCm(S, x, y), dc = A.distCm(S, x, y)
        if (Math.abs((len / 2) ** 2 + dc ** 2 - 25) > 1e-6) out.push(`pythagoras ${x}${y}`)
      }
      if (S.linked.C && Math.abs(A.chordCm(S, "A", "B") - A.chordCm(S, "C", "D")) > 1e-6) out.push("linked chord changed length")
      if (S.slider && S.slider.t === 0.5) { const v = A.angleList(S, L).find(a => a.id === "X"); if (v && v.value !== 90) out.push("X in the middle but angle " + v.value) }
      for (const el of document.querySelectorAll("[class*=label]")) {
        const b = el.getBoundingClientRect()
        if (b.width && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + el.textContent)
      }
      if (/NaN|undefined/.test(document.body.innerText)) out.push("NaN on screen")
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
          if (!m) return null
          return { name: m, slider: !!(S.slider && S.slider.name === m), O: S.OD, R: S.RD, p: A.posOf(S, m), a: S.ptsD[m], A: S.slider ? A.posOf(S, S.slider.a) : null, B: S.slider ? A.posOf(S, S.slider.b) : null }
        })
        if (!g) break
        const pts = []
        if (g.slider) {
          const t1 = 0.05 + rnd() * 0.9
          const to = [g.A[0] + (g.B[0] - g.A[0]) * t1, g.A[1] + (g.B[1] - g.A[1]) * t1]
          for (let s = 0; s <= 24; s++) pts.push([g.p[0] + (to[0] - g.p[0]) * s / 24, g.p[1] + (to[1] - g.p[1]) * s / 24])
        } else {
          const by = (rnd() - 0.5) * 2 * Math.PI * 0.6
          for (let s = 0; s <= 30; s++) { const t = g.a + by * s / 30; pts.push([g.O[0] + Math.cos(t) * g.R, g.O[1] + Math.sin(t) * g.R]) }
        }
        await page.mouse.move(...pts[0]); await page.mouse.down()
        for (const p of pts.slice(1)) { await page.mouse.move(...p); await sleep(8) }
        await page.mouse.up()
        await sleep(650)
        await check(IDS[i], `drag ${g.name} ${W}x${H}`)
      }
    }
  }
  console.log(`${checks} checks, ${bad.length} problems`)
  for (const b of [...new Set(bad)].slice(0, 30)) console.log("  ", b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
