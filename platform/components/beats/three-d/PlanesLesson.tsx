"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-planes"
import { solidEngine } from "./engine"

/** Symmetry of solids: a sheet turned and tipped through a solid until its mirror image lands on it. */
export default function PlanesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
