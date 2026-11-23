// Scripted play-through of "Surface area": the box, the prism and the tank
// opened out, the cylinder unrolled, and every typed answer with a slip
// (the tank's total with its top on first). FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")
const { kit3d } = require("./kit3d.cjs")

;(async () => {
  const T = await open("surface-area", "play-surface")
  const { page, next, expect } = T
  const K = kit3d(T)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await K.at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "top") { await K.slip("7", /adds/); await K.right("4*3"); continue }
    if (id === "front") { await K.slip("12", /top/); await K.right("8"); continue }
    if (id === "end-face") { await K.slip("5", /adds/); await K.right("6"); continue }
    if (id === "box-total") { await K.slip("26", /two of each/); await K.right("52"); continue }
    if (id === "w11-a") { await K.slip("24", /Halve/); await K.right("12"); continue }
    if (id === "w11-sa") { await K.slip("320", /ends/); await K.right("320+2*12"); continue }
    if (id === "tin-curved") { await K.slip("484", /diameter/); await K.right("2*p*3.5*11"); continue }
    if (id === "tin-ends") { await K.slip("38.5", /two/); await K.right("2*p*3.5^"); continue }
    if (id === "tin-total") { await K.slip("242", /circles/); await K.right("319"); continue }
    if (id === "tank-n") { await K.slip("6", /open top/); await K.right("5"); continue }
    if (id === "tank-15") { await K.slip("30", /half/); await K.right("15"); continue }
    if (id === "tank-h") { await K.slip("71.6", /take away/); await K.right("r70^-15^"); continue }
    if (id === "tank-end") { await K.slip("12991", /half/); await K.right("6500"); continue }
    if (id === "tank-base") { await K.right("6400"); continue }
    if (id === "tank-side") { await K.right("5600"); continue }
    if (id === "tank-total") { await K.slip("39391", /open top/); await K.right("30600"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    await next()
  }
  await T.finish()
})()
