"use client"

import { useState } from "react"
import { AltPanel, COLOR, MixedText, type InteractionProps } from "./_shared"

/** One judgment the examiner must make, in mark-scheme order. */
type Judgment = {
  id: string
  /** Mark code, e.g. "M1", "A1", "B1". */
  code: string
  /** What this mark is for (e.g. "the equation line"). May contain $...$. */
  label: string
  /** Ground truth: does this script earn the mark? */
  award: boolean
  /** Shown after a correct judgment. Teaches the criterion. */
  explain: string
  /** Shown after a wrong judgment. */
  whyWrong: string
}

export type MarkScriptConfig = {
  prompt?: string
  /** Optional diagram (reference card, StepSolve-style). */
  contextHtml?: string
  /** The question as the candidate saw it. */
  question?: string
  /** The candidate's working, line by line. May contain $...$. */
  script: Array<{ id: string; text: string }>
  judgments: Judgment[]
  /** When any judgment withholds a mark: the script line the student must then tap. */
  faultLineId?: string
  /** Shown when the fault line is found. */
  faultExplain?: string
  successText?: string
  /** Verify slides: injected by InteractionSlide. No extra affordances here anyway. */
  noHelp?: boolean
  /** Alternative explanation, injected by LessonRunner when the student
   *  taps "explain another way". Shown ALONGSIDE the prompt. */
  altText?: string
}

/**
 * MarkScript — the student plays examiner. A candidate's script is shown;
 * for each mark in the scheme the student decides award or withhold, and if
 * anything was withheld, taps the exact line where the mark was lost.
 *
 * This is the marking knowledge base turned into an interaction: the deepest
 * rehearsal of mark-scheme awareness the platform can offer, because the
 * student has to apply the criteria rather than just satisfy them.
 */
