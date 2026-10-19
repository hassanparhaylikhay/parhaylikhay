#!/usr/bin/env node
/**
 * Runs the lesson tests against a production build of the site.
 *
 *   node tests/lessons/run.mjs quick          what CI runs on every push (about 10 minutes)
 *   node tests/lessons/run.mjs full           everything: play-throughs on desktop and phone,
 *                                             walkthroughs, fuzz, flicker (about an hour)
 *   node tests/lessons/run.mjs cold:pythagoras play:pythagoras ...   chosen jobs by name
 *   node tests/lessons/run.mjs list           the job names
 *
 * Options:
 *   --serve      build the site and start it on port 3124 first (skipped if it is already up)
 *   --no-build   with --serve, start the build that is already there
 *
 * HOST picks another server (for example HOST=https://parhaylikhay.com), and
 * CHROME_PATH another browser. A job passes when its script exits cleanly and
 * prints its pass line; a failing job prints the end of its output.
 */

import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "../..")
const HOST = (process.env.HOST || "http://localhost:3124").replace(/\/$/, "")
const LOGS = path.join(os.tmpdir(), "lesson-tests", "logs")
fs.mkdirSync(LOGS, { recursive: true })

const LESSONS = [
  ["triangle", "angles-in-a-triangle"],
  ["polygons", "angles-in-polygons"],
  ["angles", "angles"],
  ["circle-1", "circle-theorems-1"],
  ["circle-2", "circle-theorems-2"],
  ["circle-3", "circle-theorems-3"],
  ["pythagoras", "pythagoras"],
  ["trig-1", "trigonometry-1"],
  ["trig-2", "trigonometry-2"],
]

const noPageErrors = out => !/PAGEERROR/.test(out)
const PASS = {
  cold: out => /problems: none/.test(out) && /errors: none/.test(out),
  walk: out => /problems: none/.test(out) && /errors: none/.test(out),
  play: out => /done, 0 mismatches/.test(out) && noPageErrors(out),
  fuzzOld: out => /\d+ checks, 0 failures/.test(out) && /page errors: 0/.test(out),
  fuzz: out => /\d+ checks, 0 problems/.test(out) && /errors: none/.test(out),
}

/** Every job: a script, its settings, and how to tell it passed. `solo` jobs time things and run alone. */
const JOBS = []
for (const [short, slug] of LESSONS) {
  JOBS.push({ name: `cold:${short}`, script: "cold.cjs", env: { LESSON: slug, WAIT: "900" }, pass: PASS.cold })
  JOBS.push({ name: `walk:${short}`, script: "walk.cjs", env: { LESSON: slug }, pass: PASS.walk, solo: true })
  JOBS.push({ name: `play:${short}`, script: `play-${short}.cjs`, env: {}, pass: PASS.play })
  JOBS.push({ name: `play-phone:${short}`, script: `play-${short}.cjs`, env: { TOUCH: "1", W: "390", H: "844" }, pass: PASS.play })
  // the trig lessons share one fuzz script, told which lesson by LESSON
  const fuzz = short.startsWith("trig") ? { script: "fuzz-trig.cjs", env: { LESSON: slug } } : { script: `fuzz-${short}.cjs`, env: {} }
  JOBS.push({ name: `fuzz:${short}`, ...fuzz, pass: short === "triangle" || short === "polygons" ? PASS.fuzzOld : PASS.fuzz })
}
JOBS.push({ name: "cards", script: "cards.cjs", env: {}, pass: out => /all good/.test(out) })
JOBS.push({ name: "note", script: "note.cjs", env: {}, pass: out => (out.match(/ OK$/gm) || []).length >= 3 && !/OVERLAP/.test(out) })
JOBS.push({ name: "near-miss", script: "near-miss.cjs", env: {}, pass: out => /near miss: ok/.test(out) })
JOBS.push({ name: "overshoot", script: "overshoot.cjs", env: {}, pass: out => /overshoot: ok/.test(out) && /errors: none/.test(out) })
JOBS.push({ name: "o-letter", script: "o-letter.cjs", env: {}, pass: out => /flicks/.test(out) && !/\b[1-9]\d* flicks/.test(out) })
JOBS.push({ name: "right-mark", script: "right-mark.cjs", env: {}, pass: out => /side changes/.test(out) && !/\b[1-9]\d* side changes/.test(out) })
JOBS.push({ name: "flash", script: "flash.cjs", env: {}, pass: out => /\d+ checks, 0 wrong/.test(out) })

