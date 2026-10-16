// Scripted play-through of Circle theorems I, the way a student would do it.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const fs = require("fs")
const OUT = outDir("play-circle-1")
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || HOST + "/learn/circle-theorems-1?debug"
const W = +(process.env.W || 1440), H = +(process.env.H || 900)
const TOUCH = !!process.env.TOUCH
const sleep = ms => new Promise(r => setTimeout(r, ms))
const D2R = Math.PI / 180

;(async () => {
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
      if (p && p.startsWith(prefix) && bs !== lastStart) { lastStart = bs; await sleep(700); return true }
      await sleep(100)
    }
    fail(`wanted ${JSON.stringify(prefix)} but phrase is ${JSON.stringify(await phrase())}`)
    return false
  }
  const press = async (x, y) => { if (TOUCH) await page.touchscreen.touchStart(x, y); else { await page.mouse.move(x, y); await page.mouse.down() } }
  const moveTo = async (x, y) => { if (TOUCH) await page.touchscreen.touchMove(x, y); else await page.mouse.move(x, y) }
  const release = async () => { if (TOUCH) await page.touchscreen.touchEnd(); else await page.mouse.up() }
  const path = async pts => { await press(...pts[0]); for (const p of pts.slice(1)) { await moveTo(...p); await sleep(12) } await release(); await sleep(300) }
  const drag = async (a, b, steps = 18) => { const pts = []; for (let i = 0; i <= steps; i++) pts.push([a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await path(pts) }
  const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await sleep(300) }
  const tapSel = async sel => { const el = await page.$(sel); if (!el) return fail("no element " + sel); const b = await el.boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2) }
  const next = async (ms = 24000) => {
    try { await page.waitForSelector("[class*=ctaWrap] button", { timeout: ms }) } catch { return fail("no continue button on " + JSON.stringify(await phrase())) }
    await sleep(250); await tapSel("[class*=ctaWrap] button"); await sleep(300)
  }
  const type = async str => {
    if (TOUCH) { for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(70) } await tapSel('button[aria-label="Check"]'); await sleep(650); return }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(70) } await page.keyboard.press("Enter"); await sleep(650)
  }
  const expect = async (cond, msg) => { if (!cond) fail(msg + " on " + JSON.stringify(await phrase())) }

  const geo = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    const L = A.layout(S)
    const pts = {}
    for (const n of Object.keys(S.pts)) pts[n] = { a: S.ptsD[n], p: A.posOf(S, n) }
    return { O: S.OD, R: S.RD, L, pts, note: S.note && S.note.text, input: S.input && S.input.state, locked: S.locked }
  })
  const vals = () => page.evaluate(() => {
    const S = window.__beatScene, A = window.__beatApi
    return Object.fromEntries(A.angleList(S, A.layout(S)).map(a => [a.id, a.value]))
  })
  const at = (g, deg) => [g.O[0] + Math.cos(deg * D2R) * g.R, g.O[1] + Math.sin(deg * D2R) * g.R]
  /** Slide a point round the circle by `by` degrees, in small steps. */
  const slide = async (name, by) => {
    const g = await geo()
    const a0 = g.pts[name].a / D2R
    const steps = Math.max(6, Math.ceil(Math.abs(by) / 3))
    const pts = []
    for (let i = 0; i <= steps; i++) pts.push(at(g, a0 + by * i / steps))
    await path(pts); await sleep(400)
  }
  /** Slide a point to an angle (degrees), going the short way unless told. */
  const slideTo = async (name, deg, dir) => {
    const g = await geo()
    const a0 = g.pts[name].a / D2R
    let d = ((deg - a0) % 360 + 540) % 360 - 180
    if (dir && Math.sign(d) !== dir) d += dir * 360
    await slide(name, d)
  }
  const tapAngle = async id => {
    const p = await page.evaluate(id => {
      const S = window.__beatScene, A = window.__beatApi
      const a = A.angleList(S, A.layout(S)).find(x => x.id === id)
      if (!a) return null
      const m = a.start + a.sweep / 2
      return [a.c[0] + Math.cos(m) * a.r * 0.6, a.c[1] + Math.sin(m) * a.r * 0.6]
    }, id)
    if (!p) return fail("no angle " + id)
    await tap(...p)
  }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const twice = async () => { const v = await vals(); await expect(v.C0 === 2 * v.P, `centre ${v.C0} is not twice ${v.P}`) }

  // ── 1. your circle ──
  await want("Tap to place"); await shot("empty"); await tap(W / 2 + 20, H / 2 + 30)
  await want("Now drag out")
  {
    const g = await geo()
    await drag(g.O, [g.O[0] + 30, g.O[1] - 10]); await expect((await geo()).note, "no note for a tiny circle")
    await sleep(300)
    const mid = g.L.Rmax * 0.6
    await drag(g.O, [g.O[0] + mid * 0.8, g.O[1] - mid * 0.6], 20); await expect((await geo()).note, "no note for a middling circle"); await sleep(300)
    const R = g.L.Rmax * 0.9
    await drag(g.O, [g.O[0] + R * 0.8, g.O[1] - R * 0.6], 24); await sleep(700); await shot("drawn")
    { const g2 = await geo(); await expect(Math.abs(g2.R - g2.L.Rmax) < 2, "circle is not the biggest: " + g2.R + " vs " + g2.L.Rmax) }
  }
  await want("This point is the centre"); await shot("centre"); await next()
  await want("Drag this point"); await slide("T", 120); await slide("T", 100); await shot("radius"); await next()
  await want("It always stays"); await next()
  await want("That distance is"); await shot("r"); await next()
  // ── 2. parts ──
  {
    await want("Draw a line across the circle")
    let g = await geo()
    await drag([g.O[0] - g.R * 0.9, g.O[1] + g.R * 0.5], [g.O[0] + g.R * 0.9, g.O[1] + g.R * 0.4]); await expect((await geo()).note, "no note for a line missing the centre")
    await sleep(400)
    g = await geo()
    await drag([g.O[0] - g.R * 0.92, g.O[1] + g.R * 0.08], [g.O[0] + g.R * 0.92, g.O[1] - g.R * 0.08]); await shot("diameter")
  }
  await want("That's a diameter"); await shot("diameter-word"); await next()
  await want("It's two radii"); await expect((await geo()).note, "no note saying what radii means"); await shot("two-radii"); await next()
  {
    await want("Now draw a line across that misses")
    let g = await geo()
    await drag([g.O[0] - g.R * 0.7, g.O[1] - g.R * 0.7], [g.O[0] + g.R * 0.7, g.O[1] + g.R * 0.7]); await expect((await geo()).note, "no note for a line through the centre")
    await sleep(400)
    g = await geo()
    await drag([g.O[0] - g.R * 0.95, g.O[1] + g.R * 0.45], [g.O[0] + g.R * 0.95, g.O[1] + g.R * 0.25]); await shot("chord")
  }
  await want("A line joining"); await next()
  await want("The circle itself"); await next()
  await want("A chord cuts"); await next()
  await want("Each part is"); await shot("segments"); await next()
  {
    await want("Tap the smaller")
    let g = await geo()
    await tap(g.O[0], g.O[1] - g.R * 0.3); await expect((await geo()).note, "no note tapping the big segment")
    const E = g.pts.E.p, F = g.pts.F.p, M = lerp(E, F, 0.5)
    const d = [M[0] - g.O[0], M[1] - g.O[1]], l = Math.hypot(...d), off = l
    await tap(g.O[0] + d[0] / l * (off + g.R) / 2, g.O[1] + d[1] / l * (off + g.R) / 2); await shot("small-seg")
  }
  {
    await want("Tap a radius")
    const g = await geo()
    await tap(...lerp(g.O, g.pts.A.p, 0.6)); await expect((await geo()).note, "no note tapping the diameter")
    await tap(...lerp(g.O, g.pts.T.p, 0.55))
  }
  { await want("Tap the chord"); const g = await geo(); await tap(...lerp(g.O, g.pts.T.p, 0.5)); await expect((await geo()).note, "no note tapping the radius"); await tap(...lerp(g.pts.E.p, g.pts.F.p, 0.5)) }
  { await want("Tap the diameter"); const g = await geo(); await tap(...lerp(g.O, g.pts.A.p, 0.6)) }
  // ── 3. semicircle ──
  await want("Here's your diameter"); await shot("AB"); await next()
  {
    await want("Tap the circle to put")
    const g = await geo()
    await tap(g.O[0] + g.R * 0.3, g.O[1]); await expect((await geo()).note, "no note tapping inside the circle")
    const aA = g.pts.A.a / D2R
    const c1 = at(g, aA + 105), c2 = at(g, aA - 105)
    await tap(...(c1[1] < c2[1] ? c1 : c2)); await shot("P")
  }
  await want("Join")
  {
    const g = await geo()
    await drag(g.pts.P.p, g.pts.A.p)
    await drag(g.pts.A.p, g.pts.B.p); await expect((await geo()).note, "no note for a join that is not asked")
    await sleep(300)
    await drag(g.pts.P.p, g.pts.B.p); await shot("joined")
  }
  await want("There's an angle"); { const v = await vals(); await expect(v.P === 90, "semicircle angle " + v.P) } await next()
  await want("Its two lines"); await shot("arms"); await next()
  await want("We say"); await next()
  await want("Move")
  {
    for (const by of [40, -70, 50]) { await slide("P", by); const v = await vals(); await expect(v.P === 90, "semicircle angle " + v.P) }
    // P may cross into the other semicircle
    const side = g => Math.sign(Math.sin(g.pts.P.a - g.pts.A.a))
    const before = side(await geo())
    await slide("P", 200); await slide("P", 0)
    const after = side(await geo())
    await expect(before !== after, "P could not cross into the other semicircle")
    const v = await vals(); await expect(v.P === 90, "after crossing " + v.P)
  }
  await shot("still-90"); await next()
  await want("Try to make it"); await slide("P", 30); await next()
  await want("You can't"); await shot("semi"); await next()
  await want("Move"); await slide("A", 30); await slide("A", -25); { const v = await vals(); await expect(v.P === 90, "after moving A " + v.P) } await shot("moved-A"); await next()
  await want("Find the missing"); { const v = await vals(); await expect(v.tA + v.tB + v.tP === 180, "triangle " + JSON.stringify(v)) } await type("50"); await shot("semi-help"); await type("55")
  // ── 4. same segment ──
  {
    await want("Now move")
    const g = await geo()
    const away = Math.sign(((g.pts.B.a - g.pts.P.a) / D2R % 360 + 540) % 360 - 180) || 1
    await slide("B", 35 * away)
  }
  await want(""); { const v0 = (await vals()).P; await slide("P", 25); await slide("P", -50); await slide("P", 40); const v1 = (await vals()).P; await expect(v0 === v1, `angle changed ${v0} → ${v1}`) } await shot("chord-P"); await next()
  await want("It stays"); await next()
  await want("Move"); { await slide("B", 12); await slide("B", -12); await slide("P", 30); await slide("P", -30) } await next()
  await want("Here's a second"); { const v = await vals(); await expect(v.P === v.Q, `P ${v.P} Q ${v.Q}`) } await shot("Q"); await next()
  {
    await want("Tap the two points")
    const g = await geo()
    await tap(...g.pts.P.p); await expect((await geo()).note, "no note tapping P")
    await tap(...g.pts.A.p); await tap(...g.pts.B.p); await shot("tapped-AB")
  }
  await want(""); await shot("same-two"); await next()
  await want("Move")
  {
    await slide("Q", 15); await slide("Q", -30)
    // Q may pass P (but not A or B)
    const g = await geo()
    const rel = ((g.pts.P.a - g.pts.Q.a) / D2R % 360 + 540) % 360 - 180
    await slide("Q", rel + Math.sign(rel) * 12)
    const g2 = await geo()
    const rel2 = ((g2.pts.P.a - g2.pts.Q.a) / D2R % 360 + 540) % 360 - 180
    await expect(Math.sign(rel2) !== Math.sign(rel), "Q could not pass P")
    const v = await vals(); await expect(v.P === v.Q, `P ${v.P} Q ${v.Q}`)
  }
  await next()
  await want(""); await next()
  await want("Angles in the same"); await next()
  await want("Both angles must"); await shot("same-two-rule"); await next()
  {
    await want("Now move")
    const g = await geo()
    const dA = Math.abs(((g.pts.Q.a - g.pts.A.a) / D2R % 360 + 540) % 360 - 180), dB = Math.abs(((g.pts.Q.a - g.pts.B.a) / D2R % 360 + 540) % 360 - 180)
    const end = dA < dB ? "A" : "B"
    const d = ((g.pts[end].a - g.pts.Q.a) / D2R % 360 + 540) % 360 - 180
    await slide("Q", d + Math.sign(d) * 40); await shot("Q-across")
  }
  await want("In the other"); await next()
  await want("Find the missing"); await type("38")
  // ── 5. centre ──
  { await want("Join"); const g = await geo(); await drag(g.pts.A.p, g.O); await drag(g.pts.B.p, g.O); await shot("joined-O") }
  await want("This is the angle at the centre"); await twice(); await next()
  {
    await want("Tap the two points")
    const g = await geo()
    await tap(...g.pts.P.p); await expect((await geo()).note, "no note tapping P")
    await tap(...g.pts.A.p); await tap(...g.pts.B.p)
  }
  await want("The angle at"); await next()
  await want("Both angles are made"); await next()
  await want("Move"); { await slide("B", 20); await twice(); await slide("B", -35); await twice() } await next()
  await want("Guess"); await type("3")
  await want("It's twice"); await next()
  await want("Move"); { await slide("B", 25); await twice(); await slide("P", 40); await twice(); await slide("P", -40); await twice() } await shot("still-twice"); await next()
  await want("The angle at the centre is twice"); await next()
  await want("Both must"); await next()
  {
    await want("Move")
    const g = await geo()
    const dA = ((g.pts.A.a - g.pts.P.a) / D2R % 360 + 540) % 360 - 180, dB = ((g.pts.B.a - g.pts.P.a) / D2R % 360 + 540) % 360 - 180
    const d = Math.abs(dA) < Math.abs(dB) ? dA : dB
    await slide("P", d + Math.sign(d) * 45); await twice(); await shot("reflex")
  }
  await want("Now the centre"); await twice(); await next()
  await want("Find the angle at the centre"); await type("84")
  await want("Find the angle at"); await type("60"); await shot("centre-help"); await type("65")
  // ── 6. why ──
  {
    await want("Why is it twice")
    let g = await geo()
    await drag(g.pts.A.p, lerp(g.pts.A.p, g.O, 1.6)); await expect((await geo()).note, "no note for a line from A")
    await sleep(400)
    g = await geo()
    await drag(g.pts.P.p, lerp(g.pts.P.p, g.O, 1.7)); await shot("through")
  }
  await want("It splits"); await next()
  await want(""); await next()
  await want("So triangle"); await next()
  await want("Tap the two"); await tapAngle("aA"); await sleep(500); await shot("flying"); await tapAngle("aP"); await sleep(1300)
  await want("They fill"); await shot("filled"); await next()
  await want("In the triangle"); await next()
  await want("On the straight"); await shot("straight"); await next()
  await want("So the gap"); await next()
  await want("Tap the two"); await tapAngle("bB"); await tapAngle("bP"); await sleep(1300)
  await want("The angle at P is a"); { const v = await vals(); await expect(v.aP === v.aA && v.bP === v.bB, "base angles " + JSON.stringify(v)) } await shot("both"); await next()
  await want("So the centre"); await next()
  await want("Move"); { await slide("P", 15); await slide("P", -25); const v = await vals(); await expect(v.aP === v.aA && v.bP === v.bB && v.gapA === 2 * v.aP, "proof values " + JSON.stringify(v)) } await shot("proof-play"); await next()
  // ── 7. one idea ──
  await want("Drag"); await slideTo("B", -30, -1); await shot("diameter-made")
  await want("The angle at the centre is now"); { const v = await vals(); await expect(v.C0 === 180 && v.P === 90, "straight " + JSON.stringify(v)) } await next()
  await want("Half of"); await next()
  await want(""); { const v = await vals(); await expect(v.P === v.Q && v.C0 === 2 * v.P, "share " + JSON.stringify(v)) } await next()
  await want("Each is half"); await next()
  // ── 8. use it ──
  await want("Find the missing"); await type("66")
  await want("Find the missing"); await type("32")
  await want("Find"); await type("125")
  await want("Find angle"); await type("70"); await shot("OAB-help-1"); await type("35"); await shot("OAB-help-2"); await type("55")
  await want(""); await shot("exam"); await type("90"); await type("24"); await shot("exam-help"); await type("114")
  // ── 9. build ──
  await want("Make the angle at"); await slideTo("B", 89); await expect((await geo()).locked, "30 not locked"); { const v = await vals(); await expect(v.P === 30 && v.C0 === 60, "30: " + JSON.stringify(v)) }
  await want("Now make the angle"); await slideTo("B", 11); { const v = await vals(); await expect(v.C0 === 140, "140: " + JSON.stringify(v)) }
  await want("Make the angle at"); await slideTo("B", -29, -1); { const v = await vals(); await expect(v.P === 90, "90: " + JSON.stringify(v)) }
  await want("The only way"); await next()
  // ── 10. can't ──
  await want("Make "); await slideTo("B", 51); { const v = await vals(); await expect(v.P === 50, "50: " + JSON.stringify(v)) } await shot("chip-50"); await slideTo("B", 31); { const v = await vals(); await expect(v.C0 === 120, "120: " + JSON.stringify(v)) } await shot("chip-120"); await next()
  await want("Do you know"); await next()
  await want("With "); await next()
  await want("And "); await next()
  await want("The angle at the centre is always"); await next()
  await want("Move anything"); await slide("P", 20); await twice(); await slide("A", -15); await twice(); await sleep(3500); await shot("end")
  const restart = await page.evaluate(() => [...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Start again"))
  await expect(restart, "no Start again button")

  console.log(`done, ${misses} mismatches, ${Math.round((Date.now() - t0) / 1000)}s`)
  console.log("logs:", logs.length ? [...new Set(logs)].slice(0, 10) : "none")
  await browser.close()
})().catch(e => { console.error(e); process.exit(1) })
