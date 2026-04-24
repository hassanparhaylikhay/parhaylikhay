import { notFound } from "next/navigation"
import Link from "next/link"
import { UNITS, getPrevNext, urlFor } from "../../../data"
import { loadLessonPart } from "@/lib/lesson-loader"
import LessonBody from "../lesson-body"
import InlineCheck from "../inline-check"
import WidgetFrame from "../widget-frame"

export default async function PartPage({
  params,
}: {
  params: Promise<{ unit: string; topic: string; part: string }>
}) {
  const { unit: unitSlug, topic: topicSlug, part: partSlug } = await params

  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()
  const topic = unit.topics.find(t => t.slug === topicSlug)
  if (!topic || !topic.parts) notFound()
  const part = topic.parts.find(p => p.slug === partSlug)
  if (!part) notFound()

  const lesson = await loadLessonPart(unitSlug, topicSlug, partSlug)
  const { prev, next } = getPrevNext(unitSlug, topicSlug, partSlug)

  const partIdx = topic.parts.findIndex(p => p.slug === partSlug)
  const partNumber = partIdx + 1
  const partsTotal = topic.parts.length

  return (
    <main className="max-w-[760px] mx-auto px-8 py-12">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] font-mono text-[#3a4a5a] mb-8 flex-wrap">
        <Link href="/dashboard" className="hover:text-[#7a7875] transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/maths/${unitSlug}`} className="hover:text-[#7a7875] transition-colors">{unit.title}</Link>
        <span>/</span>
        <Link href={`/dashboard/maths/${unitSlug}/${topicSlug}`} className="hover:text-[#7a7875] transition-colors">{topic.code} {topic.title}</Link>
        <span>/</span>
        <span className="text-[#7a7875]">{part.label}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-mono tracking-[2.5px] uppercase text-[#00abfa] bg-[#00abfa12] border border-[#00abfa44] rounded px-2 py-0.5">
            {part.isReview ? "REVIEW" : `PART ${partNumber} OF ${partsTotal - 1}`}
          </span>
          <span className="text-[11px] font-mono text-[#3a4a5a]">{topic.code} · {topic.title}</span>
        </div>
        <h1 className="text-[28px] font-bold text-[#f0eeea] tracking-tight leading-tight">{part.title}</h1>
      </div>

      {/* Body */}
      {lesson ? (
        <>
          <LessonBody markdown={lesson.body} />

          {lesson.checks && lesson.checks.length > 0 && (
            <InlineCheck checks={lesson.checks} />
          )}

          {lesson.widget && (
            <WidgetFrame
              src={lesson.widget}
              title={`${part.title} interactive`}
              initialHeight={lesson.widgetHeight ?? 640}
            />
          )}
        </>
      ) : (
        <div className="rounded-xl border border-[#141e2a] bg-[#0b1118] px-8 py-14 text-center">
          <p className="text-[14px] text-[#7a7875]">This part is being written.</p>
        </div>
      )}

      {/* Prev / Next */}
      <div className="flex justify-between items-start pt-8 mt-16 border-t border-[#141e2a] gap-6">
        {prev ? (
          <Link href={urlFor(prev)} className="flex items-start gap-3 group max-w-[48%]">
            <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="text-[#3a4a5a] group-hover:text-[#c8c6be] transition-colors mt-1 shrink-0">
              <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p className="text-[10px] font-mono text-[#3a4a5a] mb-0.5 uppercase tracking-wider">Previous</p>
              <p className="text-[13px] text-[#7a7875] group-hover:text-[#c8c6be] transition-colors leading-snug">{prev.partTitle || prev.topicTitle}</p>
            </div>
          </Link>
        ) : <div />}

        {next ? (
          <Link href={urlFor(next)} className="flex items-start gap-3 text-right group max-w-[48%]">
            <div>
              <p className="text-[10px] font-mono text-[#3a4a5a] mb-0.5 uppercase tracking-wider">Next</p>
              <p className="text-[13px] text-[#7a7875] group-hover:text-[#c8c6be] transition-colors leading-snug">{next.partTitle || next.topicTitle}</p>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="text-[#3a4a5a] group-hover:text-[#c8c6be] transition-colors mt-1 shrink-0">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : <div />}
      </div>

    </main>
  )
}
