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
}

// Map of "{unit}-{topic}" → lesson folder under /lessons/maths
const LESSON_FOLDERS: Record<string, string> = {
  "01-01": "01-01-types-of-number",
}

// Map of "{unit}-{topic}-{part|'_'}" → widget URL served from /public
// For single-page lessons, use '_' for the part component. For multi-part
// topics, the widget attaches to a specific part (typically 'review').
const WIDGETS: Record<string, string> = {
  "01-01-review": "/widgets/types-of-number-quiz.html",
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

  lesson.widget = WIDGETS[`${key}-_`]
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

  lesson.widget = WIDGETS[`${key}-${partSlug}`]
  return lesson
}
