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
          { slug: "p1",     label: "P1", title: "Reading numbers and reciprocals" },
          { slug: "p2",     label: "P2", title: "The number families" },
          { slug: "p3",     label: "P3", title: "Terminating, recurring, irrational" },
          { slug: "p4",     label: "P4", title: "Special number shapes" },
          { slug: "p5",     label: "P5", title: "Prime factorisation" },
          { slug: "p6",     label: "P6", title: "HCF and LCM" },
          { slug: "p7",     label: "P7", title: "Recurring decimals as fractions" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "02", code: "1.2", title: "Sets",
        parts: [
          { slug: "p1",     label: "P1", title: "Notation and subsets" },
          { slug: "p2",     label: "P2", title: "Union, intersection, complement" },
          { slug: "p3",     label: "P3", title: "Venn diagrams: shading" },
          { slug: "p4",     label: "P4", title: "Venn word problems" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      { slug: "03", code: "1.3",  title: "Powers and roots" },
      { slug: "04", code: "1.4",  title: "Fractions, decimals and percentages" },
      { slug: "05", code: "1.5",  title: "Ordering" },
      { slug: "06", code: "1.6",  title: "The four operations" },
      { slug: "07", code: "1.7",  title: "Indices I" },
      { slug: "08", code: "1.8",  title: "Standard form" },
      { slug: "09", code: "1.9",  title: "Estimation" },
      { slug: "10", code: "1.10", title: "Limits of accuracy" },
      { slug: "11", code: "1.11", title: "Ratio and proportion" },
      { slug: "12", code: "1.12", title: "Rates" },
      { slug: "13", code: "1.13", title: "Percentages" },
      { slug: "14", code: "1.14", title: "Using a calculator" },
      { slug: "15", code: "1.15", title: "Time" },
      { slug: "16", code: "1.16", title: "Money" },
      { slug: "17", code: "1.17", title: "Exponential growth and decay" },
      { slug: "18", code: "1.18", title: "Surds" },
    ],
  },
  {
    slug: "02", title: "Algebra and graphs", color: "#fff067",
    topics: [
      { slug: "01", code: "2.1",  title: "Introduction to algebra" },
      { slug: "02", code: "2.2",  title: "Algebraic manipulation" },
      { slug: "03", code: "2.3",  title: "Algebraic fractions" },
      { slug: "04", code: "2.4",  title: "Indices II" },
      { slug: "05", code: "2.5",  title: "Equations" },
      { slug: "06", code: "2.6",  title: "Inequalities" },
      { slug: "07", code: "2.7",  title: "Sequences" },
      { slug: "08", code: "2.8",  title: "Proportion" },
      { slug: "09", code: "2.9",  title: "Graphs in practical situations" },
      { slug: "10", code: "2.10", title: "Graphs of functions" },
      { slug: "11", code: "2.11", title: "Sketching curves" },
      { slug: "12", code: "2.12", title: "Functions" },
    ],
  },
  {
    slug: "03", title: "Coordinate geometry", color: "#0fee89",
    topics: [
      { slug: "01", code: "3.1", title: "Coordinates" },
      { slug: "02", code: "3.2", title: "Drawing linear graphs" },
      { slug: "03", code: "3.3", title: "Gradient of linear graphs" },
      { slug: "04", code: "3.4", title: "Length and midpoint" },
      { slug: "05", code: "3.5", title: "Equations of linear graphs" },
      { slug: "06", code: "3.6", title: "Parallel lines" },
      { slug: "07", code: "3.7", title: "Perpendicular lines" },
    ],
  },
  {
    slug: "04", title: "Geometry", color: "#ff822c",
    topics: [
      { slug: "01", code: "4.1", title: "Geometrical terms" },
      { slug: "02", code: "4.2", title: "Geometrical constructions" },
      { slug: "03", code: "4.3", title: "Scale drawings" },
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
      { slug: "01", code: "5.1", title: "Units of measure" },
      { slug: "02", code: "5.2", title: "Area and perimeter" },
      { slug: "03", code: "5.3", title: "Circles, arcs and sectors" },
      { slug: "04", code: "5.4", title: "Surface area and volume" },
      { slug: "05", code: "5.5", title: "Compound shapes and parts of shapes" },
    ],
  },
  {
    slug: "06", title: "Trigonometry", color: "#00abfa",
    topics: [
      { slug: "01", code: "6.1", title: "Pythagoras' theorem" },
      { slug: "02", code: "6.2", title: "Right-angled triangles" },
      { slug: "03", code: "6.3", title: "Non-right-angled triangles" },
      { slug: "04", code: "6.4", title: "Pythagoras and trigonometry in 3D" },
    ],
  },
  {
    slug: "07", title: "Transformations and vectors", color: "#fff067",
    topics: [
      { slug: "01", code: "7.1", title: "Transformations" },
      { slug: "02", code: "7.2", title: "Vectors in two dimensions" },
      { slug: "03", code: "7.3", title: "Magnitude of a vector" },
      { slug: "04", code: "7.4", title: "Vector geometry" },
    ],
  },
  {
    slug: "08", title: "Probability", color: "#0fee89",
    topics: [
      { slug: "01", code: "8.1", title: "Introduction to probability" },
      { slug: "02", code: "8.2", title: "Relative and expected frequencies" },
      { slug: "03", code: "8.3", title: "Probability of combined events" },
    ],
  },
  {
    slug: "09", title: "Statistics", color: "#ff822c",
    topics: [
      { slug: "01", code: "9.1", title: "Classifying statistical data" },
      { slug: "02", code: "9.2", title: "Interpreting statistical data" },
      { slug: "03", code: "9.3", title: "Averages and measures of spread" },
      { slug: "04", code: "9.4", title: "Statistical charts and diagrams" },
      { slug: "05", code: "9.5", title: "Scatter diagrams" },
      { slug: "06", code: "9.6", title: "Cumulative frequency diagrams" },
      { slug: "07", code: "9.7", title: "Histograms" },
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
