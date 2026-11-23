// Scripted play-through of "Volume of prisms and cylinders": a box of 36
// built by pulling its edges (two different ones), pieces moved across the
// = (a wrong pick first), and every typed answer with a slip, some typed as
// a calculation. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")
const { kit3d } = require("./kit3d.cjs")

;(async () => {
  const T = await open("volume-of-prisms", "play-volume")
  const { page, next, expect } = T
  const K = kit3d(T)
  const beats = await page.evaluate(() => window.__beatApi.beats.map(b => b.id))
  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await K.at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (id === "build") {
      await K.pull("len", 0.5); await K.pull("wid", 0.5); await K.pull("hgt", 1)
      let b = (await K.st()).box
      await expect(b.l * b.w * b.h === 36, `box is ${b.l} by ${b.w} by ${b.h}`)
      await expect(/works/.test((await K.st()).note || ""), "no word for 36")
      await K.pull("len", 1); await K.pull("hgt", -1)
      b = (await K.st()).box
      await expect(b.l * b.w * b.h === 36 && /too/.test((await K.st()).note || ""), `second box is ${b.l} by ${b.w} by ${b.h}: ${(await K.st()).note}`)
      await next()
      continue
    }
    if (id === "w25") { await K.slip("27", /adds/); await K.right("10*8*9"); continue }
    if (id === "w25-time") { await K.slip("4320", /divide/); await K.right("120"); continue }
    if (id === "s22-cross") { await K.across("ten", 1, 0); continue }
    if (id === "s22-x2") { await K.slip("625", /dividing/); await K.right("6.25"); continue }
    if (id === "s22-x") { await K.slip("3.125", /square root/); await K.right("r6.25"); continue }
    if (id === "s23-a") { await K.slip("9", /half/); await K.right("4.5"); continue }
    if (id === "s23-v") { await K.slip("72", /triangle/); await K.right("36"); continue }
    if (id === "w25p-h") { await K.slip("13", /sloping/); await K.right("r13^-5^"); continue }
    if (id === "w25p-a") { await K.slip("120", /half/); await K.right("60"); continue }
    if (id === "w25p-v") { await K.right("180"); continue }
    if (id === "tin") { await K.slip("1693", /diameter/); await K.right("p*3.5^*11"); continue }
    if (id === "barrel") { await K.slip("3200p", /Square/); await K.right("32000p"); continue }
    if (id === "barrel-min") { await K.right("32000p/5500"); continue }
    if (id === "barrel-s") { await K.slip("28", /60/); await K.right("17"); continue }
    if (id === "tank-072") { await K.slip("1.8", /adds/); await K.right("0.72"); continue }
    if (id === "tank-cross") { await K.across("a", 1, 0); continue }
    if (id === "tank-h") { await K.right("2.5"); continue }
    if (id === "tank-90") { await K.slip("162", /0\.9/); await K.right("1.62"); continue }
    if (id === "tank-min") { await K.slip("9", /1\.62/); await K.right("8.1"); continue }
    if (id === "tank-s") { await K.slip("10", /60/); await K.right("6"); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    await next()
  }
  await T.finish()
})()
