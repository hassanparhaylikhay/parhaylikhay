"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Delete, Minus, Plus, X } from "lucide-react"
import styles from "./beats.module.css"
import { Phrase } from "./Tex"

/**
 * Everything around the board: a hairline for progress, a quiet way out,
 * one phrase at a time, a short note under it when needed, and a continue
 * button only when the beat asks for one. Nothing else. When a new part
 * of the lesson starts, its title comes up over the board and leaves.
 */
export default function Shell({
  progress,
  phrase,
  phraseKey,
  note,
  noteKey,
  noteTone = "wrong",
  cta,
  onCta,
  closeHref,
  card = null,
  onSkipCard,
  children,
}: {
  progress: number
  phrase: string
  phraseKey: string
  note: string | null
  noteKey: string
  /** "wrong" is a correction (pink); "calm" is a neutral remark. */
  noteTone?: "wrong" | "calm"
  cta: string | null
  onCta: () => void
  closeHref: string
  /** a section title over the board (see chapter.ts) */
  card?: { text: string; key: string; leaving: boolean } | null
  onSkipCard?: () => void
  children: React.ReactNode
}) {
  return (
    <div className={styles.root}>
      <div className={styles.progress} style={{ width: `${Math.round(progress * 1000) / 10}%` }} />
      <a href={closeHref} className={styles.close} aria-label="Leave the lesson">
        <X size={18} strokeWidth={1.8} />
      </a>
      {children}
      <PhraseLine text={phrase} k={phraseKey} note={note ? (
        // the note sits right under the phrase, however many lines the phrase wraps to
        <div key={noteKey} className={styles.note} style={noteTone === "calm" ? { color: "#c8c6be" } : undefined}>
          <Phrase text={note} />
        </div>
      ) : null} />
      {cta !== null && (
        <div className={styles.ctaWrap}>
          <button key={phraseKey} type="button" onClick={onCta} className={`${styles.cta} ${cta ? styles.ctaWide : ""}`}
            aria-label={cta || "Continue"}>
            {cta ? <span>{cta}</span> : <ArrowRight size={20} strokeWidth={1.8} />}
          </button>
        </div>
      )}
      {card && (
        <div key={card.key} className={`${styles.card} ${card.leaving ? styles.cardLeaving : ""}`}
          onPointerDown={card.leaving ? undefined : e => { e.preventDefault(); onSkipCard?.() }}>
          <div className={styles.cardInner}>
            <div className={styles.cardTitle}><Phrase text={card.text} /></div>
          </div>
        </div>
      )}
    </div>
  )
}

/** The outgoing phrase lifts away while the next one settles in. */
function PhraseLine({ text, k, note }: { text: string; k: string; note: React.ReactNode }) {
  const [cur, setCur] = useState({ k, text })
  const [old, setOld] = useState<{ k: string; text: string } | null>(null)
  if (cur.k !== k) {
    setOld(cur)
    setCur({ k, text })
  }
  useEffect(() => {
    if (!old) return
    const t = setTimeout(() => setOld(null), 420)
    return () => clearTimeout(t)
  }, [old])
  return (
    <div className={styles.phraseWrap}>
      {old && (
        <div key={`o-${old.k}`} className={`${styles.phrase} ${styles.phraseOut}`}>
          <Phrase text={old.text} />
        </div>
      )}
      <div key={`n-${cur.k}`} className={styles.phrase} style={{ animationDelay: old ? "200ms" : "0ms" }}>
        <Phrase text={cur.text} />
        {note}
      </div>
    </div>
  )
}

export const DIGIT_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "back"],
  ["6", "7", "8", "9", "0", "go"],
]

/** The keypad: digits by default, or any rows of keys (a calculator: see calc.ts). */
export function Keypad({ top, onKey, rows = DIGIT_KEYS }: { top: number; onKey: (k: string) => void; rows?: string[][] }) {
  const calc = rows.some(r => r.includes("sin"))
  const row = (keys: string[], i: number) => (
    <div key={i} className={styles.keyRow}>
      {keys.map(k => (
        <button key={k} type="button" className={`${styles.key} ${k === "go" ? styles.keyGo : ""} ${k.length > 1 && k !== "go" && k !== "back" ? styles.keyFn : ""}`}
          onPointerDown={e => { e.preventDefault(); onKey(k) }}
          aria-label={k === "go" ? "Check" : k === "back" ? "Delete" : k}>
          {k === "back" ? <Delete size={19} strokeWidth={1.7} /> : k === "go" ? (calc ? "=" : <ArrowRight size={20} strokeWidth={2} />) : k}
        </button>
      ))}
    </div>
  )
  return (
    <div className={styles.keypad} style={{ top }}>
      {rows.map(row)}
    </div>
  )
}

/** Fewer or more sides: the only controls that sit off the shape. */
export function Stepper({ top, n, onStep }: { top: number; n: number; onStep: (d: number) => void }) {
  return (
    <div className={styles.keypad} style={{ top, flexDirection: "row", justifyContent: "center", gap: 18 }}>
      <button type="button" className={styles.key} style={{ width: 52, height: 52, borderRadius: 26 }}
        onPointerDown={e => { e.preventDefault(); onStep(-1) }} aria-label="Fewer sides">
        <Minus size={20} strokeWidth={2} />
      </button>
      <span style={{ minWidth: 92, textAlign: "center", fontSize: 17, color: "#c8c6be", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Phrase text={`$${n}$ sides`} />
      </span>
      <button type="button" className={styles.key} style={{ width: 52, height: 52, borderRadius: 26 }}
        onPointerDown={e => { e.preventDefault(); onStep(1) }} aria-label="More sides">
        <Plus size={20} strokeWidth={2} />
      </button>
    </div>
  )
}

/** A few words to pick from, for questions whose answer is a name. */
export function Choices({ top, options, picked, state, wrongAt, onPick }: {
  top: number
  options: string[]
  picked: number | null
  state: "idle" | "wrong" | "right"
  wrongAt: number
  onPick: (k: number) => void
}) {
  return (
    <div className={styles.choices} style={{ top }}>
      {options.map((o, k) => {
        const mark = picked === k ? (state === "right" ? styles.choiceRight : state === "wrong" ? styles.choiceWrong : "") : ""
        return (
          <button key={picked === k ? `${k}-${wrongAt}` : k} type="button" className={`${styles.choice} ${mark}`}
            onPointerDown={e => { e.preventDefault(); onPick(k) }}>
            <Phrase text={o} />
          </button>
        )
      })}
    </div>
  )
}
