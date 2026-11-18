"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-vol"
import { simEngine } from "./engine"

/** Areas and volumes of similar shapes: the area factor, the volume factor, and going back to a length. */
export default function SimilarVolLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={simEngine} beats={BEATS} closeHref={closeHref} />
}
