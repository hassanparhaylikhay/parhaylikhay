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
      {
        slug: "03", code: "1.3", title: "Powers and roots",
        parts: [
          { slug: "p1",     label: "P1", title: "Squares and square roots" },
          { slug: "p2",     label: "P2", title: "Cubes and cube roots" },
          { slug: "p3",     label: "P3", title: "Other powers, other roots" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "04", code: "1.4", title: "Fractions, decimals and percentages",
        parts: [
          { slug: "p1",     label: "P1", title: "Proper, improper, mixed; simplifying" },
          { slug: "p2",     label: "P2", title: "Fractions ↔ decimals" },
          { slug: "p3",     label: "P3", title: "Percentages as a third form" },
          { slug: "p4",     label: "P4", title: "Recurring decimals" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "05", code: "1.5", title: "Ordering",
        parts: [
          { slug: "p1",     label: "P1", title: "The six comparison symbols" },
          { slug: "p2",     label: "P2", title: "Ordering quantities" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "06", code: "1.6", title: "The four operations",
        parts: [
          { slug: "p1",     label: "P1", title: "Integers and negatives" },
          { slug: "p2",     label: "P2", title: "Fractions: + − × ÷" },
          { slug: "p3",     label: "P3", title: "Decimals: + − × ÷" },
          { slug: "p4",     label: "P4", title: "Order of operations (BIDMAS)" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "07", code: "1.7", title: "Indices I",
        parts: [
          { slug: "p1",     label: "P1", title: "Powers and the three rules" },
          { slug: "p2",     label: "P2", title: "Zero and negative indices" },
          { slug: "p3",     label: "P3", title: "Fractional indices and roots" },
          { slug: "p4",     label: "P4", title: "Combining the rules" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "08", code: "1.8", title: "Standard form",
        parts: [
          { slug: "p1",     label: "P1", title: "Writing numbers in standard form" },
          { slug: "p2",     label: "P2", title: "Converting back to ordinary form" },
          { slug: "p3",     label: "P3", title: "Calculating with standard form" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "09", code: "1.9", title: "Estimation",
        parts: [
          { slug: "p1",     label: "P1", title: "Rounding to decimal places" },
          { slug: "p2",     label: "P2", title: "Significant figures" },
          { slug: "p3",     label: "P3", title: "Estimating calculations" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "10", code: "1.10", title: "Limits of accuracy",
        parts: [
          { slug: "p1",     label: "P1", title: "Upper and lower bounds" },
          { slug: "p2",     label: "P2", title: "Bounds for sums and differences" },
          { slug: "p3",     label: "P3", title: "Bounds for products and quotients" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "11", code: "1.11", title: "Ratio and proportion",
        parts: [
          { slug: "p1",     label: "P1", title: "Simplifying ratios" },
          { slug: "p2",     label: "P2", title: "Dividing in a given ratio" },
          { slug: "p3",     label: "P3", title: "Proportional reasoning" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "12", code: "1.12", title: "Rates",
        parts: [
          { slug: "p1",     label: "P1", title: "Common rates" },
          { slug: "p2",     label: "P2", title: "Speed, distance, and time" },
          { slug: "p3",     label: "P3", title: "Density and other compound rates" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "13", code: "1.13", title: "Percentages",
        parts: [
          { slug: "p1",     label: "P1", title: "Basic percentages" },
          { slug: "p2",     label: "P2", title: "Percentage increase and decrease" },
          { slug: "p3",     label: "P3", title: "Compound interest and repeated change" },
          { slug: "p4",     label: "P4", title: "Reverse percentages" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "14", code: "1.14", title: "Using a calculator",
        parts: [
          { slug: "p1",     label: "P1", title: "Calculator efficiency" },
          { slug: "p2",     label: "P2", title: "Reading and entering values" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "15", code: "1.15", title: "Time",
        parts: [
          { slug: "p1",     label: "P1", title: "Time units and conversion" },
          { slug: "p2",     label: "P2", title: "12-hour and 24-hour clocks" },
          { slug: "p3",     label: "P3", title: "Timetables and time zones" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "16", code: "1.16", title: "Money",
        parts: [
          { slug: "p1",     label: "P1", title: "Money arithmetic" },
          { slug: "p2",     label: "P2", title: "Currency conversion" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "17", code: "1.17", title: "Exponential growth and decay",
        parts: [
          { slug: "p1",     label: "P1", title: "Exponential growth" },
          { slug: "p2",     label: "P2", title: "Exponential decay" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "18", code: "1.18", title: "Surds",
        parts: [
          { slug: "p1",     label: "P1", title: "Simplifying surds" },
          { slug: "p2",     label: "P2", title: "Operations with surds" },
          { slug: "p3",     label: "P3", title: "Rationalising the denominator" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
    ],
  },
  {
    slug: "02", title: "Algebra and graphs", color: "#fff067",
    topics: [
      {
        slug: "01", code: "2.1", title: "Introduction to algebra",
        parts: [
          { slug: "p1",     label: "P1", title: "Letters and conventions" },
          { slug: "p2",     label: "P2", title: "Substitution into expressions" },
          { slug: "p3",     label: "P3", title: "Substitution into formulas" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "02", code: "2.2", title: "Algebraic manipulation",
        parts: [
          { slug: "p1",     label: "P1", title: "Like terms and simplifying" },
          { slug: "p2",     label: "P2", title: "Expanding brackets" },
          { slug: "p3",     label: "P3", title: "Factorising: common factors and grouping" },
          { slug: "p4",     label: "P4", title: "Factorising quadratics" },
          { slug: "p5",     label: "P5", title: "Completing the square" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "03", code: "2.3", title: "Algebraic fractions",
        parts: [
          { slug: "p1",     label: "P1", title: "Adding and subtracting" },
          { slug: "p2",     label: "P2", title: "Multiplying and dividing" },
          { slug: "p3",     label: "P3", title: "Simplifying rational expressions" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "04", code: "2.4", title: "Indices II",
        parts: [
          { slug: "p1",     label: "P1", title: "Index rules with algebra" },
          { slug: "p2",     label: "P2", title: "Index equations" },
          { slug: "p3",     label: "P3", title: "Combined index work" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "05", code: "2.5", title: "Equations",
        parts: [
          { slug: "p1",     label: "P1", title: "Linear equations" },
          { slug: "p2",     label: "P2", title: "Fractional equations" },
          { slug: "p3",     label: "P3", title: "Simultaneous equations" },
          { slug: "p4",     label: "P4", title: "Quadratic equations" },
          { slug: "p5",     label: "P5", title: "Changing the subject" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "06", code: "2.6", title: "Inequalities",
        parts: [
          { slug: "p1",     label: "P1", title: "Linear inequalities and the number line" },
          { slug: "p2",     label: "P2", title: "Compound inequalities" },
          { slug: "p3",     label: "P3", title: "Inequalities in two variables (regions)" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "07", code: "2.7", title: "Sequences",
        parts: [
          { slug: "p1",     label: "P1", title: "Patterns and term-to-term rules" },
          { slug: "p2",     label: "P2", title: "Linear sequences and the nth term" },
          { slug: "p3",     label: "P3", title: "Quadratic and cubic sequences" },
          { slug: "p4",     label: "P4", title: "Special sequences" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "08", code: "2.8", title: "Proportion",
        parts: [
          { slug: "p1",     label: "P1", title: "Direct proportion" },
          { slug: "p2",     label: "P2", title: "Inverse proportion" },
          { slug: "p3",     label: "P3", title: "Solving proportion problems" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "09", code: "2.9", title: "Graphs in practical situations",
        parts: [
          { slug: "p1",     label: "P1", title: "Distance-time graphs" },
          { slug: "p2",     label: "P2", title: "Speed-time graphs" },
          { slug: "p3",     label: "P3", title: "Conversion and other practical graphs" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "10", code: "2.10", title: "Graphs of functions",
        parts: [
          { slug: "p1",     label: "P1", title: "Tables of values and drawing curves" },
          { slug: "p2",     label: "P2", title: "Reciprocal and power graphs" },
          { slug: "p3",     label: "P3", title: "Exponential graphs" },
          { slug: "p4",     label: "P4", title: "Solving equations using graphs" },
          { slug: "p5",     label: "P5", title: "Estimating gradient by tangent" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "11", code: "2.11", title: "Sketching curves",
        parts: [
          { slug: "p1",     label: "P1", title: "Sketching linear and quadratic curves" },
          { slug: "p2",     label: "P2", title: "Sketching cubics and reciprocals" },
          { slug: "p3",     label: "P3", title: "Sketching exponentials" },
          { slug: "p4",     label: "P4", title: "Explore: a graph playground" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "12", code: "2.12", title: "Functions",
        parts: [
          { slug: "p1",     label: "P1", title: "Function notation, domain, range" },
          { slug: "p2",     label: "P2", title: "Inverse functions" },
          { slug: "p3",     label: "P3", title: "Composite functions" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
    ],
  },
  {
    slug: "03", title: "Coordinate geometry", color: "#0fee89",
    topics: [
      {
        slug: "01", code: "3.1", title: "Coordinates",
        parts: [
          { slug: "p1",     label: "P1", title: "Cartesian coordinates" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "02", code: "3.2", title: "Drawing linear graphs",
        parts: [
          { slug: "p1",     label: "P1", title: "Drawing y = mx + c" },
          { slug: "p2",     label: "P2", title: "General form, vertical & horizontal" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "03", code: "3.3", title: "Gradient of linear graphs",
        parts: [
          { slug: "p1",     label: "P1", title: "The gradient formula" },
          { slug: "p2",     label: "P2", title: "Sign, steepness, special cases" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "04", code: "3.4", title: "Length and midpoint",
        parts: [
          { slug: "p1",     label: "P1", title: "Length of a line segment" },
          { slug: "p2",     label: "P2", title: "Midpoint of a line segment" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "05", code: "3.5", title: "Equations of linear graphs",
        parts: [
          { slug: "p1",     label: "P1", title: "Equation from gradient + point" },
          { slug: "p2",     label: "P2", title: "Equation from two points" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "06", code: "3.6", title: "Parallel lines",
        parts: [
          { slug: "p1",     label: "P1", title: "Parallel lines" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "07", code: "3.7", title: "Perpendicular lines",
        parts: [
          { slug: "p1",     label: "P1", title: "Perpendicular lines" },
          { slug: "p2",     label: "P2", title: "Perpendicular bisectors" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
    ],
  },
  {
    slug: "04", title: "Geometry", color: "#ff822c",
    topics: [
      {
        slug: "01", code: "4.1", title: "Geometrical terms",
        parts: [
          { slug: "p1",     label: "P1", title: "The vocabulary of geometry" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "02", code: "4.2", title: "Geometrical constructions",
        parts: [
          { slug: "p1",     label: "P1", title: "Measuring and constructing triangles" },
          { slug: "p2",     label: "P2", title: "Nets of solids" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "03", code: "4.3", title: "Scale drawings",
        parts: [
          { slug: "p1",     label: "P1", title: "Scale drawings" },
          { slug: "p2",     label: "P2", title: "Bearings" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "04", code: "4.4", title: "Similarity",
        parts: [
          { slug: "p1",     label: "P1", title: "Similar shapes, length scale" },
          { slug: "p2",     label: "P2", title: "Area and volume scale factors" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "05", code: "4.5", title: "Symmetry",
        parts: [
          { slug: "p1",     label: "P1", title: "Line symmetry" },
          { slug: "p2",     label: "P2", title: "Rotational symmetry" },
          { slug: "p3",     label: "P3", title: "Symmetry of 3D solids" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "06", code: "4.6", title: "Angles",
        parts: [
          { slug: "p1",     label: "P1", title: "Basic angle rules" },
          { slug: "p2",     label: "P2", title: "Parallel-line angles" },
          { slug: "p3",     label: "P3", title: "Polygon angles" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "07", code: "4.7", title: "Circle theorems I",
        parts: [
          { slug: "p1",     label: "P1", title: "Semicircle, tangent and radius" },
          { slug: "p2",     label: "P2", title: "Angle at centre, same segment" },
          { slug: "p3",     label: "P3", title: "Cyclic quadrilateral, alternate segment" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "08", code: "4.8", title: "Circle theorems II",
        parts: [
          { slug: "p1",     label: "P1", title: "Equal chords, perpendicular bisectors" },
          { slug: "p2",     label: "P2", title: "Tangents from an external point" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
    ],
  },
  {
    slug: "05", title: "Mensuration", color: "#ff4670",
    topics: [
      {
        slug: "01", code: "5.1", title: "Units of measure",
        parts: [
          { slug: "p1",     label: "P1", title: "Length and mass" },
          { slug: "p2",     label: "P2", title: "Area conversions" },
          { slug: "p3",     label: "P3", title: "Volume and capacity" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "02", code: "5.2", title: "Area and perimeter",
        parts: [
          { slug: "p1",     label: "P1", title: "Rectangle area and perimeter" },
          { slug: "p2",     label: "P2", title: "Triangle area and perimeter" },
          { slug: "p3",     label: "P3", title: "Parallelogram area and perimeter" },
          { slug: "p4",     label: "P4", title: "Trapezium area and perimeter" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "03", code: "5.3", title: "Circles, arcs and sectors",
        parts: [
          { slug: "p1",     label: "P1", title: "Circle area and circumference" },
          { slug: "p2",     label: "P2", title: "Arc length" },
          { slug: "p3",     label: "P3", title: "Sector area" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "04", code: "5.4", title: "Surface area and volume",
        parts: [
          { slug: "p1",     label: "P1", title: "Cuboid" },
          { slug: "p2",     label: "P2", title: "Prism" },
          { slug: "p3",     label: "P3", title: "Cylinder" },
          { slug: "p4",     label: "P4", title: "Sphere and hemisphere" },
          { slug: "p5",     label: "P5", title: "Pyramid and cone" },
          { slug: "p6",     label: "P6", title: "Composite solids" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
      {
        slug: "05", code: "5.5", title: "Compound shapes and parts of shapes",
        parts: [
          { slug: "p1",     label: "P1", title: "2D compound shapes" },
          { slug: "p2",     label: "P2", title: "Parts with circular curves" },
          { slug: "p3",     label: "P3", title: "3D compound solids" },
          { slug: "p4",     label: "P4", title: "Frustums and hollow solids" },
          { slug: "review", label: "R",  title: "Review & practice", isReview: true },
        ],
      },
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
