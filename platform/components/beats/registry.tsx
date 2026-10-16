import type { ComponentType } from "react"
import TriangleAnglesLesson from "./triangle-angles/TriangleAnglesLesson"
import PolygonAnglesLesson from "./polygon-angles/PolygonAnglesLesson"
import AnglesLesson from "./angles-basics/AnglesLesson"
import CircleTheoremsLesson from "./circle-theorems/CircleTheoremsLesson"
import CircleTheorems2Lesson from "./circle-theorems-2/CircleTheorems2Lesson"
import CircleTheorems3Lesson from "./circle-theorems-3/CircleTheorems3Lesson"
import PythagorasLesson from "./pythagoras/PythagorasLesson"

/**
 * Every beat lesson, by URL slug. The dashboard page and the public page
 * both read from here, so a lesson is added once and appears in both.
 */
export const BEAT_LESSONS: Record<string, {
  title: string
  description: string
  /** Where the X goes for a logged-in student. */
  topicHref: string
  Lesson: ComponentType<{ closeHref: string }>
}> = {
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
