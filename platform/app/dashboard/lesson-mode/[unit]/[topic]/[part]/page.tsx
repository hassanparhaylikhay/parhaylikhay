import { notFound } from "next/navigation"
import { UNITS } from "../../../../maths/data"
import { loadLesson, lessonIdFromParts } from "@/lib/lesson-mode/loader"
import LessonRunner from "@/components/lesson-mode/LessonRunner"

export default async function LessonModePage({
  params,
}: {
  params: Promise<{ unit: string; topic: string; part: string }>
}) {
  const { unit: unitSlug, topic: topicSlug, part: partSlug } = await params

  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()
  const topic = unit.topics.find(t => t.slug === topicSlug)
  if (!topic) notFound()
  if (topic.parts && !topic.parts.find(p => p.slug === partSlug)) notFound()

  const lessonId = lessonIdFromParts(unitSlug, topicSlug, partSlug)
  const lesson = await loadLesson(lessonId)

  if (!lesson) {
    return (
      <div className="h-full w-full flex items-center justify-center px-8">
        <div className="max-w-md text-center">
          <p className="text-[11px] font-mono text-[#3a4a5a] uppercase tracking-[2px] mb-3">
            Lesson Mode
          </p>
          <h1 className="text-[22px] font-semibold text-[#f0eeea] mb-3 tracking-tight">
            This lesson isn&apos;t ready yet
          </h1>
          <p className="text-[13px] text-[#7a7875] leading-relaxed mb-6">
            We&apos;re still writing the slide-by-slide version of this part.
            Use the revision notes for now.
          </p>
          <a
            href={`/dashboard/maths/${unitSlug}/${topicSlug}/${partSlug}`}
            className="inline-block text-[12px] font-mono text-[#00abfa] hover:text-[#7ed1ff] transition-colors"
          >
            ← Back to revision notes
          </a>
        </div>
      </div>
    )
  }

  return <LessonRunner lesson={lesson} />
}
