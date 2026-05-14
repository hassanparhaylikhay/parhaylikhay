import fs from "node:fs/promises"
import path from "node:path"
import type { Lesson } from "./types"

/**
 * Loads a topic-level Lesson JSON from /content/lessons/<lessonId>/lesson.json.
 * Server-side only. Returns null if the file is missing or malformed.
 *
 * lessonId for a topic is "<unit>-<topic>", e.g. "07-01" for unit 7, topic 1.
 */
export async function loadLesson(lessonId: string): Promise<Lesson | null> {
  const filePath = path.join(process.cwd(), "content", "lessons", lessonId, "lesson.json")
  try {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as Lesson
    if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function lessonIdForTopic(unit: string, topic: string): string {
  return `${unit}-${topic}`
}
