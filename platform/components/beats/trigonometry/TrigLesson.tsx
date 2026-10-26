"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-main"
import { trigEngine } from "./engine"

/** Trigonometry: from Pythagoras to finding any side (the main lesson). */
export default function TrigLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={trigEngine} beats={BEATS} closeHref={closeHref} />
}
