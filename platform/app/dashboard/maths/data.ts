export type Topic = {
  slug: string
  code: string
  title: string
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
      { slug: "01", code: "1.1", title: "Types of number" },
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

const ALL_TOPICS = UNITS.flatMap(u =>
  u.topics.map(t => ({ unitSlug: u.slug, unitTitle: u.title, topicSlug: t.slug, code: t.code, title: t.title }))
)

export function getPrevNext(unitSlug: string, topicSlug: string) {
  const idx = ALL_TOPICS.findIndex(t => t.unitSlug === unitSlug && t.topicSlug === topicSlug)
  return {
    prev: idx > 0 ? ALL_TOPICS[idx - 1] : null,
    next: idx < ALL_TOPICS.length - 1 ? ALL_TOPICS[idx + 1] : null,
  }
}
