// Scripted play-through of "Symmetry of solids", beat by beat: the sheet
// turned and tipped by its knobs into each plane (into one that does not
// match first, wherever there is one), counts typed with a slip each, and the
// sheet turned round the cylinder. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("symmetry-of-solids", "play-planes")
  const { page, next, path, expect, fail, TOUCH, tapSel } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], input: s.input && s.input.state, typed: s.input && s.input.typed, sheet: window.__beatApi.sheetNow(s) }
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
  const type = async str => {
    if (TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async () => { await type((await st()).typed); await expect((await st()).input === "right", "count not taken") }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }

  /**
   * Drag a knob to an angle through the angles in between (as a hand would
   * follow it round), then wait while the mirror copy goes through.
   */
  const knobTo = async (which, phi, tau) => {
    await sleep(500)
    const s = (await st()).sheet
    if (!s) return fail("no sheet")
    const dphi = ((((phi - s.phi) % 360) + 540) % 360) - 180, pts = []
    for (let i = 0; i <= 28; i++) {
      const f = i / 28
      pts.push(await api("knobAt", which, which === "turn" ? s.phi + dphi * f : s.phi, which === "tip" ? s.tau + (tau - s.tau) * f : s.tau))
    }
    await path(pts)
    await sleep(1700)
  }
  const found = async () => (await st()).sheet.found
  const clicked = async what => { const s = (await st()).sheet; await expect(s && s.at, `the sheet did not click ${what} (at ${s && s.phi.toFixed(1)}, ${s && s.tau.toFixed(1)})`) }
  const doneOrOn = async id => expect((await st()).got.includes("done") || (await idNow()) !== id, `${id}: not done`)
  const mismatch = async what => { await clicked(what); await expect(/match/.test((await st()).note || ""), `no "don't match" note ${what}`) }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "turn-1") { await knobTo("turn", 90, 0); await clicked("at the width"); await doneOrOn(id); continue }
    if (id === "diag") { await knobTo("turn", 122.9, 0); await mismatch("at the diagonal"); await doneOrOn(id); continue }
    if (id === "flat") { await knobTo("tip", 0, 90); await clicked("flat"); await doneOrOn(id); continue }
    if (id === "w25") { await slip("9", /cube/); await right(); continue }
    if (id === "cube-diag") {
      await knobTo("turn", 135, 0)
      await expect((await found()) === 4, "first diagonal not counted")
      await expect(/another/.test((await st()).note || ""), "no 'Find another one'")
      await knobTo("turn", 45, 0); await doneOrOn(id); continue
    }
    if (id === "prism-1") { await knobTo("turn", 180, 0); await mismatch("along the length"); await knobTo("turn", 90, 0); await doneOrOn(id); continue }
    if (id === "prism-2") { await knobTo("tip", 0, -45); await mismatch("tipped the wrong way"); await knobTo("tip", 0, 45); await doneOrOn(id); continue }
    if (id === "pyr-q") { await slip("4", /level/); await right(); continue }
    // turned round in quarter turns until it counts (a slow frame under load can drop a little of a drag)
    if (id === "cyl") { for (let k = 0; k < 4 && !(await st()).got.includes("done") && (await idNow()) === id; k++) await knobTo("turn", (await st()).sheet.phi + 90, 0); await doneOrOn(id); await next(); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