export default function MarkScript({ config, onComplete }: InteractionProps<MarkScriptConfig>) {
  const [judged, setJudged] = useState(0)              // judgments locked so far
  const [verdicts, setVerdicts] = useState<boolean[]>([]) // the (correct) verdict per locked judgment
  const [wrongPick, setWrongPick] = useState<"award" | "withhold" | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [faultFound, setFaultFound] = useState(false)
  const [wrongLineId, setWrongLineId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const judgments = config.judgments
  const judgingDone = judged >= judgments.length
  const current = judgingDone ? null : judgments[judged]
  const anyWithheld = judgments.some(j => !j.award)
  const needsFault = anyWithheld && !!config.faultLineId
  const done = judgingDone && (!needsFault || faultFound)
  const inFaultPhase = judgingDone && needsFault && !faultFound

  function judge(choice: "award" | "withhold") {
    if (!current) return
    const correct = (choice === "award") === current.award
    if (correct) {
      setVerdicts(v => [...v, current.award])
      setJudged(n => n + 1)
      setWrongPick(null)
      if (judged + 1 >= judgments.length && !needsFault) {
        onComplete({ attempts })
      }
    } else {
      setAttempts(a => a + 1)
      setWrongPick(choice)
      setShakeKey(k => k + 1)
    }
  }

  function tapLine(id: string) {
    if (!inFaultPhase) return
    if (id === config.faultLineId) {
      setFaultFound(true)
      setWrongLineId(null)
      onComplete({ attempts })
    } else {
      setAttempts(a => a + 1)
      setWrongLineId(id)
      setShakeKey(k => k + 1)
      setTimeout(() => setWrongLineId(null), 700)
    }
  }

  // ── the candidate's script ─────────────────────────────────────────────
  const scriptCard = (
    <div
      className={`rounded-xl border transition-colors duration-300 ${done ? "pl-success-pulse" : ""}`}
      style={{
        borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
        background: COLOR.card,
      }}
    >
      <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b" style={{ borderColor: "#0f161f" }}>
        <span className="text-[10.5px] font-mono uppercase tracking-[2px]" style={{ color: COLOR.faint }}>
          candidate&apos;s answer
        </span>
        {/* verdict pills accumulate as the examiner rules on each mark */}
        <span className="flex items-center gap-2">
          {judgments.slice(0, judged).map((j, i) => (
            <span
              key={j.id}
              className="pl-reveal text-[10.5px] font-mono uppercase tracking-[1.5px]"
              style={{
                color: verdicts[i] ? COLOR.green : COLOR.pink,
                textDecoration: verdicts[i] ? undefined : "line-through",
                textDecorationThickness: "1.5px",
              }}
            >
              {j.code}
            </span>
          ))}
        </span>
      </div>
      {config.question && (
        <div className="px-5 pt-3">
          <MixedText
            text={config.question}
            className="block text-[14.5px] sm:text-[15px] leading-relaxed"
            style={{ color: COLOR.grey }}
          />
        </div>
      )}
      <div className="flex flex-col gap-1 px-5 py-4">
        {config.script.map(line => {
          const isFault = faultFound && line.id === config.faultLineId
          const isWrongTap = wrongLineId === line.id
          const tappable = inFaultPhase
          return (
            <button
              key={line.id + (isWrongTap ? shakeKey : "")}
              onClick={() => tapLine(line.id)}
              disabled={!tappable}
              className={`text-left rounded-lg px-3 py-1.5 transition-all duration-200 ${isWrongTap ? "pl-shake" : ""} ${tappable && !isFault ? "hover:bg-[#0f161f]" : ""}`}
              style={{
                cursor: tappable ? "pointer" : "default",
                background: isFault ? "rgba(255,70,112,0.08)" : undefined,
                boxShadow: isFault ? "inset 0 0 0 1.5px rgba(255,70,112,0.55)" : isWrongTap ? "inset 0 0 0 1.5px rgba(255,70,112,0.4)" : undefined,
              }}
            >
              <MixedText
                text={line.text}
                className="text-[19px] sm:text-[21px]"
                style={{ color: isFault ? COLOR.pink : COLOR.white }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── the examiner's controls ────────────────────────────────────────────
  let controls: React.ReactNode = null
  if (current) {
    controls = (
      <div key={current.id} className="flex flex-col gap-3">
        <MixedText
          text={`Does this script earn ${current.code} for ${current.label}?`}
          className="block text-[16.5px] sm:text-[17.5px] font-medium pl-reveal"
          style={{ color: COLOR.white }}
        />
        <div className={`flex gap-3 ${wrongPick ? "pl-shake" : ""}`} key={"btns-" + shakeKey}>
          <button
            onClick={() => judge("award")}
            className="rounded-lg border-[1.5px] px-6 py-3 text-[13px] font-mono uppercase tracking-[1.5px] transition-colors"
            style={{
              borderColor: wrongPick === "award" ? COLOR.pink : "rgba(15,238,137,0.55)",
              background: wrongPick === "award" ? "rgba(255,70,112,0.05)" : "rgba(15,238,137,0.06)",
              color: wrongPick === "award" ? COLOR.pink : COLOR.green,
              cursor: "pointer",
            }}
          >
            award ✓
          </button>
          <button
            onClick={() => judge("withhold")}
            className="rounded-lg border-[1.5px] px-6 py-3 text-[13px] font-mono uppercase tracking-[1.5px] transition-colors"
            style={{
              borderColor: wrongPick === "withhold" ? COLOR.pink : "#3a4a5a",
              background: wrongPick === "withhold" ? "rgba(255,70,112,0.05)" : "transparent",
              color: wrongPick === "withhold" ? COLOR.pink : COLOR.text,
              cursor: "pointer",
            }}
          >
            withhold ✗
          </button>
        </div>
      </div>
    )
  } else if (inFaultPhase) {
    controls = (
      <MixedText
        text="A mark was lost. Tap the exact line in the script where it went wrong."
        className="block text-[16.5px] sm:text-[17.5px] font-medium pl-reveal"
        style={{ color: COLOR.yellow }}
      />
    )
  }

  // ── feedback ───────────────────────────────────────────────────────────
  const lastLocked = judged > 0 ? judgments[judged - 1] : null
  const feedback = (
    <>
      {wrongPick && current && (
        <MixedText
          key={"w" + shakeKey}
          text={current.whyWrong}
          className="block text-[15.5px] sm:text-[16.5px] text-[#ff4670] pl-reveal leading-relaxed"
        />
      )}
      {!wrongPick && lastLocked && !done && (
        <MixedText
          key={"e" + judged}
          text={lastLocked.explain}
          className="block text-[15.5px] sm:text-[16.5px] pl-reveal leading-relaxed"
          style={{ color: COLOR.text }}
        />
      )}
      {done && faultFound && config.faultExplain && (
        <MixedText
          text={config.faultExplain}
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

  const body = (
    <>
      {config.prompt && (
        <MixedText
          text={config.prompt}
          className="block text-[20px] sm:text-[23px] text-[#f0eeea] leading-snug"
        />
      )}
      <AltPanel text={config.altText} />
      {scriptCard}
      {controls}
      {feedback}
    </>
  )

  if (config.contextHtml) {
    return (
      <div className="w-full flex flex-col-reverse xl:flex-row gap-6 xl:gap-9 items-center xl:items-start justify-center">
        <div className="pl-stagger w-full xl:flex-1 min-w-0 max-w-[680px] flex flex-col gap-4" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {body}
        </div>
        <aside className="w-full max-w-[540px] xl:w-[460px] shrink-0 xl:pt-1">
          <div
            className="w-full rounded-xl overflow-hidden"
            style={{ background: COLOR.card, border: `1px solid ${COLOR.border}`, aspectRatio: "480 / 320" }}
            dangerouslySetInnerHTML={{ __html: config.contextHtml }}
          />
        </aside>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div className="pl-stagger w-full max-w-[640px] flex flex-col gap-4" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {body}
      </div>
    </div>
  )
}
