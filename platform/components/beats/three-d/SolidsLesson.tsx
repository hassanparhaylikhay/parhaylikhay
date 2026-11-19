"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-solids"
import { solidEngine } from "./engine"

/** Solids and nets: faces, edges and vertices counted by tapping, the solids by name, and nets folded up into them. */
export default function SolidsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
