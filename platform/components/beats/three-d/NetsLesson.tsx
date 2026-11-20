"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-nets"
import { solidEngine } from "./engine"

/** Drawing nets: a cube's net made on squared paper and folded to check it, a net drawn to size, and surface area from a net. */
export default function NetsLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
