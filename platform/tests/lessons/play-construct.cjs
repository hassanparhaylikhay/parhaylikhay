// Scripted play-through of "Constructing triangles", beat by beat: the
// compasses opened on the ruler (to the wrong length first where a note
// waits), carried by the top onto a place, turned round to draw (too short
// first, once), C dragged round 4 cm from A, crossings tapped (the wrong
// one first where there is one), angles measured with the protractor laid
// along the other line from the one Show me how uses, sides measured, and
// lengths converted with the scale. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("constructing-triangles", "play-construct")
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

  // ── the compasses ──
  const comp = () => api("compAt")
  const cst = () => page.evaluate(() => { const C = window.__beatScene.comp; return C && { open: C.open, on: C.on, dir: C.dir, point: C.point } })
  /** Slide the pencil leg along the ruler to a length. */
  const openComp = async len => {
    await sleep(500)
    const g = await comp()
    const to = [g.P[0] + g.e[0] * g.u * len, g.P[1] + g.e[1] * g.u * len]
    await path([g.Q, [(g.Q[0] + to[0]) / 2, (g.Q[1] + to[1]) / 2], to])
    await sleep(500)
  }
  /** Carry them by the point, so it lands (a little off) on a place. */
  const carryComp = async place => {
    await sleep(500)
    const g = await comp(), t = await api("ptS", place)
    // held by the point, dropped a little off the place (it clicks on)
    await path([g.P, [(g.P[0] + t[0]) / 2, (g.P[1] + t[1]) / 2], [t[0] + 10, t[1] + 6]])
    await sleep(500)
    await expect((await cst()).on === place, `compasses not on ${place}`)
  }
  /** Draw: turn the pencil round the point from where it is to a bearing, the way `sign` says (+1 clockwise). */
  const drawTo = async (to, sign) => {
    await sleep(400)
    const g = await comp(), c = await cst()
    const R = Math.hypot(g.Q[0] - g.P[0], g.Q[1] - g.P[1])
    let span = ((to - c.dir) % 360 + 360) % 360
    if (sign < 0) span = span - 360
    const n = Math.max(6, Math.ceil(Math.abs(span) / 8)), pts = []
    for (let i = 0; i <= n; i++) { const b = (c.dir + (span * i) / n) * Math.PI / 180; pts.push([g.P[0] + Math.sin(b) * R, g.P[1] - Math.cos(b) * R]) }
    await path(pts)
    await sleep(600)
  }
  /** An arc through a bearing: from where the pencil is, round past it by 35 degrees. */
  const arcThrough = async b => {
    const c = await cst()
    const d = ((b - c.dir) % 360 + 540) % 360 - 180
    await drawTo(b + Math.sign(d || 1) * 35, Math.sign(d || 1))
  }
  /** Open, carry, draw: the three jobs of an arc beat. */
  const compAll = async (place, len, through, wrong) => {
    if (wrong !== undefined) { await openComp(wrong); await expect(/need/.test((await st()).note || ""), `no note for opening to ${wrong}`) }
    await openComp(len)
    await expect(Math.abs((await cst()).open - len) < 1e-6, `not opened to ${len} (${(await cst()).open})`)
    await carryComp(place)
    await arcThrough(through)
  }
  const brgW = (p, q) => ((Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI) % 360 + 360) % 360
  /** Where two circles cross (the one on the left of a to b first), as the lesson works it out. */
  const circles = (a, r1, b, r2) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]), x = (d * d + r1 * r1 - r2 * r2) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - x * x))
    const e = [(b[0] - a[0]) / d, (b[1] - a[1]) / d], n = [-e[1], e[0]], m = [a[0] + e[0] * x, a[1] + e[1] * x]
    return [[m[0] + n[0] * h, m[1] + n[1] * h], [m[0] - n[0] * h, m[1] - n[1] * h]]
  }
  const along = (p, b, d) => [p[0] + Math.sin(b * Math.PI / 180) * d, p[1] + Math.cos(b * Math.PI / 180) * d]
  const tapW = async w => { await tap(...(await api("projAt", w))); await sleep(400) }
  /** Arc beat for a corner C of a triangle on base AB: through C from `at`. */
  const P = async () => (await st()).P
  const C6 = circles([0, 0], 4, [6, 0], 5)[0]
  const C24 = circles([0, 0], 5, [8, 0], 10)[0], C25 = circles([0, 0], 6, [8.5, 0], 7)[0]
  const W19B = along([0, 0], 110, 8), [C19, C19b] = circles([0, 0], 5, W19B, 7)
  const RB = circles([0, 0], 5, [8, 0], 5)[0], RD = circles([0, 0], 5, [8, 0], 5)[1]
  const S21A = [0, 10], S21C = [0, 0], [S21B, S21Bb] = circles(S21A, 8, S21C, 6), S21D = along(S21A, 230, 4.5)
  const FA = [0, -4], FC = along([0, 0], 70, 7.07), FD = circles(FC, 5, FA, 6)[0]

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "open-3") { await openComp(3); continue }
    if (id === "put-a" || id === "c-put") { await carryComp("A"); continue }
    if (id === "turn-a") { await drawTo(150, 1); await said(/Keep going/, "after a short arc"); await drawTo(20, -1); await drawTo(359, 1); continue }
    if (id === "c-4") { const w = along([0, 0], 48, 4.06); await sleep(400); await path([await api("ptS", "C"), await api("projAt", w)]); await sleep(500); continue }
    if (id === "c-more") {
      const pts = []
      for (let b = 48; b <= 330; b += 6) pts.push(await api("projAt", along([0, 0], b, 4.02)))
      await sleep(300); await path([await api("ptS", "C"), ...pts]); await sleep(600)
      await expect((await page.evaluate(() => window.__beatScene.keep.trail)) >= 5, "not five places")
      await next(); continue
    }
    if (id === "c-open") { await openComp(4); continue }
    if (id === "c-draw") { await drawTo(10, 1); await said(/further/, "after an arc short of C"); await arcThrough(brgW([0, 0], C6)); continue }
    if (id === "c-b") { await compAll("B", 5, brgW([6, 0], C6), 4); continue }
    if (id === "c-tap") { await tapW(C6); continue }
    if (id === "s24-a") { await compAll("A", 5, brgW([0, 0], C24), 10); continue }
    if (id === "s24-b") { await compAll("B", 10, brgW([8, 0], C24), 5); continue }
    if (id === "s24-c") { await tapW([4, 3]); await noted("a tap away from the crossing"); await tapW(C24); continue }
    // along AC this time (Show me how lays it along AB)
    if (id === "s24-prot") { await putProt("A"); await turnProt(brgW([0, 0], C24)); continue }
    if (id === "s24-read") { await slip("82", /other row/); await right("98"); continue }
    if (id === "w25-a") { await compAll("A", 6, brgW([0, 0], C25)); continue }
    if (id === "w25-b") { await compAll("B", 7, brgW([8.5, 0], C25)); continue }
    if (id === "w25-c") { await tapW(C25); continue }
    if (id === "w25-prot") { await putProt("A"); await turnProt(270); continue }
    if (id === "w25-read") { await slip("125", /other row/); await right("54"); continue }
    // long arcs, so the crossing below AB is drawn too (and tapped first: C is above)
    if (id === "w19-a") { await openComp(5); await carryComp("A"); await drawTo(30, 1); await drawTo(190, 1); continue }
    if (id === "w19-b") { await openComp(7); await carryComp("B"); await drawTo(240, -1); await drawTo(340, 1); continue }
    if (id === "w19-c") { await tapW(C19b); await said(/below/, "for the crossing below AB"); await tapW(C19); continue }
    if (id === "no-a") { await compAll("A", 3, 70); await drawTo(170, 1); continue }
    if (id === "no-b") { await compAll("B", 4, 290); await drawTo(200, -1); continue }
    if (id === "rh-a") { await compAll("A", 5, brgW([0, 0], RB)); continue }
    if (id === "rh-c") { await compAll("C", 5, brgW([8, 0], RB)); continue }
    if (id === "rh-b") { await tapW(RB); continue }
    if (id === "rh-a2") { await arcThrough(brgW([0, 0], RD)); continue }
    if (id === "rh-c2") { await arcThrough(brgW([8, 0], RD)); continue }
    if (id === "rh-d") { await tapW(RD); continue }
    // long arcs, so the crossing on the left is drawn too: round the left side first (too short, a note), then on round through B
    if (id === "s21-a") { await openComp(6); await said(/need/, "opened to 6 at A"); await openComp(8); await carryComp("A"); await drawTo(200, -1); await said(/further/, "an arc short of B"); await drawTo(113, -1); continue }
    if (id === "s21-c") { await openComp(6); await carryComp("C"); await drawTo(320, 1); await drawTo(80, 1); continue }
    if (id === "s21-b") { await tapW(S21Bb); await said(/left/, "for the crossing on the left"); await tapW(S21B); continue }
    if (id === "s21-prot") { await putProt("A"); await turnProt(0); await said(/left/, "on the wrong side"); await turnProt(180); continue }
    if (id === "s21-50") { await markProt(310); await said(/other row/, "at the other row's 50"); await markProt(230); continue }
    if (id === "s21-45") { await penTo(4.5); continue }
    if (id === "s21-pd") { await putProt("D"); await turnProt(brgW(S21D, S21A)); continue }
    if (id === "s21-adc") { await slip("76", /other row/); await right("104"); continue }
    // DC measured from C (its 0 on C): it counts the same
    if (id === "s21-lay") { await layRuler("C", "D"); continue }
    if (id === "s21-dc") { await right("7.9"); continue }
    if (id === "s21-per") { await slip("22.5", null); await right("26.4"); continue }
    if (id === "field-5") { await slip("50", null); await right("5"); continue }
    if (id === "field-6") { await right("6"); continue }
    if (id === "field-c") { await compAll("C", 5, brgW(FC, FD)); continue }
    if (id === "field-a") { await compAll("A", 6, brgW(FA, FD)); continue }
    if (id === "field-d") { await tapW(FD); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
