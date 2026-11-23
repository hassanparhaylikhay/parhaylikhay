"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-volume"
import { solidEngine } from "./engine"

/** Volume of prisms and cylinders: cubes counted in layers, a cross-section swept along a prism, and a cylinder's circle swept up. */
export default function VolumeLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={solidEngine} beats={BEATS} closeHref={closeHref} />
}
