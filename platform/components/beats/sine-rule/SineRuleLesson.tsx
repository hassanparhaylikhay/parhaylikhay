"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats"
import { sineEngine } from "./engine"

/** The sine rule: bigger angle, longer side; the rule found, shown why, and used for sides and angles. */
export default function SineRuleLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={sineEngine} beats={BEATS} closeHref={closeHref} />
}
