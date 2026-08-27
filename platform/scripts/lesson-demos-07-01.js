const fs = require("fs");
const G = require("./lesson-demo-gen.js");
const path = "./content/lessons/07-01/lesson.json";
const L = JSON.parse(fs.readFileSync(path, "utf8"));
const f = (id) => L.slides.find(s => s.id === id);

const TRI = [[1,1],[4,1],[2,3]];        // translation / reflection / rotation object
const TRE = [[2,1],[4,1],[2,2]];        // enlargement object

const DEMOS = {
  // ── translation ──
  "08-translation-target-1": () => G.demoTranslation({ obj: TRI, vec: [3,-2] }),
  "09-q-translate-point":    () => G.demoTranslatePoint({ from: [1,5], vec: [3,-2] }),
  "10-translation-target-2": () => G.demoTranslation({ obj: TRI, vec: [-5,1] }),
  "11-q-find-vector":        () => G.demoTranslatePoint({ from: [2,-1], vec: [-5,5] }),
  "12-translation-target-3": () => G.demoTranslation({ obj: TRI, vec: [5,0] }),
  "12b-translation-target-4":() => G.demoTranslation({ obj: TRI, vec: [-2,-4] }),
  "12c-pp-translation":      () => G.demoTranslation({ obj: TRI, vec: [-5,-4] }),
  "14-translation-builder":  () => G.demoReadVector({ obj: [[1,1],[4,1],[2,3]], img: [[4,-1],[7,-1],[5,1]] }),
  // ── reflection ──
  "15-predict-reflect":      () => G.demoReflection({ pointOnly: true, from: [4,1], mirror: "y=x" }),
  "15b-reflect-y0":          () => G.demoReflection({ obj: TRI, mirror: "y=0" }),
  "15c-reflect-yx":          () => G.demoReflection({ obj: TRI, mirror: "y=x" }),
  "15d-reflect-x0":          () => G.demoReflection({ obj: TRI, mirror: "x=0" }),
  "15e-reflect-negyx":       () => G.demoReflection({ obj: TRI, mirror: "y=-x" }),
  "15f-pp-reflection":       () => G.demoReflection({ obj: TRI, mirror: "x=1" }),
  "16-q-reflect-y-x":        () => G.demoReflection({ pointOnly: true, from: [3,5], mirror: "y=x" }),
  "17-q-reflect-x-axis":     () => G.demoReflection({ pointOnly: true, from: [2,-4], mirror: "y=0" }),
  "20c-reflection-builder":  () => G.demoFindMirror({ obj: [[2,1],[5,1],[3,3]], img: [[0,1],[-3,1],[-1,3]], mirror: "x=1" }),
  // ── rotation ──
  "22-predict-rotate":       () => G.demoRotation({ pointOnly: true, from: [3,1], centre: [0,0], deg: 90 }),
  "22b-rotate-90acw":        () => G.demoRotation({ obj: TRI, centre: [0,0], deg: 90 }),
  "22c-rotate-180":          () => G.demoRotation({ obj: TRI, centre: [0,0], deg: 180 }),
  "22d-rotate-90cw":         () => G.demoRotation({ obj: TRI, centre: [0,0], deg: -90 }),
  "22e-rotate-non-origin":   () => G.demoRotation({ obj: TRI, centre: [1,0], deg: 90 }),
  "22f-pp-rotation":         () => G.demoRotation({ obj: TRI, centre: [4,1], deg: -90 }),
  "25-q-90-clockwise":       () => G.demoEquivalentTurns(),
  "26-q-rotate-point":       () => G.demoRotation({ pointOnly: true, from: [3,0], centre: [0,0], deg: 90 }),
  "29-rotation-builder":     () => G.demoFindCentreRotation({ obj: [[1,1],[4,1],[2,3]], img: [[-1,1],[-1,4],[-3,2]], centre: [0,0], deg: 90 }),
  // ── enlargement ──
  "30-predict-enlarge":      () => G.demoEnlargement({ pointOnly: true, from: [2,1], centre: [0,0], k: 2 }),
  "31-find-k-2":             () => G.demoEnlargement({ obj: TRE, centre: [0,0], k: 2 }),
  "32-find-k-1p5":           () => G.demoEnlargement({ obj: TRE, centre: [0,0], k: 1.5 }),
  "34-find-k-half":          () => G.demoEnlargement({ obj: TRE, centre: [0,0], k: 0.5 }),
  "35-q-area-scales":        () => G.demoAreaScale(),
  "37-find-k-neg1":          () => G.demoEnlargement({ obj: TRE, centre: [0,0], k: -1 }),
  "37b-pp-enlargement":      () => G.demoEnlargement({ obj: TRE, centre: [1,0], k: -0.5 }),
  "38-enlargement-builder":  () => G.demoFindCentreEnlargement({ obj: [[2,1],[4,1],[2,2]], img: [[3,1],[7,1],[3,3]], centre: [1,1], k: 2 }),
  "51-final-examlink":       () => G.demoFindCentreRotation({ obj: [[2,1],[5,1],[3,3]], img: [[-1,2],[-1,5],[-3,3]], centre: [0,0], deg: 90 }),
};

let n = 0, missing = [];
for (const s of L.slides) {
  if (!s.altExplain) continue;
  const gen = DEMOS[s.id];
  if (!gen) { missing.push(s.id); continue; }
  // The demo overlays either a live widget / grid (PAD-28 geometry) or a
  // contextHtml reference canvas (28 px per unit). Match it exactly or the
  // graph visibly jumps when the demonstration opens.
  const k = s.interaction.kind;
  G.useGeometry(k === "widgetCanvas" || k === "clickOnGrid" ? "widget" : "card");
  s.altExplain = { demoSvg: gen() };
  n++;
}
if (missing.length) { console.error("NO DEMO FOR:", missing.join(", ")); process.exit(1); }
fs.writeFileSync(path, JSON.stringify(L, null, 2));
JSON.parse(fs.readFileSync(path, "utf8"));
console.log("07-01: " + n + " text alts replaced with animated demonstrations");
const sizes = L.slides.filter(s => s.altExplain).map(s => s.altExplain.demoSvg.length);
console.log("  svg size: min " + Math.min(...sizes) + " max " + Math.max(...sizes) + " avg " + Math.round(sizes.reduce((a,b)=>a+b,0)/sizes.length));
