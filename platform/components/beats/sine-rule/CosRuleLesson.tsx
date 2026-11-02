"use client"

import BeatRunner from "../BeatRunner"
import { BEATS } from "./beats-cos"
import { cosEngine } from "./engine"

/** The cosine rule: from Pythagoras to any angle, then finding a side and an angle with it. */
export default function CosRuleLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={cosEngine} beats={BEATS} closeHref={closeHref} />
}
