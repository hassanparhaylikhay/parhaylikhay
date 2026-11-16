// Random play on a 3D lesson (LESSON=pythagoras-3d or angles-3d) at random
// screen sizes: turns the figure, drags handles, taps points, angles,
// triangles, lines and the sides of flat triangles, picks choices, drags
// pieces of the equation over the =, types on the calculator. After every
// move: no label, piece of the equation or corner of the figure is off
// screen; the box's edges say its true size and its long diagonal is right;
// the stick's live angle is its true tilt; nothing on screen says NaN.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST } = require("./lib.cjs")
const LESSON = process.env.LESSON || "pythagoras-3d"
const BASE = process.env.BASE || `${HOST}/learn/${LESSON}`
const ROUNDS = +(process.env.ROUNDS || 1)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const SIZES = [[1440, 900], [1280, 720], [390, 844], [360, 640], [820, 1180], [1024, 600]]
let seed = +(process.env.SEED || 11)
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const KEYS = ["1", "2", "5", "9", ".", "*", "/", "+", "-", "^", "r", "t", "T", "a", "Backspace"]

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
      const lab = k => S.labs.find(l => l.key === k && l.op > 0.5)
      // the box's edges say its size; its long diagonal (when live) is √(l² + w² + h²)
      if (S.box && !S.drag && S.box.h > 0.05) {
        const l = num(lab("N-E-H")?.tex), w = num(lab("G-H")?.tex ?? lab("N-G-H")?.tex), h = num(lab("N-C-G")?.tex)
        if (S.tick && l !== null && l !== S.box.l) out.push(`length shows ${l}, box is ${S.box.l}`)
        if (S.tick && h !== null && h !== S.box.h) out.push(`height shows ${h}, box is ${S.box.h}`)
        void w
        const d = num(lab("N-C-E")?.tex)
        if (S.tick && d !== null && Object.keys(S.handles).length) {
          const want = Math.sqrt(S.box.l ** 2 + S.box.w ** 2 + S.box.h ** 2)
          if (Math.abs(d - want) > 0.006) out.push(`EC shows ${d}, should be ${want.toFixed(2)}`)
        }
      }
      // the stick's angle shown is its tilt
      if (S.stick && !S.drag) {
        const a = S.arcs.find(g => g.at === "P" && g.tex)
        if (a) { const v = num(a.tex), th = S.stick.th * 180 / Math.PI; if (Math.abs(v - Math.round(th)) > 0.5) out.push(`stick shows ${v}°, is ${th.toFixed(1)}°`) }
      }
      // nothing off screen
      for (const el of document.querySelectorAll("[class*=label]")) {
        const b = el.getBoundingClientRect()
        if (b.width && (b.left < -4 || b.right > S.w + 4 || b.top < 0 || b.bottom > S.h)) out.push("label off screen: " + el.textContent)
      }
      for (const [k, d] of Object.entries(S.eq.atoms)) if (d.op > 0.6 && (d.x < -3 || d.x + d.w > S.w + 3)) out.push("equation off screen: " + k)
      if (!S.drag) {
        for (const n of Object.keys(S.P3)) {
          if (!S.names[n]) continue
          const p = A.ptS(S, n)
          if (!isFinite(p[0]) || !isFinite(p[1])) out.push(`point ${n} not a number`)
          else if (p[0] < -6 || p[0] > S.w + 6 || p[1] < -6 || p[1] > S.h + 6) out.push(`point ${n} off the board`)
        }
        for (const F of S.flats) if (F.t.v > 0.99) for (const n of F.pts) {
          const p = F.pos[n]
          if (!p || p[0] < -6 || p[0] > S.w + 6 || p[1] < -6 || p[1] > S.h + 6) out.push(`flat ${F.id} corner ${n} off the board`)
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
    for (let k = 0; k < beats.length; k++) {
      const id = beats[k]
      const [w, h] = SIZES[Math.floor(rnd() * SIZES.length)]
      const touch = w < 500
      await page.setViewport({ width: w, height: h, isMobile: touch, hasTouch: touch })
      await page.goto(`${BASE}?debug&beat=${k + 1}`, { waitUntil: "load" })
      await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0)
      await sleep(1300)
      await check(id, `open ${w}x${h}`)
      for (let m = 0; m < 5; m++) {
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        const st = await page.evaluate(() => {
          const S = window.__beatScene, A = window.__beatApi
          return {
            mode: S.mode, w: S.w, h: S.h, input: !!S.input && S.vis.keypad.t > 0.5,
            handles: S.handles.map(x => A.handleAt(S, x.id)).filter(Boolean),
            points: (S.tapPoints || []).map(n => A.ptS(S, n)),
            arcs: (S.tapArcs || []).map((_, i) => A.arcAt(S, i)).filter(Boolean),
            regions: S.regions ? S.regions.map(r => A.regionAt(S, r.id)).filter(Boolean) : [],
            segs: (S.tapSegs || []).map(key => { const [a, b] = key.split("-"); return A.segMid(S, a, b) }),
            flatSides: S.tapFlat ? (() => { const F = S.flats.find(f => f.id === S.tapFlat); return F ? [[0, 1], [1, 2], [2, 0]].map(([i, j]) => A.flatSide(S, F.id, F.pts[i], F.pts[j])).filter(Boolean) : [] })() : [],
            carry: S.dragAtoms.map(i => A.atomAt(S, i)).filter(Boolean),
            eq: A.atomAt(S, "eq"),
            choices: !!document.querySelector("[class*=choices] button"),
          }
        })
        const R = () => [st.w * (0.1 + 0.8 * rnd()), st.h * (0.18 + 0.6 * rnd())]
        const any = a => a[Math.floor(rnd() * a.length)]
        if (st.input && rnd() < 0.7) {
          for (let t = 0; t < 5; t++) await page.keyboard.press(any(KEYS))
          await page.keyboard.press("Enter")
        } else if (st.choices && rnd() < 0.6) {
          const bs = await page.$$("[class*=choices] button")
          const b = await any(bs).boundingBox()
          await tap([b.x + b.width / 2, b.y + b.height / 2], touch)
        } else if (st.handles.length && rnd() < 0.7) {
          await drag(any(st.handles), R(), touch)
          await sleep(500)
        } else if (st.points.length && rnd() < 0.7) {
          await tap(any(st.points), touch); await sleep(250); await tap(any(st.points), touch)
          await sleep(600)
        } else if (st.arcs.length && rnd() < 0.7) {
          await tap(any(st.arcs), touch)
          await sleep(500)
        } else if (st.regions.length && rnd() < 0.7) {
          await tap(any(st.regions), touch)
          await sleep(1300)
        } else if (st.segs.length && rnd() < 0.7) {
          await tap(any(st.segs), touch)
          await sleep(500)
        } else if (st.flatSides.length && rnd() < 0.7) {
          await tap(any(st.flatSides), touch)
          await sleep(500)
        } else if (st.carry.length && st.eq && rnd() < 0.7) {
          const a = any(st.carry)
          await drag(a, rnd() < 0.7 ? [st.eq[0] + (a[0] < st.eq[0] ? 1 : -1) * 80, st.eq[1]] : R(), touch)
          await sleep(900)
        } else {
          // turn the figure
          await drag(R(), R(), touch)
          await sleep(500)
        }
        await sleep(500)
        if ((await page.evaluate(() => window.__beatIdx)) !== k) break
        await check(id, `move ${m}`)
      }
    }
  }
  console.log(`${LESSON}: ${checks} checks, ${bad.length} problems`)
  for (const b of bad.slice(0, 30)) console.log("  " + b)
  console.log("errors:", errs.length ? errs.slice(0, 5).join(" | ") : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
