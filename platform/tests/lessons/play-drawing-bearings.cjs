// Scripted play-through of "Measuring and drawing bearings", beat by beat:
// the protractor put on a place and turned, pencil marks, the crossing
// tapped, answers typed (with a wrong one at each kind of task).
// FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("drawing-bearings", "play-drawing-bearings")
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
    await path(arc(p.c, p.R + 14, s.prot.rot, rot))
    await sleep(400)
    await expect((await st()).prot.rot === rot, `protractor not turned to ${rot} (is ${(await st()).prot.rot})`)
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

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    // the centre dropped 22 px off A still clicks on, and the beat needs no turn
    if (id === "prot-on") { await putProt("A", 22); continue }
    if (id === "prot-turn") {
      // turned by its body (it stays on A): held anywhere on it, it turns
      const p = await api("protAt"), s = await st()
      const grab = s.prot.rot + 90
      await path(arc(p.c, p.R * 0.6, grab, grab - 40))
      await sleep(500)
      await expect((await idNow()) !== "prot-turn" || (await st()).prot.rot === 0, `protractor turned by its body to ${(await st()).prot.rot}`)
      continue
    }
    if (id === "c-on" || id === "x1-on") { await putProt("A"); continue }
    if (id === "b-on" || id === "x1-bon" || id === "x3-on") { await putProt("B"); continue }
    if (id === "c-turn" || id === "x1-turn" || id === "x3-turn") { await turnProt(0); continue }
    if (id === "left-turn" || id === "b-turn" || id === "x1-bturn") { await turnProt(180); continue }
    if (id === "read-110") { await slip("070", /other row/); await right(); continue }
    if (id === "left-read") { await slip("60", /other row/); await right(); continue }
    if (id === "left-brg") { await slip("120", /left/); await right(); continue }
    if (id === "left-40") { await slip("140", /360/); await right(); continue }
    if (id === "x1-left") { await slip("72", /360/); await right(); continue }
    if (id === "mark-60") { await markProt(60); continue }
    if (id === "mark-40") { await markProt(320); continue }
    if (id === "x1-164") { await markProt(164); continue }
    if (id === "x1-252") { await markProt(252); continue }
    if (id === "c-tap") { const c = await crossAt("A", 60, "B", 320); await tap(c[0] - 80, c[1] + 70); await noted("a tap away from the crossing"); await sleep(300); await tap(...c); continue }
    if (id === "x1-ctap") { await tap(...(await crossAt("A", 164, "B", 252))); continue }
    if (["x1-brg", "x3-brg"].includes(id)) { await right(); continue }
    if (id === "end-brg") { await sleep(3200); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
