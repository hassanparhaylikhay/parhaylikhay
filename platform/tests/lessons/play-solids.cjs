// Scripted play-through of "Solids and nets", beat by beat: the cube turned
// and its faces, edges and vertices tapped (turning it to reach the hidden
// ones, and one tapped twice for the note), counts typed with a slip each,
// solids named (a wrong word first), and nets unfolded and folded by their
// handle. FROM=n starts at beat n.
const { open, sleep } = require("./trig-lib.cjs")

;(async () => {
  const T = await open("solids-and-nets", "play-solids")
  const { page, next, tap, path, expect, fail, TOUCH, tapSel } = T

  const api = (fn, ...args) => page.evaluate((fn, args) => window.__beatApi[fn](window.__beatScene, ...args), fn, args)
  const st = () => page.evaluate(() => {
    const s = window.__beatScene
    return { note: s.note && s.note.text, got: [...s.got], count: s.vals.count || 0, input: s.input && s.input.state, typed: s.input && s.input.typed, regions: (s.regions || []).map(r => r.id), segs: s.tapSegs || [], pts: s.tapPoints || [], lit: Object.keys(s.faceLit), edgeCol: Object.keys(s.edgeCol), glow: s.glowPts, t: s.net && s.net.t, w: s.w, h: s.h }
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
  const waitFor = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(100) } return false }
  const noted = async what => expect((await st()).note, "no note after " + what)
  const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n])
  /** Turn the solid: a drag across the empty middle of the board. */
  const orbit = async (dx, dy = 0) => {
    const s = await st(), L = await api("layout"), cy = (L.solidCell.y0 + L.solidCell.y1) / 2
    const a = [s.w * 0.5 - dx / 2, cy - dy / 2], b = [s.w * 0.5 + dx / 2, cy + dy / 2]
    await path(line(a, b, 16))
    await sleep(500)
  }
  const type = async str => {
    if (TOUCH) {
      for (const ch of str) { await tapSel(`button[aria-label="${ch}"]`); await sleep(60) }
      await tapSel('button[aria-label="Check"]'); await sleep(700); return
    }
    for (const ch of str) { await page.keyboard.press(ch); await sleep(50) }
    await page.keyboard.press("Enter"); await sleep(700)
  }
  const right = async () => { await type((await st()).typed); await expect((await st()).input === "right", "count not taken") }
  const slip = async (str, re) => { await type(str); const s = await st(); await expect(s.input === "wrong", `"${str}" was taken`); if (re) await expect(re.test(s.note || ""), `no note like ${re} for ${str}: ${s.note}`) }
  const pickIdx = async k => {
    const ok = await waitFor(async () => (await page.$$("[class*=choices] button")).length > k, 5000)
    if (!ok) return fail("no choice " + k)
    const bs = await page.$$("[class*=choices] button")
    const r = await bs[k].boundingBox()
    await tap(r.x + r.width / 2, r.y + r.height / 2)
    await sleep(500)
  }
  const reason = async (wrong, rightK) => { await pickIdx(wrong); await noted("picking " + wrong); await sleep(500); await pickIdx(rightK) }

  /** How a student turns it to see every side: a quarter turn at a time, and once tipped to see underneath. */
  const TURNS = [[214, 0], [214, 0], [214, 0], [0, -110], [214, 0], [214, 0], [0, 220], [214, 0]]

  /** Tap every face, turning the cube to find the hidden ones; one face is tapped twice for its note. */
  const tapFaces = async id => {
    let twice = false
    for (let round = 0; round < 8 && (await idNow()) === id; round++) {
      const s = await st()
      if (process.env.VERBOSE) console.log("  round", round, "regions", s.regions.join(","), "lit", s.lit.join(","), "count", s.count)
      for (const r of s.regions) {
        if ((await idNow()) !== id) return
        if (s.lit.includes(r) && twice) continue
        const p = await api("regionAt", r)
        if (!p) continue
        await tap(...p); await sleep(350)
        if (s.lit.includes(r) && !twice) { twice = true; await noted("tapping a face twice") }
      }
      if ((await st()).got.includes("done")) return
      await orbit(...TURNS[round % TURNS.length])
    }
  }
  /** Tap every edge (or vertex), turning when one is hard to reach. */
  const tapAll = async (id, kind) => {
    for (let round = 0; round < 6 && (await idNow()) === id; round++) {
      const s = await st(), keys = kind === "edges" ? s.segs.filter(k => !s.edgeCol.includes(k)) : s.pts.filter(n => !s.glow.includes(n))
      for (const k of keys) {
        if ((await idNow()) !== id) return
        const p = kind === "edges" ? await api("segMid", ...k.split("-")) : await api("ptS", k)
        await tap(...p); await sleep(300)
      }
      if ((await st()).got.includes("done")) return
      await orbit(...TURNS[round % TURNS.length])
    }
  }
  /** Drag a net's fold handle up (fold) or down (unfold) along its axis on the screen. */
  const fold = async up => {
    await sleep(500)
    const id0 = await idNow()
    const h = await api("handleAt", "fold"), ax = await api("handleAxis", "fold")
    if (!h || !ax) return fail("no fold handle")
    const k = up ? 3.2 : -3.2
    await path(line(h, [h[0] + ax[0] * k, h[1] + ax[1] * k], 24))
    await sleep(600)
    await expect((await st()).got.includes("done") || (await idNow()) !== id0, "the net did not click")
  }

  const FROM = +(process.env.FROM || 1)
  for (const id of beats.slice(FROM - 1)) {
    if (!(await at(id))) break
    if (process.env.VERBOSE) console.log("beat", id)
    if (["cube", "cuboid", "prism", "pyr", "cyl", "cone", "hemi", "frustum"].includes(id)) { await orbit(320); await orbit(-200); await next(); continue }
    if (id === "faces-tap") { await tapFaces(id); continue }
    if (id === "edges-tap") { await tapAll(id, "edges"); continue }
    if (id === "verts-tap") {
      // a vertex tapped twice gets a note
      const n = (await st()).pts[0], p = await api("ptS", n)
      await tap(...p); await sleep(300); await tap(...p); await sleep(300)
      await noted("tapping a vertex twice")
      await tapAll(id, "vertices"); continue
    }
    if (id === "cuboid-v") { await slip("4", /bottom/); await right(); continue }
    if (id === "prism-f") { await slip("6", /ends/); await right(); continue }
    if (id === "prism-e") { await slip("6", /along/); await right(); continue }
    if (id === "prism-v") { await slip("3", /other end/); await right(); continue }
    if (id === "pyr-f") { await slip("4", /square/); await right(); continue }
    if (id === "pyr-e") { await slip("4", /top/); await right(); continue }
    if (id === "pyr-v") { await slip("4", /top/); await right(); continue }
    if (id === "w19-v") { await slip("8", /corners/); await right(); continue }
    if (id === "quiz-cone") { await reason(0, 2); continue }
    if (id === "quiz-frustum") { await reason(1, 0); continue }
    if (id === "w21-1n") { await reason(0, 1); continue }
    if (id === "w21-2n") { await reason(1, 0); continue }
    if (id === "w21-3n") { await reason(0, 1); continue }
    if (id === "unfold") { await fold(false); continue }
    if (["fold", "w21-1", "w21-2", "w21-3", "w19-fold"].includes(id)) { await fold(true); continue }
    if (id === "end") { await sleep(3400); await expect(!!(await page.$("[class*=ctaWrap] button")), "no Finish"); break }
    // a watching beat
    await next()
  }
  await T.finish()
})()
