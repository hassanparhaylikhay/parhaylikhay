"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-surface"
import { solidEngine } from "./engine"

/** Surface area: solids opened out into nets, a prism's strip of rectangles, and a cylinder's curved face unrolled. */
export default function SurfaceLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
