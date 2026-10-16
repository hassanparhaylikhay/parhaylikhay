// Random drags, then read what the student actually sees. Every check is on
// the DOM labels, not on the maths underneath.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/angles-in-a-triangle"
const sleep = ms => new Promise(r => setTimeout(r, ms))
let seed = 7
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
  const scene = () => page.evaluate(() => { const S = window.__beatScene; return { P: S.P, D: S.D, apex: S.apex, snapped: S.snapped, locked: S.locked, tri: null } })
  // value labels are the first three .label nodes on these beats
  const shown = () => page.evaluate(() =>
    [...document.querySelectorAll("[class*=label]")].map(e => e.textContent.replace(/[^0-9]/g, "")).filter(Boolean).map(Number))
  const exact = () => page.evaluate(() => {
    const S = window.__beatScene, P = S.P
    const ang = i => { const a = P[i], b = P[(i + 1) % 3], c = P[(i + 2) % 3]; const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - a[0], c[1] - a[1]]; return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * 180 / Math.PI }
    return [0, 1, 2].map(ang)
  })
  const drag = async (a, b) => {
    await page.mouse.move(a[0], a[1]); await page.mouse.down()
    for (let i = 1; i <= 10; i++) await page.mouse.move(a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10)
    await page.mouse.up()
  }

  let fails = 0, checks = 0, smoothFails = 0
  const fail = m => { fails++; if (fails < 15) console.log("FAIL", m) }

  // 1. free triangle, labels shown
  await open(8)
  for (let t = 0; t < 120; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 3)
    const to = [200 + rnd() * 880, 200 + rnd() * 450]
    const off = [s.P[i][0] - s.D[i][0], s.P[i][1] - s.D[i][1]]
    await drag(s.D[i], to)
    await sleep(40)
    const v = (await shown()).slice(0, 3)
    const after = await scene()
    checks++
    if (v.length === 3 && v[0] + v[1] + v[2] !== 180) fail(`free: shown ${v} sum ${v[0] + v[1] + v[2]}`)
    // smooth: the corner sits where the finger let go (unless that spot was refused)
    const want = [to[0] + off[0], to[1] + off[1]]
    const T = s.P.slice(); T[i] = want
    const angT = [0, 1, 2].map(n => { const a = T[n], b = T[(n + 1) % 3], c = T[(n + 2) % 3]; const u = [b[0] - a[0], b[1] - a[1]], w = [c[0] - a[0], c[1] - a[1]]; return Math.abs(Math.atan2(u[0] * w[1] - u[1] * w[0], u[0] * w[0] + u[1] * w[1])) * 180 / Math.PI })
    const areaT = Math.abs((T[1][0] - T[0][0]) * (T[2][1] - T[0][1]) - (T[1][1] - T[0][1]) * (T[2][0] - T[0][0])) / 2
    const refusable = Math.min(...angT) <= 2.6 || areaT <= 520
    const gap = Math.hypot(after.P[i][0] - want[0], after.P[i][1] - want[1])
    if (!refusable && gap > 0.6) { smoothFails++; fail(`free: corner ${gap.toFixed(1)}px from the finger (min angle there ${Math.min(...angT).toFixed(1)})`) }
  }
  console.log("free triangle: done")

  // 2. isosceles, top corner dragged up and down
  for (let round = 0; round < 3; round++) {
    await open(22)
    for (let t = 0; t < 40; t++) {
      const s = await scene()
      const ap = s.P[s.apex], j = (s.apex + 1) % 3, k = (s.apex + 2) % 3
      const m = [(s.P[j][0] + s.P[k][0]) / 2, (s.P[j][1] + s.P[k][1]) / 2]
      const f = 0.25 + rnd() * 1.4
      await drag(s.D[s.apex], [m[0] + (ap[0] - m[0]) * f + (rnd() - 0.5) * 30, m[1] + (ap[1] - m[1]) * f])
      await sleep(40)
      const v = (await shown()).slice(0, 3)
      const s2 = await scene()
      const jj = (s2.apex + 1) % 3, kk = (s2.apex + 2) % 3
      checks++
      if (v[jj] !== v[kk]) fail(`iso: base angles shown ${v[jj]} and ${v[kk]} (${v})`)
      if (v[0] + v[1] + v[2] !== 180) fail(`iso: sum ${v}`)
    }
  }
  console.log("isosceles: done")

  // 3. make two sides equal: every lock must give equal base angles
  let locks = 0
  for (let round = 0; round < 25; round++) {
    await open(18)
    const s = await scene()
    const i = Math.floor(rnd() * 3), j = (i + 1) % 3, k = (i + 2) % 3
    const m = [(s.P[j][0] + s.P[k][0]) / 2, (s.P[j][1] + s.P[k][1]) / 2]
    const d = [s.P[k][0] - s.P[j][0], s.P[k][1] - s.P[j][1]]
    const L = Math.hypot(...d), n = [-d[1] / L, d[0] / L]
    const sg = Math.sign((s.P[i][0] - m[0]) * n[0] + (s.P[i][1] - m[1]) * n[1]) || 1
    const h = 80 + rnd() * 200
    await drag(s.D[i], [m[0] + n[0] * h * sg + (rnd() - 0.5) * 20, m[1] + n[1] * h * sg + (rnd() - 0.5) * 20])
    await sleep(60)
    const s2 = await scene()
    if (!s2.locked) continue
    locks++
    // go on as a student would, to the frame where the angles appear
    const until = async pre => { for (let w = 0; w < 80; w++) { const t = await page.evaluate(() => { const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className)); return els.length ? els[els.length - 1].textContent : "" }); if (t.startsWith(pre)) return; await sleep(100) } }
    const arrow = async () => { await page.waitForSelector("[class*=ctaWrap] button", { timeout: 10000 }); await page.click("[class*=ctaWrap] button") }
    await until("These marks"); await arrow()
    await until("It is called"); await arrow()
    await until("Look at these"); await sleep(1500)
    const v = (await shown()).slice(0, 3)
    const s3 = await scene()
    const jj = (s3.apex + 1) % 3, kk = (s3.apex + 2) % 3
    checks++
    if (v[jj] !== v[kk]) fail(`iso-make then iso-angles: base angles shown ${v[jj]} and ${v[kk]} (${v})`)
    if (v[0] + v[1] + v[2] !== 180) fail(`iso-angles: sum ${v}`)
  }
  console.log(`make two sides equal: ${locks} locks checked`)

  // 4. the end beat after a few drags: sum line terms
  await open(47)
  for (let t = 0; t < 30; t++) {
    const s = await scene()
    const i = Math.floor(rnd() * 3)
    await drag(s.D[i], [250 + rnd() * 780, 220 + rnd() * 330])
    await sleep(700)
    const v = await shown()
    checks++
    // three corner labels, then the three terms, then 180
    const corners = v.slice(0, 3), terms = v.slice(3, 6)
    if (corners.reduce((a, b) => a + b, 0) !== 180) fail(`end: corners ${corners}`)
    if (terms.length === 3 && terms.join() !== corners.join()) fail(`end: terms ${terms} vs corners ${corners}`)
  }
  console.log("sum line: done")

  console.log(`\n${checks} checks, ${fails} failures (${smoothFails} not smooth), page errors: ${errs.length}`)
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
