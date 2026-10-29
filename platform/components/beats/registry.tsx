import type { ComponentType } from "react"
import TriangleAnglesLesson from "./triangle-angles/TriangleAnglesLesson"
import PolygonAnglesLesson from "./polygon-angles/PolygonAnglesLesson"
import AnglesLesson from "./angles-basics/AnglesLesson"
import CircleTheoremsLesson from "./circle-theorems/CircleTheoremsLesson"
import CircleTheorems2Lesson from "./circle-theorems-2/CircleTheorems2Lesson"
import CircleTheorems3Lesson from "./circle-theorems-3/CircleTheorems3Lesson"
import PythagorasLesson from "./pythagoras/PythagorasLesson"
import TrigLesson from "./trigonometry/TrigLesson"
import WhyTrigLesson from "./trigonometry/WhyTrigLesson"
import AngleLesson from "./trigonometry/AngleLesson"
import SineRuleLesson from "./sine-rule/SineRuleLesson"

/**
 * Every beat lesson, by URL slug. The dashboard page and the public page
 * both read from here, so a lesson is added once and appears in both.
 */
type BeatLesson = {
  title: string
  description: string
  /** Where the X goes for a logged-in student. */
  topicHref: string
  Lesson: ComponentType<{ closeHref: string }>
}

export const BEAT_LESSONS: Record<string, BeatLesson> = {
  angles: {
    title: "Angles",
    description: "Turn a line to see what an angle is, then find the rules for straight lines, crossing lines and parallel lines.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: AnglesLesson,
  },
  "circle-theorems-1": {
    title: "Circle theorems I",
    description: "Draw a circle, find that the angle in a semicircle is always 90°, and see why the angle at the centre is twice the angle at the circumference.",
    topicHref: "/dashboard/maths/04/07",
    Lesson: CircleTheoremsLesson,
  },
  "circle-theorems-2": {
    title: "Circle theorems II",
    description: "Cyclic quadrilaterals, tangents, two tangents from a point, and the alternate segment theorem, each found by moving the figure yourself.",
    topicHref: "/dashboard/maths/04/07",
    Lesson: CircleTheorems2Lesson,
  },
  "circle-theorems-3": {
    title: "Circle theorems III",
    description: "Find the middle of a chord, see why the line through it at 90° always hits the centre, find a lost centre, and learn why equal chords are the same distance from the centre.",
    topicHref: "/dashboard/maths/04/08",
    Lesson: CircleTheorems3Lesson,
  },
  pythagoras: {
    title: "Pythagoras' theorem",
    description: "Build squares on the sides of a right-angled triangle, see why the two small ones always make the big one, and use it to find any side.",
    topicHref: "/dashboard/maths/06/01",
    Lesson: PythagorasLesson,
  },
  trigonometry: {
    title: "Trigonometry: sin, cos and tan",
    description: "From Pythagoras to trigonometry: name the sides, learn SOH CAH TOA, and find any missing side, with every step of the algebra done in front of you.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: TrigLesson,
  },
  "trigonometry-angles": {
    title: "Trigonometry: finding an angle",
    description: "Find a missing angle with sin⁻¹, cos⁻¹ and tan⁻¹, see why they undo sin, cos and tan, and work out angles of elevation and depression.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: AngleLesson,
  },
  "sine-rule": {
    title: "The sine rule",
    description: "See why a bigger angle faces a longer side, find the sine rule yourself, and use it to find sides and angles, including when the angle could be obtuse.",
    topicHref: "/dashboard/maths/06/03",
    Lesson: SineRuleLesson,
  },
  "why-trig-works": {
    title: "Why trigonometry works",
    description: "An optional tour behind the scenes: why every angle has its own sin, cos and tan, where your calculator's numbers come from, and why tan is called tangent.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: WhyTrigLesson,
  },
  "angles-in-a-triangle": {
    title: "Angles in a triangle",
    description: "Draw a triangle, play with it, and find out why its angles always add up to 180°.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: TriangleAnglesLesson,
  },
  "angles-in-polygons": {
    title: "Angles in polygons",
    description: "Draw a shape, cut it into triangles, walk round it, and find out what its angles add up to.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: PolygonAnglesLesson,
  },
}

// Old links keep working: the first two trig lessons were reshaped into the
// main lesson and the optional tour (26 Oct 2026).
BEAT_LESSONS["trigonometry-2"] = BEAT_LESSONS.trigonometry
BEAT_LESSONS["trigonometry-1"] = BEAT_LESSONS["why-trig-works"]
