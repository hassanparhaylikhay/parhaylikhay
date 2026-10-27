/**
 * The calculator in the keypad, and how decimal answers are judged.
 *
 * What the student types is kept as a short string: digits, ".", "×", "÷",
 * and one letter for each function key (s = sin, c = cos, t = tan; S, C, T
 * for their inverses). A function applies to what follows it, the way a
 * scientific calculator reads "sin 30". Angles are in degrees, always.
 *
 * The inverses come from SHIFT, as on the calculators students use, and
 * open a bracket that runs to the end: SHIFT sin 5 ÷ 8 is sin⁻¹(5 ÷ 8).
 * sin⁻¹ or cos⁻¹ of a number bigger than 1 is a Math ERROR.
 *
 * An answer is right when it is the exact calculation, or a number correct
 * to the accuracy asked for (3 significant figures for lengths, 1 decimal
 * place for angles) or better. A correct number given too roughly is not
 * wrong: the student is told how many figures to give.
 */

export const CALC_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "back"],
  ["6", "7", "8", "9", "0", "."],
  ["sin", "cos", "tan", "×", "÷", "go"],
]

/** For finding angles: SHIFT in place of ×, and the inverses under it. */
export const ANGLE_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "back"],
  ["6", "7", "8", "9", "0", "."],
  ["SHIFT", "sin", "cos", "tan", "÷", "go"],
]
export const INV_KEY: Record<string, string> = { sin: "sin⁻¹", cos: "cos⁻¹", tan: "tan⁻¹" }
/** The angle keypad with SHIFT down: sin, cos and tan become their inverses. */
export const ANGLE_KEYS_SHIFT = ANGLE_KEYS.map(r => r.map(k => INV_KEY[k] ?? k))

/** The keypad key for a key on a keyboard, or null. */
export function calcKeyOf(key: string): string | null {
  if (/^\d$/.test(key) || key === ".") return key
  if (key === "*" || key === "x" || key === "X") return "×"
  if (key === "/") return "÷"
  if (key === "s") return "sin"
  if (key === "c") return "cos"
  if (key === "t") return "tan"
  if (key === "Backspace") return "back"
  if (key === "Enter" || key === "=") return "go"
  return null
}

const FN: Record<string, string> = { sin: "s", cos: "c", tan: "t", "sin⁻¹": "S", "cos⁻¹": "C", "tan⁻¹": "T" }
const FN_TEX: Record<string, string> = { s: "\\sin", c: "\\cos", t: "\\tan", S: "\\sin^{-1}", C: "\\cos^{-1}", T: "\\tan^{-1}" }
const INV = new Set(["S", "C", "T"])

/** The same, for the angle calculator: capital S, C and T are sin⁻¹, cos⁻¹ and tan⁻¹. */
export function angleKeyOf(key: string): string | null {
  if (key === "S") return "sin⁻¹"
  if (key === "C") return "cos⁻¹"
  if (key === "T") return "tan⁻¹"
  return calcKeyOf(key)
}

/** Add a key to what has been typed. Returns the new string. */
export function calcType(value: string, key: string, max = 18): string {
  if (key === "back") return value.slice(0, -1)
  if (value.length >= max) return value
  // no answer here needs more than two functions; more only runs off the screen
  if (FN[key]) return (value.match(/[sctSCT]/g) ?? []).length >= 2 ? value : value + FN[key]
  if (key === "×" || key === "÷") return value + key
  if (/^\d$/.test(key)) return value + key
  if (key === ".") {
    // one point per number
    const m = value.match(/[\d.]*$/)
    if (m && m[0].includes(".")) return value
    return value + (m && m[0] ? "." : "0.")
  }
  return value
}

/** What has been typed, as KaTeX. */
export function calcTex(value: string): string {
  let out = ""
  let open = 0
  for (const ch of value) {
    // an inverse opens its bracket, as the calculator does
    if (INV.has(ch)) { out += `${FN_TEX[ch]}(`; open++ }
    else if (FN_TEX[ch]) out += `${FN_TEX[ch]} `
    else if (ch === "×") out += "\\times "
    else if (ch === "÷") out += "\\div "
    else out += ch
  }
  return (out.trim() + ")".repeat(open)).trim()
}

/** Whether the student typed a calculation (as opposed to just a number). */
export const isCalculation = (value: string) => /[×÷sctSCT]/.test(value)

/** Work out what has been typed, in degrees; null if it is not finished or not sense. */
export function calcValue(value: string): number | null {
  return calcEval(value).v
}

/** Whether what has been typed is a Math ERROR (sin⁻¹ or cos⁻¹ of more than 1). */
export const isMathError = (value: string) => calcEval(value).error

