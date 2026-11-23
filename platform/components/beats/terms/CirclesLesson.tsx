"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-circles"
import { termsEngine } from "./engine"

/** Circles: a circle rolled along a line for its circumference, and cut into slices for its area. */
export default function CirclesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={termsEngine} beats={BEATS} closeHref={closeHref} />
}
