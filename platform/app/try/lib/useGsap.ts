"use client"

import { useEffect, useState } from "react"

/**
 * useGsap — loads GSAP + ScrollTrigger once and returns the gsap object
 * (or null until ready). Registers ScrollTrigger plugin lazily so we
 * stay SSR-safe and don't bloat the initial bundle for visitors who
 * bounce in the first second.
 */
type GsapBundle = {
  gsap: typeof import("gsap").gsap
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger
}

let cached: GsapBundle | null = null
let cachedPromise: Promise<GsapBundle> | null = null

function loadGsap(): Promise<GsapBundle> {
  if (cached) return Promise.resolve(cached)
  if (cachedPromise) return cachedPromise
  cachedPromise = (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ])
    gsap.registerPlugin(ScrollTrigger)
    cached = { gsap, ScrollTrigger }
    return cached
  })()
  return cachedPromise
}

export function useGsap(): GsapBundle | null {
  const [bundle, setBundle] = useState<GsapBundle | null>(cached)
  useEffect(() => {
    if (bundle) return
    let alive = true
    void loadGsap().then(b => { if (alive) setBundle(b) })
    return () => { alive = false }
  }, [bundle])
  return bundle
}
