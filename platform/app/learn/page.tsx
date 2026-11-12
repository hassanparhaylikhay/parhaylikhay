import type { CSSProperties } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import fs from "node:fs"
import path from "node:path"
import { BEAT_LESSONS } from "@/components/beats/registry"
import { UNITS } from "@/app/dashboard/maths/data"
import styles from "./learn.module.css"

/**
 * Every beat lesson on one page, for testers: no login, grouped by syllabus
 * unit. It reads the registry, so a new lesson appears here by itself (its
 * picture comes from scripts/learn-covers.mjs).
 */
export const metadata: Metadata = {
  title: "Lessons",
  description: "Every Parhaylikhay lesson built so far, in syllabus order.",
  robots: { index: false, follow: false },
}

// Built once, so the pictures in public/learn are checked at build time.
export const dynamic = "force-static"

type Card = { slug: string; code: string; title: string; description: string; cover: boolean }
type Group = { slug: string; title: string; color: string; lessons: Card[] }

/** Lessons by unit, in syllabus order (a topic's lessons keep the registry's order). */
function units(): Group[] {
  const seen = new Set<object>()
  const out = new Map<string, Group>()
  const order = new Map<string, string>()
  for (const [slug, entry] of Object.entries(BEAT_LESSONS)) {
    // old slugs point at the same lesson: list it once, by its first slug
    if (seen.has(entry)) continue
    seen.add(entry)
    const [, unitSlug = "99", topicSlug = "99"] = entry.topicHref.match(/\/(\d+)\/(\d+)$/) ?? []
    const unit = UNITS.find(u => u.slug === unitSlug)
    const topic = unit?.topics.find(t => t.slug === topicSlug)
    if (!out.has(unitSlug)) out.set(unitSlug, { slug: unitSlug, title: unit?.title ?? "More lessons", color: unit?.color ?? "#0fee89", lessons: [] })
    order.set(slug, topicSlug)
    out.get(unitSlug)!.lessons.push({
      slug,
      code: topic?.code ?? "",
      title: entry.title,
      description: entry.description,
      cover: fs.existsSync(path.join(process.cwd(), "public", "learn", `${slug}.webp`)),
    })
  }
  const list = [...out.values()].sort((a, b) => a.slug.localeCompare(b.slug))
  for (const u of list) u.lessons.sort((a, b) => order.get(a.slug)!.localeCompare(order.get(b.slug)!))
  return list
}

export default function LessonsPage() {
  const list = units()
  const count = list.reduce((n, u) => n + u.lessons.length, 0)
  let k = 0

  return (
    <main className="min-h-screen bg-[#07090d] text-[#c8c6be]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 pt-10 pb-24 sm:pt-14">
        <header className={styles.rise}>
          <Image
            src="/parhaylikhay-logo.png"
            alt="Parhaylikhay"
            width={900}
            height={225}
            priority
            className="block h-auto w-[170px] sm:w-[200px]"
          />
          <h1 className="mt-10 sm:mt-14 font-sans text-[34px] sm:text-[46px] leading-[1.1] tracking-[-0.025em] text-[#f0eeea] font-medium">
            Lessons
          </h1>
          <p className="mt-4 max-w-[52ch] text-[16px] sm:text-[17px] leading-[1.6]">
            Every lesson we have built so far, in syllabus order. Tap one to start. You
            don&apos;t need an account.
          </p>
          <p className="mt-5 text-[14px] text-[#7a7875]">
            <span className="text-[#f0eeea] font-medium">{count}</span> lessons
          </p>
        </header>

        {list.map(u => (
          <section key={u.slug} className="mt-14 sm:mt-20" aria-labelledby={`unit-${u.slug}`}>
            <div className={`mb-5 sm:mb-7 ${styles.rise}`} style={{ "--delay": `${Math.min(k * 50, 500)}ms` } as CSSProperties}>
              <p className="text-[13px] font-medium" style={{ color: u.color }}>
                Unit {Number(u.slug)}
              </p>
              <h2 id={`unit-${u.slug}`} className="mt-1 text-[24px] sm:text-[28px] leading-tight tracking-[-0.02em] text-[#f0eeea] font-medium">
                {u.title}
              </h2>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {u.lessons.map(l => {
                const delay = Math.min(++k * 50, 500)
                return (
                  <li key={l.slug} className={styles.rise} style={{ "--delay": `${delay}ms` } as CSSProperties}>
                    <Link href={`/learn/${l.slug}`} className={styles.card} style={{ "--accent": u.color } as CSSProperties}>
                      {l.cover && (
                        <div className={styles.cover}>
                          <Image
                            src={`/learn/${l.slug}.webp`}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 116px, (max-width: 1024px) 50vw, 380px"
                            priority={k <= 3}
                          />
                        </div>
                      )}
                      <div className={styles.body}>
                        <p className="font-mono text-[12px]" style={{ color: u.color }}>{l.code}</p>
                        <h3 className="mt-1 text-[16px] sm:text-[17px] leading-snug tracking-[-0.01em] text-[#f0eeea] font-medium">{l.title}</h3>
                        <p className={`mt-1.5 sm:mt-2 text-[13.5px] sm:text-[14px] leading-[1.55] text-[#c8c6be]/80 ${styles.blurb}`}>{l.description}</p>
                        <p className={`mt-auto pt-4 text-[14px] font-medium ${styles.start}`}>
                          Start <span className={styles.arrow} aria-hidden>→</span>
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        <p className="mt-20 text-center text-[14px] text-[#7a7875]">
          If something looks wrong, take a screenshot and send it to us.
        </p>
      </div>
    </main>
  )
}
