// Scripted play-through of Trigonometry II (finding a side), the way a student would do it.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("trigonometry-2", "play-trig-2")
  const { want, next, tap, shot, expect, S, turnTo, slideTo, dropLine, tapCard, tapAtom, dropChip, solveIt, type, page, atomAt, drag, corner } = T

  /** One question: which rule, get x on its own, work it out. */
  const question = async (ruleWant, fn, wrongFn, calc, o = {}) => {
    await want(ruleWant)
    if (wrongFn) { await tapCard(wrongFn); await expect((await S()).note, "no note on a wrong card"); await sleep(400) }
    await tapCard(fn)
    await want("Get")
    if (o.swap) {
      const a = await atomAt("x"), b = await atomAt("fn")
      await drag(a, b, 14); await sleep(1600)
      await expect((await S()).solve.stage === 2, "the swap did not solve it")
    } else await solveIt({ wrongFirst: o.wrongFirst })
    await want("Work it out")
    if (o.slip) { await type(o.slip); await expect((await S()).input === "wrong", "a slip was accepted"); await expect((await S()).note, "no note for a slip " + o.slip) }
    await type(calc)
    await expect((await S()).input === "right", "answer not right: " + calc)
  }

  // ── 1. finding a side ──
  await want("Turn the arm"); await turnTo(36); await expect(/Close/.test((await S()).note || ""), "no 'Close' at 36"); await turnTo(30.5)
  await want("Pull a line"); await dropLine(1.2)
  await want("The hypotenuse is"); await next()
  await want("This side is missing"); await next()
  await want("Which rule uses O and H"); await tapCard("cos"); await expect((await S()).note, "no note on cos"); await sleep(400); await tapCard("sin")
  await want("Put the numbers"); await sleep(1800); await shot("numbers-in"); await next()
  await want("Now we get"); await next()
  await want("What is stuck"); await tapAtom("x"); await expect((await S()).note, "no note tapping x"); await sleep(300); await tapAtom("k")
  await want("Multiplying by"); await next()
  await want("An equation is like"); await next()
  await want("If only one side"); await sleep(1600); await shot("tipped"); await next()
  await want("Drag"); await dropChip("mul-k"); await shot("both-sides")
  await want("Why do the two"); await next()
  await want("10x"); await shot("tenth"); await next()
  await want("Ten tenths"); await sleep(2600); await next()
  await want("Tap the two"); await tapAtom("m1R.k"); await sleep(2400); await shot("cancelled")
  await want("Now x is on its own"); await next()
  await want("Type the right side"); await type("10/s30"); await expect((await S()).input === "wrong", "10 ÷ sin 30 accepted"); await expect((await S()).note, "no slip note for ÷"); await type("10*s30")
  await want("5 is half"); await next()
  await want("Turn"); await turnTo(40.4)
  await want("The hypotenuse is 9"); await tapCard("sin")
  await want("Get"); await solveIt({ wrongFirst: true })
  await want("Now type"); await type("5.8"); await expect(/significant/.test((await S()).note || ""), "no figures note for 5.8"); await type("5.79")
  await want("Lengths are given"); await sleep(4200); await shot("rounding"); await next()
  await want("Now the adjacent"); await next()
  await question("Which rule", "cos", "sin", "8*c55")
  await question("Now we know the adjacent", "tan", "cos", "6*t35")
  await want("Every question"); await shot("steps"); await next()
  // ── 2. x underneath ──
  await want("Now the hypotenuse is missing"); await next()
  await want("Which rule"); await tapCard("sin")
  await want("Put the numbers"); await next()
  await want("This time"); await next()
  await want("First we bring"); await next()
  await want("Drag"); await dropChip("mul-x"); await sleep(2600)
  await want("What is stuck"); await tapAtom("k"); await expect((await S()).note, "no note tapping 9"); await sleep(300); await tapAtom("fn")
  await want("Undo it"); await solveIt({ wrongFirst: true })
  await want("Work it out"); await type("9*s65"); await expect((await S()).input === "wrong", "9 × sin 65 accepted"); await type("9/s65")
  await want("The hypotenuse must"); await next()
  await want("A common mistake"); await next()
  await want("A hypotenuse of"); await shot("too-short"); await next()
  await want("Here is a shortcut"); await next()
  await want("x and"); await next()
  await want("It gives the same"); await next()
  await question("Find x. Which rule", "cos", null, "7/c40", { swap: true })
  await question("Find x. Which rule", "tan", "sin", "3/t25")
  // ── 3. any side ──
  await question("Find x. Which rule", "sin", "tan", "11*s48", { wrongFirst: true })
  await question("Find x. Which rule", "tan", null, "5/t62", { swap: true })
  await question("Find x. Which rule", "cos", null, "15.0")
  await question("Find x. Which rule", "cos", "sin", "7.5*c33", { slip: "7.5/c33" })
  // ── 4. exam questions ──
  await want("Triangle PQR"); await shot("ex1"); await next()
  await question("Calculate PQ", "sin", "cos", "7.39")
  await want("PQRS is a trapezium"); await next()
  await want("Tap the right-angled"); {
    const r = await corner("R"), q = await corner("P"), v = await corner("V")
    await tap((r[0] + q[0] + v[0]) / 3, (r[1] + q[1] + v[1]) / 3); await expect((await S()).note, "no note tapping QRS")
    const f = await corner("F")
    await tap((f[0] + q[0] + v[0]) / 3, (f[1] + q[1] + v[1]) / 3)
  }
  await question("Calculate PS", "cos", null, "15*c58")
  await want("A frame on a wall"); await shot("ex3"); await next()
  await question("Calculate AB", "cos", "sin", "64/c35", { swap: true })
  await want("A ladder from"); await next()
  await question("The ladder makes", "sin", null, "8.51")
  // ── 5. make it ──
  await want("θ is 40"); await next()
  await want("Work out the hypotenuse"); await type("6*s40"); await expect((await S()).input === "wrong", "6 × sin 40 accepted"); await type("6/s40")
  await want("Now slide"); await slideTo(9.4); await expect((await S()).locked, "the opposite did not lock at 6"); await shot("made")
  await want("Play with it"); await turnTo(55); await shot("end")
  void page
  await T.finish()
})().catch(e => { console.error(e); process.exit(1) })
