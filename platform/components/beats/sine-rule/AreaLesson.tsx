"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-area"
import { cosEngine } from "./engine"

/** The area of a triangle: ½ab sin C found from the height, used, worked backwards, and the shortest distance. */
export default function AreaLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={cosEngine} beats={BEATS} closeHref={closeHref} />
}
