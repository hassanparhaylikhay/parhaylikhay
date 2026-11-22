"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-units"
import { solidEngine } from "./engine"

/** Units of measure: a metre stick, a ladder of units, a square cm split into mm squares, and a litre filled with cm cubes. */
export default function UnitsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
