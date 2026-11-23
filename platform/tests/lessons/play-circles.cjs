// Scripted play-through of "Circles": the circle rolled part of the way
// (not yet a full turn) and then all the way, π moved across the = (a
// wrong pick first), and every typed answer with a slip; answers in terms
// of π also get a bare number first, which must be sent back for π.
// FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")
const { termsKit } = require("./terms-lib.cjs")

;(async () => {
  const T = await open("circles", "play-circles")
  const { page, next, expect } = T
  const K = termsKit(T)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await K.at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "roll") {
      await K.dragTo("O", [3, 1])
      await expect(!(await K.st()).locked.includes("roll"), "half a turn counted as a full one")
      await K.dragTo("O", [2 * Math.PI, 1])
      await expect(await K.moves(id, 6000), "a full turn did not move on")
      continue
    }
    if (id === "s10-cross") { await K.across("pi", 1, 0); continue }
    if (id === "s10-d") { await K.slip("28*p", /divides/); await K.noPi("8.91"); await K.right("28/p"); continue }
    if (id === "track-c") { await K.slip("100", /one end/); await K.right("200"); continue }
    if (id === "track-d") { await K.slip("63.6", /rounds/); await K.right("200/p"); continue }
    if (id === "w25") { await K.slip("144p", /diameter/); await K.noPi("113.1"); await K.right("36p"); continue }
    if (id === "w25-calc") { await K.slip("36", /key/); await K.right("113"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
