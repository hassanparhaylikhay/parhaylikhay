const fs = require("fs");
const G = require("./lesson-demo-gen.js");
const T = require("./lesson-demo-triangles.js");
const { C } = G;

function apply(lessonId, specs) {
  const path = `./content/lessons/${lessonId}/lesson.json`;
  const L = JSON.parse(fs.readFileSync(path, "utf8"));
  let n = 0, missing = [];
  for (const s of L.slides) {
    const i = s.interaction;
    if (i?.kind !== "stepSolve") continue;
    for (const ln of i.config.lines) {
      if (!ln.alt && !ln.altDemo) continue;
      const key = s.id + "/" + ln.id;
      const gen = specs[key];
      if (!gen) { missing.push(key); continue; }
      delete ln.alt;
      ln.altDemo = gen(i.config.contextHtml);
      n++;
    }
  }
  if (missing.length) { console.error("NO DEMO FOR:", missing.join(", ")); process.exit(1); }
  fs.writeFileSync(path, JSON.stringify(L, null, 2));
  JSON.parse(fs.readFileSync(path, "utf8"));
  console.log(`${lessonId}: ${n} line alts replaced with demonstrations`);
}

// ══ 6.1 Pythagoras: which side is the hypotenuse decides add vs subtract ══
const pyth = (labels, steps, headline) => (html) => {
  const e = T.triEdges(html);
  return T.demoRoles({
    html, headline,
    segments: [
      { pts: e.hyp,  label: labels.hyp,  color: C.pink,   dx: -34, dy: 26 },
      { pts: e.base, label: labels.base, color: C.blue,   dy: 44 },
      { pts: e.vert, label: labels.vert, color: C.orange, dx: -66 },
    ],
    steps,
  });
};
const ADD = { text: "both short sides known → add the squares", color: C.green, size: 14 };
const SUB = { text: "long side known → subtract the squares", color: C.green, size: 14 };

apply("06-01", {
  "07-solve-hyp-1/l-eq":  pyth({ hyp: "the long side = ?", base: "short side", vert: "short side" }, [ADD], "find the long side: it faces the right angle"),
  "08-solve-hyp-2/l-eq":  pyth({ hyp: "the long side = ?", base: "short side", vert: "short side" }, [ADD], "find the long side: it faces the right angle"),
  "12-solve-leg-1/l-eq":  pyth({ hyp: "the long side", base: "short side", vert: "the one you want" }, [SUB], "the long side is known this time"),
  "13-solve-leg-2/l-eq":  pyth({ hyp: "the long side", base: "short side", vert: "the one you want" }, [SUB], "the long side is known this time"),
  "16-solve-rectangle/l-eq": (html) => {
    const ls = T.lines(html);
    const diag = ls[ls.length - 1];
    const m = html.match(/<rect x='([\d.]+)' y='([\d.]+)' width='([\d.]+)' height='([\d.]+)'/);
    const x = +m[1], y = +m[2], w = +m[3], h = +m[4];
    return T.demoRoles({
      html, headline: "the diagonal cuts out a right-angled triangle",
      segments: [
        { pts: [[x, y + h], [x + w, y + h]], label: "short side", color: C.blue, dy: 34 },
        { pts: [[x + w, y], [x + w, y + h]], label: "short side", color: C.orange, dx: 54 },
        { pts: diag, label: "the long side", color: C.pink, dx: -34, dy: -22 },
      ],
      steps: [ADD],
    });
  },
  "17-solve-ladder/l-eq": (html) => {
    const ls = T.lines(html);
    const [ground, wall, ladder] = [ls[0], ls[1], ls[2]];
    const foot = ladder[0], top = ladder[1], base = [top[0], foot[1]];
    return T.demoRoles({
      html, headline: "the leaning ladder is the long side",
      segments: [
        { pts: ladder, label: "the long side", color: C.pink, dx: -46, dy: -20 },
        { pts: [foot, base], label: "short side", color: C.blue, dy: 36 },
        { pts: [base, top], label: "the one you want", color: C.orange, dx: 62 },
      ],
      steps: [SUB],
    });
  },
  "19-pp-isosceles/l-eq": (html) => {
    const [Lp, Rp, Tp] = T.polyPts(html);
    const foot = [Tp[0], Lp[1]];
    return T.demoRoles({
      html, headline: "work inside the left half only",
      segments: [
        { pts: [Lp, Tp], label: "the long side", color: C.pink, dx: -62, dy: -26 },
        { pts: [Lp, foot], label: "half the base", color: C.blue, dy: -22 },
        { pts: [foot, Tp], label: "the one you want", color: C.orange, dx: 62 },
      ],
      steps: [SUB],
    });
  },
});

