"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-construct"
import { mapEngine } from "./engine"

/** Constructing triangles: compasses opened on the ruler, arcs drawn from each end, the third corner where they cross. */
export default function ConstructLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={mapEngine} beats={BEATS} closeHref={closeHref} />
}
