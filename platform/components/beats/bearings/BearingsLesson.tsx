"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats"
import { mapEngine } from "./engine"

/** Bearings: measure a direction from North, clockwise, in three figures; find the bearing back. */
export default function BearingsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={mapEngine} beats={BEATS} closeHref={closeHref} />
}
