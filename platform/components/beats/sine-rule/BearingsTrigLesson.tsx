"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-brg"
import { cosEngine } from "./engine"

/** Bearings in triangles: the angle between two bearings, and a bearing from an angle, with the sine and cosine rules. */
export default function BearingsTrigLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={cosEngine} beats={BEATS} closeHref={closeHref} />
}
