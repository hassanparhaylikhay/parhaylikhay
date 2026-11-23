// What the 3D mensuration play-throughs share (built on trig-lib's open()):
// the scene's state, waiting for a beat, pulling a handle along its axis,
// typing on the calculator keys (keyboard or touch), picking a chip, and
// carrying a piece of the equation over the =.
const { sleep } = require("./trig-lib.cjs")

function kit3d(T) {
  const { page, tap, drag, expect, fail, TOUCH, tapSel } = T
  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], input: s.input && s.input.state, typed: s.input && s.input.typed, box: s.box, done: !!(s.solve && s.solve.done) }
  })
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
  /** Drag a handle along its axis by this many world units. */
  const pull = async (id, units) => {
    await sleep(600)
    const p = await api("handleAt", id), ax = await api("handleAxis", id)
    if (!p || !ax) return fail("no handle " + id)
    await drag(p, [p[0] + ax[0] * units, p[1] + ax[1] * units], 26)
    await sleep(600)
  }
  const KEY = { "*": "×", "/": "÷", "^": "x²", r: "√", "+": "+", "-": "−", p: "π" }
  const type = async str => {
    if (TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${KEY[ch] ?? ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  const pickIdx = async k => {
    const t0 = Date.now()
    while (Date.now() - t0 < 5000 && (await page.$$("[class*=choices] button")).length <= k) await sleep(100)
    const bs = await page.$$("[class*=choices] button")
    if (!bs[k]) return fail("no choice " + k)
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(600)
  }
  /** Carry a piece of the equation over the =, then pick what it becomes: a wrong pick first. */
  const across = async (piece, wrong, rightK) => {
    await sleep(600)
    const a = await api("atomAt", piece), e = await api("atomAt", "eq")
    if (!a || !e) return fail("no piece " + piece)
    await drag(a, [e[0] + (a[0] < e[0] ? 1 : -1) * 70, e[1]], 18)
    await sleep(600)
    await pickIdx(wrong)
    await expect(/opposite|dividing|take-away/.test((await st()).note || ""), "no note for the wrong pick")
    await pickIdx(rightK)
    const t0 = Date.now()
    while (Date.now() - t0 < 5000 && !(await st()).done) await sleep(150)
    await expect((await st()).done, "the move did not finish")
  }
  return { api, st, idNow, at, pull, type, right, slip, pickIdx, across }
}

module.exports = { kit3d }
