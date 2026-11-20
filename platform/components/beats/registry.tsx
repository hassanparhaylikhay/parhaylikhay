import type { ComponentType } from "react"
import TriangleAnglesLesson from "./triangle-angles/TriangleAnglesLesson"
import PolygonAnglesLesson from "./polygon-angles/PolygonAnglesLesson"
import AnglesLesson from "./angles-basics/AnglesLesson"
import CircleTheoremsLesson from "./circle-theorems/CircleTheoremsLesson"
import CircleTheorems2Lesson from "./circle-theorems-2/CircleTheorems2Lesson"
import CircleTheorems3Lesson from "./circle-theorems-3/CircleTheorems3Lesson"
import PythagorasLesson from "./pythagoras/PythagorasLesson"
import TrigLesson from "./trigonometry/TrigLesson"
import WhyTrigLesson from "./trigonometry/WhyTrigLesson"
import AngleLesson from "./trigonometry/AngleLesson"
import SineRuleLesson from "./sine-rule/SineRuleLesson"
import CosRuleLesson from "./sine-rule/CosRuleLesson"
import AreaLesson from "./sine-rule/AreaLesson"
import BearingsTrigLesson from "./sine-rule/BearingsTrigLesson"
import Pyth3dLesson from "./three-d/Pyth3dLesson"
import Angles3dLesson from "./three-d/Angles3dLesson"
import BearingsLesson from "./bearings/BearingsLesson"
import ScaleLesson from "./bearings/ScaleLesson"
import DrawingBearingsLesson from "./bearings/DrawingBearingsLesson"
import SimilarLesson from "./similar/SimilarLesson"
import SimilarVolLesson from "./similar/SimilarVolLesson"
import TermsLesson from "./terms/TermsLesson"
import SolidsLesson from "./three-d/SolidsLesson"
import SymmetryLesson from "./terms/SymmetryLesson"
import PlanesLesson from "./three-d/PlanesLesson"
import MeasureAnglesLesson from "./bearings/MeasureAnglesLesson"
import ConstructLesson from "./bearings/ConstructLesson"
import NetsLesson from "./three-d/NetsLesson"

/**
 * Every beat lesson, by URL slug. The dashboard page and the public page
 * both read from here, so a lesson is added once and appears in both.
 */
type BeatLesson = {
  title: string
  description: string
  /** Where the X goes for a logged-in student. */
  topicHref: string
  Lesson: ComponentType<{ closeHref: string }>
}

