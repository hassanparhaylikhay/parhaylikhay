"use client"

/**
 * "I understood" — the student-led advance button used on every non-interaction
 * slide (hook, concept, recap, examLink without an interaction). Lets the
 * student set their own pace rather than searching for the small Next arrow.
 *
 * The button is intentionally NOT loud. It sits below the slide content,
 * neutral until hovered, then green. Keyboard ← / → still works in parallel.
 */
export default function UnderstoodButton({
  onClick,
  label = "I understood",
  disabled = false,
}: {
  onClick?: () => void
  label?: string
  disabled?: boolean
}) {
  if (!onClick) return null
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-3 sm:mt-4 group flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#1a3350] bg-[#0b1118] hover:bg-[#0d1a28] hover:border-[#00abfa66] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="text-[12.5px] font-mono uppercase tracking-[1.5px] text-[#7a7875] group-hover:text-[#0fee89] transition-colors duration-300">
        {label}
      </span>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-[#3a4a5a] group-hover:text-[#0fee89] transition-colors duration-300">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
