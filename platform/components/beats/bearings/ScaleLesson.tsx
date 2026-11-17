"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-scale"
import { mapEngine } from "./engine"

/** Scale drawings: read a map with a ruler and its scale, and measure and draw bearings with a protractor. */
export default function ScaleLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={mapEngine} beats={BEATS} closeHref={closeHref} />
}
