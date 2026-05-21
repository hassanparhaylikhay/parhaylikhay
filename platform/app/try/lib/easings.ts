/**
 * Shared easing constants for the /try demo page.
 *
 * Apple-style: weighted entrances, decisive exits. Never floaty.
 * - ENTER: slow, weighted, confident — long settle.
 * - EXIT: quick, decisive — fast release.
 * - SPRING: low-bounce snap for "thing locked into place" moments.
 *
 * Use the CSS string forms in inline styles; the GSAP array forms
 * pass straight to `ease:` / `customEase`.
 */

export const EASE = {
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit:  "cubic-bezier(0.4, 0, 0.2, 1)",
} as const

export const GSAP_EASE = {
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit:  "cubic-bezier(0.4, 0, 0.2, 1)",
} as const

/** GSAP spring config for snap-into-place moments. */
export const SPRING = { stiffness: 200, damping: 25 } as const

/** Standard stagger between sibling reveals. 80–150 ms per spec. */
export const STAGGER = 0.12

/** Standard text reveal duration. Never under 500 ms per spec. */
export const TEXT_DURATION = 0.9
