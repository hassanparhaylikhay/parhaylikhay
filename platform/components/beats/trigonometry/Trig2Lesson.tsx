"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import { BEATS } from "./beats-2"
import { trigEngine } from "./Trig1Lesson"
import type { Scene, Layout } from "./scene"

/** Trigonometry II: finding a side. Same board as lesson I (Trig1Lesson.tsx). */
const engine: BeatEngine<Scene, Layout> = { ...trigEngine }

export default function Trig2Lesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
