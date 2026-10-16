// Shared settings for the lesson tests: which Chrome to drive, which server
// to test, and where screenshots go.
const fs = require("fs")
const os = require("os")
const path = require("path")

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
]
const CHROME = CANDIDATES.find(p => p && fs.existsSync(p))
if (!CHROME) {
  console.error("No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.")
  process.exit(2)
}

/** The site under test, without a trailing slash (a local production build by default). */
const HOST = (process.env.HOST || "http://localhost:3124").replace(/\/$/, "")

/** Where a test saves its screenshots: $OUT, or a folder in the system temp directory. */
function outDir(name) {
  const dir = process.env.OUT || path.join(os.tmpdir(), "lesson-tests", name)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

module.exports = { CHROME, HOST, outDir }
