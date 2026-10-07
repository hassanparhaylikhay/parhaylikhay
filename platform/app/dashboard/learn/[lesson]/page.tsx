import type { Metadata } from "next"
import { notFound } from "next/navigation"
import TriangleAnglesLesson from "@/components/beats/triangle-angles/TriangleAnglesLesson"

/**
 * Beat lessons: one tiny idea per frame on a single full-screen board.
 * No sidebar, no header. The proxy already keeps /dashboard behind login.
 */
const LESSONS: Record<string, { title: string; back: string }> = {
  "angles-in-a-triangle": { title: "Angles in a triangle", back: "/dashboard/maths/04/06" },
}

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson } = await params
  return { title: LESSONS[lesson]?.title ?? "Lesson" }
}

export default async function LearnPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params
  const meta = LESSONS[lesson]
  if (!meta) notFound()
  if (lesson === "angles-in-a-triangle") return <TriangleAnglesLesson closeHref={meta.back} />
  notFound()
}
