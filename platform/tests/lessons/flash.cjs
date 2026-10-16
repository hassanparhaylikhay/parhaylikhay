// Every kind of success in the Angles lesson: which lines go green?
// Typed answers, taps and word choices must light no line. Drawing or
// moving a line or ray must light that one and nothing else.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/angles"
const W = +(process.env.W || 1440), H = +(process.env.H || 900)
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H })
  let bad = 0, ran = 0
  const open = async n => {
    await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
    await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0 && window.__beatApi)
    await sleep(1400)
  }
  // which lines/rays are drawn green right now
  const green = () => page.evaluate(() => {
    const S = window.__beatScene
    const out = []
    for (const el of document.querySelectorAll('svg line[stroke="#0fee89"]')) {
      const a = [+el.getAttribute("x1"), +el.getAttribute("y1")], b = [+el.getAttribute("x2"), +el.getAttribute("y2")]
      const off = (p, l) => Math.abs((p[0] - l.p[0]) * Math.sin(l.a) - (p[1] - l.p[1]) * Math.cos(l.a))
      let name = "?"
      S.linesD.forEach((l, i) => { if (off(a, l) < 2 && off(b, l) < 2) name = "line" + i })
      S.raysD.forEach((r, i) => { if (Math.hypot(a[0] - r.from[0], a[1] - r.from[1]) < 2 && Math.abs(Math.atan2(b[1] - a[1], b[0] - a[0]) - r.a) < 0.05) name = "ray" + i })
      out.push(name)
    }
    return out
  })
  // watch the flash for a moment and collect everything that went green
  const watchFlash = async () => { const seen = new Set(); for (let k = 0; k < 8; k++) { (await green()).forEach(g => seen.add(g)); await sleep(80) } return [...seen] }
  const expectGreen = async (name, want) => {
    ran++
    const got = await watchFlash()
    const ok = JSON.stringify(got.sort()) === JSON.stringify(want.sort())
    if (!ok) bad++
    console.log(`${ok ? "ok " : "BAD"} ${name}: green ${JSON.stringify(got)}${ok ? "" : ", wanted " + JSON.stringify(want)}`)
  }
  const type = async str => { for (const ch of str) { await page.keyboard.press(ch); await sleep(40) } await page.keyboard.press("Enter") }
  const tapAngle = async id => {
    const p = await page.evaluate(id => {
      const S = window.__beatScene, A = window.__beatApi
      const a = A.angleList(S, A.layout(S)).find(x => x.id === id)
      const m = a.start + a.sweep / 2
      return [a.c[0] + Math.cos(m) * a.r * 0.6, a.c[1] + Math.sin(m) * a.r * 0.6]
    }, id)
    await page.mouse.click(p[0], p[1])
  }
  const tapText = async t => {
    const p = await page.evaluate(t => { const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === t); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] }, t)
    await page.mouse.click(p[0], p[1])
  }
  const rotate = async (i, by) => {
    const g = await page.evaluate(i => { const S = window.__beatScene, A = window.__beatApi; return { h: A.lineHandle(S, A.layout(S), i), p: S.lines[i].p } }, i)
    const r = Math.hypot(g.h[0] - g.p[0], g.h[1] - g.p[1]), a0 = Math.atan2(g.h[1] - g.p[1], g.h[0] - g.p[0])
    await page.mouse.move(...g.h); await page.mouse.down()
    for (let k = 1; k <= 24; k++) { const t = a0 + by * k / 24; await page.mouse.move(g.p[0] + Math.cos(t) * r, g.p[1] + Math.sin(t) * r); await sleep(10) }
    await page.mouse.up()
  }

  // typed answers: nothing on the board lights up but the answer
  for (const [n, ans] of [[29, "180"], [32, "50"], [33, "65"], [35, "360"], [40, "75"], [41, "125"], [51, "70"], [52, "110"], [62, "2"],
    [86, "65"], [87, "65"], [88, "115"], [89, "108"], [90, "65"], [91, "68"], [92, "68"]]) {
    await open(n); await type(ans); await expectGreen(`beat ${n} typed ${ans}`, [])
  }
  // taps and word choices
  for (const [n, id] of [[45, null], [72, "B3"], [75, "B0"], [81, "B3"]]) {
    await open(n)
    if (id) await tapAngle(id); else { await tapAngle("C0"); await sleep(200); await tapAngle("C2") }
    await expectGreen(`beat ${n} tap`, [])
  }
  for (const [n, t] of [[82, "Alternate"], [83, "Co-interior"], [84, "Corresponding"]]) { await open(n); await tapText(t); await expectGreen(`beat ${n} choice ${t}`, []) }
  // drawing and moving: only that line or ray
  await open(26)
  {
    const f = await page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi, L = A.layout(S), l = S.lines[0]; const x = L.centre[0]; return [x, l.p[1] + Math.tan(l.a) * (x - l.p[0])] })
    await page.mouse.move(f[0], f[1]); await page.mouse.down(); for (let k = 1; k <= 16; k++) { await page.mouse.move(f[0] + 4 * k, f[1] - 11 * k); await sleep(10) } await page.mouse.up()
    await expectGreen("beat 26 draw a line from a point", ["ray0"])
  }
  await open(28)
  {
    const r = await page.evaluate(() => { const S = window.__beatScene; return S.rays[0] })
    await page.mouse.move(r.from[0] + Math.cos(r.a) * r.len, r.from[1] + Math.sin(r.a) * r.len); await page.mouse.down()
    for (let k = 1; k <= 40; k++) { const t = r.a + (k <= 20 ? k : 40 - k) * 0.04; await page.mouse.move(r.from[0] + Math.cos(t) * r.len, r.from[1] + Math.sin(t) * r.len); await sleep(10) }
    await page.mouse.up(); await sleep(150)
    await expectGreen("beat 28 move the new line", ["ray0"])
  }
  await open(61); await rotate(2, 0.5); await sleep(300); await rotate(2, -0.5); await sleep(150); await expectGreen("beat 61 turn the crossing line", ["line2"])
  await open(67); await rotate(1, 0.15); await sleep(150); await expectGreen("beat 67 tilt a parallel line", ["line1"])
  await open(93)
  {
    const by = await page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi; const h = A.lineHandle(S, A.layout(S), 2), p = S.lines[2].p
      const ha = Math.atan2(h[1] - p[1], h[0] - p[0]); let r = ((S.lines[0].a % Math.PI) + Math.PI) % Math.PI; if (r > Math.PI / 2) r -= Math.PI
      let best = 9; for (const t of [r + 70 * Math.PI / 180, r - 70 * Math.PI / 180]) { let d = Math.atan2(Math.sin(t - ha), Math.cos(t - ha)); if (d > Math.PI / 2) d -= Math.PI; if (d < -Math.PI / 2) d += Math.PI; if (Math.abs(d) < Math.abs(best)) best = d } return best })
    await rotate(2, by); await sleep(150); await expectGreen("beat 93 make them 70 and 110", ["line2"])
  }
  console.log(`${ran} checks, ${bad} wrong`)
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
