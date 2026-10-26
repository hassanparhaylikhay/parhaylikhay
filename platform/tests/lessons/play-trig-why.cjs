// Scripted play-through of "Why trigonometry works", the optional tour, the way a student would do it.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("why-trig-works", "play-trig-why")
  const { want, next, shot, expect, S, turnTo, slideTo, dropLine } = T

  // ── the question ──
  await want("Your calculator says"); await shot("question"); await next()
  await want("Where does"); await next()
  // ── triangles in an angle ──
  await want("Open the angle"); await turnTo(55); await turnTo(30); await next()
  await want("Pull a line"); await dropLine(1.2)
  await want("Slide it bigger"); await T.slideTo(8); await T.slideTo(4); await next()
  await want("Here are lots"); await sleep(1600); await shot("family"); await next()
  await want("They are all the same shape"); await sleep(2800); await shot("stacked"); await next()
  await want("Turn the angle. They all"); await turnTo(55); await turnTo(35); await next()
  // ── what sine means ──
  await want("The hypotenuse gets"); await next()
  await want("Lay the opposite"); await sleep(1600); await shot("door"); await next()
  await want("Slide it. It always"); await slideTo(8); await slideTo(4); await next()
  await want("Turn the angle. Now"); await turnTo(52); await next()
  await want("Every angle has"); await next()
  // ── inside your calculator ──
  await want("Shrink the hypotenuse"); await slideTo(2.0); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 2"); await slideTo(1.1); await expect((await S()).locked, "1 did not lock")
  await want("Now the opposite is"); await next()
  await want("Turn it all the way round"); await turnTo(120); await turnTo(240); await turnTo(359.6); await shot("sine-wave")
  await expect(((await S()).graph || {}).seen >= 330, "the sine wave was not drawn"); await next()
  await want("This wave"); await next()
  await want("The adjacent is"); await turnTo(180); await turnTo(359.6); await shot("cos-wave"); await next()
  await want("Turn to 35"); await turnTo(41); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 41"); await turnTo(35.5); await sleep(600)
  await expect((await S()).locked, "35 did not lock"); await shot("sin35")
  await want("Your calculator gives"); await next()
  // ── why it is called tangent ──
  await want("This line touches"); await next()
  await want("Stretch the radius"); await sleep(1500); await shot("stretched"); await next()
  await want("The length up the tangent"); await next()
  await want("Turn towards 90"); await turnTo(80); await turnTo(89.5); await sleep(500); await shot("tan90")
  await expect(/never meets/.test((await S()).note || ""), "no note at 90"); await next()
  // ── round the whole circle ──
  await want("30"); await shot("mirror"); await next()
  await want("So"); await next()
  await want("Play with it"); await turnTo(200); await shot("end")
  await T.finish()
})().catch(e => { console.error(e); process.exit(1) })
