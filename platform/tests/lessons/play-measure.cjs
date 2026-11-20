// Scripted play-through of "Measuring and drawing angles", beat by beat:
// the protractor put on a corner and turned (along the wrong line first, and
// once the other way round from the one asked, which also counts), angles
// read with the other row's number first, angles marked with the pencil
// (on the other row first), the crossing tapped, a length marked with the
// ruler's pencil, sides measured with the ruler laid from either end.
// FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("measuring-angles", "play-measure")
  const { page, next, tap, tapSel, path, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, got: [...s.got], mode: s.mode,
      ruler: s.ruler && { on: s.ruler.on, along: s.ruler.along, dir: s.ruler.dir, len: s.ruler.len, pen: s.ruler.pen },
      prot: s.prot && { on: s.prot.on, rot: s.prot.rot, pen: s.prot.pen }, P: s.P }
  })
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const idNow = () => page.evaluate(() => window.__beatApi.beats[window.__beatIdx ?? 0].id)
  const at = async (id, ms = 30000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      if ((await idNow()) === id && !(await page.$("[class*=card]"))) { await sleep(700); return true }
      await sleep(120)
    }
    fail(`never reached ${id} (on ${await idNow()})`)
    return false
  }
  const noted = async what => expect((await st()).note, "no note after " + what)
  const D = b => [Math.sin(b * Math.PI / 180), -Math.cos(b * Math.PI / 180)]
  const brg = (p, q) => ((Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI) % 360 + 360) % 360
  /** A path round a centre on the screen, from one bearing to another (the short way). */
  const arc = (c, r, from, to, extra = [0, 0]) => {
    const d = ((to - from) % 360 + 540) % 360 - 180, pts = []
    for (let i = 0; i <= 18; i++) { const b = from + (d * i) / 18, u = D(b); pts.push([c[0] + u[0] * r + extra[0], c[1] + u[1] * r + extra[1]]) }
    return pts
  }

  // ── the ruler ──
  const layRuler = async (on, to) => {
    await sleep(600)
    let r = await api("rulerAt")
    const target = await api("ptS", on)
    // carry it by its body so its 0 lands on the place
    await path([r.body, [r.body[0] + (target[0] - r.zero[0]) * 0.5, r.body[1] + (target[1] - r.zero[1]) * 0.5], [r.body[0] + target[0] - r.zero[0], r.body[1] + target[1] - r.zero[1]]])
    await sleep(300)
    const s = await st()
    await expect(s.ruler.on === on, `ruler's 0 is not on ${on}`)
    // turn it by its end, round its 0, until its edge points at the other place
    r = await api("rulerAt")
    const want = brg(s.P[on], s.P[to]), now = s.ruler.dir, L = r.turnT * r.u
    const end = [r.zero[0] + r.e[0] * L, r.zero[1] + r.e[1] * L], half = [r.turn[0] - end[0], r.turn[1] - end[1]], hw = Math.hypot(...half)
    const pts = []
    for (let i = 0; i <= 18; i++) {
      const b = now + ((((want - now) % 360) + 540) % 360 - 180) * i / 18, e = D(b), n = [e[1], -e[0]]
      pts.push([r.zero[0] + e[0] * L + n[0] * hw, r.zero[1] + e[1] * L + n[1] * hw])
    }
    await path(pts)
    await sleep(400)
    const s2 = await st()
    await expect(s2.ruler.along === to, `ruler not along ${on}${to} (dir ${s2.ruler.dir})`)
  }
  // ── the protractor ──
  /** Carry the protractor by its centre onto a place (dropped a little off it: it clicks on). */
  const putProt = async (on, miss = 14) => {
    await sleep(600)
    const p = await api("protAt")
    const target = await api("ptS", on)
    await path([[p.c[0] + 4, p.c[1] + 4], [(p.c[0] + target[0]) / 2 + 4, (p.c[1] + target[1]) / 2 + 4], [target[0] + miss, target[1] + 4]])
    await sleep(300)
    await expect((await st()).prot.on === on, `protractor not on ${on}`)
  }
  /** Turn it by its handle (which only comes once it is on a place). */
  const turnProt = async rot => {
    await sleep(500)
    const p = await api("protAt"), s = await st()
    // its handle may be at the other end (or the top) when its 0 end is off the screen
    const b0 = ((Math.atan2(p.turn[0] - p.c[0], p.c[1] - p.turn[1]) * 180 / Math.PI) % 360 + 360) % 360, off = b0 - s.prot.rot
    await path(arc(p.c, p.R + 14, b0, rot + off))
    await sleep(400)
    await expect(Math.abs((await st()).prot.rot - rot) < 0.01, `protractor not turned to ${rot} (is ${(await st()).prot.rot})`)
  }
  const placeProt = async (on, rot) => { await putProt(on); await turnProt(rot) }
  const markProt = async b => {
    await sleep(600)
    const p = await api("protAt"), s = await st()
    await path(arc(p.c, p.R + 2, s.prot.pen, b))
    await sleep(500)
  }
  /** Where two lines cross (world), on the screen. */
  const crossAt = async (a, b1, b, b2) => {
    const s = await st(), p = s.P[a], q = s.P[b]
    const d1 = [Math.sin(b1 * Math.PI / 180), Math.cos(b1 * Math.PI / 180)], d2 = [Math.sin(b2 * Math.PI / 180), Math.cos(b2 * Math.PI / 180)]
    const det = d1[0] * -d2[1] - d1[1] * -d2[0], r = [q[0] - p[0], q[1] - p[1]]
    const t = (r[0] * -d2[1] - r[1] * -d2[0]) / det
    return api("projAt", [p[0] + d1[0] * t, p[1] + d1[1] * t])
  }

  const type = async str => {
    if (TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str ?? "typed"}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }

  /** Choose Less or More. */
  const pickIdx = async k => {
    for (let i = 0; i < 50 && (await page.$$("[class*=choices] button")).length <= k; i++) await sleep(100)
    const bs = await page.$$("[class*=choices] button")
    if (bs.length <= k) return fail("no choice " + k)
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(600)
  }
  /** Slide the ruler's pencil to a length. */
  const penTo = async len => {
    await sleep(600)
    const r = await api("rulerAt")
    const to = [r.zero[0] + r.e[0] * r.u * len, r.zero[1] + r.e[1] * r.u * len]
    await path([r.pen, [(r.pen[0] + to[0]) / 2, (r.pen[1] + to[1]) / 2], to])
    await sleep(600)
  }
  const said = async (re, what) => expect(re.test((await st()).note || ""), `no note like ${re} ${what}: ${(await st()).note}`)

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "guess-a") { await pickIdx(1); await expect(/Let's see/.test((await st()).note || ""), "no Let's see"); continue }
    if (id === "guess-b") { await pickIdx(1); await expect(/Spot on/.test((await st()).note || ""), "no Spot on"); continue }
    if (id === "on-a" || id === "s23-on") { await putProt("A"); if (id === "s23-on") { await turnProt(90); await said(/above/, "on the wrong side"); await turnProt(270) } continue }
    // along AC first: the phrase asked for AB
    if (id === "turn-a") { await turnProt(60); await said(/AC/, "along AC"); await turnProt(270); continue }
    if (id === "read-a") { await slip("150", /other row/); await right(); continue }
    if (id === "on-b") { await putProt("B"); continue }
    // the other line from the one the walkthrough uses: it counts, and the reading follows it
    if (id === "turn-b") { await turnProt(205); continue }
    if (id === "read-b") { await slip("65", /other row/); await right("115"); continue }
    if (id === "d-on") { await putProt("Q"); continue }
    if (id === "d-turn") { await turnProt(90); await said(/above/, "on the wrong side"); await turnProt(270); continue }
    if (id === "d-mark") { await markProt(310); await said(/other row/, "at the other row's 40"); await markProt(50); continue }
    if (id === "d-130") { await markProt(40); await said(/other row/, "at the other row's 130"); await markProt(320); continue }
    if (id === "w19-a") { await putProt("A"); await turnProt(290); await said(/below/, "on the wrong side"); await turnProt(110); continue }
    if (id === "w19-a28") { await markProt(138); continue }
    if (id === "w19-b") { await putProt("B"); await turnProt(110); continue }
    if (id === "w19-b96") { await markProt(206); await said(/other row/, "at the other row's 96"); await markProt(194); continue }
    if (id === "w19-d") { const c = await crossAt("A", 138, "B", 194); await tap(c[0] - 90, c[1] - 60); await noted("a tap away from the crossing"); await sleep(300); await tap(...c); continue }
    if (id === "s23-105") { await markProt(15); await said(/other row/, "at the other row's 105"); await markProt(345); continue }
    if (id === "s23-83") { await penTo(8.3); continue }
    // AB laid from B (its 0 on B): it counts the same
    if (id === "s23-lay-ab") { await layRuler("B", "A"); continue }
    if (id === "s23-ab") { await slip("9.3", null); await said(/Close/, "for 9.3"); await right("9"); continue }
    if (id === "s23-lay-bc") { await layRuler("B", "C"); continue }
    if (id === "s23-bc") { await right("13.7"); continue }
    if (id === "s23-per") { await slip("30", null); await right("31"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
