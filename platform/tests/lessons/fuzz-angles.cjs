// Random drags on the Angles lesson's interactive beats, at random screen
// sizes. After every drag the numbers on screen must obey the rules.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const BASE = process.env.BASE || HOST + "/learn/angles"
const ROUNDS = +(process.env.ROUNDS || 6)
const sleep = ms => new Promise(r => setTimeout(r, ms))
// beat number (1-based) and what to drag there
const BEATS = [
  [9, "turn"], [28, "rays"], [34, "rays"], [39, "rays"], [44, "rot1"], [46, "rot1"],
  [57, "rot1"], [61, "rot2"], [64, "rot2"], [67, "rot1"], [70, "rot2"], [85, "rot2"], [101, "rot2"], [99, "rot1"],
]
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 7)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let checks = 0, bad = []
  const check = async (n, what) => {
    const r = await page.evaluate(() => {
      const S = window.__beatScene, A = window.__beatApi
      const L = A.layout(S)
      const list = A.angleList(S, L)
      const v = Object.fromEntries(list.map(a => [a.id, a.value]))
      const out = []
      const sum = p => list.filter(a => a.id.startsWith(p)).reduce((s, a) => s + a.value, 0)
      if (S.board === "line" && list.length) { if (sum("W") !== 180) out.push("line sum " + sum("W")) }
      if (S.board === "point" && list.length) { if (sum("P") !== 360) out.push("point sum " + sum("P")) }
      if (S.board === "cross" && list.length) {
        if (v.C0 !== v.C2 || v.C1 !== v.C3 || v.C0 + v.C1 !== 180) out.push(`cross ${v.C0},${v.C1},${v.C2},${v.C3}`)
      }
      if (S.board === "parallel" && list.length === 8) {
        const par = Math.abs(Math.sin(S.lines[0].a - S.lines[1].a)) < 1e-4
        if (v.A0 + v.A1 !== 180 || v.A0 !== v.A2 || v.B0 !== v.B2 || v.B0 + v.B1 !== 180) out.push(`crossing ${JSON.stringify(v)}`)
        if (par && (v.A0 !== v.B0 || v.A1 !== v.B1)) out.push(`parallel but A0=${v.A0} B0=${v.B0}`)
      }
      if (S.board === "turn" && (S.theta < 0 || S.theta > 360)) out.push("theta " + S.theta)
      for (const a of list) {
        if (!Number.isFinite(a.value) || !Number.isFinite(a.label[0]) || !Number.isFinite(a.label[1])) out.push("bad " + a.id)
        if (S.show === "all" || S.show.has(a.id)) {
          const inX = a.label[0] > -5 && a.label[0] < S.w + 5, inY = a.label[1] > 0 && a.label[1] < S.h
          if (!inX || !inY) out.push(`label ${a.id} off screen ${a.label.map(Math.round)}`)
        }
      }
      // lines must still cross where they should
      if (S.board === "parallel" && S.lines.length === 3) {
        const crossInside = list.every(a => a.c[0] > L.board.x0 && a.c[0] < L.board.x1 && a.c[1] > L.board.y0 && a.c[1] < L.board.y1)
        if (!crossInside) out.push("a crossing left the board")
      }
      return out
    })
    checks++
    for (const m of r) bad.push(`beat ${n} ${what}: ${m}`)
  }
  for (let round = 0; round < ROUNDS; round++) {
    for (const [n, kind] of BEATS) {
      const [W, H] = SIZES[Math.floor(rnd() * SIZES.length)]
      await page.setViewport({ width: W, height: H })
      await page.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0 && window.__beatApi)
      await sleep(1300)
      await check(n, `open ${W}x${H}`)
      for (let k = 0; k < 4; k++) {
        const g = await page.evaluate(kind => {
          const S = window.__beatScene, A = window.__beatApi, L = A.layout(S)
          if (kind === "turn") { const t = A.turnGeom(S, L); return { p: t.O, h: [t.O[0] + Math.cos(-S.thetaD * Math.PI / 180) * t.arm, t.O[1] + Math.sin(-S.thetaD * Math.PI / 180) * t.arm] } }
          if (kind === "rays") { const r = S.rays[Math.floor(Math.random() * S.rays.length)]; return { p: r.from, h: [r.from[0] + Math.cos(r.a) * r.len, r.from[1] + Math.sin(r.a) * r.len] } }
          const i = kind === "rot1" ? 1 : 2
          return { p: S.pivot || S.lines[i].p, h: A.lineHandle(S, L, i) }
        }, kind)
        const r = Math.hypot(g.h[0] - g.p[0], g.h[1] - g.p[1])
        const a0 = Math.atan2(g.h[1] - g.p[1], g.h[0] - g.p[0])
        const turnBy = (rnd() - 0.5) * (kind === "turn" ? 5 : 2.2)
        await page.mouse.move(g.h[0], g.h[1]); await page.mouse.down()
        for (let s = 1; s <= 24; s++) { const t = a0 + turnBy * s / 24; await page.mouse.move(g.p[0] + Math.cos(t) * r, g.p[1] + Math.sin(t) * r); await sleep(8) }
        await page.mouse.up()
        await sleep(700)
        await check(n, `drag ${k} ${W}x${H}`)
      }
    }
  }
  console.log(`${checks} checks, ${bad.length} problems`)
  for (const b of [...new Set(bad)].slice(0, 30)) console.log("  ", b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 5) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