// ══ 6.2 trig: naming the sides against the angle picks the ratio ══
const ratio = (roles, eq, headline) => (html) => {
  const e = T.triEdges(html);
  const map = { hyp: { pts: e.hyp, color: C.pink, dx: -30, dy: 26 }, base: { pts: e.base, color: C.blue, dy: 44 }, vert: { pts: e.vert, color: C.orange, dx: -66 } };
  return T.demoRoles({
    html, headline,
    segments: roles.map(r => ({ ...map[r.edge], label: r.label })),
    steps: [{ text: eq, color: C.yellow, size: 16 }],
  });
};

apply("06-02", {
  "08-solve-side-1/l-ratio": ratio([{ edge: "vert", label: "opposite" }, { edge: "hyp", label: "hypotenuse" }], "opposite ÷ hypotenuse = sin", "name the sides against the 35° angle"),
  "09-solve-side-2/l-ratio": ratio([{ edge: "base", label: "adjacent" }, { edge: "hyp", label: "hypotenuse" }], "adjacent ÷ hypotenuse = cos", "name the sides against the 52° angle"),
  "09b-pp-cos/l-ratio": (html) => {
    const [D, Cc, A] = T.polyPts(html);
    return T.demoRoles({
      html, headline: "name the sides against the 25° angle at A",
      segments: [
        { pts: [A, D], label: "adjacent", color: C.blue, dx: -56 },
        { pts: [Cc, A], label: "hypotenuse", color: C.pink, dx: -46, dy: 22 },
      ],
      steps: [{ text: "adjacent ÷ hypotenuse = cos", color: C.yellow, size: 16 }],
    });
  },
  "12-solve-angle-1/l-ratio": ratio([{ edge: "vert", label: "opposite" }, { edge: "hyp", label: "hypotenuse" }], "opposite ÷ hypotenuse = sin", "name the two sides you were given"),
  "13-solve-angle-2/l-ratio": ratio([{ edge: "vert", label: "opposite" }, { edge: "base", label: "adjacent" }], "opposite ÷ adjacent = tan", "no hypotenuse here, so it cannot be sin or cos"),
  "15-pp-elevation/l-dist": (html) => {
    const ls = T.lines(html);
    const ground = ls[0], wallBase = ls[1][0];
    const obs = ls[3][0];
    return T.demoRoles({
      html, headline: "the two ground measurements do not match",
      segments: [
        { pts: [obs, [wallBase[0], obs[1]]], label: "21 − 16 = 5", color: C.blue, dy: 36 },
      ],
      steps: [{ text: "that subtraction earns a mark on its own", color: C.green, size: 14 }],
    });
  },
  "15-pp-elevation/l-ratio": (html) => {
    const ls = T.lines(html);
    const wallBase = ls[1][0], wallTop = ls[1][1], obs = ls[3][0];
    return T.demoRoles({
      html, headline: "height and horizontal distance, no slant length",
      segments: [
        { pts: [[wallBase[0], wallBase[1]], [wallBase[0], wallTop[1] + 14]], label: "opposite", color: C.orange, dx: 30 },
        { pts: [obs, [wallBase[0], obs[1]]], label: "adjacent", color: C.blue, dy: 22 },
      ],
      steps: [{ text: "opposite ÷ adjacent = tan", color: C.yellow, size: 16 }],
    });
  },
  "15b-pp-trapezoid/l-ratio": (html) => {
    const ls = T.lines(html);
    const drop = ls[ls.length - 2], baseExt = ls[ls.length - 1];
    return T.demoRoles({
      html, headline: "use the small dashed triangle beside C",
      segments: [
        { pts: baseExt, label: "opposite", color: C.orange, dy: 34 },
        { pts: drop, label: "adjacent", color: C.blue, dx: 52 },
      ],
      steps: [{ text: "opposite ÷ adjacent = tan", color: C.yellow, size: 16 }],
    });
  },
  "15b-pp-trapezoid/l-assemble": (html) => {
    const [D, A, B, Cc] = T.polyPts(html);
    return T.demoRoles({
      html, headline: "the angle opens from the base, past the vertical",
      segments: [
        { pts: [Cc, D], label: "start at the base", color: C.blue, dy: 20 },
        { pts: [Cc, [Cc[0], Cc[1] - 90]], label: "90° to vertical", color: C.green, dx: -34 },
        { pts: [Cc, B], label: "then 14° more", color: C.yellow, dx: 26, dy: -10 },
      ],
      steps: [{ text: "90° + 14° = 104°", color: C.yellow, size: 16 }],
    });
  },
});
