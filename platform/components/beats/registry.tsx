import type { ComponentType } from "react"
import TriangleAnglesLesson from "./triangle-angles/TriangleAnglesLesson"

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
  "angles-in-a-triangle": {
    title: "Angles in a triangle",
    description: "Draw a triangle, play with it, and find out why its angles always add up to 180°.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: TriangleAnglesLesson,
  },
}
