"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats"
import { simEngine } from "./engine"

/** Similar shapes: the scale factor, a length from it, matching corners, and showing two triangles are similar. */
export default function SimilarLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={simEngine} beats={BEATS} closeHref={closeHref} />
}
