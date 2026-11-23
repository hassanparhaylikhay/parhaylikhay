"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-sectors"
import { termsEngine } from "./engine"

/** Arcs and sectors: a sector as a fraction of the circle, its arc and area, and three exam questions. */
export default function SectorsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={termsEngine} beats={BEATS} closeHref={closeHref} />
}
