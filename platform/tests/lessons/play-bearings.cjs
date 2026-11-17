// Scripted play-through of "Bearings", beat by beat, the way a student would
// do it, with a wrong attempt at each kind of task. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("bearings", "play-bearings")
  const { page, next, tap, tapSel, drag, path, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, got: [...s.got], mode: s.mode,
      choice: s.choice && s.choice.state, rays: s.rays.map(r => ({ id: r.id, at: r.at, brg: r.brg })), turned: s.turned, B: s.P.B, A: s.P.A }
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
  const waitFor = async (fn, ms = 7000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(150) } return false }
  const noted = async what => expect((await st()).note, "no note after " + what)

  /** Turn a line by its end, round a circle, to a bearing (the finger goes the way a student's would). */
  const aim = async (id, to) => {
    const s = await st()
    const r = s.rays.find(x => x.id === id)
    if (!r) return fail("no line " + id)
    const end = await api("rayAt", id), c = await api("ptS", r.at)
    const R = Math.hypot(end[0] - c[0], end[1] - c[1])
    let d = ((to - r.brg) % 360 + 540) % 360 - 180
    const pts = []
    for (let i = 0; i <= 16; i++) { const b = (r.brg + (d * i) / 16) * Math.PI / 180; pts.push([c[0] + Math.sin(b) * R, c[1] - Math.cos(b) * R]) }
    await path(pts)
    await sleep(400)
  }
  /** Drag a place to a bearing and distance (on the screen) from another. */
  const moveTo = async (n, from, brg, px) => {
    const p = await api("ptS", n), target = await api("brgAt", from, brg, px)
    await drag(p, target, 24)
    await sleep(400)
  }
  const tapPt = async n => { await tap(...(await api("ptS", n))); await sleep(300) }
  const tapArc = async id => { const p = await api("arcAt", id); if (!p) return fail("no angle " + id); await tap(...p); await sleep(300) }
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  /** Type on the keypad (digits only). */
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
    // ── turning the line ──
    if (id === "turn") { await aim("r", 160); await aim("r", 300); await expect((await st()).turned >= 150, "not turned enough"); await next(); continue }
    if (id === "left") { await aim("r", 345); continue }
    const AIMS = { east: 90, south: 180, west: 270, "make-45": 45, "make-300": 300 }
    if (id in AIMS) {
      // a near miss first: it does not click on, and nothing moves on
      await aim("r", AIMS[id] + 12)
      await expect((await idNow()) === id, "moved on from a near miss")
      await aim("r", AIMS[id])
      await expect((await st()).rays[0].brg === AIMS[id], `${id}: line is at ${(await st()).rays[0].brg}`)
      continue
    }
    if (id === "eight") { await pickIdx(1); await noted("080"); await sleep(400); await pickIdx(2); continue }
    // ── standing and facing ──
    if (id === "stand-a") { await tapPt("B"); await noted("standing at B"); await sleep(300); await tapPt("A"); continue }
    if (id === "stand-b") { await tapPt("A"); await noted("standing at A"); await sleep(300); await tapPt("B"); continue }
    if (id === "face-b") { await aim("r", 72); continue }
    if (id === "face-a") { await aim("r", 252); continue }
    if (id === "alt") { await tapArc("co"); await noted("the other angle"); await sleep(300); await tapArc("alt"); continue }
    // ── moving B ──
    if (id === "move-b") {
      const s = await st()
      const A = await api("ptS", "A"), B = await api("ptS", "B"), R = Math.hypot(B[0] - A[0], B[1] - A[1])
      await moveTo("B", "A", 140, R * 0.9)
      await moveTo("B", "A", 30, R * 1.1)
      await moveTo("B", "A", 200, R)
      void s
      await next()
      continue
    }
    if (id === "past-180") {
      const A = await api("ptS", "A"), B = await api("ptS", "B"), R = Math.hypot(B[0] - A[0], B[1] - A[1])
      await moveTo("B", "A", 240, R)
      continue
    }
    // ── typing ──
    if (id === "back") { await slip("072", /bearing of \$B\$ from \$A\$/); await right(); continue }
    if (id === "q40") { await slip("140", /180/); await right(); continue }
    if (id === "q290") { await slip("470", /full turn/); await right(); continue }
    if (id === "o-a") {
      // the right angle, but not in three figures: told so, not taken
      await type("70"); await expect(/three figures/.test((await st()).note || ""), "no note for 70 without its zero"); await expect((await st()).input !== "right", "70 was taken")
      await right("070"); continue
    }
    if (id === "o-c") { await slip("070", /clockwise/); await right(); continue }
    if (["o-oa", "x1-ask", "x2-ask", "x3-ask", "x4-ask"].includes(id)) { await right(); continue }
    if (id === "end-back") { await sleep(3000); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
