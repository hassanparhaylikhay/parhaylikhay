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
  widgetHeight?: number
}

// Map of "{unit}-{topic}" → lesson folder under /lessons/maths
const LESSON_FOLDERS: Record<string, string> = {
  "01-01": "01-01-types-of-number",
  "01-02": "01-02-sets",
  "01-03": "01-03-powers-and-roots",
  "01-04": "01-04-fractions-decimals-percentages",
  "01-05": "01-05-ordering",
  "01-06": "01-06-four-operations",
  "01-07": "01-07-indices-i",
  "01-08": "01-08-standard-form",
  "01-09": "01-09-estimation",
  "01-10": "01-10-limits-of-accuracy",
  "01-11": "01-11-ratio-and-proportion",
  "01-12": "01-12-rates",
  "01-13": "01-13-percentages",
  "01-14": "01-14-using-a-calculator",
  "01-15": "01-15-time",
  "01-16": "01-16-money",
  "01-17": "01-17-exponential-growth-and-decay",
  "01-18": "01-18-surds",
  "02-01": "02-01-introduction-to-algebra",
  "02-02": "02-02-algebraic-manipulation",
  "02-03": "02-03-algebraic-fractions",
  "02-04": "02-04-indices-ii",
  "02-05": "02-05-equations",
  "02-06": "02-06-inequalities",
  "02-07": "02-07-sequences",
  "02-08": "02-08-proportion",
  "02-09": "02-09-graphs-in-practical-situations",
  "02-10": "02-10-graphs-of-functions",
  "02-11": "02-11-sketching-curves",
  "02-12": "02-12-functions",
  "03-01": "03-01-coordinates",
  "03-02": "03-02-drawing-linear-graphs",
  "03-03": "03-03-gradient-of-linear-graphs",
  "03-04": "03-04-length-and-midpoint",
  "03-05": "03-05-equations-of-linear-graphs",
  "03-06": "03-06-parallel-lines",
  "03-07": "03-07-perpendicular-lines",
  "04-01": "04-01-geometrical-terms",
  "04-02": "04-02-geometrical-constructions",
  "04-03": "04-03-scale-drawings",
  "04-04": "04-04-similarity",
  "04-05": "04-05-symmetry",
  "04-06": "04-06-angles",
  "04-07": "04-07-circle-theorems-i",
  "04-08": "04-08-circle-theorems-ii",
  "05-01": "05-01-units-of-measure",
  "05-02": "05-02-area-and-perimeter",
  "05-03": "05-03-circles-arcs-sectors",
  "05-04": "05-04-surface-area-and-volume",
  "05-05": "05-05-compound-shapes",
  "06-01": "06-01-pythagoras",
  "06-02": "06-02-right-angled-triangles",
  "06-03": "06-03-non-right-triangles",
  "06-04": "06-04-3d-trigonometry",
  "07-01": "07-01-transformations",
  "07-02": "07-02-vectors-2d",
  "07-03": "07-03-magnitude",
  "07-04": "07-04-vector-geometry",
  "08-01": "08-01-intro-to-probability",
  "08-02": "08-02-relative-expected-frequencies",
  "08-03": "08-03-combined-events",
}

