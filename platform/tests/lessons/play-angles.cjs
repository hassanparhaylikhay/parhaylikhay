// Scripted play-through of the Angles lesson, the way a student would do it.
// Waits for each phrase (and a new beat), acts, checks the board.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-angles")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/angles?debug"
const W = +(process.env.W || 1440), H = +(process.env.H || 900)
const TOUCH = !!process.env.TOUCH
const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, isMobile: TOUCH, hasTouch: TOUCH, deviceScaleFactor: TOUCH ? 2 : 1 })
  const logs = []
  page.on("pageerror", e => logs.push("PAGEERROR " + e.message))
  page.on("console", m => { if (m.type() === "error") logs.push(m.text()) })
  await page.goto(URL, { waitUntil: "load", timeout: 60000 })
  await page.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0, { timeout: 60000 })
  await sleep(1500)

  let n = 0, misses = 0, lastStart = -1
  const t0 = Date.now()
  const fail = msg => { misses++; console.log("!!", msg) }
  const shot = async name => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(3, "0")}-${name}.png` }) }
  const phrase = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("[class*=phrase]")].filter(e => !/phraseOut|phraseWrap/.test(e.className))
    return els.length ? els[els.length - 1].textContent : null
  })
  const want = async (prefix, ms = 12000) => {
    const start = Date.now()
    while (Date.now() - start < ms) {
      const p = await phrase()
      const bs = await page.evaluate(() => window.__beatScene.beatStart)
      if (p && p.startsWith(prefix) && bs !== lastStart) { lastStart = bs; await sleep(650); return true }
      await sleep(100)
    }
    fail(`wanted ${JSON.stringify(prefix)} but phrase is ${JSON.stringify(await phrase())}`)
    return false
  }
  // values the student sees, by angle id
  const angles = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    const L = A.layout(S)
    return A.angleList(S, L).map(a => ({ id: a.id, value: a.value, c: a.c, start: a.start, sweep: a.sweep, r: a.r }))
  })
  const shownValues = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    return A.angleList(S, A.layout(S)).filter(a => S.show === "all" || S.show.has(a.id)).map(a => [a.id, a.value])
  })
  const press = async (x, y) => { if (TOUCH) await page.touchscreen.touchStart(x, y); else { await page.mouse.move(x, y); await page.mouse.down() } }
  const moveTo = async (x, y) => { if (TOUCH) await page.touchscreen.touchMove(x, y); else await page.mouse.move(x, y) }
  const release = async () => { if (TOUCH) await page.touchscreen.touchEnd(); else await page.mouse.up() }
  const path = async pts => { await press(...pts[0]); for (const p of pts.slice(1)) { await moveTo(...p); await sleep(12) } await release(); await sleep(250) }
  const drag = async (a, b, steps = 18) => {
    const pts = []
    for (let i = 0; i <= steps; i++) pts.push([a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps])
    await path(pts)
  }
  const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await sleep(250) }
  const tapSel = async sel => { const el = await page.$(sel); if (!el) return fail("no element " + sel); const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  const tapText = async text => {
    const box = await page.evaluate(t => {
      const b = [...document.querySelectorAll("button")].find(x => x.textContent.trim() === t)
      if (!b) return null
      const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]
    }, text)
    if (!box) return fail("no button " + text)
    await tap(...box)
  }
  const next = async (ms = 24000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { return fail("no continue button on " + JSON.stringify(await phrase())) }
    await sleep(250); await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const type = async str => {
    if (TOUCH) { for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(70) } await tapSel('button[aria-label="Check"]'); await sleep(600); return }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(70) } await page.keyboard.press("Enter"); await sleep(600)
  }
  const state = () => page.evaluate(() => { const S = window.__beatScene; return { theta: S.theta, locked: S.locked, lines: S.lines.map(l => ({ p: l.p, a: l.a })), rays: S.rays.map(r => ({ from: r.from, a: r.a, len: r.len })), input: S.input && S.input.state, note: S.note && S.note.text, got: [...S.got], board: S.board } })
  const expect = async (cond, msg) => { if (!cond) fail(msg + " on " + JSON.stringify(await phrase())) }

  // turn the line by dragging its tip round the circle
  const turnTo = async deg => {
    const g = await page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi; const t = A.turnGeom(S, A.layout(S)); return { O: t.O, arm: t.arm, th: S.thetaD } })
    const from = g.th, steps = Math.max(6, Math.ceil(Math.abs(deg - from) / 4))
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const t = from + (deg - from) * i / steps
      pts.push([g.O[0] + Math.cos(-t * Math.PI / 180) * g.arm, g.O[1] + Math.sin(-t * Math.PI / 180) * g.arm])
    }
    await path(pts); await sleep(500)
  }
  // turn line i by its handle until its direction is `a` (radians, either way along the line)
  const rotateLine = async (i, a) => {
    const g = await page.evaluate(i => { const S = window.__beatScene, A = window.__beatApi; const L = A.layout(S); return { h: A.lineHandle(S, L, i), p: S.pivot || S.lines[i].p } }, i)
    const r = Math.hypot(g.h[0] - g.p[0], g.h[1] - g.p[1])
    const ha = Math.atan2(g.h[1] - g.p[1], g.h[0] - g.p[0])
    const wrap = x => Math.atan2(Math.sin(x), Math.cos(x))
    let d = wrap(a - ha)
    if (d > Math.PI / 2) d -= Math.PI
    if (d < -Math.PI / 2) d += Math.PI
    const steps = Math.max(6, Math.ceil(Math.abs(d) / (3 * Math.PI / 180)))
    const pts = []
    for (let k = 0; k <= steps; k++) { const t = ha + d * k / steps; pts.push([g.p[0] + Math.cos(t) * r, g.p[1] + Math.sin(t) * r]) }
    await path(pts); await sleep(500)
  }
  const lineAngle = async i => (await state()).lines[i].a
  const rightDir = a => { let x = ((a % Math.PI) + Math.PI) % Math.PI; if (x > Math.PI / 2) x -= Math.PI; return x }
  const tapAngle = async id => {
    const a = (await angles()).find(x => x.id === id)
    if (!a) return fail("no angle " + id)
    const m = a.start + a.sweep / 2
    await tap(a.c[0] + Math.cos(m) * a.r * 0.6, a.c[1] + Math.sin(m) * a.r * 0.6)
  }
  const board = () => page.evaluate(() => { const S = window.__beatScene, A = window.__beatApi; return A.layout(S).board })
  const checkSum = async (total, prefix) => {
    const v = (await shownValues()).filter(([id]) => id.startsWith(prefix)).map(x => x[1])
    const s = v.reduce((p, q) => p + q, 0)
    await expect(s === total, `angles ${v.join("+")}=${s}, not ${total}`)
  }
  const checkPar = async () => {
    const v = Object.fromEntries(await shownValues())
    for (let q = 0; q < 4; q++) if (v[`A${q}`] !== undefined && v[`B${q}`] !== undefined && v[`A${q}`] !== v[`B${q}`]) fail(`A${q}=${v[`A${q}`]} B${q}=${v[`B${q}`]}`)
    if (v.A0 !== undefined && v.A1 !== undefined && v.A0 + v.A1 !== 180) fail(`A0+A1=${v.A0 + v.A1}`)
  }
  const cx = W / 2, cy = H / 2 + 40
  const SPAN = Math.min(220, W * 0.36)

  // ── 1. turn ──
  await want("Turn the line"); await turnTo(80); await turnTo(160); await turnTo(30); await shot("turned"); await next()
  await want("How far it turns"); await shot("how-far"); await next()
  await want("Turn it all the way"); await turnTo(200); await turnTo(360); await sleep(300); await shot("full")
  await want("One full turn"); await next()
  await want("Now turn it halfway"); await sleep(600); await turnTo(178); await shot("half")
  await want("Half a turn"); await next()
  await want("Now a quarter"); await sleep(600); await turnTo(91); await shot("quarter")
  await want("A quarter turn"); await shot("right-angle"); await next()
  await want("Turn it to any"); await turnTo(140); await turnTo(300); await turnTo(70); await next()
  // ── 2. names ──
  await want("Make an angle smaller"); await sleep(400); await turnTo(55)
  await want("That's an acute"); await shot("acute"); await next()
  await want("Now make one bigger"); await turnTo(130)
  await want("That's an obtuse"); await next()
  await want("Now go past"); await turnTo(235)
  await want("An angle bigger than"); await shot("reflex"); await next()
  await want("Tap the acute"); await tapAngle("F2"); await expect((await state()).note, "no note after wrong tap"); await shot("tap-wrong"); await tapAngle("F0")
  await want("Tap the obtuse"); await tapAngle("F1")
  await want("Tap the reflex"); await tapAngle("F2")
  await want("Make an angle of"); await turnTo(262); await turnTo(271); await shot("270")
  // ── 3. letters ──
  await want("Points get capital"); await next()
  await want("This angle is called"); await next()
  await want("The middle letter"); await shot("middle"); await next()
  await want("Tap angle"); await tapAngle("RQS"); await tapAngle("PQR")
  await want("Tap angle"); await tapAngle("RQS")
  // ── 4. straight line ──
  {
    await want("Draw a straight line")
    const b = await board()
    await drag([b.x0 + 60, cy + 60], [b.x1 - 60, cy + 10]); await shot("line")
    await want("Now draw a line from")
    const st = await state(); const l = st.lines[0]
    const foot = [cx, l.p[1] + Math.tan(l.a) * (cx - l.p[0])]
    await drag([foot[0], foot[1] - 90], [foot[0] + 60, foot[1] - 200]); await expect((await state()).note, "no note for a ray off the line")
    await sleep(500)
    await drag([foot[0] + 4, foot[1]], [foot[0] + 70, foot[1] - 180]); await shot("ray")
  }
  await want("Two angles share"); await checkSum(180, "W"); await next()
  await want("Move the new line")
  { const s = await state(); const r = s.rays[0]; const tip = [r.from[0] + Math.cos(r.a) * r.len, r.from[1] + Math.sin(r.a) * r.len]
    const pts = []; for (let k = 0; k <= 30; k++) { const t = r.a - k * 0.035; pts.push([r.from[0] + Math.cos(t) * r.len, r.from[1] + Math.sin(t) * r.len]) } pts.unshift(tip); await path(pts)
    await checkSum(180, "W"); const s2 = await state(); const r2 = s2.rays[0]; const pts2 = []; for (let k = 0; k <= 50; k++) { const t = r2.a + k * 0.035; pts2.push([r2.from[0] + Math.cos(t) * r2.len, r2.from[1] + Math.sin(t) * r2.len]) } await path(pts2); await checkSum(180, "W") }
  await shot("moved-ray"); await next()
  await want("Guess: what do they"); await type("200"); await expect((await state()).input === "guessed", "guess not marked guessed")
  await want("Add them"); await sleep(2600); await shot("sum-180"); await checkSum(180, "W"); await next()
  await want("Together they make half"); await shot("half-turn"); await next()
  await want("Find the missing"); await type("40"); await shot("line-help"); await type("50"); await expect((await state()).input === "right", "50 not right")
  await want("Find the missing"); await type("65")
  // ── 5. point ──
  await want("Now three lines"); await checkSum(360, "P")
  for (const i of [0, 1, 2, 0]) { const s = await state(); const r = s.rays[i]; const pts = []; for (let k = 0; k <= 20; k++) { const t = r.a + (k <= 10 ? k : 20 - k) * 0.05; pts.push([r.from[0] + Math.cos(t) * r.len, r.from[1] + Math.sin(t) * r.len]) } await path(pts); await checkSum(360, "P") }
  await checkSum(360, "P"); await shot("point"); await next()
  await want("Guess: what do they"); await type("360")
  await want("Add them"); await sleep(2600); await shot("sum-360"); await next()
  await want("Together they make a full"); await shot("full-turn"); await next()
  await want("Tap to add"); { const s = await state(); const c = s.rays[0].from; const a0 = s.rays[0].a; await tap(c[0] + Math.cos(a0 + 0.05) * 90, c[1] + Math.sin(a0 + 0.05) * 90); await expect((await state()).note, "no note tapping on a line")
    const as = s.rays.map(r => ((r.a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((p, q) => p - q); let best = 0, gap = 0
    as.forEach((x, k) => { const nx = k + 1 < as.length ? as[k + 1] : as[0] + 2 * Math.PI; if (nx - x > gap) { gap = nx - x; best = x + (nx - x) / 2 } })
    await tap(c[0] + Math.cos(best) * 100, c[1] + Math.sin(best) * 100) }
  await sleep(800); await checkSum(360, "P"); await shot("four-rays")
  await want("Now there are four angles"); await checkSum(360, "P"); await next()
  await want("Find the missing"); await type("75")
  await want("Find the missing"); await type("135"); await shot("point-help"); await type("125")
  // ── 6. crossing ──
  {
    await want("Draw two straight")
    const b = await board()
    await drag([b.x0 + 80, cy], [b.x1 - 80, cy - 40])
    await drag([b.x0 + 80, cy + 120], [b.x0 + 260, cy + 120]); await expect((await state()).note, "no note for a line that does not cross")
    await sleep(400)
    await drag([cx - 90, cy + 180], [cx + 60, cy - 200]); await shot("crossed")
  }
  await want("That makes four angles"); await checkSum(360, "C"); await next()
  await want("Turn one line"); { const a = await lineAngle(1); await rotateLine(1, a + 0.6); await rotateLine(1, a - 0.5) } await checkSum(360, "C"); await shot("turned-cross"); await next()
  await want("Tap two angles"); await tapAngle("C0"); await tapAngle("C1"); await expect((await state()).note, "no note for neighbours"); await shot("neighbours"); await tapAngle("C0"); await tapAngle("C2"); await shot("opposite")
  await want("Opposite angles are"); { const v = Object.fromEntries(await shownValues()); await expect(v.C0 === v.C2 && v.C1 === v.C3, "opposites not equal") } await next()
  await want("They're called"); await next()
  await want("Here's why"); await shot("why-ab"); await next()
  await want(""); await next()
  await want("So "); await shot("a-eq-c"); await next()
  await want("This one is"); await type("70")
  await want("Now find this"); await type("100"); await shot("cross-help"); await type("110")
  // ── 7. parallel ──
  let lineA
  {
    await want("Draw a straight line")
    const b = await board()
    await drag([b.x0 + 80, cy - 40], [b.x1 - 80, cy - 70])
    await want("Draw a line that will never")
    const l = (await state()).lines[0]; lineA = l.a
    const d = [Math.cos(l.a), Math.sin(l.a)], nrm = [-d[1], d[0]]
    const m = [cx + nrm[0] * Math.min(170, H * 0.18), cy - 40 + nrm[1] * Math.min(170, H * 0.18)]
    const tilt = l.a + 0.35, dt = [Math.cos(tilt), Math.sin(tilt)]
    await drag([m[0] - dt[0] * SPAN, m[1] - dt[1] * SPAN], [m[0] + dt[0] * SPAN, m[1] + dt[1] * SPAN]); await sleep(300); await shot("would-meet")
    await expect((await state()).note, "no note for a line that would meet")
    await sleep(2400)
    await drag([m[0] - d[0] * SPAN, m[1] - d[1] * SPAN + 2], [m[0] + d[0] * SPAN, m[1] + d[1] * SPAN])
  }
  await want("Lines that never meet"); await next()
  await want("These arrows"); await shot("arrows"); await next()
  await want("Tilt one line"); { const a = await lineAngle(0); await rotateLine(1, a + 0.12) } await shot("tilted"); await next()
  await want("Make them parallel"); { const a = await lineAngle(0); await rotateLine(1, a + 0.01) } await shot("parallel-again")
  // ── 8. across ──
  {
    await want("Draw a line across")
    const s = await state(); const p0 = s.lines[0].p, p1 = s.lines[1].p
    const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], u = [p0[0] - p1[0], p0[1] - p1[1]], L = Math.hypot(...u)
    const dir = [u[0] / L + 0.5, u[1] / L], dl = Math.hypot(...dir)
    await drag([m[0] - dir[0] / dl * (L / 2 + 70), m[1] - dir[1] / dl * (L / 2 + 70)], [m[0] + dir[0] / dl * (L / 2 + 70), m[1] + dir[1] / dl * (L / 2 + 70)])
  }
  await want("That makes eight"); await checkPar(); await shot("eight"); await next()
  await want("Turn the crossing"); { const a = await lineAngle(2); await rotateLine(2, a + 0.5); await checkPar(); await rotateLine(2, a - 0.4); await checkPar() } await next()
  await want("Guess: how many"); await type("4")
  await want("There are only two sizes"); await sleep(2400); await checkPar(); await shot("two-sizes"); await next()
  await want("Turn it again"); { const a = await lineAngle(2); await rotateLine(2, a + 0.6); await checkPar() } await next()
  await want("Here's why"); await sleep(1700); await shot("slide"); await next()
  await want("The two crossings"); await shot("copies"); await next()
  await want("Tilt one of the parallel"); { const a = await lineAngle(0); await rotateLine(1, a - 0.15) } await shot("tilt-par"); await next()
  await want("Only parallel lines"); await next()
  await want("Make them parallel"); { const a = await lineAngle(0); await rotateLine(1, a) } await checkPar()
  // ── 9. pairs ──
  await want("These are corresponding"); await checkPar(); await next()
  await want("They make an F"); await shot("F"); await next()
  await want("Tap the angle that corresponds"); await tapAngle("B0"); await tapAngle("B1"); await shot("tap-corr-help"); await tapAngle("B3")
  await want("These are alternate"); await next()
  await want("They make a Z"); await shot("Z"); await next()
  await want("Tap the angle alternate"); await tapAngle("B0")
  await want("Why are they equal"); await next()
  await want("And these two"); await next()
  await want("So alternate"); await next()
  await want("These are co-interior"); await next()
  await want("They make a C"); await sleep(2000); await shot("C"); await checkSum(180, "AB".length ? "" : ""); await next()
  await want("Tap the angle co-interior"); await tapAngle("B3")
  await want("Which pair"); await tapText("Corresponding"); await sleep(400); await shot("quiz-wrong"); await tapText("Alternate")
  await want("Which pair"); await tapText("Co-interior")
  await want("Which pair"); await tapText("Corresponding")
  await want("Turn the crossing line. It still"); { const a = await lineAngle(2); await rotateLine(2, a - 0.45); await checkPar(); await rotateLine(2, a + 0.2); await checkPar() } await next()
  // ── 10. using them ──
  await want("Find the missing"); await shot("par-q1"); await type("65")
  await want("Find the missing"); await type("65")
  await want("Find the missing"); await type("65"); await shot("coi-help"); await type("115")
  await want("Find"); await type("72"); await shot("x-help-1"); await type("70"); await shot("x-help-2"); await type("108")
  await want("Find"); await type("115"); await shot("x2-help"); await type("65")
  await want("Here are three parallel lines"); await shot("exam"); await type("112"); await shot("exam-help"); await type("68")
  await want("Now find"); await type("68")
  await want("Make all eight"); { const a0 = await lineAngle(0); const a2 = await lineAngle(2); const r = rightDir(a0)
    const cands = [r + 70 * Math.PI / 180, r - 70 * Math.PI / 180]; const wrap = x => Math.abs(Math.atan2(Math.sin(2 * (x - a2)), Math.cos(2 * (x - a2))))
    await rotateLine(2, cands.sort((p, q) => wrap(p) - wrap(q))[0]) } await shot("seventy"); await checkPar()
  await want("Now make them"); { const a0 = await lineAngle(0); const a2 = await lineAngle(2); const r = rightDir(a0)
    const cands = [r + 45 * Math.PI / 180, r - 45 * Math.PI / 180]; const wrap = x => Math.abs(Math.atan2(Math.sin(2 * (x - a2)), Math.cos(2 * (x - a2))))
    await rotateLine(2, cands.sort((p, q) => wrap(p) - wrap(q))[0]) } await checkPar()
  // ── 11. can't ──
  await want("Make these co-interior"); { const a = await lineAngle(2); await rotateLine(2, a + 0.3); await rotateLine(2, a - 0.3) } await shot("cant")
  await next()
  await want("Do you know"); await next()
  await want("The lines would stop"); await sleep(3200); await shot("not-parallel"); await next()
  await want("These angles add up"); await sleep(2400); await checkSum(200, ""); await shot("200"); await next()
  await want("Make them parallel"); { const a = await lineAngle(0); await rotateLine(1, a) }
  await want("Co-interior angles always"); await sleep(2400); await shot("always-180"); await next()
  await want("Turn it any way"); { const a = await lineAngle(2); await rotateLine(2, a + 0.4); await checkPar() } await sleep(3600); await shot("end")
  const restart = await page.evaluate(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Start again"))
  await expect(restart, "no Start again button")

  console.log(`done, ${misses} mismatches, ${Math.round((Date.now() - t0) / 1000)}s`)
  console.log("logs:", logs.length ? [...new Set(logs)].slice(0, 10) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
