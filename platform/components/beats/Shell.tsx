"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Delete, X } from "lucide-react"
import styles from "./beats.module.css"
import { Phrase } from "./Tex"

/**
 * Everything around the board: a hairline for progress, a quiet way out,
 * one phrase at a time, a short note under it when needed, and a continue
 * button only when the beat asks for one. Nothing else.
 */
export default function Shell({
  progress,
  phrase,
  phraseKey,
  note,
  noteKey,
  cta,
  onCta,
  closeHref,
  children,
}: {
  progress: number
  phrase: string
  phraseKey: string
  note: string | null
  noteKey: string
  cta: string | null
  onCta: () => void
  closeHref: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.root}>
      <div className={styles.progress} style={{ width: `${Math.round(progress * 1000) / 10}%` }} />
      <a href={closeHref} className={styles.close} aria-label="Leave the lesson">
        <X size={18} strokeWidth={1.8} />
      </a>
      {children}
      <PhraseLine text={phrase} k={phraseKey} />
      {note && (
        <div key={noteKey} className={styles.note}>
          <Phrase text={note} />
        </div>
      )}
      {cta !== null && (
        <div className={styles.ctaWrap}>
          <button key={phraseKey} type="button" onClick={onCta} className={`${styles.cta} ${cta ? styles.ctaWide : ""}`}
            aria-label={cta || "Continue"}>
            {cta ? <span>{cta}</span> : <ArrowRight size={20} strokeWidth={1.8} />}
          </button>
        </div>
      )}
    </div>
  )
}

/** The outgoing phrase lifts away while the next one settles in. */
function PhraseLine({ text, k }: { text: string; k: string }) {
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
      </div>
    </div>
  )
}

export function Keypad({ top, onKey }: { top: number; onKey: (k: string) => void }) {
  const row = (keys: string[]) => (
    <div className={styles.keyRow}>
      {keys.map(k => (
        <button key={k} type="button" className={`${styles.key} ${k === "go" ? styles.keyGo : ""}`}
          onPointerDown={e => { e.preventDefault(); onKey(k) }}
          aria-label={k === "go" ? "Check" : k === "back" ? "Delete" : k}>
          {k === "back" ? <Delete size={19} strokeWidth={1.7} /> : k === "go" ? <ArrowRight size={20} strokeWidth={2} /> : k}
        </button>
      ))}
    </div>
  )
  return (
    <div className={styles.keypad} style={{ top }}>
      {row(["1", "2", "3", "4", "5", "back"])}
      {row(["6", "7", "8", "9", "0", "go"])}
    </div>
  )
}
