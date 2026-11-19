"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-sym"
import { termsEngine } from "./engine"

/** Line and rotational symmetry: fold a shape, turn a line until the halves match, and turn a shape to count how often it fits. */
export default function SymmetryLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={termsEngine} beats={BEATS} closeHref={closeHref} />
}
