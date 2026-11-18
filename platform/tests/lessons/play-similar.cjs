// Scripted play-through of "Similar shapes", beat by beat: the triangle
// grown by its corner to a scale factor and stretched one way, sides and
// angles tapped (a wrong one first at each kind of task), the small
// triangle turned to sit like the big one, ADE pulled out of the figure,
// reasons picked and answers typed (with a slip at each). FROM=n starts at
// beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("similar-shapes", "play-similar")
  const { page, next, tap, tapSel, path, expect, fail, TOUCH } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return {
      note: s.note && s.note.text, input: s.input && s.input.state, typed: s.input && s.input.typed, got: [...s.got], mode: s.mode,
      locked: [...s.locked], poses: Object.fromEntries(s.shapes.map(sh => [sh.id, sh.pose])),
    }
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
  const waitFor = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(100) } return false }
  const noted = async what => expect((await st()).note, "no note after " + what)
  const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n])

  /** Grow (or shrink) the triangle by its corner to a scale factor: the corner slides along the line from the pivot. */
  const scaleTo = async (id, k) => {
    await sleep(500)
    const s = await st(), h = await api("handleAt", id), O = await api("ptS", "T:A")
    const now = s.poses.T.k, want = [O[0] + (h[0] - O[0]) * k / now, O[1] + (h[1] - O[1]) * k / now]
    await path(line(h, want))
    await sleep(500)
  }
  /** Stretch it along its own base by its corner B. */
  const stretchTo = async sx => {
    await sleep(500)
    const s = await st(), h = await api("handleAt", "stretch"), O = await api("ptS", "T:A")
    const now = s.poses.T.sx
    await path(line(h, [O[0] + (h[0] - O[0]) * sx / now, O[1] + (h[1] - O[1]) * sx / now]))
    await sleep(500)
  }
  /** Turn a shape's corner round its pivot (on the screen, the short way) until it points where it would at `rot`. */
  const turnTo = async (id, sh, corner, pivot, rot) => {
    await sleep(500)
    const h = await api("handleAt", id), C = await api("ptS", `${sh}:${pivot}`)
    const s = await st(), P = s.poses[sh]
    // where the corner goes at the wanted turn, from where it is now
    const from = Math.atan2(h[1] - C[1], h[0] - C[0])
    const d = (((P.rot - rot) % 360) + 540) % 360 - 180
    const to = from + (d * Math.PI) / 180 // screen y runs down, so an anticlockwise turn is a clockwise one here
    const r = Math.hypot(h[0] - C[0], h[1] - C[1])
    const pts = []
    for (let i = 0; i <= 24; i++) { const t = from + (to - from) * i / 24; pts.push([C[0] + Math.cos(t) * r, C[1] + Math.sin(t) * r]) }
    await path(pts)
    await sleep(500)
    await expect((await st()).locked.includes(id), `${sh} not turned to ${rot}`)
  }
  const tapSide = async key => { const p = await api("sideAt", key); if (!p) return fail("no side " + key); await tap(...p) }
  const tapAngle = async key => { const p = await api("angleAt", key); if (!p) return fail("no angle " + key); await tap(...p) }
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  const type = async str => {
    if (TOUCH) {
      const fn = { "*": "×", "/": "÷" }
      for (const ch of str) { await tapSel(`button[aria-label="${fn[ch] || ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str ?? "typed"}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  /** A wrong tap first (it gets a note), then the right ones. */
  const sides = async (wrong, ...rightOnes) => { if (wrong) { await tapSide(wrong); await noted("tapping " + wrong); await sleep(400) } for (const k of rightOnes) { await tapSide(k); await sleep(400) } }
  const angle = async (wrong, rightOne) => { await tapAngle(wrong); await noted("tapping " + wrong); await sleep(400); await tapAngle(rightOne) }
  const reason = async (wrong, rightOne) => { await pickIdx(wrong); await noted("picking " + wrong); await sleep(400); await pickIdx(rightOne) }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (id === "grow") { await scaleTo("grow", 1.7); await scaleTo("grow", 1.2); await next(); continue }
    if (id === "angles") { await reason(0, 1); continue }
    if (id === "make-2") {
      // dropped short of 2 it does not click on; at 2 it does
      await scaleTo("grow", 1.6)
      await expect(!(await st()).locked.includes("grow"), "clicked on at 1.6")
      await scaleTo("grow", 2)
      await expect((await st()).locked.includes("grow"), "not clicked on at 2")
      continue
    }
    if (id === "make-15") { await scaleTo("grow", 1.5); await expect((await st()).locked.includes("grow"), "not clicked on at 1.5"); continue }
    if (id === "stretch") { await stretchTo(1.7); await next(); continue }
    if (id === "still") { await reason(0, 1); continue }
    if (id === "w25-ab") { await sides("ABC:BC", "PQR:AB", "ABC:AB"); continue }
    if (id === "w25-k") { await slip("3", /how many times/i); await right(); continue }
    if (id === "w25-ac") { await sides("PQR:AB", "PQR:CA"); continue }
    if (id === "w25-pr") { await slip("8.5", /multiplies/); await right(); continue }
    if (id === "w22-turn") {
      const R = (await st()).poses.ABC.rot
      await turnTo("turn", "DEC", "A", "C", R)
      continue
    }
    if (id === "w22-de") { await sides("DEC:BC", "DEC:AB"); continue }
    if (id === "w22-k") { await slip("9", /how many times/i); await right(); continue }
    if (id === "w22-cd") { await sides("ABC:BC", "ABC:CA"); continue }
    if (id === "w22-ac") { await slip("11", /multiplies/); await right(); continue }
    if (id === "w24-pull") {
      await sleep(500)
      const mid = await api("handleAt", "pull"), A = await api("ptS", "ADE:A"), to = await api("ptS", "ADEto:A")
      // let go a little off the outline: it clicks into place
      const end = [mid[0] + to[0] - A[0] + 12, mid[1] + to[1] - A[1] - 8]
      await path(line(mid, end, 24))
      await sleep(500)
      await expect((await st()).locked.includes("pull"), "ADE did not click into place")
      continue
    }
    if (id === "w24-d") { await angle("ADE:C", "ADE:B"); continue }
    if (id === "w24-why") { await reason(0, 1); continue }
    if (id === "tz-e") { await angle("T2:C", "T2:E"); continue }
    if (id === "tz-e-why") { await reason(0, 2); continue }
    if (id === "tz-a") { await angle("T2:D", "T2:C"); continue }
    if (id === "tz-a-why") { await reason(1, 0); continue }
    if (id === "x1-k") { await slip("4.2", /how many times/i); await right(); continue }
    if (id === "x1-ad") { await slip("2.025", /more than/); await right(); continue }
    if (id === "x1-ae") { await slip("2.925", /divide/); await right(); continue }
    if (id === "x2-ab") { await sides("CBD:BD", "CBD:CB"); continue }
    if (id === "x2-k") { await slip("3", /how many times/i); await right(); continue }
    if (id === "x2-bd") { await sides("CBD:CB", "CBD:BD"); continue }
    if (id === "x2-ans") { await slip("9.6", /multiplies/); await right(); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
