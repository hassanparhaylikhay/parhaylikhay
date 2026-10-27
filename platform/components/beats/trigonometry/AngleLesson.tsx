"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-angle"
import { angleEngine } from "./engine"

/** Trigonometry: finding an angle, with sin⁻¹, cos⁻¹ and tan⁻¹, and angles of elevation and depression. */
export default function AngleLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={angleEngine} beats={BEATS} closeHref={closeHref} />
}
