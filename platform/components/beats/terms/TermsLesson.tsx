"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats"
import { termsEngine } from "./engine"

/** Naming shapes: lines, triangles, quadrilaterals, polygons and the parts of a circle. */
export default function TermsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={termsEngine} beats={BEATS} closeHref={closeHref} />
}