function calcEval(value: string): { v: number | null; error: boolean } {
  let error = false
  let i = 0
  const num = (): number | null => {
    const m = value.slice(i).match(/^\d+(\.\d*)?|^\.\d+/)
    if (!m) return null
    i += m[0].length
    return Number(m[0])
  }
  const term = (): number | null => {
    const ch = value[i]
    if (ch && INV.has(ch)) {
      // its bracket runs to the end of what is typed
      i++
      const x = expr()
      if (x === null) return null
      const r = Math.PI / 180
      if (ch !== "T" && Math.abs(x) > 1 + 1e-12) { error = true; return null }
      if (ch === "S") return Math.asin(Math.max(-1, Math.min(1, x))) / r
      if (ch === "C") return Math.acos(Math.max(-1, Math.min(1, x))) / r
      return Math.atan(x) / r
    }
    if (ch && FN_TEX[ch]) {
      i++
      const x = term()
      if (x === null) return null
      const r = Math.PI / 180
      if (ch === "s") return Math.sin(x * r)
      if (ch === "c") return Math.cos(x * r)
      if (ch === "t") return Math.tan(x * r)
      if (ch === "S") return Math.abs(x) <= 1 ? Math.asin(x) / r : null
      if (ch === "C") return Math.abs(x) <= 1 ? Math.acos(x) / r : null
      return Math.atan(x) / r
    }
    return num()
  }
  const expr = (): number | null => {
    let acc = term()
    if (acc === null) return null
    while (i < value.length) {
      const ch = value[i]
      if (ch === "×" || ch === "÷") {
        i++
        const x = term()
        if (x === null) return null
        acc = ch === "×" ? acc * x : acc / x
      } else if (FN_TEX[ch]) {
        // "10 sin 30" means 10 × sin 30, as on a calculator
        const x = term()
        if (x === null) return null
        acc *= x
      } else return null
    }
    return acc
  }
  const v = expr()
  if (error) return { v: null, error: true }
  return { v: v !== null && Number.isFinite(v) ? v : null, error: false }
}

/** How many significant figures a typed number shows. */
export function sigFigs(s: string): number {
  const t = s.replace(/^[-+]/, "")
  const digits = t.replace(".", "").replace(/^0+/, "")
  if (!t.includes(".")) return digits.replace(/0+$/, "").length || 1
  return digits.length || 1
}

const decimals = (s: string) => (s.includes(".") ? s.split(".")[1].length : 0)

/** A value to `n` significant figures, as a number. */
export function toSig(x: number, n: number): number {
  if (x === 0) return 0
  const p = Math.floor(Math.log10(Math.abs(x))) + 1 - n
  const f = 10 ** p
  return Math.round(x / f) * f
}

/** A value to `n` significant figures, as text with the zeros that count (4.20, 15.0). */
export function sigText(x: number, n = 3): string {
  if (Math.abs(x - Math.round(x)) < 1e-9 && Math.abs(x) >= 10 ** (n - 1)) return String(Math.round(x))
  const p = Math.floor(Math.log10(Math.abs(x))) + 1
  return toSig(x, n).toFixed(Math.max(0, n - p))
}

/** A value to `d` decimal places, as text. */
export const dpText = (x: number, d = 1) => x.toFixed(d)

export type Verdict = "right" | "rough" | "wrong" | "unfinished" | "error"

/**
 * Judge a typed answer against the true value. `sf` asks for significant
 * figures (lengths), `dp` for decimal places (angles). An exact answer is
 * right however it is written.
 */
export function judge(value: string, truth: number, { sf, dp }: { sf?: number; dp?: number } = {}): { verdict: Verdict; v: number | null } {
  const { v, error } = calcEval(value)
  if (error) return { verdict: "error", v: null }
  if (v === null) return { verdict: "unfinished", v }
  const scale = Math.max(1, Math.abs(truth))
  if (Math.abs(v - truth) <= 1e-9 * scale) return { verdict: "right", v }
  if (isCalculation(value)) {
    // a calculation with rounded numbers inside it: right if it lands on the same answer
    const same = sf ? toSig(v, sf) === toSig(truth, sf) : dp !== undefined ? v.toFixed(dp) === truth.toFixed(dp) : false
    return { verdict: same ? "right" : "wrong", v }
  }
  const tol = 0.5 * 10 ** -decimals(value) + 1e-9 * scale
  if (Math.abs(v - truth) > tol) return { verdict: "wrong", v }
  if (sf && sigFigs(value) < sf) return { verdict: "rough", v }
  if (dp !== undefined && decimals(value) < dp) return { verdict: "rough", v }
  return { verdict: "right", v }
}
