// Sides 7 and 11 in "Now make it 13": the hypotenuse (root 170) must read 13.04, never 13,
// the task must not accept it, and letting go there gets "Close" under the phrase.
const puppeteer = require("puppeteer-core")
const { CHROME, HOST, outDir } = require("./lib.cjs")
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
  const BASE = process.env.BASE || HOST + "/learn/pythagoras"
  await p.goto(`${BASE}?debug&beat=1`, { waitUntil: "load" }); await p.waitForFunction(() => window.__beatApi)
  const n = await p.evaluate(() => window.__beatApi.beats.findIndex(x => x.id === "make-13") + 1)
  await p.goto(`${BASE}?debug&beat=${n}`, { waitUntil: "load" }); await p.waitForFunction(() => window.__beatScene && window.__beatScene.w > 0); await sleep(1500)
  const dragTo = async (name, w) => {
    const [a, t] = await p.evaluate((name, w) => { const S = window.__beatScene, A = window.__beatApi; return [A.posOf(S, name), A.toScreen(S, w)] }, name, w)
    await p.mouse.move(...a); await p.mouse.down(); for (let s = 1; s <= 20; s++) { await p.mouse.move(a[0] + (t[0] - a[0]) * s / 20, a[1] + (t[1] - a[1]) * s / 20); await sleep(10) } await p.mouse.up(); await sleep(600)
  }
  await dragTo("A", [0, 7]); await dragTo("B", [11, 0])
  const r = await p.evaluate(() => ({ labels: [...document.querySelectorAll("[class*=label]")].map(e => e.textContent), note: window.__beatScene.note && window.__beatScene.note.text, locked: window.__beatScene.locked, chip: [...document.querySelectorAll("[class*=chip]")].map(e => /chipLit/.test(e.className)) }))
  await p.screenshot({ path: outDir("near-miss") + "/near-miss.png" })
  // the board must not show 13 while the hypotenuse is root 170, and a near miss gets a word
  const ok = r.labels.includes("13.04") && !r.labels.includes("13") && !!r.note && !r.locked && r.chip.every(x => !x)
  console.log(JSON.stringify(r))
  console.log(ok ? "near miss: ok" : "near miss: BAD")
  await b.close()
})()
