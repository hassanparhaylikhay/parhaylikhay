// Shared helpers for the trigonometry play-throughs: open the page, wait for
// phrases, and do what a student does on the trig board (turn the arm, slide
// the triangle, tap sides and cards, drag chips onto the equation, tap or
// drag pieces of the equation, type on the calculator).
const puppeteer = require("puppeteer-core")
const fs = require("fs")
const { CHROME, HOST, outDir } = require("./lib.cjs")

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function open(slug, name) {
  const OUT = outDir(name)
  fs.mkdirSync(OUT, { recursive: true })
  const URL = process.env.URL || `${HOST}/learn/${slug}?debug${process.env.FROM ? `&beat=${process.env.FROM}` : ""}`
  const W = +(process.env.W || 1440), H = +(process.env.H || 900)
  const TOUCH = !!process.env.TOUCH
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, isMobile: TOUCH, hasTouch: TOUCH, deviceScaleFactor: TOUCH ? 2 : 1 })
  const logs = []
  page.on("pageerror", e => logs.push("PAGEERROR " + e.message))
  page.on("console", m => { if (m.type() === "error") logs.push(m.text()) })
  await page.goto(URL, { waitUntil: "load", timeout: 60000 })
  await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0, { timeout: 60000 })
  await sleep(1200)

  let n = 0, misses = 0, lastStart = -1
  const t0 = Date.now()
  const fail = msg => { misses++; console.log("!!", msg) }
  const shot = async nm => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(3, "0")}-${nm}.png` }) }
  const phrase = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className))
    return els.length ? els[els.length - 1].textContent : null
  })
  const want = async (prefix, ms = 15000) => {
    const start = Date.now()
    while (Date.now() - start < ms) {
      const p = await phrase()
      const bs = await page.evaluate(() => window.__beatScene.beatStart)
      if (p && p.startsWith(prefix) && bs !== lastStart) { lastStart = bs; await sleep(800); return true }
      await sleep(100)
    }
    fail(`wanted ${JSON.stringify(prefix)} but phrase is ${JSON.stringify(await phrase())}`)
    return false
  }
  const press = async (x, y) => { if (TOUCH) await page.touchscreen.touchStart(x, y); else { await page.mouse.move(x, y); await page.mouse.down() } }
  const moveTo = async (x, y) => { if (TOUCH) await page.touchscreen.touchMove(x, y); else await page.mouse.move(x, y) }
  const release = async () => { if (TOUCH) await page.touchscreen.touchEnd(); else await page.mouse.up() }
  const path = async pts => { await press(...pts[0]); for (const p of pts.slice(1)) { await moveTo(...p); await sleep(14) } await release(); await sleep(350) }
  const drag = async (a, b, steps = 20) => { const pts = []; for (let i = 0; i <= steps; i++) pts.push([a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await path(pts) }
  const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await sleep(350) }
  const tapSel = async sel => { const el = await page.$(sel); if (!el) return fail("no element " + sel); const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  const next = async (ms = 26000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { return fail("no continue button on " + JSON.stringify(await phrase())) }
    await sleep(250); await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const expect = async (cond, msg) => { if (!cond) fail(msg + " on " + JSON.stringify(await phrase())) }
  const S = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, locked: s.locked, input: s.input && s.input.state, tri: s.tri, mode: s.mode, got: [...s.got], chips: s.chips.map(c => c.id),
      solve: s.solve && { stage: s.solve.stage, busy: s.solve.busy, q: s.solve.q.id, under: s.solve.q.known && null }, alg: !!s.alg, graph: s.graph && { seen: s.graph.seen.filter(Boolean).length, cos: s.graph.seenCos.filter(Boolean).length } }
  })
  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)

  // ── the trig board ──
  const corner = c => api("cornerS", c)
  const sideMid = async side => { const a = await corner(side[0]), b = await corner(side.slice(1)); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
  /** The side playing a role now (the triangle's corner `at`). */
  const roleSide = role => page.evaluate(r => window.__beatApi.sideOf(window.__beatScene.tri.at, r), role)
  const tapSide = async side => tap(...(await sideMid(side)))
  const tapRole = async role => tapSide(await roleSide(role))
  /** Turn the arm (upright pose) to an angle, by its handle, along an arc. */
  const turnTo = async deg => {
    const s = await page.evaluate(() => ({ R: window.__beatScene.armR, th: window.__beatScene.tri.th }))
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const t = (s.th + (deg - s.th) * i / 24) * Math.PI / 180
      pts.push(await api("toScreen", [s.R * Math.cos(t), s.R * Math.sin(t)]))
    }
    await path(pts)
    await sleep(300)
  }
  /** Slide P along the arm to a hypotenuse length. */
  const slideTo = async h => {
    const s = await page.evaluate(() => ({ th: window.__beatScene.tri.th, h: window.__beatScene.tri.h }))
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const l = s.h + (h - s.h) * i / 20, t = s.th * Math.PI / 180
      pts.push(await api("toScreen", [l * Math.cos(t), l * Math.sin(t)]))
    }
    await path(pts)
    await sleep(300)
  }
  const dropLine = async (frac = 1.15) => {
    const p = await corner("P"), f = await corner("F")
    await drag(p, [f[0], p[1] + (f[1] - p[1]) * frac], 18)
  }
  const tapCard = async fn => {
    const L = await api("layout")
    const rects = await page.evaluate(L => window.__beatApi.cardRects(window.__beatScene, L), L)
    const r = rects.find(c => c.fn === fn)
    if (!r) return fail("no card " + fn)
    await tap((r.r.x0 + r.r.x1) / 2, (r.r.y0 + r.r.y1) / 2)
  }
  const atomAt = id => api("atomAt", id)
  const tapAtom = async id => { const p = await atomAt(id); if (!p) return fail("no piece " + id); await tap(...p) }
  const chipAt = async id => {
    const L = await api("layout")
    const rects = await page.evaluate(L => window.__beatApi.chipRects(window.__beatScene, L), L)
    const r = rects.find(c => c.id === id)
    return r ? [(r.r.x0 + r.r.x1) / 2, (r.r.y0 + r.r.y1) / 2] : null
  }
  /** Drag a chip onto the equals sign. */
  const dropChip = async id => {
    const a = await chipAt(id)
    if (!a) return fail("no chip " + id + " (have " + (await S()).chips.join(",") + ")")
    const e = await atomAt("eq")
    await drag(a, e, 16)
  }
  /** The right move for where the solve is now. */
  const rightChip = () => page.evaluate(() => {
    const v = window.__beatScene.solve
    const fnOf = q => { const r = new Set([q.known, q.unknown]); return r.has("H") ? (r.has("O") ? "sin" : "cos") : "tan" }
    const RULE = { sin: ["O", "H"], cos: ["A", "H"], tan: ["O", "A"] }
    const under = RULE[fnOf(v.q)][1] === v.q.unknown
    if (!under) return "mul-k"
    return v.stage === 0 ? "mul-x" : "div-F"
  })
  /** Make the moves until x is on its own. */
  const solveIt = async (o = {}) => {
    for (let k = 0; k < 4; k++) {
      const s = await S()
      if (!s.solve || s.solve.stage === 2) return
      if (s.solve.busy) { await sleep(400); continue }
      const id = await rightChip()
      if (o.wrongFirst && k === 0) {
        const wrong = (await S()).chips.find(c => c !== id)
        if (wrong) { await dropChip(wrong); await expect((await S()).note, "no note after a wrong move"); await sleep(2700) }
      }
      await dropChip(id)
      await sleep(2600)
    }
  }
  /** Type on the calculator: s c t for sin cos tan, * and / for × and ÷. */
  const type = async str => {
    if (TOUCH) {
      const map = { s: "sin", c: "cos", t: "tan", "*": "×", "/": "÷" }
      for (const ch of str) { await tapSel(`button[aria-label="${map[ch] || ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(60) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const finish = async () => {
    console.log(`done, ${misses} mismatches, ${((Date.now() - t0) / 1000).toFixed(0)}s`)
    if (logs.length) console.log("logs:", logs.slice(0, 5))
    await browser.close()
  }
  return { page, want, next, tap, tapSel, drag, path, shot, expect, fail, S, api, corner, sideMid, roleSide, tapSide, tapRole, turnTo, slideTo, dropLine, tapCard, atomAt, tapAtom, chipAt, dropChip, solveIt, type, finish, sleep, TOUCH }
}

module.exports = { open, sleep }
