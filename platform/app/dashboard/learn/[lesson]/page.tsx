import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BEAT_LESSONS } from "@/components/beats/registry"

/**
 * Beat lessons for logged-in students: one tiny idea per frame on a single
 * full-screen board. No sidebar, no header. The proxy keeps /dashboard
 * behind login; the same lessons are open to anyone at /learn/<slug>.
 */
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson } = await params
  return { title: BEAT_LESSONS[lesson]?.title ?? "Lesson" }
}

export default async function LearnPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params
  const entry = BEAT_LESSONS[lesson]
  if (!entry) notFound()
  return <entry.Lesson closeHref={entry.topicHref} />
}
