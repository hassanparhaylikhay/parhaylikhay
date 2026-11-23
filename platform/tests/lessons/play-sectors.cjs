// Scripted play-through of "Arcs and sectors": the radius turned round,
// and every typed answer with a slip (one typed as the whole calculation,
// one in terms of π left as a bare number first). FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")
const { termsKit } = require("./terms-lib.cjs")

;(async () => {
  const T = await open("arcs-and-sectors", "play-sectors")
  const { page, next, expect } = T
  const K = termsKit(T)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await K.at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "turn") {
      await K.turnBy("B", "O", 90)
      await expect((await K.st()).vals.th === 150, `snapped to ${(await K.st()).vals.th}, not 150`)
      await K.turnBy("B", "O", 120)
      await next()
      continue
    }
    if (id === "q20-ab") { await K.slip("12p", /whole/); await K.noPi("6.28"); await K.right("60/360*2*p*6"); continue }
    if (id === "q20-cd") { await K.slip("2p", /radius/); await K.right("3p"); continue }
    if (id === "q20-ac") { await K.slip("9", /OC/); await K.right("3"); continue }
    if (id === "q20-a") { await K.slip("6", /arcs/); await K.right("5"); continue }
    if (id === "q20-b") { await K.slip("3", /two/); await K.right("6"); continue }
    if (id === "q20-area") { await K.slip("13.5p", /big/); await K.right("7.5p"); continue }
    if (id === "w24-c") { await K.right("24p"); continue }
    if (id === "w24-r") { await K.slip("24", /Halve/); await K.right("12"); continue }
    if (id === "w24-area") { await K.slip("144p", /whole/); await K.right("24p"); continue }
    if (id === "q23-full") { await K.right("18p"); continue }
    if (id === "q23-angle") { await K.slip("260", /small/); await K.right("100"); continue }
    if (id === "q23-major") { await K.slip("100", /minor/); await K.right("260"); continue }
    if (id === "q23-area") { await K.slip("36p", /whole/); await K.right("26p"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
