import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BEAT_LESSONS } from "@/components/beats/registry"

/**
 * Beat lessons with no login, so a link can be sent to anyone to try.
 * Same lesson as /dashboard/learn/<slug>; the X leads to the public site.
 */
export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson } = await params
  const entry = BEAT_LESSONS[lesson]
  if (!entry) return { title: "Lesson" }
  return {
    title: entry.title,
    description: entry.description,
    openGraph: { title: `${entry.title} · Parhaylikhay`, description: entry.description, type: "website" },
  }
}

export default async function PublicLearnPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params
  const entry = BEAT_LESSONS[lesson]
  if (!entry) notFound()
  return <entry.Lesson closeHref="/" />
}
