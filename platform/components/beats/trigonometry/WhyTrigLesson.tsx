"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-why"
import { trigEngine } from "./engine"

/** Why trigonometry works: the optional tour behind the scenes. */
export default function WhyTrigLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={trigEngine} beats={BEATS} closeHref={closeHref} />
}