// Map of "{unit}-{topic}-{part|'_'}" → widget URL served from /public
// For single-page lessons, use '_' for the part component. For multi-part
// topics, the widget attaches to a specific part (typically 'review').
type WidgetSpec = { url: string; height: number }
const WIDGETS: Record<string, WidgetSpec> = {
  "01-01-p3":     { url: "/widgets/terminate-or-recur.html",            height: 520 },
  "01-01-p4":     { url: "/widgets/shape-classifier-grid.html",         height: 760 },
  "01-01-p5":     { url: "/widgets/factor-tree-builder.html",           height: 560 },
  "01-01-p6":     { url: "/widgets/hcf-or-lcm-word-problems.html",      height: 640 },
  "01-01-review": { url: "/widgets/types-of-number-quiz.html",          height: 680 },
  "01-02-p3":     { url: "/widgets/venn-shader.html",                   height: 700 },
  "01-03-p1":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-03-p2":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-03-p3":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-04-p2":     { url: "/widgets/fdp-converter.html",                 height: 480 },
  "01-04-p3":     { url: "/widgets/fdp-converter.html",                 height: 480 },
  "01-05-p2":     { url: "/widgets/ordering-trainer.html",              height: 540 },
  "01-06-p1":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-06-p2":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-06-p4":     { url: "/widgets/four-ops-trainer.html",              height: 460 },
  "01-07-p1":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-07-p3":     { url: "/widgets/powers-roots-trainer.html",          height: 460 },
  "01-08-p1":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
  "01-08-p2":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
  "01-08-p3":     { url: "/widgets/standard-form-trainer.html",         height: 480 },
  "02-01-p1":     { url: "/widgets/algebra-conventions-trainer.html",   height: 540 },
  "02-01-p2":     { url: "/widgets/substitution-trainer.html",          height: 520 },
  "02-01-p3":     { url: "/widgets/substitution-trainer.html",          height: 520 },
  "02-01-review": { url: "/widgets/substitution-trainer.html",          height: 520 },
  "02-02-p1":     { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-02-p2":     { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-02-p3":     { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-02-p4":     { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-02-p5":     { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-02-review": { url: "/widgets/algebra-manipulation-trainer.html",  height: 540 },
  "02-03-p1":     { url: "/widgets/algebraic-fractions-trainer.html",   height: 560 },
  "02-03-p2":     { url: "/widgets/algebraic-fractions-trainer.html",   height: 560 },
  "02-03-p3":     { url: "/widgets/algebraic-fractions-trainer.html",   height: 560 },
  "02-03-review": { url: "/widgets/algebraic-fractions-trainer.html",   height: 560 },
  "02-04-p1":     { url: "/widgets/indices-ii-trainer.html",            height: 540 },
  "02-04-p2":     { url: "/widgets/indices-ii-trainer.html",            height: 540 },
  "02-04-p3":     { url: "/widgets/indices-ii-trainer.html",            height: 540 },
  "02-04-review": { url: "/widgets/indices-ii-trainer.html",            height: 540 },
  "02-05-p1":     { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-05-p2":     { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-05-p3":     { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-05-p4":     { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-05-p5":     { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-05-review": { url: "/widgets/equations-trainer.html",             height: 540 },
  "02-06-p1":     { url: "/widgets/inequalities-trainer.html",          height: 540 },
  "02-06-p2":     { url: "/widgets/inequalities-trainer.html",          height: 540 },
  "02-06-p3":     { url: "/widgets/inequalities-trainer.html",          height: 540 },
  "02-06-review": { url: "/widgets/inequalities-trainer.html",          height: 540 },
  "02-07-p1":     { url: "/widgets/sequences-trainer.html?topic=next",      height: 540 },
  "02-07-p2":     { url: "/widgets/sequences-trainer.html?topic=linear",    height: 540 },
  "02-07-p3":     { url: "/widgets/sequences-trainer.html?topic=quadratic", height: 540 },
  "02-07-p4":     { url: "/widgets/sequences-trainer.html?topic=special",   height: 540 },
  "02-07-review": { url: "/widgets/sequences-trainer.html",                 height: 540 },
  "02-08-p1":     { url: "/widgets/proportion-trainer.html?topic=direct",   height: 540 },
  "02-08-p2":     { url: "/widgets/proportion-trainer.html?topic=inverse",  height: 540 },
  "02-08-p3":     { url: "/widgets/proportion-trainer.html",                height: 540 },
  "02-08-review": { url: "/widgets/proportion-trainer.html",                height: 540 },
  "02-09-p1":     { url: "/widgets/practical-graphs-trainer.html?topic=dt",   height: 540 },
  "02-09-p2":     { url: "/widgets/practical-graphs-trainer.html?topic=vt",   height: 540 },
  "02-09-p3":     { url: "/widgets/practical-graphs-trainer.html?topic=conv", height: 540 },
  "02-09-review": { url: "/widgets/practical-graphs-trainer.html",            height: 540 },
  "02-10-p1":     { url: "/widgets/functions-graph-trainer.html?topic=plot",    height: 540 },
  "02-10-p2":     { url: "/widgets/functions-graph-trainer.html?topic=power",   height: 540 },
  "02-10-p3":     { url: "/widgets/functions-graph-trainer.html?topic=exp",     height: 540 },
  "02-10-p4":     { url: "/widgets/functions-graph-trainer.html?topic=solve",   height: 540 },
  "02-10-p5":     { url: "/widgets/functions-graph-trainer.html?topic=tangent", height: 540 },
  "02-10-review": { url: "/widgets/functions-graph-trainer.html",               height: 540 },
  "02-11-p1":     { url: "/widgets/sketching-trainer.html?topic=quad",          height: 540 },
  "02-11-p2":     { url: "/widgets/sketching-trainer.html?topic=cubic",         height: 540 },
  "02-11-p3":     { url: "/widgets/sketching-trainer.html?topic=exp",           height: 540 },
  "02-11-review": { url: "/widgets/sketching-trainer.html",                     height: 540 },
  "02-12-p1":     { url: "/widgets/functions-trainer.html?topic=notation",      height: 540 },
  "02-12-p2":     { url: "/widgets/functions-trainer.html?topic=inverse",       height: 540 },
  "02-12-p3":     { url: "/widgets/functions-trainer.html?topic=composite",     height: 540 },
  "02-12-review": { url: "/widgets/functions-trainer.html",                     height: 540 },
  "03-01-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=coord",   height: 540 },
  "03-01-review": { url: "/widgets/coord-geometry-trainer.html?topic=coord",   height: 540 },
  "03-02-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=line",    height: 540 },
  "03-02-p2":     { url: "/widgets/coord-geometry-trainer.html?topic=line",    height: 540 },
  "03-02-review": { url: "/widgets/coord-geometry-trainer.html?topic=line",    height: 540 },
  "03-03-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=grad",    height: 540 },
  "03-03-p2":     { url: "/widgets/coord-geometry-trainer.html?topic=grad",    height: 540 },
  "03-03-review": { url: "/widgets/coord-geometry-trainer.html?topic=grad",    height: 540 },
  "03-04-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=dist",    height: 540 },
  "03-04-p2":     { url: "/widgets/coord-geometry-trainer.html?topic=dist",    height: 540 },
  "03-04-review": { url: "/widgets/coord-geometry-trainer.html?topic=dist",    height: 540 },
  "03-05-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=eq",      height: 540 },
  "03-05-p2":     { url: "/widgets/coord-geometry-trainer.html?topic=eq",      height: 540 },
  "03-05-review": { url: "/widgets/coord-geometry-trainer.html?topic=eq",      height: 540 },
  "03-06-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=parperp", height: 540 },
  "03-06-review": { url: "/widgets/coord-geometry-trainer.html?topic=parperp", height: 540 },
  "03-07-p1":     { url: "/widgets/coord-geometry-trainer.html?topic=parperp", height: 540 },
  "03-07-p2":     { url: "/widgets/coord-geometry-trainer.html?topic=parperp", height: 540 },
  "03-07-review": { url: "/widgets/coord-geometry-trainer.html",               height: 540 },
  "04-01-p1":     { url: "/widgets/geometry-trainer.html?topic=terms",         height: 540 },
  "04-01-review": { url: "/widgets/geometry-trainer.html?topic=terms",         height: 540 },
  "04-02-p1":     { url: "/widgets/geometry-trainer.html?topic=constructions", height: 540 },
  "04-02-p2":     { url: "/widgets/geometry-trainer.html?topic=constructions", height: 540 },
  "04-02-review": { url: "/widgets/geometry-trainer.html?topic=constructions", height: 540 },
  "04-03-p1":     { url: "/widgets/geometry-trainer.html?topic=scale",         height: 540 },
  "04-03-p2":     { url: "/widgets/geometry-trainer.html?topic=bearings",      height: 540 },
  "04-03-review": { url: "/widgets/geometry-trainer.html?topic=scale",         height: 540 },
  "04-04-p1":     { url: "/widgets/geometry-trainer.html?topic=similarity",    height: 540 },
  "04-04-p2":     { url: "/widgets/geometry-trainer.html?topic=similarity",    height: 540 },
  "04-04-review": { url: "/widgets/geometry-trainer.html?topic=similarity",    height: 540 },
  "04-05-p1":     { url: "/widgets/geometry-trainer.html?topic=symmetry",      height: 540 },
  "04-05-p2":     { url: "/widgets/geometry-trainer.html?topic=symmetry",      height: 540 },
  "04-05-p3":     { url: "/widgets/geometry-trainer.html?topic=symmetry",      height: 540 },
  "04-05-review": { url: "/widgets/geometry-trainer.html?topic=symmetry",      height: 540 },
  "04-06-p1":     { url: "/widgets/geometry-trainer.html?topic=angles",        height: 540 },
  "04-06-p2":     { url: "/widgets/geometry-trainer.html?topic=angles",        height: 540 },
  "04-06-p3":     { url: "/widgets/geometry-trainer.html?topic=angles",        height: 540 },
  "04-06-review": { url: "/widgets/geometry-trainer.html?topic=angles",        height: 540 },
  "04-07-p1":     { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-07-p2":     { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-07-p3":     { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-07-review": { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-08-p1":     { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-08-p2":     { url: "/widgets/geometry-trainer.html?topic=circles",       height: 540 },
  "04-08-review": { url: "/widgets/geometry-trainer.html",                     height: 540 },
  "05-01-p1":     { url: "/widgets/unit-conversion-trainer.html?topic=length", height: 540 },
  "05-01-p2":     { url: "/widgets/unit-conversion-trainer.html?topic=area",   height: 540 },
  "05-01-p3":     { url: "/widgets/unit-conversion-trainer.html?topic=volume", height: 540 },
  "05-01-review": { url: "/widgets/unit-conversion-trainer.html?topic=mixed",  height: 540 },
  "05-02-p1":     { url: "/widgets/area-perimeter-trainer.html?topic=rectangle",     height: 600 },
  "05-02-p2":     { url: "/widgets/area-perimeter-trainer.html?topic=triangle",      height: 600 },
  "05-02-p3":     { url: "/widgets/area-perimeter-trainer.html?topic=parallelogram", height: 600 },
  "05-02-p4":     { url: "/widgets/area-perimeter-trainer.html?topic=trapezium",     height: 600 },
  "05-02-review": { url: "/widgets/area-perimeter-trainer.html?topic=mixed",         height: 600 },
  "05-03-p1":     { url: "/widgets/circle-trainer.html?topic=circle", height: 580 },
  "05-03-p2":     { url: "/widgets/circle-trainer.html?topic=arc",    height: 580 },
  "05-03-p3":     { url: "/widgets/circle-trainer.html?topic=sector", height: 580 },
  "05-03-review": { url: "/widgets/circle-trainer.html?topic=mixed",  height: 580 },
  "05-04-p1":     { url: "/widgets/volume-trainer.html?topic=cuboid",   height: 600 },
  "05-04-p2":     { url: "/widgets/volume-trainer.html?topic=prism",    height: 600 },
  "05-04-p3":     { url: "/widgets/volume-trainer.html?topic=cylinder", height: 600 },
  "05-04-p4":     { url: "/widgets/volume-trainer.html?topic=sphere",   height: 600 },
  "05-04-p5":     { url: "/widgets/volume-trainer.html?topic=cone",     height: 600 },
  "05-04-p6":     { url: "/widgets/volume-trainer.html?topic=mixed",    height: 600 },
  "05-04-review": { url: "/widgets/volume-trainer.html?topic=mixed",    height: 600 },
  "05-05-p1":     { url: "/widgets/compound-shapes-trainer.html?topic=area2d",     height: 600 },
  "05-05-p2":     { url: "/widgets/compound-shapes-trainer.html?topic=parts",      height: 600 },
  "05-05-p3":     { url: "/widgets/compound-shapes-trainer.html?topic=compound3d", height: 600 },
  "05-05-p4":     { url: "/widgets/compound-shapes-trainer.html?topic=frustum",    height: 600 },
  "05-05-review": { url: "/widgets/compound-shapes-trainer.html?topic=mixed",      height: 600 },
  "06-01-p1":     { url: "/widgets/pythagoras-trainer.html?topic=identify", height: 620 },
  "06-01-p2":     { url: "/widgets/pythagoras-trainer.html?topic=hyp",      height: 620 },
  "06-01-p3":     { url: "/widgets/pythagoras-trainer.html?topic=leg",      height: 620 },
  "06-01-p4":     { url: "/widgets/pythagoras-trainer.html?topic=context",  height: 620 },
  "06-01-review": { url: "/widgets/pythagoras-trainer.html?topic=mixed",    height: 620 },
  "06-02-p1":     { url: "/widgets/trig-trainer.html?topic=identify", height: 620 },
  "06-02-p2":     { url: "/widgets/trig-trainer.html?topic=identify", height: 620 },
  "06-02-p3":     { url: "/widgets/trig-trainer.html?topic=side",     height: 620 },
  "06-02-p4":     { url: "/widgets/trig-trainer.html?topic=angle",    height: 620 },
  "06-02-review": { url: "/widgets/trig-trainer.html?topic=mixed",    height: 620 },
  "06-03-p1":     { url: "/widgets/trig-non-right-trainer.html?topic=rule",   height: 640 },
  "06-03-p2":     { url: "/widgets/trig-non-right-trainer.html?topic=sine",   height: 640 },
  "06-03-p3":     { url: "/widgets/trig-non-right-trainer.html?topic=sine",   height: 640 },
  "06-03-p4":     { url: "/widgets/trig-non-right-trainer.html?topic=cosine", height: 640 },
  "06-03-p5":     { url: "/widgets/trig-non-right-trainer.html?topic=area",   height: 640 },
  "06-03-review": { url: "/widgets/trig-non-right-trainer.html?topic=mixed",  height: 640 },
}

async function readMarkdown(folder: string, file: string): Promise<Lesson | null> {
  const filepath = path.join(process.cwd(), "lessons", "maths", folder, file)
  try {
    const raw = await readFile(filepath, "utf8")
    let parsed
    try {
      parsed = matter(raw)
    } catch (err) {
      // YAML frontmatter parse failure — typically an unknown backslash
      // escape in a double-quoted string (\, \l \g etc. need to be doubled).
      // Log loudly so the bad file is obvious in dev/build logs instead of
      // silently rendering "This part is being written".
      console.error(
        `[lesson-loader] YAML parse failed for ${filepath}:\n  ${(err as Error).message}`,
      )
      return null
    }
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

  const w = WIDGETS[`${key}-_`]
  if (w) { lesson.widget = w.url; lesson.widgetHeight = w.height }
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

  const w = WIDGETS[`${key}-${partSlug}`]
  if (w) { lesson.widget = w.url; lesson.widgetHeight = w.height }
  return lesson
}
