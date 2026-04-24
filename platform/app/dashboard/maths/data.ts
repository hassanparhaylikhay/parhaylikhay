export type Part = {
  slug: string          // "p1", "p2", ..., "review"
  label: string         // "P1", "P2", ..., "R"
  title: string
  isReview?: boolean
}

export type Topic = {
  slug: string
  code: string
  title: string
  parts?: Part[]        // when present, topic is multi-part
}

export type Unit = {
  slug: string
  title: string
  color: string
  topics: Topic[]
}

export const UNITS: Unit[] = [
  {
    slug: "01", title: "Number", color: "#00abfa",
    topics: [
      {
        slug: "01", code: "1.1", title: "Types of number",
        parts: [
          { slug: "p1",     label: "P1", title: "The number families" },
          { slug: "p2",     label: "P2", title: "Terminating, recurring, irrational" },
          { slug: "p3",     label: "P3", title: "Special number shapes" },
          { slug: "p4",     label: "P4", title: "Prime factorisation" },
          { slug: "p5",     label: "P5", title: "HCF and LCM" },
          { slug: "p6",     label: "P6", title: "Recurring decimals as fractions" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      { slug: "02", code: "1.2", title: "Sets & Venn diagrams" },
      { slug: "03", code: "1.3", title: "Fractions, decimals & percentages" },
      { slug: "04", code: "1.4", title: "Ratio & proportion" },
      { slug: "05", code: "1.5", title: "Rates" },
      { slug: "06", code: "1.6", title: "Percentage calculations" },
      { slug: "07", code: "1.7", title: "Time" },
      { slug: "08", code: "1.8", title: "Money" },
    ],
  },
  {
    slug: "02", title: "Algebra and Graphs", color: "#fff067",
    topics: [
      { slug: "01", code: "2.1", title: "Algebraic manipulation" },
      { slug: "02", code: "2.2", title: "Solving equations" },
      { slug: "03", code: "2.3", title: "Indices & surds" },
      { slug: "04", code: "2.4", title: "Sequences" },
      { slug: "05", code: "2.5", title: "Functions" },
      { slug: "06", code: "2.6", title: "Graphs of functions" },
      { slug: "07", code: "2.7", title: "Graphical methods" },
    ],
  },
  {
    slug: "03", title: "Coordinate Geometry", color: "#0fee89",
    topics: [
      { slug: "01", code: "3.1", title: "Gradient" },
      { slug: "02", code: "3.2", title: "Straight-line equations" },
      { slug: "03", code: "3.3", title: "Midpoint & distance" },
      { slug: "04", code: "3.4", title: "Parallel & perpendicular lines" },
    ],
  },
  {
    slug: "04", title: "Geometry", color: "#ff822c",
    topics: [
      { slug: "01", code: "4.1", title: "Geometrical terms" },
      { slug: "02", code: "4.2", title: "Geometrical constructions" },
      { slug: "03", code: "4.3", title: "Scale drawings & bearings" },
      { slug: "04", code: "4.4", title: "Similarity" },
      { slug: "05", code: "4.5", title: "Symmetry" },
      { slug: "06", code: "4.6", title: "Angles" },
      { slug: "07", code: "4.7", title: "Circle theorems I" },
      { slug: "08", code: "4.8", title: "Circle theorems II" },
    ],
  },
  {
    slug: "05", title: "Mensuration", color: "#ff4670",
    topics: [
      { slug: "01", code: "5.1", title: "Perimeter & area" },
      { slug: "02", code: "5.2", title: "Surface area & volume" },
    ],
  },
  {
    slug: "06", title: "Trigonometry", color: "#00abfa",
    topics: [
      { slug: "01", code: "6.1", title: "Right-angled triangles" },
      { slug: "02", code: "6.2", title: "Non-right-angled triangles" },
      { slug: "03", code: "6.3", title: "Elevation, depression & 3D" },
    ],
  },
  {
    slug: "07", title: "Transformations and Vectors", color: "#fff067",
    topics: [
      { slug: "01", code: "7.1", title: "Transformations" },
      { slug: "02", code: "7.2", title: "Vectors" },
    ],
  },
  {
    slug: "08", title: "Probability", color: "#0fee89",
    topics: [
      { slug: "01", code: "8.1", title: "Basic probability" },
      { slug: "02", code: "8.2", title: "Combined events" },
      { slug: "03", code: "8.3", title: "Relative frequency" },
    ],
  },
  {
    slug: "09", title: "Statistics", color: "#ff822c",
    topics: [
      { slug: "01", code: "9.1", title: "Data collection & display" },
      { slug: "02", code: "9.2", title: "Averages & spread" },
      { slug: "03", code: "9.3", title: "Cumulative frequency" },
      { slug: "04", code: "9.4", title: "Correlation" },
    ],
  },
]

// A "stop" = one navigable page in the course. A part if the topic has parts;
// otherwise the topic itself.
type Stop = {
  unitSlug: string
  unitTitle: string
  topicSlug: string
  topicCode: string
  topicTitle: string
  partSlug: string | null
  partTitle: string | null
}

const ALL_STOPS: Stop[] = UNITS.flatMap(u =>
  u.topics.flatMap<Stop>(t => {
    if (t.parts && t.parts.length > 0) {
      return t.parts.map<Stop>(p => ({
        unitSlug: u.slug, unitTitle: u.title,
        topicSlug: t.slug, topicCode: t.code, topicTitle: t.title,
        partSlug: p.slug, partTitle: p.title,
      }))
    }
    return [{
      unitSlug: u.slug, unitTitle: u.title,
      topicSlug: t.slug, topicCode: t.code, topicTitle: t.title,
      partSlug: null, partTitle: null,
    }]
  })
)

export function getPrevNext(unitSlug: string, topicSlug: string, partSlug: string | null = null) {
  const idx = ALL_STOPS.findIndex(s =>
    s.unitSlug === unitSlug &&
    s.topicSlug === topicSlug &&
    s.partSlug === partSlug
  )
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? ALL_STOPS[idx - 1] : null,
    next: idx < ALL_STOPS.length - 1 ? ALL_STOPS[idx + 1] : null,
  }
}

export function urlFor(s: Stop): string {
  const base = `/dashboard/maths/${s.unitSlug}/${s.topicSlug}`
  return s.partSlug ? `${base}/${s.partSlug}` : base
}
