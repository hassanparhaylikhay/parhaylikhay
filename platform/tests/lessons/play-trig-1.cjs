// Scripted play-through of Trigonometry I (sin, cos and tan), the way a student would do it.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("trigonometry-1", "play-trig-1")
  const { want, next, tap, shot, expect, S, tapSide, tapRole, turnTo, slideTo, dropLine, tapCard, type, page, roleSide } = T
  const choose = async text => {
    const b = await page.evaluateHandle(t => [...document.querySelectorAll("button")].find(x => x.textContent.startsWith(t)), text)
    const box = b.asElement() ? await b.asElement().boundingBox() : null
    if (!box) return T.fail("no choice " + text)
    await tap(box.x + box.width / 2, box.y + box.height / 2)
  }

  // ── 1. the sides ──
  await want("This is an angle"); await shot("angle"); await next()
  await want("Open and close"); await turnTo(60); await turnTo(25); await turnTo(40); await next()
  await want("Pull a line"); await dropLine(0.45); await expect((await S()).note, "no note for a short pull"); await sleep(400); await dropLine(1.2); await shot("dropped")
  await want("You made"); await next()
  await want("Slide the point"); await slideTo(8.5); await slideTo(5); await next()
  await want("The longest side"); await tapSide("VF"); await expect((await S()).note, "no note tapping a short side"); await sleep(300); await tapSide("VP")
  await want("The hypotenuse is always"); await next()
  await want("We call this angle"); await next()
  await want("The side across"); await tapSide("VF"); await expect((await S()).note, "no note tapping the adjacent"); await tapSide("FP")
  await want("The side next to"); await tapSide("VP"); await expect((await S()).note, "no note tapping the hypotenuse"); await tapSide("VF")
  await want("Now every side"); await next()
  await want("Turn"); await turnTo(50); await slideTo(7.5); await turnTo(35); await next()
  await want("Now look from"); await shot("hop"); await next()
  await want("The opposite and the adjacent"); await next()
  await want("The hypotenuse stays"); await next()
  for (const [want1, role] of [["Tap the opposite", "O"], ["Tap the adjacent", "A"], ["Tap the hypotenuse", "H"], ["Tap the opposite", "O"]]) {
    await want(want1)
    const wrong = role === "H" ? "O" : "H"
    await tapRole(wrong); await expect((await S()).note, `no note tapping ${wrong} for ${role}`); await sleep(300)
    await tapRole(role)
  }
  // ── 2. bigger and smaller ──
  await want("Let's keep"); await next()
  await want("These are the"); await next()
  await want("Slide the triangle"); await slideTo(8.8); await slideTo(5); await next()
  await want("The opposite is always part"); await choose("a third"); await expect(/Let's see/.test((await S()).note || ""), "a guess was not 'Let's see'")
  await want("Let's check"); await sleep(2600); await shot("halves"); await next()
  await want("Slide it. It is always"); await slideTo(8); await slideTo(4); await next()
  await want("So the opposite divided"); await next()
  await want("Slide it again"); await slideTo(8.5); await next()
  await want("Now turn"); await turnTo(55); await turnTo(25); await next()
  await want("What changes"); await choose("Turning")
  await want("Only the angle"); await next()
  await want("This number is called"); await next()
  await want("So"); await next()
  await want("Turn"); await turnTo(60); await next()
  // ── 3. cos and tan ──
  await want("The other pairs"); await next()
  await want("The adjacent divided"); await next()
  await want("Slide and turn"); await turnTo(30); await next()
  await want("The opposite divided by the adjacent"); await next()
  await want("Slide and turn"); await turnTo(60); await next()
  await want("Can you make"); await turnTo(58)
  await want("Here are all three"); await next()
  await want("Many students"); await next()
  for (const [a, b, fn, wrong] of [["O", "A", "tan", "sin"], ["A", "H", "cos", "tan"], ["O", "H", "sin", "cos"]]) {
    await want(`Which rule uses ${a} and ${b}`)
    await tapCard(wrong); await expect((await S()).note, "no note on a wrong card"); await sleep(400)
    await tapCard(fn)
  }
  // ── 4. the calculator ──
  await want("Your calculator knows"); await next()
  await want("Type"); await type("c30"); await expect((await S()).input === "wrong", "cos 30 accepted for sin 30"); await type("s30"); await shot("sin30")
  await want("Now type"); await type("0.77"); await expect(/significant/.test((await S()).note || ""), "no figures note for 0.77"); await type("s50")
  await want("Your own calculator"); await next()
  await want("Type"); await type("t45")
  await want("At"); await next()
  // ── 5. where the numbers come from ──
  await want("Where does"); await next()
  await want("Slide until"); await slideTo(1.9); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 1.9"); await slideTo(1.08); await expect((await S()).locked, "1 did not lock")
  await want("Now the opposite is"); await next()
  await want("Turn"); await turnTo(2); await turnTo(89); await shot("sine-curve"); await expect(((await S()).graph || {}).seen >= 78, "sine curve not drawn"); await next()
  await want("This curve"); await next()
  await want("The adjacent is"); await turnTo(2); await turnTo(88); await shot("cos-curve"); await next()
  // ── 6. make it ──
  await want("Make"); await turnTo(44); await expect((await S()).locked, "tan 1 did not lock")
  await want("Make the adjacent"); await turnTo(59); await expect((await S()).locked, "half did not lock")
  await want("Make"); await turnTo(38); await expect((await S()).locked, "0.6 did not lock"); await shot("sin06")
  await want("Later"); await next()
  await want("Play with it"); await turnTo(50); await shot("end")
  void roleSide
  await T.finish()
})().catch(e => { console.error(e); process.exit(1) })
