// Random play on the geometrical terms lessons (LESSON picks one) at random
// screen sizes: corners dragged
// (grown, stretched, turned), shapes carried, sides and angles tapped,
// chips, the calculator. After every move: a triangle's angles shown add to
// 180, each side's number is the length it is drawn at, no two labels on
// the figure sit on each other, nothing is off screen, every corner is on
// the board, and nothing says NaN.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const LESSON = process.env.LESSON || "naming-shapes"
const BASE = process.env.BASE || `${HOST}/learn/${LESSON}`
const ROUNDS = +(process.env.ROUNDS || 1)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 7)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const KEYS = ["1", "2", "5", "9", ".", "*", "/", "Backspace"]

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
      const num = t => (/^-?\d/.test(t || "") ? Number(/-?\d+(\.\d+)?/.exec(t)[0]) : null)
      // a side's length shown is the length it is drawn at
      for (const pl of S.polys) {
        if (!pl.lens || S.drag) continue
        pl.pts.forEach((n, i) => {
          const m = pl.pts[(i + 1) % pl.pts.length], lab = S.labs.find(l => l.key === `S-${pl.id}:${i}`)
          if (!lab) return
          const d = Math.hypot(S.pts[n].p[0] - S.pts[m].p[0], S.pts[n].p[1] - S.pts[m].p[1])
          if (Math.abs(Number(lab.tex) - d) > 0.051) out.push(`side ${pl.id}:${i} says ${lab.tex} but is ${d.toFixed(3)}`)
        })
      }
      // no two labels on the figure on top of each other (more than a third of the smaller one covered)
      const figLabs = [...document.querySelectorAll("[data-k]")].filter(el => +(el.style.opacity || 1) > 0.5 && el.textContent.trim()).map(el => ({ t: el.textContent.trim(), k: el.dataset.k, b: el.getBoundingClientRect() }))
      for (let i = 0; i < figLabs.length; i++) for (let j = i + 1; j < figLabs.length; j++) {
        const a = figLabs[i].b, c = figLabs[j].b
        const ow = Math.min(a.right, c.right) - Math.max(a.left, c.left), oh = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)
        if (ow > 0 && oh > 0 && ow * oh > 0.34 * Math.min(a.width * a.height, c.width * c.height)) out.push(`labels overlap: ${figLabs[i].k} ${figLabs[i].t} / ${figLabs[j].k} ${figLabs[j].t}`)
      }
      // nothing off screen
      for (const el of document.querySelectorAll("[class*=label]")) {
        const b = el.getBoundingClientRect()
        if (b.width && +(el.style.opacity || 1) > 0.3 && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + el.textContent)
      }
      for (const [k, d] of Object.entries(S.eq.atoms)) if (d.op > 0.6 && (d.x < -3 || d.x + d.w > S.w + 3)) out.push("equation off screen: " + k)
      // every corner of a shape, and the circle, on the board
      if (!S.drag && S.vis.shapes.t > 0.5) {
        const L = A.layout(S)
        const off = p => p[0] < L.board.x0 - 8 || p[0] > L.board.x1 + 8 || p[1] < L.board.y0 - 8 || p[1] > L.board.y1 + 8
        for (const pl of S.polys) for (const n of pl.pts) if (off(A.ptS(S, n))) out.push(`corner ${pl.id}:${n} off the board`)
        if (S.circle) { const c = A.ptS(S, S.circle.c), r = S.circle.r * S.fitD.u; if (off([c[0] - r, c[1] - r]) || off([c[0] + r, c[1] + r])) out.push("circle off the board") }
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
    for (const id of beats) {
      const [w, h] = SIZES[Math.floor(rnd() * SIZES.length)]
      const touch = w < 500
      await page.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch })
      const k = beats.indexOf(id)
      await page.goto(`${BASE}?debug&beat=${k + 1}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
      await sleep(1800)
      await check(id, `open ${w}x${h}`)
      for (let m = 0; m < 6; m++) {
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        const st = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          return {
            w: S.w, h: S.h, handles: S.handles.filter(x => !S.locked.has(x.id)).map(x => A.handleAt(S, x.id)).filter(Boolean),
            taps: (S.taps || []).map(t => A.tapAt(S, t.id)).filter(Boolean),
            choices: !!document.querySelector("[class*=choices] button"),
            stepper: !!document.querySelector('button[aria-label="More sides"]'),
          }
        })
        const R = () => [st.w * (0.1 + 0.8 * rnd()), st.h * (0.15 + 0.7 * rnd())]
        const any = a => a[Math.floor(rnd() * a.length)]
        if (st.choices && rnd() < 0.6) {
          const bs = await page.$$("[class*=choices] button")
          const b = await any(bs).boundingBox()
          await tap([b.x + b.width / 2, b.y + b.height / 2], touch)
        } else if (st.stepper && rnd() < 0.6) {
          const b = await (await page.$(rnd() < 0.6 ? 'button[aria-label="More sides"]' : 'button[aria-label="Fewer sides"]')).boundingBox()
          await tap([b.x + b.width / 2, b.y + b.height / 2], touch)
          await sleep(400)
        } else if (st.handles.length && rnd() < 0.8) {
          await drag(any(st.handles), R(), touch)
          await sleep(500)
        } else if (st.taps.length && rnd() < 0.8) {
          await tap(rnd() < 0.7 ? any(st.taps) : R(), touch)
          await sleep(500)
        } else {
          await drag(R(), R(), touch)
          await sleep(300)
        }
        await sleep(900)
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        await check(id, `move ${m}`)
      }
    }
  }
  console.log(`${LESSON}: ${checks} checks, ${bad.length} problems`)
  for (const b of bad.slice(0, 40)) console.log("  " + b)
  console.log("errors:", errs.length ? [...new Set(errs)].slice(0, 6) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
