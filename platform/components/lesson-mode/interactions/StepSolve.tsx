"use client"

import { useRef, useState } from "react"
import { COLOR, ContextCanvas, MixedText, Prompt, type InteractionProps } from "./_shared"

/**
 * One line of working. Two kinds:
 *  - "pick": choose the correct next line from chips (method marks; the M1
 *    is earned by writing the right equation, so the student picks it)
 *  - "numeric": type the value (accuracy marks; the A1 is earned by the
 *    number, so the student computes and types it)
 */
type PickLine = {
  id: string
  kind: "pick"
  /** What this line is, shown while active (e.g. "the equation"). */
  label: string
  markCode?: string
  options: Array<{ id: string; text: string; isCorrect?: boolean; whyWrong?: string }>
}

type NumericLine = {
  id: string
  kind: "numeric"
  label: string
  markCode?: string
  /** The accepted value. */
  answer: number
  /** Absolute tolerance; defaults to exact after parseFloat. */
  tolerance?: number
  /** TeX template for the locked line; {v} is replaced by the student's value (e.g. "c = {v}\\ \\text{cm}"). */
  display: string
  /** TeX shown before the input while typing (e.g. "c ="). */
  inputPrefix?: string
  /** Plain text after the input (e.g. "cm"). */
  inputSuffix?: string
  placeholder?: string
  /** Teaching line shown after two wrong attempts on this line. */
  nudge?: string
}

export type StepSolveLine = PickLine | NumericLine

export type StepSolveConfig = {
  prompt?: string
  contextHtml?: string
  lines: StepSolveLine[]
  successText?: string
  /** Verify slides: hides nudges. Injected by InteractionSlide. */
  noHelp?: boolean
}

/**
 * StepSolve — the exam script builds line by line, exactly as it would be
 * written on paper. This is the calculation-topic counterpart of
 * AnswerBuilder: method lines are picked (M1), values are typed (A1), each
 * locked line lights its mark pill, and the finished working reads top to
 * bottom like a full-marks answer.
 */
