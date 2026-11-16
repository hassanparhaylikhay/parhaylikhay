"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-angles"
import { solidEngine } from "./engine"

/** Angles in 3D: a stick and its shadow, the angle between a line and the floor, and heights above a point seen from two places. */
export default function Angles3dLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
