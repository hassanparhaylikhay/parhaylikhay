// Scripted play-through of "Areas and volumes of similar shapes", beat by
// beat: the square, the triangle and the cube grown by a corner to 2 and 3
// times their size, what fits inside counted, a side tapped, and answers
// typed with a slip at each (sums, a fraction, a square root). FROM=n
// starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("similar-areas-volumes", "play-similar-vol")
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
  const scaleTo = async (id, k, sh = "T") => {
    await sleep(500)
    const s = await st(), h = await api("handleAt", id), O = await api("ptS", `${sh}:A`)
    const now = s.poses[sh].k, want = [O[0] + (h[0] - O[0]) * k / now, O[1] + (h[1] - O[1]) * k / now]
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
      const fn = { "*": "×", "/": "÷", "-": "−", r: "√" }
      for (const ch of str) { await tapSel(`button[aria-label="${fn[ch] || ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    const kb = { "√": "r", "÷": "/", "×": "*", "−": "-" }
    for (const ch of str) { await page.keyboard.press(kb[ch] || ch); await sleep(50) }
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
    if (id === "sq-2" || id === "cube-2") {
      // dropped short of 2 it does not click on; at 2 it does
      await scaleTo("grow", 1.6, "G")
      await expect(!(await st()).locked.includes("grow"), "clicked on at 1.6")
      await scaleTo("grow", 2, "G")
      await expect((await st()).locked.includes("grow"), "not clicked on at 2")
      continue
    }
    if (id === "sq-3" || id === "cube-3") { await scaleTo("grow", 3, "G"); await expect((await st()).locked.includes("grow"), "not clicked on at 3"); continue }
    if (id === "tri") { await scaleTo("grow", 2, "T"); await expect((await st()).locked.includes("grow"), "triangle not clicked on at 2"); continue }
    if (id === "sq-4") { await slip("2", /one row/); await right(); continue }
    if (id === "sq-9") { await slip("3", /one row/); await right(); continue }
    if (id === "cube-8") { await slip("4", /one layer/); await right(); continue }
    if (id === "cube-27") { await slip("9", /one layer/); await right(); continue }
    if (id === "w25-k") { await slip("3", /how many times/i); await right(); continue }
    if (id === "w25-af") { await slip("1.5", /scale factor/); await right(); continue }
    if (id === "w25-pqr") { await slip("24", /area factor/); await right(); continue }
    if (id === "w22-k") { await slip("9", /how many times/i); await right(); continue }
    if (id === "w22-af") { await slip("8", /4 \\times 4|Squared/); await right(); continue }
    if (id === "w22-ans") { await slip("2560", /divide/); await right(); continue }
    if (id === "s23-big") { await slip("21", /length times width/); await right(); continue }
    if (id === "s23-pq") { await sides("ABCD:BC", "ABCD:AB"); continue }
    if (id === "s23-k") { await slip("4", /how many times/i); await right(); continue }
    if (id === "s23-af") { await right(); continue }
    if (id === "s23-small") { await slip("243", /divide/); await right(); continue }
    if (id === "s23-shade") { await slip("156", /taken out/); await right("108-48"); continue }
    if (id === "pr-vf") { await slip("1260", /how many times/i); await right(); continue }
    if (id === "pr-k") { await slip("4", /smaller/); await right(); continue }
    if (id === "pr-x") { await slip("80", /scale factor/); await right(); continue }
    if (id === "mug-vf") { await slip("370", /how many times/i); await right("640/270"); continue }
    if (id === "mug-4") { await slip("8", /cubed/); await right(); continue }
    if (id === "mug-3") { await right(); continue }
    if (id === "mug-w") { await slip("10.67", /divide/); await right("8/4*3"); continue }
    if (id === "px-a") { await slip("250000", /divide/); await right(); continue }
    if (id === "px-af") { await slip("84", /how many times/i); await right(); continue }
    if (id === "px-k") { await slip("39.0625", /square root/); await right("√6.25"); continue }
    if (id === "px-len") { await slip("125", /divide/); await right(); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
