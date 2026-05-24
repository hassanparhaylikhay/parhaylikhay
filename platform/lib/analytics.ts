"use client"

import posthog from "posthog-js"

type Props = Record<string, unknown>

export function capture(event: string, props?: Props) {
  if (typeof window === "undefined") return
  try {
    if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return
    posthog.capture(event, props)
  } catch {
    // never break the page on analytics
  }
}
