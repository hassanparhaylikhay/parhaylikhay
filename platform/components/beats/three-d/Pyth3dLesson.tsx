"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-pyth"
import { solidEngine } from "./engine"

/** Pythagoras in 3D: build a box, lift the hidden right-angled triangles out of it, and find any length inside a cuboid or a pyramid. */
export default function Pyth3dLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
