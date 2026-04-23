import { readFile } from "fs/promises"
import path from "path"
import matter from "gray-matter"

export type LessonMeta = {
  topic?: string
  syllabus_ref?: string
  last_updated?: string
  word_count?: number
}

export type Lesson = {
  meta: LessonMeta
  body: string
  widget?: string
}

// Map of "{unit}-{topic}" → widget URL served from /public
const LESSON_WIDGETS: Record<string, string> = {
  "01-01": "/widgets/types-of-number-quiz.html",
}

// Map of "{unit}-{topic}" → lesson folder name under /lessons/maths
const LESSON_FOLDERS: Record<string, string> = {
  "01-01": "01-01-types-of-number",
}

export async function loadLesson(unitSlug: string, topicSlug: string): Promise<Lesson | null> {
  const key = `${unitSlug}-${topicSlug}`
  const folder = LESSON_FOLDERS[key]
  if (!folder) return null

  const filepath = path.join(process.cwd(), "lessons", "maths", folder, "lesson.md")

  try {
    const raw = await readFile(filepath, "utf8")
    const parsed = matter(raw)
    return {
      meta: parsed.data as LessonMeta,
      body: parsed.content,
      widget: LESSON_WIDGETS[key],
    }
  } catch {
    return null
  }
}