export default function StepSolve({ config, onComplete }: InteractionProps<StepSolveConfig>) {
  const [locked, setLocked] = useState<string[]>([])   // display text per locked line
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [numWrong, setNumWrong] = useState(0)          // wrong attempts on the CURRENT line
  const [attempts, setAttempts] = useState(0)
  const [typed, setTyped] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const lines = config.lines
  const idx = locked.length
  const done = idx >= lines.length
  const current = done ? null : lines[idx]

  function lockLine(displayText: string) {
    setLocked(prev => [...prev, displayText])
    setWrongId(null)
    setNumWrong(0)
    setTyped("")
    if (locked.length + 1 >= lines.length) {
      onComplete({ attempts })
    }
  }

  function pickOption(line: PickLine, o: PickLine["options"][number]) {
    if (o.isCorrect) {
      lockLine(o.text)
    } else {
      setAttempts(a => a + 1)
      setNumWrong(n => n + 1)
      setWrongId(o.id)
      setShakeKey(k => k + 1)
    }
  }

  function submitNumeric(line: NumericLine) {
    const raw = typed.trim().replace(",", ".")
    if (raw === "") return
    const v = Number(raw)
    const tol = line.tolerance ?? 0
    if (Number.isFinite(v) && Math.abs(v - line.answer) <= tol) {
      lockLine("$" + line.display.replace("{v}", raw) + "$")
    } else {
      setAttempts(a => a + 1)
      setNumWrong(n => n + 1)
      setShakeKey(k => k + 1)
    }
  }

  const wrongOption = current?.kind === "pick" && wrongId
    ? current.options.find(o => o.id === wrongId)
    : null
  const showNudge = !config.noHelp && current?.kind === "numeric" && numWrong >= 2 && current.nudge

  // ── the script: locked lines + mark pills ──────────────────────────────
  const script = (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3.5 transition-colors duration-300 ${done ? "pl-success-pulse" : ""}`}
      style={{
        borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
        background: done ? "rgba(15,238,137,0.05)" : COLOR.card,
      }}
    >
      {lines.map((line, i) => {
        const isLocked = i < idx
        const isActive = i === idx && !done
        return (
          <div key={line.id} className="flex items-center justify-between gap-3 min-h-[30px]">
            {isLocked ? (
              <MixedText
                text={locked[i]}
                className="pl-reveal text-[16px] sm:text-[17px]"
                style={{ color: COLOR.white }}
              />
            ) : (
              <span
                className="text-[10.5px] font-mono uppercase tracking-wider"
                style={{ color: isActive ? COLOR.yellow : COLOR.faint }}
              >
                {line.label}
              </span>
            )}
            {line.markCode && (
              <span
                className="shrink-0 text-[9.5px] font-mono uppercase tracking-[1.5px] transition-colors duration-300"
                style={{ color: isLocked ? COLOR.green : COLOR.faint }}
              >
                {line.markCode}{isLocked ? " ✓" : ""}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── the entry area for the current line ────────────────────────────────
  let entry: React.ReactNode = null
  if (current?.kind === "pick") {
    entry = (
      <div className="flex flex-wrap gap-2.5" key={current.id}>
        {current.options.map(o => {
          const isWrongPick = wrongId === o.id
          return (
            <button
              key={o.id + (isWrongPick ? shakeKey : "")}
              onClick={() => pickOption(current, o)}
              className={`rounded-lg border-[1.5px] px-4 py-2.5 transition-all duration-200 pl-reveal ${isWrongPick ? "pl-shake" : ""}`}
              style={{
                borderColor: isWrongPick ? COLOR.pink : COLOR.blue,
                background: isWrongPick ? "rgba(255,70,112,0.05)" : "rgba(0,171,250,0.06)",
                cursor: "pointer",
              }}
            >
              <MixedText
                text={o.text}
                className="text-[15px] sm:text-[16px] font-medium"
                style={{ color: isWrongPick ? COLOR.pink : COLOR.blue }}
              />
            </button>
          )
        })}
      </div>
    )
  } else if (current?.kind === "numeric") {
    entry = (
      <div key={current.id + "-" + shakeKey} className={`flex items-center gap-2.5 flex-wrap ${numWrong > 0 && shakeKey > 0 ? "pl-shake" : ""}`}>
        {current.inputPrefix && (
          <MixedText text={`$${current.inputPrefix}$`} className="text-[17px]" style={{ color: COLOR.white }} />
        )}
        <input
          ref={inputRef}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submitNumeric(current) }}
          inputMode="decimal"
          placeholder={current.placeholder ?? "?"}
          className="w-[110px] rounded-lg border-[1.5px] bg-transparent px-3 py-2 text-[17px] outline-none transition-colors"
          style={{ borderColor: COLOR.blue, color: COLOR.white, fontFamily: "var(--font-geist-mono), monospace" }}
          aria-label={current.label}
        />
        {current.inputSuffix && (
          <span className="text-[14px] font-mono" style={{ color: COLOR.grey }}>{current.inputSuffix}</span>
        )}
        <button
          onClick={() => submitNumeric(current)}
          className="rounded-lg border-[1.5px] px-4 py-2 text-[12px] font-mono uppercase tracking-[1.5px] transition-colors"
          style={{ borderColor: "#00abfa88", background: "rgba(0,171,250,0.07)", color: COLOR.blue, cursor: "pointer" }}
        >
          check
        </button>
      </div>
    )
  }

  const feedback = (
    <>
      {wrongOption?.whyWrong && !done && (
        <MixedText
          key={wrongId}
          text={wrongOption.whyWrong}
          className="block text-[14.5px] sm:text-[15.5px] text-[#ff4670] pl-reveal leading-relaxed"
        />
      )}
      {current?.kind === "numeric" && numWrong > 0 && !showNudge && (
        <p className="text-[13px] font-mono pl-reveal" style={{ color: COLOR.pink }}>
          Not it. Check the working and try again.
        </p>
      )}
      {showNudge && (
        <MixedText
          text={(current as NumericLine).nudge!}
          className="block text-[14.5px] sm:text-[15.5px] text-[#fff067] pl-reveal leading-relaxed"
        />
      )}
      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="block text-[15px] sm:text-[16px] text-[#0fee89] pl-reveal leading-relaxed"
        />
      )}
    </>
  )

  const stepLabel = !done && current && (
    <p className="text-[10.5px] font-mono uppercase tracking-[2px]" style={{ color: COLOR.faint }}>
      line {idx + 1} of {lines.length} · {current.kind === "pick" ? "pick" : "work out"} {current.label}
    </p>
  )

  if (config.contextHtml) {
    return (
      <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <ContextCanvas html={config.contextHtml} asideWidth={360} />
        </div>
        <aside className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3.5 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {config.prompt && (
            <MixedText
              text={config.prompt}
              className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug max-w-full"
            />
          )}
          {script}
          {stepLabel}
          {entry}
          {feedback}
        </aside>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <Prompt>{config.prompt}</Prompt>
      <div className="w-full max-w-[560px] flex flex-col gap-4">
        {script}
        {stepLabel}
        {entry}
        {feedback}
      </div>
    </div>
  )
}
