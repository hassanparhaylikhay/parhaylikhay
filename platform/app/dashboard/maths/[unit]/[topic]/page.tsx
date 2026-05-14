import { notFound } from "next/navigation"
import Link from "next/link"
import fs from "node:fs/promises"
import path from "node:path"
import { UNITS, getPrevNext, urlFor } from "../../data"
import { loadLesson } from "@/lib/lesson-loader"
import LessonBody from "./lesson-body"
import WidgetFrame from "./widget-frame"

async function topicHasLessonMode(unit: string, topic: string): Promise<boolean> {
  const lessonPath = path.join(process.cwd(), "content", "lessons", `${unit}-${topic}`, "lesson.json")
  try { await fs.access(lessonPath); return true } catch { return false }
}

function TopicLessonModeCard({ unit, topic, partsCount }: { unit: string; topic: string; partsCount: number }) {
  return (
    <Link
      href={`/dashboard/lesson-mode/${unit}/${topic}`}
      className="group block rounded-xl border border-[#00abfa44] bg-gradient-to-br from-[#00abfa1a] via-[#0b1118] to-[#0b1118] px-6 py-5 hover:border-[#00abfa88] hover:from-[#00abfa28] transition-all duration-300 mb-10"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-lg bg-[#00abfa1f] border border-[#00abfa55] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 3l8 5-8 5V3z" fill="#00abfa" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[2px] text-[#00abfa] mb-1">Lesson Mode · new</p>
          <p className="text-[15px] text-[#f0eeea] font-semibold leading-tight">Learn the whole topic in one guided flow</p>
          <p className="text-[13px] text-[#7a7875] mt-1.5 leading-relaxed">
            Slide-by-slide with drag, place, identify. Covers all {partsCount} parts plus the comprehensive worked example.
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#3a4a5a] group-hover:text-[#00abfa] transition-colors shrink-0 mt-1">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ unit: string; topic: string }>
}) {
  const { unit: unitSlug, topic: topicSlug } = await params
  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()
  const topic = unit.topics.find(t => t.slug === topicSlug)
  if (!topic) notFound()

  // ── Multi-part topic: render TOC ──
  if (topic.parts && topic.parts.length > 0) {
    const lessonModeAvailable = await topicHasLessonMode(unitSlug, topicSlug)
    return (
      <main className="max-w-[760px] mx-auto px-8 py-12">

        <div className="flex items-center gap-2 text-[12px] font-mono text-[#3a4a5a] mb-10">
          <Link href="/dashboard" className="hover:text-[#7a7875] transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href={`/dashboard/maths/${unitSlug}`} className="hover:text-[#7a7875] transition-colors">{unit.title}</Link>
          <span>/</span>
          <span className="text-[#7a7875]">{topic.code}</span>
        </div>

        <div className="mb-10">
          <p className="text-[11px] font-mono tracking-[2.5px] uppercase text-[#00abfa] mb-3">{topic.code}</p>
          <h1 className="text-[30px] font-bold text-[#f0eeea] tracking-tight leading-tight">{topic.title}</h1>
          <p className="text-[14px] text-[#7a7875] mt-3 max-w-[600px] leading-relaxed">
            This topic is split into {topic.parts.filter(p => !p.isReview).length} short parts plus a review. Work through them in order. Each part has a quick check at the end.
          </p>
        </div>

        {lessonModeAvailable && (
          <TopicLessonModeCard unit={unitSlug} topic={topicSlug} partsCount={topic.parts.filter(p => !p.isReview).length} />
        )}

        <div className="rounded-xl border border-[#141e2a] overflow-hidden mb-12">
          {topic.parts.map((part, i) => (
            <Link
              key={part.slug}
              href={`/dashboard/maths/${unitSlug}/${topicSlug}/${part.slug}`}
              className={`flex items-center gap-5 px-6 py-5 hover:bg-[#0b1118] transition-colors group${i < topic.parts!.length - 1 ? " border-b border-[#141e2a]" : ""}${part.isReview ? " bg-[#0fee8905]" : ""}`}
            >
              <span className={`inline-flex items-center justify-center w-10 h-7 rounded-md text-[11px] font-mono font-semibold shrink-0 ${part.isReview ? "text-[#0fee89] bg-[#0fee8912] border border-[#0fee8944]" : "text-[#00abfa] bg-[#00abfa10] border border-[#00abfa33]"}`}>
                {part.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#f0eeea] font-medium">{part.title}</p>
                {part.isReview && (
                  <p className="text-[12px] text-[#7a7875] mt-0.5">Marking patterns · summary · full quiz</p>
                )}
              </div>
              <svg className="w-4 h-4 text-[#3a4a5a] group-hover:text-[#00abfa] transition-colors shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>

        <div className="flex justify-end">
          <Link
            href={`/dashboard/maths/${unitSlug}/${topicSlug}/${topic.parts[0].slug}`}
            className="inline-flex items-center gap-2 bg-white text-[#07090d] text-[13px] font-semibold rounded-md px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            Start Part 1
            <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </main>
    )
  }

  // ── Single-page topic: render lesson if available, else placeholder ──
  const lesson = await loadLesson(unitSlug, topicSlug)
  const { prev, next } = getPrevNext(unitSlug, topicSlug)

  return (
    <main className="max-w-[760px] mx-auto px-8 py-12">
      <div className="flex items-center gap-2 text-[12px] font-mono text-[#3a4a5a] mb-10">
        <Link href="/dashboard" className="hover:text-[#7a7875] transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/maths/${unitSlug}`} className="hover:text-[#7a7875] transition-colors">{unit.title}</Link>
        <span>/</span>
        <span className="text-[#7a7875]">{topic.code}</span>
      </div>

      <div className="mb-10">
        <p className="text-[11px] font-mono tracking-[2.5px] uppercase text-[#00abfa] mb-3">{topic.code}</p>
        <h1 className="text-[30px] font-bold text-[#f0eeea] tracking-tight leading-tight">{topic.title}</h1>
      </div>

      {lesson ? (
        <>
          <LessonBody markdown={lesson.body} />
          {lesson.widget && (
            <WidgetFrame
              src={lesson.widget}
              title={`${topic.title} interactive`}
              initialHeight={lesson.widgetHeight ?? 640}
            />
          )}
        </>
      ) : (
        <div className="rounded-xl border border-[#141e2a] bg-[#0b1118] px-8 py-14 flex flex-col items-center text-center gap-4">
          <div className="w-10 h-10 rounded-full border border-[#141e2a] flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 6v6m0 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" stroke="#3a4a5a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] text-[#7a7875]">This lesson is being built.</p>
          <p className="text-[12px] text-[#3a4a5a] max-w-sm leading-relaxed">
            Interactive tools, worked examples, and mark-scheme annotations are coming for this topic.
          </p>
        </div>
      )}

      <div className="flex justify-between items-start pt-8 mt-16 border-t border-[#141e2a]">
        {prev ? (
          <Link href={urlFor(prev)} className="flex items-start gap-3 group max-w-[45%]">
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
          <Link href={urlFor(next)} className="flex items-start gap-3 text-right group max-w-[45%]">
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
