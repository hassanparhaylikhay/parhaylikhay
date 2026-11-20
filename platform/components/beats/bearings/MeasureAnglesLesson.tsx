"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-measure"
import { mapEngine } from "./engine"

/** Measuring and drawing angles: a protractor on a corner, the right row read, angles marked and triangles drawn. */
export default function MeasureAnglesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={mapEngine} beats={BEATS} closeHref={closeHref} />
}
