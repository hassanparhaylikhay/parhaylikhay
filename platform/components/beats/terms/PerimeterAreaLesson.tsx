"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-area"
import { termsEngine } from "./engine"

/** Perimeter and area: walking round a shape, counting squares, and the area formulas built by cutting and turning shapes. */
export default function PerimeterAreaLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={termsEngine} beats={BEATS} closeHref={closeHref} />
}
