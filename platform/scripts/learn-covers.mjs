#!/usr/bin/env node
/**
 * Pictures for the lesson list at /learn: one frame of each beat lesson,
 * cropped to its figure and saved as public/learn/<slug>.webp.
 *
 *   node scripts/learn-covers.mjs              every lesson in PICKS
 *   node scripts/learn-covers.mjs sine-rule    one lesson
 *
 * Needs the site running (npm run build, then npm start on port 3124; HOST
 * picks another server). For a new lesson, add its slug and the id of a beat
 * with a good figure to PICKS. A lesson with no picture still gets a card.
 */
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const puppeteer = require("puppeteer-core")
const sharp = require("sharp")
const { CHROME } = require("../tests/lessons/lib.cjs")

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT = path.join(ROOT, "public", "learn")
const HOST = (process.env.HOST || "http://localhost:3124").replace(/\/$/, "")

/** Lesson slug → the beat whose figure is its picture. */
const PICKS = {
  angles: "copies",
  "angles-in-a-triangle": "rule",
  "angles-in-polygons": "equal-turns",
  "circle-theorems-1": "twice",
  "circle-theorems-2": "alt-name",
  "circle-theorems-3": "equal-angles",
  pythagoras: "smaller",
  trigonometry: "soh",
  "trigonometry-angles": "dep-name",
  "why-trig-works": "to-35",
  "sine-rule": "x",
  "cosine-rule": "bigger",
  "triangle-area": "make-30",
}

/** Figures whose lines run to the board's edges are cropped by hand (1280 × 800 page coordinates). */
const BY_HAND = {
  angles: [290, 215, 990, 653],
  "circle-theorems-2": [200, 150, 1080, 700],
}

const W = 1280, H = 800, SCALE = 2
const sleep = ms => new Promise(r => setTimeout(r, ms))

/** The box round the figure: below the phrase, above the next arrow, ignoring faint grid lines. */
async function figureBox(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const at = (x, y) => (y * info.width + x) * 3
  const b = at(640 * SCALE, 790 * SCALE), bg = [data[b], data[b + 1], data[b + 2]]
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (let y = 118 * SCALE; y < 735 * SCALE; y += 2) {
    for (let x = 0; x < info.width; x += 2) {
      const i = at(x, y)
      if (Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2])) > 48) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  const pad = 44 * SCALE
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad]
}

/** Grow a box to 16:10 round its middle, kept inside the page. */
function cover([x0, y0, x1, y1]) {
  let w = x1 - x0, h = y1 - y0
  if (w / h < 1.6) w = h * 1.6
  else h = w / 1.6
  w = Math.min(w, W * SCALE)
  h = Math.min(h, H * SCALE)
  const left = Math.max(0, Math.min(W * SCALE - w, (x0 + x1) / 2 - w / 2))
  const top = Math.max(0, Math.min(H * SCALE - h, (y0 + y1) / 2 - h / 2))
  return { left: Math.round(left), top: Math.round(top), width: Math.round(w), height: Math.round(h) }
}

const only = process.argv.slice(2)
const slugs = only.length ? only : Object.keys(PICKS)
fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE })
for (const slug of slugs) {
  const id = PICKS[slug]
  if (!id) { console.log(`${slug}: not in PICKS`); continue }
  await page.goto(`${HOST}/learn/${slug}?debug&beat=1`, { waitUntil: "load" })
  await page.waitForFunction(() => window.__beatApi)
  const n = (await page.evaluate(() => window.__beatApi.beats.map(b => b.id))).indexOf(id) + 1
  if (!n) { console.log(`${slug}: no beat "${id}"`); continue }
  await page.goto(`${HOST}/learn/${slug}?debug&beat=${n}`, { waitUntil: "load" })
  await page.waitForFunction(() => document.querySelector("svg"))
  await sleep(3200)
  const png = await page.screenshot()
  const box = BY_HAND[slug] ? BY_HAND[slug].map(v => v * SCALE) : await figureBox(png)
  const file = path.join(OUT, `${slug}.webp`)
  await sharp(png).extract(cover(box)).resize(960, 600).webp({ quality: 82, effort: 6 }).toFile(file)
  console.log(`${slug}: beat ${n} (${id}), ${Math.round(fs.statSync(file).size / 1024)} KB`)
}
await browser.close()
