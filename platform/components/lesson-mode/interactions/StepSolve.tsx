"use client"

import { useEffect, useRef, useState } from "react"
import { AltDemoOverlay, COLOR, MixedText, type InteractionProps } from "./_shared"

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
  /** What this line is, shown while active (e.g. "the equation"). May contain $...$. */
  label: string
  markCode?: string
  /** Stage-specific hint surfaced by the chrome's 20s stuck-timer while THIS line is active. */
  hint?: string
  /** Stage-specific demonstration SVG for this line. */
  altDemo?: string
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
  /** Stage-specific hint for the chrome; defaults to the nudge. */
  hint?: string
  /** Stage-specific demonstration SVG for this line. */
  altDemo?: string
}

export type StepSolveLine = PickLine | NumericLine

export type StepSolveConfig = {
  prompt?: string
  /** Standing one-line explanation of how the frame works. A default is provided. */
  intro?: string
  contextHtml?: string
  lines: StepSolveLine[]
  successText?: string
  /** Verify slides: hides nudges. Injected by InteractionSlide. */
  noHelp?: boolean
  /** Animated demonstration of the method, injected by LessonRunner when the
   *  student taps "explain another way". Shown ON the canvas, never in place
   *  of the question. */
  altDemo?: string
}

/**
 * StepSolve — the exam script builds line by line, exactly as it would be
 * written on paper. This is the calculation-topic counterpart of
 * AnswerBuilder: method lines are picked (M1), values are typed (A1), each
 * locked line lights its mark pill, and the finished working reads top to
 * bottom like a full-marks answer.
 *
 * Layout: the WORKING is the manipulation here, so it takes the main
 * column at reading-plus size; the diagram is a compact reference card in
 * the side column (and stacks on top on narrow screens, like an exam
 * paper: figure first, working underneath).
 */
export type StageInfo = { hint?: string; demo?: string }

type StepSolveProps = InteractionProps<StepSolveConfig> & {
  /** Reports the ACTIVE line's help to the lesson chrome, so the 20s hint
   *  and "explain another way" always match the stage the student is on
   *  (slide-level help kept explaining line 1 after the student had moved
   *  to line 2). */
  onRegisterStageInfo?: (info: StageInfo | null) => void
}

