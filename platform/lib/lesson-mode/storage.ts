"use client"

import { createClient } from "@/lib/supabase/client"
import type { LessonProgress, SlideState } from "./types"

/**
 * Persistence layer for Lesson Mode.
 *
 * Tries Supabase first; falls back to localStorage if anything fails (no
 * network, table missing, RLS denial). The fallback keeps Lesson Mode
 * runnable even before the SQL migration is applied.
 *
 * Schema:
 *   create table lesson_mode_progress (
 *     user_id    uuid references auth.users not null,
 *     lesson_id  text not null,
 *     state      jsonb not null,
 *     updated_at timestamptz default now(),
 *     primary key (user_id, lesson_id)
 *   );
 */

const localKey = (lessonId: string) => `pl:lesson-mode:${lessonId}`

function emptyProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    currentSlideIdx: 0,
    slideStates: {},
    updatedAt: new Date().toISOString(),
  }
}

function readLocal(lessonId: string): LessonProgress | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(localKey(lessonId))
    return raw ? (JSON.parse(raw) as LessonProgress) : null
  } catch {
    return null
  }
}

function writeLocal(progress: LessonProgress): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(localKey(progress.lessonId), JSON.stringify(progress))
  } catch {
    // quota / private mode — swallow
  }
}

export async function loadProgress(lessonId: string): Promise<LessonProgress> {
  const local = readLocal(lessonId)
  try {
    const sb = createClient()
    const { data: userData } = await sb.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return local ?? emptyProgress(lessonId)

    const { data, error } = await sb
      .from("lesson_mode_progress")
      .select("state, updated_at")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .maybeSingle()

    if (error || !data) return local ?? emptyProgress(lessonId)

    const remote = data.state as LessonProgress
    // Prefer whichever is newer
    if (local && local.updatedAt > (remote.updatedAt ?? "")) return local
    return remote
  } catch {
    return local ?? emptyProgress(lessonId)
  }
}

export async function saveProgress(progress: LessonProgress): Promise<void> {
  progress.updatedAt = new Date().toISOString()
  writeLocal(progress)
  try {
    const sb = createClient()
    const { data: userData } = await sb.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    await sb
      .from("lesson_mode_progress")
      .upsert(
        { user_id: userId, lesson_id: progress.lessonId, state: progress, updated_at: progress.updatedAt },
        { onConflict: "user_id,lesson_id" }
      )
  } catch {
    // already saved locally — degrade silently
  }
}

export function updateSlideState(
  progress: LessonProgress,
  slideId: string,
  patch: Partial<SlideState>
): LessonProgress {
  const prev = progress.slideStates[slideId] ?? { completed: false }
  return {
    ...progress,
    slideStates: {
      ...progress.slideStates,
      [slideId]: { ...prev, ...patch, data: { ...(prev.data ?? {}), ...(patch.data ?? {}) } },
    },
  }
}
