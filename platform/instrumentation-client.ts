import posthog from "posthog-js"

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

// Only init on the sales demo page — /dashboard and lesson-mode pages stay
// private. The root "/" rewrites server-side to /try, so on the client
// the pathname stays "/" for visitors who land on parhaylikhay.com.
if (typeof window !== "undefined" && KEY) {
  const p = window.location.pathname
  const onTry = p === "/" || p === "/try" || p.startsWith("/try/")
  if (onTry) {
    posthog.init(KEY, {
      api_host: HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "input,textarea,select",
      },
    })
  }
}
