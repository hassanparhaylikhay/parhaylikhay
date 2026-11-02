/**
 * The calculator in the keypad, and how decimal answers are judged.
 *
 * What the student types is kept as a short string: digits, ".", "×", "÷",
 * "+", "-", "²", "√", and one letter for each function key (s = sin, c = cos,
 * t = tan; S, C, T for their inverses; A for Ans). A function applies to what follows it, the way a
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

/**
 * For the sine rule: × and ÷ and SHIFT together, and Ans (the last answer),
 * so an angle can be found in two steps the way it is on a calculator:
 * work out the right side, then SHIFT sin Ans.
 */
export const SINE_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "back"],
  ["7", "8", "9", "0", ".", "×", "÷"],
  ["SHIFT", "sin", "cos", "tan", "Ans", "go"],
]
export const SINE_KEYS_SHIFT = SINE_KEYS.map(r => r.map(k => INV_KEY[k] ?? k))

/**
 * For the cosine rule: the sine rule's keys with a row for + and −, x² and
 * √ (which, like the inverses, opens a bracket that runs to the end).
 */
export const COS_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "back"],
  ["7", "8", "9", "0", ".", "×", "÷"],
  ["+", "−", "x²", "√"],
  ["SHIFT", "sin", "cos", "tan", "Ans", "go"],
]
export const COS_KEYS_SHIFT = COS_KEYS.map(r => r.map(k => INV_KEY[k] ?? k))

/** The cosine rule's calculator on a keyboard: + and -, ^ for x², r for √, and the sine rule's keys. */
export function cosKeyOf(key: string): string | null {
  if (key === "+") return "+"
  if (key === "-") return "−"
  if (key === "^") return "x²"
  if (key === "r") return "√"
  return sineKeyOf(key)
}

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

/** The sine rule's calculator: the angle one's keys, and "a" for Ans. */
export function sineKeyOf(key: string): string | null {
  if (key === "a") return "Ans"
  return angleKeyOf(key)
}

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
  if (key === "×" || key === "÷" || key === "+") return value + key
  if (key === "−") return value + "-"
  // a square goes on a number or Ans (twice would be a double superscript; nothing here needs it)
  if (key === "x²") return /[\dA]$/.test(value) ? value + "²" : value
  if (key === "√") return value + "√"
  if (key === "Ans") return value + "A"
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
  // what closes at the end: an inverse's bracket, a root's top
  const close: string[] = []
  for (const ch of value) {
    // an inverse opens its bracket, as the calculator does
    if (INV.has(ch)) { out += `${FN_TEX[ch]}(`; close.push(")") }
    else if (ch === "√") { out += "\\sqrt{"; close.push("}") }
    else if (FN_TEX[ch]) out += `${FN_TEX[ch]} `
    else if (ch === "A") out += "\\text{Ans}"
    else if (ch === "×") out += "\\times "
    else if (ch === "÷") out += "\\div "
    else if (ch === "²") out += "^{2}"
    else if (ch === "-") out += "- "
    else if (ch === "+") out += "+ "
    else out += ch
  }
  // an empty root still shows its sign
  return (out.trim().replace(/\\sqrt\{$/, "\\sqrt{\\;") + close.reverse().join("")).trim()
}

/** Whether the student typed a calculation (as opposed to just a number). */
export const isCalculation = (value: string) => /[×÷sctSCTA+²√]/.test(value) || /.-/.test(value)

/** What Ans stands for: the last answer the calculator gave (set when one is right). */
let lastAns: number | null = null
export const setAns = (v: number | null) => { lastAns = v }
export const getAns = () => lastAns

/** Work out what has been typed, in degrees; null if it is not finished or not sense. */
export function calcValue(value: string): number | null {
  return calcEval(value).v
}

/** Whether what has been typed is a Math ERROR (sin⁻¹ or cos⁻¹ of more than 1). */
export const isMathError = (value: string) => calcEval(value).error

function calcEval(value: string): { v: number | null; error: boolean } {
  let error = false
  let i = 0
  const r = Math.PI / 180
  const num = (): number | null => {
    let x: number | null
    if (value[i] === "A") { i++; x = lastAns }
    else {
      const m = value.slice(i).match(/^\d+(\.\d*)?|^\.\d+/)
      if (!m) return null
      i += m[0].length
      x = Number(m[0])
    }
    // squares on a number: 5² is 25
    while (x !== null && value[i] === "²") { x = x * x; i++ }
    return x
  }
  const term = (): number | null => {
    const ch = value[i]
    // a minus in front: -5² is -25, as on a calculator
    if (ch === "-") { i++; const x = term(); return x === null ? null : -x }
    if (ch === "√") {
      // its top runs to the end of what is typed
      i++
      const x = sum()
      if (x === null) return null
      if (x < -1e-12) { error = true; return null }
      return Math.sqrt(Math.max(0, x))
    }
    if (ch && INV.has(ch)) {
      // its bracket runs to the end of what is typed
      i++
      const x = sum()
      if (x === null) return null
      if (ch !== "T" && Math.abs(x) > 1 + 1e-12) { error = true; return null }
      if (ch === "S") return Math.asin(Math.max(-1, Math.min(1, x))) / r
      if (ch === "C") return Math.acos(Math.max(-1, Math.min(1, x))) / r
      return Math.atan(x) / r
    }
    if (ch && FN_TEX[ch]) {
      i++
      const x = term()
      if (x === null) return null
      if (ch === "s") return Math.sin(x * r)
      if (ch === "c") return Math.cos(x * r)
      return Math.tan(x * r)
    }
    return num()
  }
  /** A product: terms joined by × and ÷ (or side by side, "10 sin 30"). */
  const prod = (): number | null => {
    let acc = term()
    if (acc === null) return null
    while (i < value.length) {
      const ch = value[i]
      if (ch === "×" || ch === "÷") {
        i++
        const x = term()
        if (x === null) return null
        acc = ch === "×" ? acc * x : acc / x
      } else if (FN_TEX[ch] || ch === "√") {
        // "10 sin 30" means 10 × sin 30, as on a calculator
        const x = term()
        if (x === null) return null
        acc *= x
      } else break
    }
    return acc
  }
  /** A sum: products joined by + and −. */
  const sum = (): number | null => {
    let acc = prod()
    if (acc === null) return null
    while (i < value.length) {
      const ch = value[i]
      if (ch !== "+" && ch !== "-") return null
      i++
      const x = prod()
      if (x === null) return null
      acc = ch === "+" ? acc + x : acc - x
    }
    return acc
  }
  const v = sum()
  if (error) return { v: null, error: true }
  return { v: v !== null && i >= value.length && Number.isFinite(v) ? v : null, error: false }
}

/** How many significant figures a typed number shows. */
export function sigFigs(s: string): number {
  const t = s.replace(/^[-+]/, "")
  const digits = t.replace(".", "").replace(/^0+/, "")
  if (!t.includes(".")) return digits.replace(/0+$/, "").length || 1
  return digits.length || 1
}

const decimals = (s: string) => (s.includes(".") ? s.split(".")[1].length : 0)

/**
 * Whether a typed answer is a known slip: as close to it as what was typed
 * can say (0.0525 typed to 4 places matches to half a ten-thousandth). A
 * calculation is exact, so it must match closely. Checking the slips in
 * order, the first that matches is the one meant.
 */
export function slipMatches(value: string, v: number, slip: number): boolean {
  const places = isCalculation(value) ? 9 : decimals(value)
  return Math.abs(v - slip) <= Math.max(0.5 * 10 ** -places, Math.abs(slip) * 0.0005) + 1e-9
}

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