export const BEAT_LESSONS: Record<string, BeatLesson> = {
  angles: {
    title: "Angles",
    description: "Turn a line to see what an angle is, then find the rules for straight lines, crossing lines and parallel lines.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: AnglesLesson,
  },
  "circle-theorems-1": {
    title: "Circle theorems I",
    description: "Draw a circle, find that the angle in a semicircle is always 90°, and see why the angle at the centre is twice the angle at the circumference.",
    topicHref: "/dashboard/maths/04/07",
    Lesson: CircleTheoremsLesson,
  },
  "circle-theorems-2": {
    title: "Circle theorems II",
    description: "Cyclic quadrilaterals, tangents, two tangents from a point, and the alternate segment theorem, each found by moving the figure yourself.",
    topicHref: "/dashboard/maths/04/07",
    Lesson: CircleTheorems2Lesson,
  },
  "circle-theorems-3": {
    title: "Circle theorems III",
    description: "Find the middle of a chord, see why the line through it at 90° always hits the centre, find a lost centre, and learn why equal chords are the same distance from the centre.",
    topicHref: "/dashboard/maths/04/08",
    Lesson: CircleTheorems3Lesson,
  },
  pythagoras: {
    title: "Pythagoras' theorem",
    description: "Build squares on the sides of a right-angled triangle, see why the two small ones always make the big one, and use it to find any side.",
    topicHref: "/dashboard/maths/06/01",
    Lesson: PythagorasLesson,
  },
  trigonometry: {
    title: "Trigonometry: sin, cos and tan",
    description: "From Pythagoras to trigonometry: name the sides, learn SOH CAH TOA, and find any missing side, with every step of the algebra done in front of you.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: TrigLesson,
  },
  "trigonometry-angles": {
    title: "Trigonometry: finding an angle",
    description: "Find a missing angle with sin⁻¹, cos⁻¹ and tan⁻¹, see why they undo sin, cos and tan, and work out angles of elevation and depression.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: AngleLesson,
  },
  "sine-rule": {
    title: "The sine rule",
    description: "See why a bigger angle faces a longer side, find the sine rule yourself, and use it to find sides and angles, including when the angle could be obtuse.",
    topicHref: "/dashboard/maths/06/03",
    Lesson: SineRuleLesson,
  },
  "cosine-rule": {
    title: "The cosine rule",
    description: "See how Pythagoras changes when the angle isn't 90°, find the cosine rule from the gap, and use it to find sides and angles, obtuse ones too.",
    topicHref: "/dashboard/maths/06/03",
    Lesson: CosRuleLesson,
  },
  "triangle-area": {
    title: "Area of a triangle",
    description: "Find the area of any triangle from two sides and the angle between them, see where ½ab sin C comes from, work backwards to a side, and find the shortest distance to a line.",
    topicHref: "/dashboard/maths/06/03",
    Lesson: AreaLesson,
  },
  "bearings-triangles": {
    title: "Bearings in triangles",
    description: "Turn two bearings into the angle inside a triangle, and an angle inside a triangle back into a bearing, with the sine and cosine rules.",
    topicHref: "/dashboard/maths/06/03",
    Lesson: BearingsTrigLesson,
  },
  "pythagoras-3d": {
    title: "Pythagoras in 3D",
    description: "Build a box, find the right-angled triangle hiding inside it, lift it out, and find any length across a cuboid or a pyramid.",
    topicHref: "/dashboard/maths/06/04",
    Lesson: Pyth3dLesson,
  },
  "angles-3d": {
    title: "Angles in 3D",
    description: "Tilt a stick under a light from above, find the angle between a line and the floor from its shadow, and work out heights seen from two places.",
    topicHref: "/dashboard/maths/06/04",
    Lesson: Angles3dLesson,
  },
  bearings: {
    title: "Bearings",
    description: "Turn a line from North to see what a bearing is, write it with three figures, and find the bearing back by turning round.",
    topicHref: "/dashboard/maths/04/03",
    Lesson: BearingsLesson,
  },
  "naming-shapes": {
    title: "Naming shapes",
    description: "Turn and slide lines, drag triangles and quadrilaterals into each special shape, add sides to a polygon, and draw the parts of a circle.",
    topicHref: "/dashboard/maths/04/01",
    Lesson: TermsLesson,
  },
  "solids-and-nets": {
    title: "Solids and nets",
    description: "Turn a cube and tap its faces, edges and vertices to count them, name the solids, and fold nets up into solids.",
    topicHref: "/dashboard/maths/04/01",
    Lesson: SolidsLesson,
  },
  symmetry: {
    title: "Line and rotational symmetry",
    description: "Fold a shape along its line of symmetry, turn a line until the halves match, and turn a shape to count how many times it fits.",
    topicHref: "/dashboard/maths/04/05",
    Lesson: SymmetryLesson,
  },
  "measuring-angles": {
    title: "Measuring and drawing angles",
    description: "Put a protractor on a corner and read the right row, draw an angle with its pencil, and draw triangles from a side and two angles.",
    topicHref: "/dashboard/maths/04/02",
    Lesson: MeasureAnglesLesson,
  },
  "constructing-triangles": {
    title: "Constructing triangles",
    description: "Open compasses on a ruler and draw arcs from each end of a side; the third corner is where they cross. Then a triangle that can't be made, a rhombus, and shapes from two triangles.",
    topicHref: "/dashboard/maths/04/02",
    Lesson: ConstructLesson,
  },
  "drawing-nets": {
    title: "Drawing nets",
    description: "Make a cube's net on squared paper by tapping squares, fold it to check, draw one to size, and find a cuboid's surface area from its net.",
    topicHref: "/dashboard/maths/04/02",
    Lesson: NetsLesson,
  },
  "symmetry-of-solids": {
    title: "Symmetry of solids",
    description: "Turn and tip a sheet of glass through a solid until its mirror image lands on it, and count the planes of symmetry of cuboids, cubes, prisms and pyramids.",
    topicHref: "/dashboard/maths/04/05",
    Lesson: PlanesLesson,
  },
  "scale-drawings": {
    title: "Scale drawings",
    description: "Lay a ruler on a map and turn its length into the real one, put a real length onto the map, and write a scale as a ratio.",
    topicHref: "/dashboard/maths/04/03",
    Lesson: ScaleLesson,
  },
  "drawing-bearings": {
    title: "Measuring and drawing bearings",
    description: "Put a protractor on a map to measure a bearing, deal with bearings past 180°, and find a place from two bearings by drawing both lines.",
    topicHref: "/dashboard/maths/04/03",
    Lesson: DrawingBearingsLesson,
  },
  "similar-shapes": {
    title: "Similar shapes",
    description: "Grow a triangle to find the scale factor, use it to find a missing length, line up the matching corners, and show two triangles are similar.",
    topicHref: "/dashboard/maths/04/04",
    Lesson: SimilarLesson,
  },
  "similar-areas-volumes": {
    title: "Areas and volumes of similar shapes",
    description: "Grow a square and a cube and count what fits inside, then use the scale factor squared for areas and cubed for volumes, both ways.",
    topicHref: "/dashboard/maths/04/04",
    Lesson: SimilarVolLesson,
  },
  "why-trig-works": {
    title: "Why trigonometry works",
    description: "An optional tour behind the scenes: why every angle has its own sin, cos and tan, where your calculator's numbers come from, and why tan is called tangent.",
    topicHref: "/dashboard/maths/06/02",
    Lesson: WhyTrigLesson,
  },
  "angles-in-a-triangle": {
    title: "Angles in a triangle",
    description: "Draw a triangle, play with it, and find out why its angles always add up to 180°.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: TriangleAnglesLesson,
  },
  "angles-in-polygons": {
    title: "Angles in polygons",
    description: "Draw a shape, cut it into triangles, walk round it, and find out what its angles add up to.",
    topicHref: "/dashboard/maths/04/06",
    Lesson: PolygonAnglesLesson,
  },
}

// Old links keep working: the first two trig lessons were reshaped into the
// main lesson and the optional tour (26 Oct 2026).
BEAT_LESSONS["trigonometry-2"] = BEAT_LESSONS.trigonometry
BEAT_LESSONS["trigonometry-1"] = BEAT_LESSONS["why-trig-works"]
