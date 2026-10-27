// Scripted play-through of "Why trigonometry works", the optional tour, the way a student would do it.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("why-trig-works", "play-trig-why")
  const { want, next, shot, expect, S, turnTo, slideTo, dropLine } = T

  // ── the question ──
  await want("Your calculator says"); await shot("question"); await next()
  await want("Where does"); await next()
  // ── triangles in an angle ──
  await want("Start with an angle"); await turnTo(55); await turnTo(30); await next()
  await want("Now pull a line"); await dropLine(1.2)
  await want("Try sliding"); await slideTo(8); await slideTo(4); await next()
  await want("What if we drew"); await sleep(1600); await shot("family"); await next()
  await want("Let's put them"); await sleep(2800); await shot("stacked"); await next()
  await want("They fit exactly"); await next()
  await want("Now turn the angle and watch"); await turnTo(55); await turnTo(40); await next()
  // ── what sine means ──
  await want("Let's turn the angle to 30"); await turnTo(36); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 36"); await turnTo(30.5)
  await expect((await S()).locked, "30 did not lock")
  await want("What if we split"); await sleep(1600); await shot("parts"); await next()
  await want("Now let's lay"); await next()
  await want("It covers exactly"); await sleep(2600); await shot("count-5"); await next()
  await want("Try making"); await slideTo(8); await slideTo(4); await next()
  await want("However big"); await next()
  await want("So the opposite is always"); await next()
  await want("That is what"); await shot("means"); await next()
  await want("Now turn the angle. Watch how many"); await turnTo(55); await shot("parts-55"); await next()
  await want("Each angle covers"); await next()
  await want("That fraction"); await next()
  // ── inside your calculator ──
  await want("Now slide the hypotenuse"); await slideTo(2.0); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 2"); await slideTo(1.1); await expect((await S()).locked, "1 did not lock")
  await want("With a hypotenuse of 1"); await next()
  await want("Now turn it all the way round"); await turnTo(120); await turnTo(240); await turnTo(359.6); await shot("sine-wave")
  await expect(((await S()).graph || {}).seen >= 330, "the sine wave was not drawn"); await next()
  await want("This wave"); await next()
  await want("The adjacent is"); await turnTo(180); await turnTo(359.6); await shot("cos-wave"); await next()
  await want("Now turn it to 35"); await turnTo(41); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 41"); await turnTo(35.5); await sleep(600)
  await expect((await S()).locked, "35 did not lock")
  await want("Let's zoom in"); await sleep(2200); await shot("zoom"); await next()
  await want("The height is"); await next()
  // ── why it is called tangent ──
  await want("This line just touches"); await next()
  await want("Let's stretch"); await sleep(1500); await shot("stretched"); await next()
  await want("The bottom of this bigger"); await sleep(1600); await shot("tan-one"); await next()
  await want("So tan"); await sleep(2200); await shot("tan-name"); await next()
  await want("That's where tan"); await next()
  await want("Now turn it towards 90"); await turnTo(80); await turnTo(89.5); await sleep(500); await shot("tan90")
  await expect(/never meets/.test((await S()).note || ""), "no note at 90"); await next()
  // ── round the whole circle ──
  await want("Look at 30"); await shot("mirror"); await next()
  await want("So"); await next()
  await want("Play with it"); await turnTo(200); await shot("end")
  await T.finish()
})().catch(e => { console.error(e); process.exit(1) })