const SUITES = {
  quick: JOBS.filter(j => j.name.startsWith("cold:") || ["cards", "note", "near-miss", "overshoot", "o-letter", "right-mark"].includes(j.name)),
  full: JOBS,
}

// ── the site ─────────────────────────────────────────────────────────────

async function up() {
  try { const r = await fetch(`${HOST}/learn/angles`); return r.ok } catch { return false }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts })
    p.on("exit", code => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))))
  })
}

async function serve(build) {
  if (await up()) { console.log(`Using the site already running at ${HOST}`); return null }
  if (build) { console.log("Building the site..."); await run("npx", ["next", "build"]) }
  console.log("Starting the site on port 3124...")
  const server = spawn("npx", ["next", "start", "-p", "3124"], { cwd: ROOT, stdio: "ignore", detached: true })
  for (let i = 0; i < 120; i++) {
    if (await up()) return server
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error("The site did not start")
}

// ── the jobs ─────────────────────────────────────────────────────────────

function runJob(job) {
  return new Promise(resolve => {
    const t0 = Date.now()
    const log = path.join(LOGS, `${job.name.replace(/:/g, "-")}.log`)
    const p = spawn(process.execPath, [path.join(HERE, job.script)], { cwd: ROOT, env: { ...process.env, HOST, ...job.env } })
    let out = ""
    p.stdout.on("data", d => { out += d })
    p.stderr.on("data", d => { out += d })
    const timer = setTimeout(() => { out += "\nTIMED OUT"; p.kill("SIGKILL") }, 25 * 60 * 1000)
    p.on("exit", code => {
      clearTimeout(timer)
      fs.writeFileSync(log, out)
      const ok = code === 0 && job.pass(out)
      resolve({ job, ok, secs: Math.round((Date.now() - t0) / 1000), out, log })
    })
  })
}

async function runAll(jobs, width) {
  const results = []
  const report = r => {
    console.log(`${r.ok ? "  pass" : "  FAIL"}  ${r.job.name.padEnd(24)} ${String(r.secs).padStart(4)}s`)
    if (!r.ok) console.log(r.out.trim().split("\n").slice(-25).map(l => "        " + l).join("\n") + `\n        (full log: ${r.log})`)
    results.push(r)
  }
  const shared = jobs.filter(j => !j.solo)
  const queue = [...shared]
  await Promise.all(Array.from({ length: Math.min(width, queue.length) }, async () => {
    while (queue.length) report(await runJob(queue.shift()))
  }))
  // jobs that time things run one at a time, with nothing else loading the machine
  for (const j of jobs.filter(j => j.solo)) report(await runJob(j))
  return results
}

// ── main ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const names = args.filter(a => !a.startsWith("--"))
if (!names.length || names[0] === "list") {
  console.log("Suites: quick, full\nJobs:\n" + JOBS.map(j => "  " + j.name).join("\n"))
  process.exit(0)
}
const chosen = []
for (const n of names) {
  if (SUITES[n]) chosen.push(...SUITES[n])
  else {
    const j = JOBS.find(x => x.name === n)
    if (!j) { console.error(`No job or suite called ${n}. Try: node tests/lessons/run.mjs list`); process.exit(2) }
    chosen.push(j)
  }
}

let server = null
if (args.includes("--serve")) server = await serve(!args.includes("--no-build"))
else if (!(await up())) { console.error(`Nothing is running at ${HOST}. Start the site, or add --serve.`); process.exit(2) }

console.log(`Running ${chosen.length} jobs against ${HOST}`)
const t0 = Date.now()
const results = await runAll(chosen, Number(process.env.WIDTH || 3))
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed, ${Math.round((Date.now() - t0) / 60000)} min`)
if (server) process.kill(-server.pid)
process.exit(failed.length ? 1 : 0)
