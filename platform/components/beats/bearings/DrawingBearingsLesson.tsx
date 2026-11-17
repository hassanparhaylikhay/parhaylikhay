"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-protractor"
import { mapEngine } from "./engine"

/** Measuring and drawing bearings: a protractor on a map, bearings past 180°, and a place found from two bearings. */
export default function DrawingBearingsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={mapEngine} beats={BEATS} closeHref={closeHref} />
}
