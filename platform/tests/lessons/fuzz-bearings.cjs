// Random play on "Bearings" at random screen sizes: turns lines by their
// ends, drags places, taps places and angles, picks choices, types. After
// every move: nothing off screen, no two labels on top of each other, the
// display says the line's bearing, a live bearing says the true bearing,
// and nothing on screen says NaN.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const LESSON = process.env.LESSON || "bearings"
const BASE = process.env.BASE || `${HOST}/learn/${LESSON}`
const ROUNDS = +(process.env.ROUNDS || 1)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 7)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const KEYS = ["0", "1", "2", "5", "7", "9", ".", "Backspace"]

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  const errs = []
  page.on("pageerror", e => errs.push(e.message))
  let checks = 0
  const bad = []
  const check = async (id, what) => {
    const r = await page.evaluate(() => {
      const S = window.__beatScene
      const out = []
      const els = [...document.querySelectorAll("[class*=label]")].filter(el => +(el.style.opacity || 1) > 0.5 && el.textContent.trim())
      const boxes = els.map(el => ({ t: el.textContent.trim(), b: el.getBoundingClientRect(), tool: /^(RU|PO|PI|RL)-/.test(el.dataset.k || "") }))
      for (const { t, b } of boxes) if (b.width && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + t)
      // two labels on top of each other (more than a third of the smaller one covered)
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        // a ruler or protractor laid on the drawing covers what is under it, as on paper
        if (boxes[i].tool !== boxes[j].tool) continue
        const a = boxes[i].b, c = boxes[j].b
        const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
        if (w > 0 && h > 0 && w * h > 0.34 * Math.min(a.width * a.height, c.width * c.height)) out.push(`labels overlap: ${boxes[i].t} / ${boxes[j].t}`)
      }
      // the display says the line's bearing (once the line has settled where it was turned to)
      const shown = document.querySelector("[data-readout]")
      if (S.readout && S.readout.ray && shown && S.vis.readout.v > 0.9) {
        const ray = S.rays.find(x => x.id === S.readout.ray)
        if (ray && Math.abs((((ray.d - ray.brg) % 360) + 540) % 360 - 180) < 0.3) {
          const n = Math.round(((ray.brg % 360) + 360) % 360) % 360
          const want = S.readout.three ? String(n).padStart(3, "0") : String(n)
          if (shown.dataset.readout !== want) out.push(`display says ${shown.dataset.readout}, the line is at ${want}`)
        }
      }
      for (const n of Object.keys(S.names)) {
        const f = S.fitD
        if (!S.P[n] || !f) continue
        const p = [f.cx + (S.P[n][0] - f.c[0]) * f.u, f.cy - (S.P[n][1] - f.c[1]) * f.u]
        if (!isFinite(p[0]) || !isFinite(p[1])) out.push(`place ${n} not a number`)
        else if (!S.drag && (p[0] < -6 || p[0] > S.w + 6 || p[1] < -6 || p[1] > S.h + 6)) out.push(`place ${n} off the board`)
      }
      for (const r of S.rays) {
        const e = window.__beatApi.rayAt(S, r.id)
        if (e && !S.drag && (e[0] < -6 || e[0] > S.w + 6 || e[1] < 60 || e[1] > S.h + 6)) out.push(`line ${r.id} runs off the board`)
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
    for (let k = 0; k < beats.length; k++) {
      const id = beats[k]
      const [w, h] = SIZES[Math.floor(rnd() * SIZES.length)]
      const touch = w < 500
      await page.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch })
      await page.goto(`${BASE}?debug&beat=${k + 1}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
      await sleep(3200)
      await check(id, `open ${w}x${h}`)
      for (let m = 0; m < 5; m++) {
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        const st = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          return {
            w: S.w, h: S.h, input: !!S.input && S.vis.keypad.t > 0.5,
            rays: S.rays.filter(r => r.handle).map(r => ({ id: r.id, end: A.rayAt(S, r.id), c: A.ptS(S, r.at) })),
            pts: (S.tapPoints || []).concat(S.dragPts).map(n => A.ptS(S, n)),
            drags: S.dragPts.map(n => A.ptS(S, n)),
            arcs: (S.tapArcs || []).map(a => A.arcAt(S, a)).filter(Boolean),
            choices: !!document.querySelector("[class*=choices] button"),
            ruler: A.rulerAt(S), prot: A.protAt(S), rulerMove: !!S.ruler && S.ruler.move, protMove: !!S.prot && S.prot.move,
          }
        })
        const R = () => [st.w * (0.1 + 0.8 * rnd()), st.h * (0.2 + 0.55 * rnd())]
        const any = a => a[Math.floor(rnd() * a.length)]
        if (st.input && rnd() < 0.7) {
          for (let t = 0; t < 3; t++) await page.keyboard.press(any(KEYS))
          await page.keyboard.press("Enter")
        } else if (st.choices && rnd() < 0.6) {
          const bs = await page.$$("[class*=choices] button")
          const b = await any(bs).boundingBox()
          await tap([b.x + b.width / 2, b.y + b.height / 2], touch)
        } else if (st.ruler && rnd() < 0.8) {
          // the ruler: carry it, turn it by its end, or slide its pencil
          const r = st.ruler
          const pick = rnd()
          if (r.pen && pick < 0.4) await drag(r.pen, R(), touch)
          else if (st.rulerMove && pick < 0.7) await drag(r.body, R(), touch)
          else await drag(r.turn, R(), touch)
        } else if (st.prot && rnd() < 0.8) {
          const p = st.prot
          const pick = rnd()
          if (p.pen && pick < 0.4) await drag(p.pen, R(), touch)
          else if (st.protMove && pick < 0.7) await drag([p.c[0] + 4, p.c[1] + 4], R(), touch)
          else await drag(p.turn, R(), touch)
        } else if (st.rays.length && rnd() < 0.8) {
          // turn a line round its place
          const r = any(st.rays), R0 = Math.hypot(r.end[0] - r.c[0], r.end[1] - r.c[1]), b = rnd() * Math.PI * 2
          await drag(r.end, [r.c[0] + Math.sin(b) * R0, r.c[1] - Math.cos(b) * R0], touch)
        } else if (st.drags.length && rnd() < 0.8) {
          await drag(any(st.drags), R(), touch)
        } else if (st.pts.length && rnd() < 0.7) {
          await tap(any(st.pts), touch)
        } else if (st.arcs.length && rnd() < 0.7) {
          await tap(any(st.arcs), touch)
        } else {
          await tap(R(), touch)
        }
        await sleep(900)
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        await check(id, `move ${m}`)
      }
    }
  }
  console.log(`${LESSON}: ${checks} checks, ${bad.length} problems`)
  for (const b of bad.slice(0, 40)) console.log("  " + b)
  console.log("errors:", errs.length ? errs.slice(0, 5).join(" | ") : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
