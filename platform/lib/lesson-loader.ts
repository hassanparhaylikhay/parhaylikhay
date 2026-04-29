import { readFile } from "fs/promises"
import path from "path"
import matter from "gray-matter"

export type LessonMeta = {
  title?: string
  topic?: string
  syllabus_ref?: string
  last_updated?: string
}

export type Check = {
  q: string
  options: string[]
  correct: number
  explain?: string
}

export type Lesson = {
  meta: LessonMeta
  body: string
  checks?: Check[]
  widget?: string
  widgetHeight?: number
}

// Map of "{unit}-{topic}" → lesson folder under /lessons/maths
const LESSON_FOLDERS: Record<string, string> = {
  "01-01": "01-01-types-of-number",
  "01-02": "01-02-sets",
  "01-03": "01-03-powers-and-roots",
  "01-04": "01-04-fractions-decimals-percentages",
  "01-05": "01-05-ordering",
  "01-06": "01-06-four-operations",
  "01-07": "01-07-indices-i",
  "01-08": "01-08-standard-form",
  "01-09": "01-09-estimation",
  "01-10": "01-10-limits-of-accuracy",
  "01-11": "01-11-ratio-and-proportion",
  "01-12": "01-12-rates",
  "01-13": "01-13-percentages",
  "01-14": "01-14-using-a-calculator",
  "01-15": "01-15-time",
  "01-16": "01-16-money",
  "01-17": "01-17-exponential-growth-and-decay",
  "01-18": "01-18-surds",
}

// Map of "{unit}-{topic}-{part|'_'}" → widget URL served from /public
// For single-page lessons, use '_' for the part component. For multi-part
// topics, the widget attaches to a specific part (typically 'review').
type WidgetSpec = { url: string; height: number }
const WIDGETS: Record<string, WidgetSpec> = {
  "01-01-p3":     { url: "/widgets/terminate-or-recur.html",            height: 520 },
  "01-01-p4":     { url: "/widgets/shape-classifier-grid.html",         height: 760 },
  "01-01-p5":     { url: "/widgets/factor-tree-builder.html",           height: 560 },
  "01-01-p6":     { url: "/widgets/hcf-or-lcm-word-problems.html",      height: 640 },
  "01-01-review": { url: "/widgets/types-of-number-quiz.html",          height: 680 },
  "01-02-p3":     { url: "/widgets/venn-shader.html",                   height: 700 },
  "01-03-p1":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-03-p2":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-03-p3":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-04-p2":     { url: "/widgets/fdp-converter.html",                 height: 480 },
  "01-04-p3":     { url: "/widgets/fdp-converter.html",                 height: 480 },
  "01-05-p2":     { url: "/widgets/ordering-trainer.html",              height: 540 },
  "01-06-p1":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-06-p2":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-06-p4":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-07-p1":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-07-p3":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-08-p1":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
  "01-08-p2":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
  "01-08-p3":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
}

async function readMarkdown(folder: string, file: string): Promise<Lesson | null> {
  const filepath = path.join(process.cwd(), "lessons", "maths", folder, file)
  try {
    const raw = await readFile(filepath, "utf8")
    const parsed = matter(raw)
    return {
      meta: parsed.data as LessonMeta,
      body: parsed.content,
      checks: (parsed.data as { checks?: Check[] }).checks,
    }
  } catch {
    return null
  }
}

export async function loadLesson(unitSlug: string, topicSlug: string): Promise<Lesson | null> {
  const key = `${unitSlug}-${topicSlug}`
  const folder = LESSON_FOLDERS[key]
  if (!folder) return null

  const lesson = await readMarkdown(folder, "lesson.md")
  if (!lesson) return null

  const w = WIDGETS[`${key}-_`]
  if (w) { lesson.widget = w.url; lesson.widgetHeight = w.height }
  return lesson
}

export async function loadLessonPart(
  unitSlug: string,
  topicSlug: string,
  partSlug: string,
): Promise<Lesson | null> {
  const key = `${unitSlug}-${topicSlug}`
  const folder = LESSON_FOLDERS[key]
  if (!folder) return null

  const lesson = await readMarkdown(folder, `${partSlug}.md`)
  if (!lesson) return null

  const w = WIDGETS[`${key}-${partSlug}`]
  if (w) { lesson.widget = w.url; lesson.widgetHeight = w.height }
  return lesson
}
