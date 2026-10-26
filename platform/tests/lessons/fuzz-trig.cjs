// Random play on the trigonometry boards at random screen sizes (LESSON =
// trigonometry or why-trig-works). Turns and slides the triangle, drops
// chips onto the equation, drags its pieces about, types on the calculator.
// After every move: the lengths on screen agree with each other and with the
// angle shown (to within their rounding), the equation is still a true equation (both sides equal), no
// label or piece of the equation is off screen, the triangle stays inside its
// board, and nothing on screen says NaN.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const LESSON = process.env.LESSON || "trigonometry"
const BASE = process.env.BASE || `${HOST}/learn/${LESSON}`
const ROUNDS = +(process.env.ROUNDS || 2)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 5)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const IDS = {
  "trigonometry": ["turn-30", "tap-1", "drag-30", "solve-40", "solve-55", "solve-35", "drag-x", "undo-65", "solve-u1", "u2-solve", "any1-solve", "any2-solve", "any3-solve", "any4-solve", "ex3-solve", "ex4-solve", "calc-65", "any3-calc", "make-slide", "end"],
  "why-trig-works": ["open", "slide", "turn-family", "same-place", "else", "to-one", "round-sin", "round-cos", "to-35", "tan-90", "end"],
}[LESSON]
const KEYS = ["1", "2", "5", "9", ".", "*", "/", "s", "c", "t", "Backspace"]

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
      const num = t => { const m = /-?\d+(\.\d+)?/.exec(t || ""); return m ? Number(m[0]) : null }
      // lengths agree: O and A are the shown hypotenuse times the ratio of the shown angle
      const lab = k => S.labs.find(l => l.key === k)
      const ang = num(lab("ang")?.tex)
      const H = num(lab("role-H")?.tex), O = num(lab("role-O")?.tex), Ad = num(lab("role-A")?.tex)
      const live = S.roleLabels.H && /^\d/.test(lab("role-H")?.tex || "") && S.tri.at === "V" && S.tri.drop === 1 && S.thExact === null && !S.input
      if (live && ang !== null && H !== null) {
        const r = ang * Math.PI / 180
        // within two roundings: a side may be rounded from the true size, like the hypotenuse beside it
        const tolr = 0.0102 + 0.0001 * H
        if (O !== null && /^\d/.test(lab("role-O").tex) && Math.abs(O - H * Math.sin(r)) > tolr) out.push(`O ${O} vs ${H} sin ${ang}`)
        if (Ad !== null && /^\d/.test(lab("role-A").tex) && Math.abs(Ad - H * Math.cos(r)) > tolr) out.push(`A ${Ad} vs ${H} cos ${ang}`)
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
      // the triangle inside its board
      const L = A.layout(S)
      if (S.vis.tri.t > 0.5 && S.vis.board.t > 0.5 && !S.drag) {
        for (const c of ["V", "F", "P"]) {
          const p = A.cornerS(S, c)
          if (p[0] < L.board.x0 - 8 || p[0] > L.board.x1 + 8 || p[1] < L.board.y0 - 8 || p[1] > L.board.y1 + 8) out.push(`corner ${c} outside the board`)
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

  for (let round = 0; round < ROUNDS; round++) {
    for (const id of IDS) {
      const [w, h] = SIZES[Math.floor(rnd() * SIZES.length)]
      const touch = w < 500
      await page.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch })
      const n = await page.evaluate(i => window.__beatApi ? window.__beatApi.beats.findIndex(b => b.id === i) : -1, id).catch(() => -1)
      const idx = n >= 0 ? n + 1 : null
      if (idx === null) {
        await page.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" })
        await page.waitForFunction(() => window.__beatApi)
      }
      const k = await page.evaluate(i => window.__beatApi.beats.findIndex(b => b.id === i), id)
      if (k < 0) { bad.push(`no beat ${id}`); continue }
      await page.goto(`${BASE}?debug&beat=${k + 1}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
      await sleep(1500)
      await check(id, `open ${w}x${h}`)
      for (let m = 0; m < 6; m++) {
        const st = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          const L = A.layout(S)
          return {
            mode: S.mode, w: S.w, h: S.h, input: !!S.input && S.vis.keypad.t > 0.5,
            turn: A.turnHandle(S), slide: A.slideHandle(S),
            chips: A.chipRects(S, L).map(c => [(c.r.x0 + c.r.x1) / 2, (c.r.y0 + c.r.y1) / 2]),
            atoms: Object.keys(S.eq.atoms).map(i => A.atomAt(S, i)).filter(Boolean),
            eq: A.atomAt(S, "eq"),
          }
        })
        const R = () => [st.w * (0.1 + 0.8 * rnd()), st.h * (0.15 + 0.7 * rnd())]
        if (st.input) {
          for (let t = 0; t < 5; t++) await page.keyboard.press(KEYS[Math.floor(rnd() * KEYS.length)])
          await page.keyboard.press("Enter")
        } else if (st.mode === "solve" && st.chips.length && rnd() < 0.7) {
          const c = st.chips[Math.floor(rnd() * st.chips.length)]
          await drag(c, st.eq && rnd() < 0.8 ? st.eq : R(), touch)
          await sleep(2600)
        } else if (st.mode === "solve" && st.atoms.length) {
          const a = st.atoms[Math.floor(rnd() * st.atoms.length)]
          const b = st.atoms[Math.floor(rnd() * st.atoms.length)]
          if (rnd() < 0.5) { await page.mouse.click(a[0], a[1]); await sleep(900) } else { await drag(a, b, touch); await sleep(1400) }
        } else if (st.mode === "turn" || st.mode === "turnSlide" || st.mode === "slide") {
          const h = st.mode === "slide" || (st.mode === "turnSlide" && rnd() < 0.5) ? st.slide : st.turn
          await drag(h, R(), touch)
          await sleep(350)
        } else {
          await drag(R(), R(), touch)
          await sleep(300)
        }
        await sleep(600)
        await check(id, `move ${m}`)
      }
    }
  }
  console.log(`${LESSON}: ${checks} checks, ${bad.length} problems`)
  for (const b of bad.slice(0, 30)) console.log("  " + b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 6) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
