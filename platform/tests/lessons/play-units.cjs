// Scripted play-through of "Units of measure", beat by beat: the metre stick
// and the mm in a cm watched, conversions typed (a slip each, one as a
// calculation), the mm squares in a cm square guessed (the wrong guess, which
// still counts them out), the litre cubes watched, and the ratio finished.
// FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("units-of-measure", "play-units")
  const { page, next, tap, expect, fail, TOUCH, tapSel } = T

  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], input: s.input && s.input.state, typed: s.input && s.input.typed }
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
      for (const ch of str) { await tapSel(`button[aria-label="${ch === "*" ? "×" : ch}"]`); await sleep(60) }
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
    await sleep(500)
  }
  const moves = async (id, ms) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) { if ((await idNow()) !== id) return true; await sleep(150) }
    return false
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "w23-78") { await slip("780", /divide/); await slip("0.78", /10/); await right("7.8"); continue }
    if (id === "s25-63") { await slip("630", /100/); await right("63"); continue }
    if (id === "s24-kg") { await slip("400", /1000/); await right("4000"); continue }
    if (id === "mm2") {
      await pickIdx(0)
      await expect(/see/.test((await st()).note || ""), "no note for the wrong guess")
      await expect(await moves(id, 9000), "the count did not move on")
      continue
    }
    if (id === "s25-61") { await slip("610", /square metre/); await right("6.1*10000"); continue }
    if (id === "w23-3") { await slip("3000", /100/); await right("30000"); continue }
    if (id === "s24-250") { await slip("2.5", /1000/); await right("0.25"); continue }
    if (id === "s25-450") { await slip("4.5", /1000/); await right("0.45"); continue }
    if (id === "ratio-ml") { await slip("250", /1000/); await right("2500"); continue }
    if (id === "ratio") { await slip("2500", /same number/); await right("100"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