export default function StepSolve({ config, onComplete, onDismissAlt, onRegisterStageInfo }: StepSolveProps) {
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

  // Report the active stage's help upward; clear when solved or unmounted.
  const stageHint = current ? (current.hint ?? (current.kind === "numeric" ? current.nudge : undefined)) : undefined
  const stageAlt = current?.altDemo
  useEffect(() => {
    if (!onRegisterStageInfo) return
    onRegisterStageInfo(done ? null : { hint: stageHint, demo: stageAlt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done, stageHint, stageAlt])
  useEffect(() => {
    return () => { onRegisterStageInfo?.(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wrongOption = current?.kind === "pick" && wrongId
    ? current.options.find(o => o.id === wrongId)
    : null
  const showNudge = !config.noHelp && current?.kind === "numeric" && numWrong >= 2 && current.nudge

  // ── the script: locked lines + mark pills ──────────────────────────────
  const script = (
    <div
      className={`flex flex-col gap-2.5 rounded-xl border px-5 py-4 transition-colors duration-300 ${done ? "pl-success-pulse" : ""}`}
      style={{
        borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
        background: done ? "rgba(15,238,137,0.05)" : COLOR.card,
      }}
    >
      {lines.map((line, i) => {
        const isLocked = i < idx
        const isActive = i === idx && !done
        return (
          <div key={line.id} className="flex items-center justify-between gap-3 min-h-[36px]">
            {isLocked ? (
              <MixedText
                text={locked[i]}
                className="pl-reveal text-[19px] sm:text-[21px]"
                style={{ color: COLOR.white }}
              />
            ) : (
              <MixedText
                text={line.label}
                className="text-[13.5px] sm:text-[14px] font-medium"
                style={{ color: isActive ? COLOR.yellow : COLOR.faint }}
              />
            )}
            {line.markCode && (
              <span
                className="shrink-0 text-[10.5px] font-mono uppercase tracking-[1.5px] transition-colors duration-300"
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
      <div className="flex flex-wrap gap-3" key={current.id}>
        {current.options.map(o => {
          const isWrongPick = wrongId === o.id
          return (
            <button
              key={o.id + (isWrongPick ? shakeKey : "")}
              onClick={() => pickOption(current, o)}
              className={`rounded-lg border-[1.5px] px-5 py-3 transition-all duration-200 pl-reveal hover:border-[#46608a] ${isWrongPick ? "pl-shake" : ""}`}
              style={{
                borderColor: isWrongPick ? COLOR.pink : "#2e3f58",
                background: isWrongPick ? "rgba(255,70,112,0.05)" : "#0f161f",
                cursor: "pointer",
              }}
            >
              <MixedText
                text={o.text}
                className="text-[17px] sm:text-[18px] font-medium"
                style={{ color: isWrongPick ? COLOR.pink : COLOR.white }}
              />
            </button>
          )
        })}
      </div>
    )
  } else if (current?.kind === "numeric") {
    entry = (
      <div key={current.id + "-" + shakeKey} className={`flex items-center gap-3 flex-wrap ${numWrong > 0 && shakeKey > 0 ? "pl-shake" : ""}`}>
        {current.inputPrefix && (
          <MixedText text={`$${current.inputPrefix}$`} className="text-[19px] sm:text-[20px]" style={{ color: COLOR.white }} />
        )}
        <input
          ref={inputRef}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submitNumeric(current) }}
          inputMode="decimal"
          placeholder={current.placeholder ?? "?"}
          className="w-[130px] rounded-lg border-[1.5px] bg-transparent px-3.5 py-2.5 text-[19px] outline-none transition-colors"
          style={{ borderColor: COLOR.blue, color: COLOR.white, fontFamily: "var(--font-geist-mono), monospace" }}
          aria-label={current.label}
        />
        {current.inputSuffix && (
          <span className="text-[15px] font-mono" style={{ color: COLOR.grey }}>{current.inputSuffix}</span>
        )}
        <button
          onClick={() => submitNumeric(current)}
          className="rounded-lg border-[1.5px] px-5 py-2.5 text-[13px] font-mono uppercase tracking-[1.5px] transition-colors"
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
          className="block text-[15.5px] sm:text-[16.5px] text-[#ff4670] pl-reveal leading-relaxed"
        />
      )}
      {current?.kind === "numeric" && numWrong > 0 && !showNudge && (
        <p className="text-[14.5px] pl-reveal" style={{ color: COLOR.pink }}>
          Not it. Check the working and try again.
        </p>
      )}
      {showNudge && (
        <MixedText
          text={(current as NumericLine).nudge!}
          className="block text-[15.5px] sm:text-[16.5px] text-[#fff067] pl-reveal leading-relaxed"
        />
      )}
      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal leading-relaxed"
        />
      )}
    </>
  )

  const working = (
    <>
      {config.prompt && (
        <MixedText
          text={config.prompt}
          className="block text-[20px] sm:text-[23px] text-[#f0eeea] leading-snug"
        />
      )}
      {config.intro && (
        <MixedText
          text={config.intro}
          className="block text-[15.5px] sm:text-[16.5px] leading-relaxed"
          style={{ color: COLOR.grey }}
        />
      )}
      {script}
      {entry}
      {feedback}
    </>
  )

  // The working owns the main column; the diagram is a reference card in
  // the side column. Below xl the column reverses so the figure sits above
  // the working, the way an exam paper reads.
  if (config.contextHtml) {
    return (
      <div className="w-full flex flex-col-reverse xl:flex-row gap-6 xl:gap-9 items-center xl:items-start justify-center">
        <div className="pl-stagger w-full xl:flex-1 min-w-0 max-w-[680px] flex flex-col gap-4" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {working}
        </div>
        <aside className="w-full max-w-[540px] xl:w-[460px] shrink-0 xl:pt-1">
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{ background: COLOR.card, border: `1px solid ${COLOR.border}`, aspectRatio: "480 / 320" }}
          >
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: config.contextHtml }} />
            <AltDemoOverlay svg={config.altDemo} onDismiss={onDismissAlt} />
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div className="pl-stagger w-full max-w-[640px] flex flex-col gap-4" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {working}
      </div>
    </div>
  )
}
