// Random play on "The sine rule" at random screen sizes. Drags corners,
// taps angles and sides, drags labels into the rule, drops chips on the
// equation, taps its pieces, swings the side, pulls the height down, types
// on the calculator. After every move: the three angles shown add up to 180°,
// every pair shown (a side and the angle across from it, both numbers) gives
// the same side ÷ sin angle (to within their rounding), the equation is still
// true, no label or piece of the equation is off screen, the corners stay on
// the board, and nothing on screen says NaN.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const BASE = process.env.BASE || `${HOST}/learn/sine-rule`
const ROUNDS = +(process.env.ROUNDS || 2)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 7)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const IDS = [
  "open", "tap-big", "move-big", "grow", "colour-A", "tap-side-B", "turn-30", "slide-60", "double", "drag-any",
  "what-c", "x-pair", "t-pair", "ex4-pair", "drop-h", "mul-b", "div-sinB", "fill-x", "fill-pair", "x-dividing", "x-mul", "x-calc", "find-B",
  "t-fill", "t-flip", "t-mul", "t-sin", "t-undo", "t-calc", "sin30", "swing-1", "swing-2",
  "ex1-fill", "ex2-mul", "ex4-obtuse", "ex5-swing-2", "ex5-fill", "ex5-other", "end",
]
const KEYS = ["1", "2", "5", "9", ".", "*", "/", "s", "S", "a", "Backspace"]

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
      // a label that is just a number (perhaps with a unit), or null
      const num = t => (/^-?\d/.test(t || "") ? Number(/-?\d+(\.\d+)?/.exec(t)[0]) : null)
      const lab = k => S.labs.find(l => l.key === k && l.op > 0.5)
      const ang = {}, side = {}
      for (const c of ["A", "B", "C"]) { ang[c] = num(lab("ang-" + c)?.tex); side[c] = num(lab("side-" + c)?.tex) }
      const live = !S.drag && !S.swing && S.vis.tri.t > 0.5
      if (live && ["A", "B", "C"].every(c => ang[c] !== null)) {
        const sum = ang.A + ang.B + ang.C
        if (Math.abs(sum - 180) > 0.25) out.push(`angles add to ${sum}`)
      }
      // each pair's side ÷ sin angle, as a range allowing for the rounding of both
      if (live) {
        const ranges = []
        for (const c of ["A", "B", "C"]) {
          if (ang[c] === null || side[c] === null) continue
          const dp = (t => { const m = /\.(\d+)/.exec(t); return m ? m[1].length : 0 })(lab("side-" + c).tex)
          const adp = (t => { const m = /\.(\d+)/.exec(t); return m ? m[1].length : 0 })(lab("ang-" + c).tex)
          const ds = 0.5 * 10 ** -dp + 1e-9, da = 0.5 * 10 ** -adp + 1e-9
          const vals = []
          for (const s of [side[c] - ds, side[c] + ds]) for (const a of [ang[c] - da, ang[c] + da]) vals.push(s / Math.sin(a * Math.PI / 180))
          ranges.push([c, Math.min(...vals), Math.max(...vals)])
        }
        // a given value from a question (drawn to the question's numbers) is still checked: they come from the same triangle
        for (let i = 0; i < ranges.length; i++) for (let j = i + 1; j < ranges.length; j++) {
          const [p, a0, a1] = ranges[i], [q, b0, b1] = ranges[j]
          if (a1 < b0 * 0.999 || b1 < a0 * 0.999) out.push(`pairs ${p} and ${q} disagree: ${side[p]}/sin ${ang[p]} vs ${side[q]}/sin ${ang[q]}`)
        }
      }
      // the equation is still true
      if (S.alg && S.mode === "solve") {
        const v = s => s.num.reduce((p, f) => p * f.v, 1) / s.den.reduce((p, f) => p * f.v, 1)
        const l = v(S.alg.L), q = v(S.alg.R)
        if (Math.abs(l - q) > 1e-6 * Math.max(1, Math.abs(l))) out.push(`equation not balanced ${l} vs ${q}`)
      }
      // nothing off screen
      for (const el of document.querySelectorAll("[class*=label]")) {
        const b = el.getBoundingClientRect()
        if (b.width && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + el.textContent)
      }
      for (const [k, d] of Object.entries(S.eq.atoms)) if (d.op > 0.6 && (d.x < -3 || d.x + d.w > S.w + 3)) out.push("equation off screen: " + k)
      // the corners on the board
      if (S.vis.tri.t > 0.5 && !S.drag) {
        for (const c of ["A", "B", "C"]) {
          const p = A.ptS(S, c)
          if (p[0] < -6 || p[0] > S.w + 6 || p[1] < -6 || p[1] > S.h + 6) out.push(`corner ${c} off the board`)
        }
      }
      if (/NaN|undefined|Infinity/.test(document.body.innerText)) out.push("NaN on screen")
      if (document.querySelector(".katex-error")) out.push("KaTeX error")
      return out
    })
    checks++
    if (r.length) bad.push(`${id} ${what}: ${[...new Set(r)].join("; ")}`)
  }
  const press = async (p, touch) => { if (touch) await page.touchscreen.touchStart(p[0], p[1]); else { await page.mouse.move(p[0], p[1]); await page.mouse.down() } }
  const move = async (p, touch) => { if (touch) await page.touchscreen.touchMove(p[0], p[1]); else await page.mouse.move(p[0], p[1]) }
  const up = async touch => { if (touch) await page.touchscreen.touchEnd(); else await page.mouse.up() }
  const drag = async (a, b, touch) => {
    await press(a, touch)
    for (let i = 1; i <= 12; i++) { await move([a[0] + (b[0] - a[0]) * i / 12, a[1] + (b[1] - a[1]) * i / 12], touch); await sleep(12) }
    await up(touch)
  }
  const tap = async (p, touch) => { if (touch) await page.touchscreen.tap(p[0], p[1]); else await page.mouse.click(p[0], p[1]) }

  await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  for (let round = 0; round < ROUNDS; round++) {
    for (const id of IDS) {
      const [w, h] = SIZES[Math.floor(rnd() * SIZES.length)]
      const touch = w < 500
      await page.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch })
      const k = beats.indexOf(id)
      if (k < 0) { bad.push(`no beat ${id}`); continue }
      await page.goto(`${BASE}?debug&beat=${k + 1}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
      await sleep(1500)
      await check(id, `open ${w}x${h}`)
      for (let m = 0; m < 6; m++) {
        const st = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          const L = A.layout(S)
          const corners = ["A", "B", "C"].map(c => A.ptS(S, c))
          return {
            mode: S.mode, w: S.w, h: S.h, input: !!S.input && S.vis.keypad.t > 0.5,
            corners, angs: ["A", "B", "C"].map(c => A.angAt(S, c)), sides: ["A", "B", "C"].map(c => A.sideAt(S, c)),
            chips: A.chipRects(S, L).map(c => [(c.r.x0 + c.r.x1) / 2, (c.r.y0 + c.r.y1) / 2]),
            atoms: Object.keys(S.eq.atoms).map(i => A.atomAt(S, i)).filter(Boolean),
            eq: A.atomAt(S, "eq"),
            swing: S.swing ? A.swingEnd(S) : null,
            labels: S.fill ? Object.keys(S.fill.items).map(k => A.labAt(S, k)).filter(Boolean) : [],
            slots: S.fill ? ["sL", "aL", "sR", "aR"].map(s => A.atomAt(S, s)).filter(Boolean) : [],
            foot: S.mode === "drop" ? A.footAt(S) : null,
            choices: !!document.querySelector("[class*=choices] button"),
          }
        })
        const R = () => [st.w * (0.1 + 0.8 * rnd()), st.h * (0.15 + 0.7 * rnd())]
        const any = a => a[Math.floor(rnd() * a.length)]
        if (st.input) {
          for (let t = 0; t < 5; t++) await page.keyboard.press(any(KEYS))
          await page.keyboard.press("Enter")
        } else if (st.choices && rnd() < 0.6) {
          const bs = await page.$$("[class*=choices] button")
          const b = await any(bs).boundingBox()
          await tap([b.x + b.width / 2, b.y + b.height / 2], touch)
        } else if (st.mode === "solve" && st.chips.length && rnd() < 0.7) {
          await drag(any(st.chips), st.eq && rnd() < 0.8 ? st.eq : R(), touch)
          await sleep(2600)
        } else if ((st.mode === "solve" || st.mode === "tapEq") && st.atoms.length) {
          await tap(any(st.atoms), touch)
          await sleep(1200)
        } else if (st.mode === "fill" && st.labels.length && st.slots.length) {
          await drag(any(st.labels), rnd() < 0.8 ? any(st.slots) : R(), touch)
          await sleep(500)
        } else if (st.mode === "swing" && st.swing) {
          await drag(st.swing, R(), touch)
          await sleep(500)
        } else if (st.mode === "drop" && st.foot) {
          await drag(st.corners[2], rnd() < 0.6 ? st.foot : R(), touch)
          await sleep(500)
        } else if (st.mode === "tapAngle") {
          await tap(any(st.angs), touch)
          await sleep(500)
        } else if (st.mode === "tapSide") {
          await tap(any(st.sides), touch)
          await sleep(500)
        } else if (st.mode === "tapPair") {
          await tap(any(rnd() < 0.5 ? st.angs : st.sides), touch)
          await sleep(500)
        } else if (st.mode === "drag" || st.mode === "rule") {
          await drag(any(st.corners), R(), touch)
          await sleep(400)
        } else {
          await drag(R(), R(), touch)
          await sleep(300)
        }
        await sleep(600)
        await check(id, `move ${m}`)
      }
    }
  }
  console.log(`sine-rule: ${checks} checks, ${bad.length} problems`)
  for (const b of bad.slice(0, 30)) console.log("  " + b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 6) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
