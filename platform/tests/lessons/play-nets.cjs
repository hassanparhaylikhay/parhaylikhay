// Scripted play-through of "Drawing nets", beat by beat: a cube's net made
// by tapping squares (one that clashes first: it folds, turns pink and opens
// out; a face is taken off and another added), a net drawn to size on the
// 1 cm grid (a different net from the cross), and the cuboid's face areas and
// total typed, with a slip each. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("drawing-nets", "play-nets")
  const { page, next, tap, expect, fail, TOUCH, tapSel } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], input: s.input && s.input.state, typed: s.input && s.input.typed, net: window.__beatApi.netNow(s) }
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
  const right = async str => { await type(str ?? (await st()).typed); await expect((await st()).input === "right", `"${str}" not taken`) }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  /** Tap a square of the floor's grid (cells of k cm). */
  const cell = async (i, j, k) => { await tap(...(await api("cellAt", i, j, k))); await sleep(450) }
  const faces = async () => ((await st()).net || { faces: [] }).faces.length
  /** Wait for the net to fold and settle (and, if it clashed, open out again). */
  const waitFold = async ms => { await sleep(ms) }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "make") {
      // two flaps side by side on one side of the row: a square of four, which can't fold into a cube
      for (const [i, j] of [[0, 1], [2, 1], [3, 1], [1, 2], [2, 2]]) await cell(i, j, 2)
      await expect((await faces()) === 6, `six faces (${await faces()})`)
      await waitFold(4800)
      const s = await st()
      await expect(/same place/.test(s.note || ""), `no clash note: ${s.note}`)
      await expect(Object.values(s.net.cols).includes("#ff4670"), "no pink faces")
      await waitFold(3800)
      // a face that would split the net: a note; then one at an end comes off and another goes on
      await cell(1, 1, 2)
      await expect(/split/.test((await st()).note || ""), "no note for splitting the net")
      await cell(2, 2, 2)
      await expect((await faces()) === 5, "the face did not come off")
      await cell(1, 0, 2)
      await waitFold(4800)
      await expect((await st()).got.includes("done") || (await idNow()) !== id, "the cross did not fold into a cube")
      continue
    }
    if (id === "s25-side") { await slip("9", /area/); await right("3"); continue }
    if (id === "s25-draw") {
      // the staircase net, not the cross
      for (const [i, j] of [[1, 0], [0, 0], [2, 1], [2, 2], [3, 2]]) await cell(i, j, 3)
      await waitFold(4800)
      await expect((await st()).got.includes("done") || (await idNow()) !== id, "the staircase did not fold into a cube")
      continue
    }
    if (id === "w25-blue") { await slip("7.7", null); await right("14.1"); continue }
    if (id === "w25-orange") { await right("24.44"); continue }
    if (id === "w25-pink") { await right("15.6"); continue }
    if (id === "w25-total") { await slip("54.14", /two of each/); await right("108"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
