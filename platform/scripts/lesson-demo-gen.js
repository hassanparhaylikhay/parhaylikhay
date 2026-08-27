/**
 * Demonstration generator for Lesson Mode "explain another way".
 *
 * Every demo is a self-contained animated SVG on the SAME manipulative canvas
 * the student is working on (480x320, 28px/unit, origin 212,160). The method
 * is SHOWN: movement on the grid, synchronised with the notation lighting up
 * as each number does its job. No prose.
 */
const DUR = "9s";
const EASE = "0.7 0 0.3 1", HOLD = "0 0 1 1";
const C = { blue:"#00abfa", pink:"#ff4670", yellow:"#fff067", green:"#0fee89", orange:"#ff822c", grey:"#7a7875", faint:"#3a4a5a", off:"#c8c6be", white:"#f0eeea", grid:"#141e2a" };

/**
 * The demo must sit EXACTLY on top of the surface it explains, or the graph
 * appears to jump when it opens. Two surfaces exist:
 *   widget  — transformation widgets and ClickOnGrid: PAD 28 inside a 480x320
 *             viewBox, so UNIT = min(424/16, 264/10) = 26.4, origin (213.6,160)
 *   card    — contextHtml reference canvases: 28 px/unit, origin (212,160)
 */
const GEOM = {
  widget: { u: 26.4, ox: 213.6, oy: 160 },
  card:   { u: 28,   ox: 212,   oy: 160 },
};
let GEO = GEOM.widget;
function useGeometry(kind) { GEO = GEOM[kind] || GEOM.widget; }

const X_MIN = -7, X_MAX = 9, Y_MIN = -5, Y_MAX = 5;
const SX = (x) => Math.round((GEO.ox + GEO.u * x) * 10) / 10;
const SY = (y) => Math.round((GEO.oy - GEO.u * y) * 10) / 10;
const r1 = (n) => Math.round(n * 10) / 10;

let uid = 0;
const nextId = () => "d" + (++uid);

// ── primitives ──────────────────────────────────────────────────────────
function anim(attr, values, keyTimes, splines) {
  return `<animate attributeName="${attr}" values="${values.join(";")}" keyTimes="${keyTimes.join(";")}" calcMode="spline" keySplines="${splines.join(";")}" dur="${DUR}" repeatCount="indefinite"/>`;
}
function animDiscrete(attr, values, keyTimes) {
  return `<animate attributeName="${attr}" values="${values.join(";")}" keyTimes="${keyTimes.join(";")}" calcMode="discrete" dur="${DUR}" repeatCount="indefinite"/>`;
}
/** Fade in at t0, hold, fade out at t1. Holds at zero first (never ramps from t=0). */
function appear(t0, t1) {
  const a = r1(Math.max(0, t0 - 0.03) * 100) / 100, b = r1(Math.min(1, t1 + 0.04) * 100) / 100;
  return anim("opacity", [0, 0, 1, 1, 0, 0], [0, a, t0, t1, b, 1], [HOLD, EASE, HOLD, EASE, HOLD]);
}
/** Annotations use the maths face (KaTeX's), never the code face. */
const MATH_FONT = "KaTeX_Main, 'Times New Roman', Georgia, serif";
const txt = (x, y, t, color, size = 13, anchor = "middle", extra = "") =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="${MATH_FONT}" font-size="${size + 1.5}" fill="${color}" text-anchor="${anchor}" dominant-baseline="middle">${extra}${t}</text>`;
/** Tick numbers keep the graph's own face so the overlay lands seamlessly. */
const tickTxt = (x, y, t) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family="Geist Mono,monospace" font-size="12" font-weight="600" fill="${C.grey}" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
const poly = (pts) => pts.map(([x, y]) => `${SX(x)},${SY(y)}`).join(" ");
const dot = (p, color, r = 5, inner = "") =>
  `<circle cx="${SX(p[0])}" cy="${SY(p[1])}" r="${r}" fill="${color}" stroke="#0b1118" stroke-width="1.5">${inner}</circle>`;

/** Bottom caption on its own backing bar, so it never fights the grid. */
function caption(text, color, t0, t1) {
  const w = Math.min(430, text.length * 7.4 + 26);
  return `<g>${appear(t0, t1)}<rect x="${r1(240 - w / 2)}" y="280" width="${r1(w)}" height="24" rx="6" fill="rgba(11,17,24,0.9)"/>` +
    txt(240, 292, text, color, 13) + `</g>`;
}

/** Small label on a dark chip, for text that must sit over the grid. */
function chip(x, y, text, color, size = 12) {
  const w = text.length * (size * 0.62) + 14;
  return `<rect x="${r1(x - w / 2)}" y="${r1(y - 10)}" width="${r1(w)}" height="20" rx="5" fill="rgba(11,17,24,0.9)"/>` + txt(x, y, text, color, size);
}

function base(inner, headline) {
  const L = SX(X_MIN), R = SX(X_MAX), T = SY(Y_MAX), B = SY(Y_MIN);
  let s = `<svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">`;
  for (let x = X_MIN; x <= X_MAX; x++) s += `<line x1="${SX(x)}" y1="${T}" x2="${SX(x)}" y2="${B}" stroke="${C.grid}" stroke-width="0.7"/>`;
  for (let y = Y_MIN; y <= Y_MAX; y++) s += `<line x1="${L}" y1="${SY(y)}" x2="${R}" y2="${SY(y)}" stroke="${C.grid}" stroke-width="0.7"/>`;
  s += `<line x1="${L}" y1="${SY(0)}" x2="${R}" y2="${SY(0)}" stroke="${C.faint}" stroke-width="1.2"/>`;
  s += `<line x1="${SX(0)}" y1="${T}" x2="${SX(0)}" y2="${B}" stroke="${C.faint}" stroke-width="1.2"/>`;
  for (let x = X_MIN; x <= X_MAX; x++) if (x !== 0) s += tickTxt(SX(x), SY(0) + 11, x);
  for (let y = Y_MIN; y <= Y_MAX; y++) if (y !== 0) s += tickTxt(SX(0) - 12, SY(y), y);
  // the headline bar must never eat into the top row of the grid
  if (headline) {
    const h = Math.max(16, T - 3);
    s += `<rect x="0" y="0" width="480" height="${r1(h)}" fill="rgba(11,17,24,0.9)"/>` + txt(240, h / 2, headline, C.yellow, Math.min(12, h - 6));
  }
  return s + inner + "</svg>";
}

/** Dashed measuring arrow that grows from p toward q along one axis. */
function growArrow(id, p, q, t0, t1, tEnd, color = C.yellow) {
  const x1 = SX(p[0]), y1 = SY(p[1]), x2 = SX(q[0]), y2 = SY(q[1]);
  const kt = [0, t0, t1, tEnd, 1];
  const sp = [HOLD, EASE, HOLD, HOLD];
  return `<g>${appear(t0, tEnd)}` +
    `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="${color}" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#${id})">` +
    anim("x2", [x1, x1, x2, x2, x2], kt, sp) + anim("y2", [y1, y1, y2, y2, y2], kt, sp) +
    `</line></g>`;
}
const markerDef = (id, color = C.yellow) =>
  `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="${color}"/></marker></defs>`;

/** Column vector notation, top-right, numbers lighting in turn. */
function vectorNote(a, b, phases) {
  const x = 402, yTop = 60, yBot = 90;
  const { xOn, xOff, yOn, yOff, done } = phases;
  const grey = C.grey;
  const topVals = [grey, grey, C.yellow, C.yellow, C.green, C.green, grey];
  const botVals = [grey, grey, grey, grey, C.yellow, C.green, grey];
  const kt = [0, xOn, xOn, yOn, yOn, done, 1];
  return `<rect x="${x - 46}" y="${yTop - 24}" width="92" height="78" rx="8" fill="rgba(11,17,24,0.9)" stroke="rgba(255,240,103,0.3)"/>` +
    txt(x - 30, yTop + 15, "(", C.off, 40) + txt(x + 30, yTop + 15, ")", C.off, 40) +
    txt(x, yTop, a, grey, 17, "middle", "") .replace("<text", `<text data-n="top"`).replace("</text>", animDiscrete("fill", topVals, kt) + "</text>") +
    txt(x, yBot, b, grey, 17, "middle", "").replace("</text>", animDiscrete("fill", botVals, kt) + "</text>");
}

// ═══ TRANSLATION ═══════════════════════════════════════════════════════
function demoTranslation({ obj, vec, anchorIdx = 2 }) {
  const [a, b] = vec;
  const id = nextId();
  const A = obj[anchorIdx];
  const mid = [A[0] + a, A[1]], end = [A[0] + a, A[1] + b];
  const P0 = poly(obj), P1 = poly(obj.map(([x, y]) => [x + a, y])), P2 = poly(obj.map(([x, y]) => [x + a, y + b]));
  const kt = [0, 0.10, 0.34, 0.44, 0.66, 0.90, 1];
  const sp = [HOLD, EASE, HOLD, EASE, HOLD, EASE];
  let s = markerDef(id);
  s += `<polygon points="${P0}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<polygon points="${P2}" fill="none" stroke="${C.pink}" stroke-width="1.6" stroke-dasharray="6 5" opacity="0.5"/>`;
  s += `<polygon points="${P0}" fill="rgba(255,240,103,0.12)" stroke="${C.yellow}" stroke-width="2.4" stroke-linejoin="round">` +
    anim("points", [P0, P0, P1, P1, P2, P2, P0], kt, sp) + `</polygon>`;
  if (a !== 0) {
    s += growArrow(id, A, mid, 0.10, 0.34, 0.90);
    s += `<g>${appear(0.14, 0.90)}${txt(SX(A[0]) + 0.35 * (SX(mid[0]) - SX(A[0])), SY(A[1]) + (b > 0 ? 20 : -16), `${Math.abs(a)} ${a > 0 ? "right" : "left"}`, C.yellow, 13)}</g>`;
  }
  if (b !== 0) {
    s += growArrow(id, mid, end, 0.44, 0.66, 0.90);
    s += `<g>${appear(0.48, 0.90)}${txt(SX(mid[0]) + (a < 0 ? -12 : 12), (SY(mid[1]) + SY(end[1])) / 2, `${Math.abs(b)} ${b > 0 ? "up" : "down"}`, C.yellow, 13, a < 0 ? "end" : "start")}</g>`;
  }
  s += vectorNote(a > 0 ? a : `−${Math.abs(a)}`, b > 0 ? b : `−${Math.abs(b)}`, { xOn: 0.10, yOn: 0.44, done: 0.66 });
  return base(s, "the top number, then the bottom number");
}

function demoTranslatePoint({ from, vec }) {
  const [a, b] = vec;
  const id = nextId();
  const mid = [from[0] + a, from[1]], end = [from[0] + a, from[1] + b];
  const kt = [0, 0.10, 0.34, 0.44, 0.66, 0.90, 1];
  const sp = [HOLD, EASE, HOLD, EASE, HOLD, EASE];
  let s = markerDef(id);
  s += dot(from, C.blue, 5.5);
  s += txt(SX(from[0]) - 14, SY(from[1]) - 14, `(${from[0]}, ${from[1]})`, C.blue, 12, "end");
  s += `<circle cx="${SX(from[0])}" cy="${SY(from[1])}" r="6" fill="${C.yellow}" stroke="#0b1118" stroke-width="1.5">` +
    anim("cx", [SX(from[0]), SX(from[0]), SX(mid[0]), SX(mid[0]), SX(end[0]), SX(end[0]), SX(from[0])], kt, sp) +
    anim("cy", [SY(from[1]), SY(from[1]), SY(mid[1]), SY(mid[1]), SY(end[1]), SY(end[1]), SY(from[1])], kt, sp) +
    `</circle>`;
  if (a !== 0) {
    s += growArrow(id, from, mid, 0.10, 0.34, 0.90);
    s += `<g>${appear(0.14, 0.90)}${txt(SX(from[0]) + 0.35 * (SX(mid[0]) - SX(from[0])), SY(from[1]) + (b > 0 ? 20 : -16), `${Math.abs(a)} ${a > 0 ? "right" : "left"}`, C.yellow, 13)}</g>`;
  }
  if (b !== 0) {
    s += growArrow(id, mid, end, 0.44, 0.66, 0.90);
    s += `<g>${appear(0.48, 0.90)}${txt(SX(mid[0]) + (a < 0 ? -12 : 12), (SY(mid[1]) + SY(end[1])) / 2, `${Math.abs(b)} ${b > 0 ? "up" : "down"}`, C.yellow, 13, a < 0 ? "end" : "start")}</g>`;
  }
  s += `<g>${appear(0.66, 0.90)}${dot(end, C.green, 5.5)}${txt(SX(end[0]) + 14, SY(end[1]) - 14, `(${end[0]}, ${end[1]})`, C.green, 12, "start")}</g>`;
  s += vectorNote(a > 0 ? a : `−${Math.abs(a)}`, b > 0 ? b : `−${Math.abs(b)}`, { xOn: 0.10, yOn: 0.44, done: 0.66 });
  return base(s, "walk the top number, then the bottom");
}

// ═══ REFLECTION ════════════════════════════════════════════════════════
const MIRRORS = {
  "y=0":  { label: "y = 0", pts: [[-7, 0], [9, 0]], f: (p) => [p[0], -p[1]], foot: (p) => [p[0], 0] },
  "x=0":  { label: "x = 0", pts: [[0, -5], [0, 5]], f: (p) => [-p[0], p[1]], foot: (p) => [0, p[1]] },
  "y=x":  { label: "y = x", pts: [[-5, -5], [5, 5]], f: (p) => [p[1], p[0]], foot: (p) => [(p[0] + p[1]) / 2, (p[0] + p[1]) / 2] },
  "y=-x": { label: "y = −x", pts: [[-5, 5], [5, -5]], f: (p) => [-p[1], -p[0]], foot: (p) => [(p[0] - p[1]) / 2, (p[1] - p[0]) / 2] },
  "x=1":  { label: "x = 1", pts: [[1, -5], [1, 5]], f: (p) => [2 - p[0], p[1]], foot: (p) => [1, p[1]] },
};

function demoReflection({ obj, mirror, anchorIdx = 1, pointOnly = false, from = null }) {
  const M = MIRRORS[mirror];
  const id = nextId();
  const A = pointOnly ? from : obj[anchorIdx];
  const F = M.foot(A), A2 = M.f(A);
  const kt = [0, 0.16, 0.44, 0.54, 0.78, 0.92, 1];
  const sp = [HOLD, EASE, HOLD, EASE, HOLD, EASE];
  let s = markerDef(id);
  s += `<line x1="${SX(M.pts[0][0])}" y1="${SY(M.pts[0][1])}" x2="${SX(M.pts[1][0])}" y2="${SY(M.pts[1][1])}" stroke="${C.yellow}" stroke-width="2" stroke-dasharray="7 5"/>`;
  {
    const p1 = [SX(M.pts[0][0]), SY(M.pts[0][1])], p2 = [SX(M.pts[1][0]), SY(M.pts[1][1])];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], Ln = Math.hypot(dx, dy) || 1;
    const vertical = Math.abs(dx) < 0.1;
    const nx = vertical ? 1 : dy / Ln, ny = vertical ? 0 : -dx / Ln;
    const lx = p1[0] + dx * 0.85 + nx * 26, ly = p1[1] + dy * 0.85 + ny * 22;
    s += txt(lx, ly, M.label, C.yellow, 14);
  }
  if (!pointOnly) {
    const P0 = poly(obj), P1 = poly(obj.map(M.f));
    s += `<polygon points="${P0}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<polygon points="${P0}" fill="rgba(255,240,103,0.12)" stroke="${C.yellow}" stroke-width="2.4" stroke-linejoin="round">` +
      anim("points", [P0, P0, P0, P1, P1, P1, P0], [0, 0.16, 0.50, 0.78, 0.88, 0.94, 1], [HOLD, HOLD, EASE, HOLD, HOLD, EASE]) + `</polygon>`;
  } else {
    s += dot(A, C.blue, 5.5) + txt(SX(A[0]) - 12, SY(A[1]) - 14, `(${A[0]}, ${A[1]})`, C.blue, 12, "end");
  }
  // perpendicular: corner to foot, then foot to image, with equal-distance ticks
  s += growArrow(id, A, F, 0.16, 0.34, 0.92, C.green);
  s += growArrow(id, F, A2, 0.42, 0.60, 0.92, C.green);
  const tick = (p, q) => {
    const mx = (SX(p[0]) + SX(q[0])) / 2, my = (SY(p[1]) + SY(q[1])) / 2;
    const dx = SX(q[0]) - SX(p[0]), dy = SY(q[1]) - SY(p[1]);
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * 6, ny = (dx / L) * 6;
    return `<line x1="${r1(mx - nx)}" y1="${r1(my - ny)}" x2="${r1(mx + nx)}" y2="${r1(my + ny)}" stroke="${C.green}" stroke-width="2.2"/>`;
  };
  s += `<g>${appear(0.60, 0.92)}${tick(A, F)}${tick(F, A2)}</g>` + caption("same distance each side of the mirror", C.green, 0.60, 0.92);
  s += `<g>${appear(0.60, 0.92)}${dot(A2, C.green, 5.5)}${pointOnly ? txt(SX(A2[0]) + 14, SY(A2[1]) - 14, `(${A2[0]}, ${A2[1]})`, C.green, 12, "start") : ""}</g>`;
  return base(s, "straight across the mirror, same distance back");
}

// ═══ ROTATION ══════════════════════════════════════════════════════════
function rot(p, c, deg) {
  const t = (deg * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1];
  return [r1(c[0] + dx * Math.cos(t) - dy * Math.sin(t)), r1(c[1] + dx * Math.sin(t) + dy * Math.cos(t))];
}
function arcPath(c, p, deg, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const q = rot(p, c, (deg * i) / n);
    pts.push(`${SX(q[0])} ${SY(q[1])}`);
  }
  return "M " + pts.join(" L ");
}
function demoRotation({ obj, centre, deg, anchorIdx = 1, pointOnly = false, from = null }) {
  const id = nextId();
  const A = pointOnly ? from : obj[anchorIdx];
  const A2 = rot(A, centre, deg);
  let s = markerDef(id, C.green);
  s += `<g>${dot(centre, C.yellow, 6)}${chip(SX(centre[0]), SY(centre[1]) + 22, `centre (${centre[0]}, ${centre[1]})`, C.yellow)}</g>`;
  if (!pointOnly) {
    const P0 = poly(obj), P1 = poly(obj.map(p => rot(p, centre, deg)));
    s += `<polygon points="${P0}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<polygon points="${P0}" fill="rgba(255,240,103,0.12)" stroke="${C.yellow}" stroke-width="2.4" stroke-linejoin="round">` +
      anim("points", [P0, P0, P0, P1, P1, P1, P0], [0, 0.18, 0.46, 0.76, 0.88, 0.94, 1], [HOLD, HOLD, EASE, HOLD, HOLD, EASE]) + `</polygon>`;
  } else {
    s += dot(A, C.blue, 5.5) + txt(SX(A[0]) + 12, SY(A[1]) - 14, `(${A[0]}, ${A[1]})`, C.blue, 12, "start");
  }
  // spoke from the centre to the corner, then the swept arc
  s += `<g>${appear(0.14, 0.92)}<line x1="${SX(centre[0])}" y1="${SY(centre[1])}" x2="${SX(A[0])}" y2="${SY(A[1])}" stroke="${C.blue}" stroke-width="1.8" stroke-dasharray="5 4"/></g>`;
  s += `<g>${appear(0.46, 0.92)}<line x1="${SX(centre[0])}" y1="${SY(centre[1])}" x2="${SX(A2[0])}" y2="${SY(A2[1])}" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="5 4"/></g>`;
  const path = arcPath(centre, A, deg);
  s += `<g>${appear(0.30, 0.92)}<path d="${path}" fill="none" stroke="${C.yellow}" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#${id})"/></g>`;
  // a dot rides the arc so the turn is watched, not inferred
  s += `<circle cx="${SX(A[0])}" cy="${SY(A[1])}" r="5.5" fill="${C.yellow}" stroke="#0b1118" stroke-width="1.5" opacity="0">${appear(0.30, 0.80)}` +
    `<animateMotion path="${path}" keyPoints="0;0;1;1" keyTimes="0;0.30;0.76;1" calcMode="spline" keySplines="${HOLD};${EASE};${HOLD}" dur="${DUR}" repeatCount="indefinite"/></circle>`;
  const mid = rot(A, centre, deg / 2);
  const lab = `${Math.abs(deg)}° ${deg > 0 ? "anticlockwise" : "clockwise"}`;
  {
    const R = Math.hypot(mid[0] - centre[0], mid[1] - centre[1]) || 1;
    const ux = (mid[0] - centre[0]) / R, uy = (mid[1] - centre[1]) / R;
    const lp = [mid[0] + ux * 1.5, mid[1] + uy * 1.5];
    s += `<g>${appear(0.34, 0.92)}${txt(Math.max(70, Math.min(410, SX(lp[0]))), Math.max(44, Math.min(296, SY(lp[1]))), lab, C.yellow, 13)}</g>`;
  }
  s += `<g>${appear(0.76, 0.92)}${dot(A2, C.green, 5.5)}${pointOnly ? txt(SX(A2[0]) - 12, SY(A2[1]) - 14, `(${A2[0]}, ${A2[1]})`, C.green, 12, "end") : ""}</g>`;
  return base(s, "swing every corner around the centre");
}

// ═══ ENLARGEMENT ═══════════════════════════════════════════════════════
function demoEnlargement({ obj, centre, k, anchorIdx = 1, pointOnly = false, from = null }) {
  const id = nextId();
  const A = pointOnly ? from : obj[anchorIdx];
  const A2 = [r1(centre[0] + k * (A[0] - centre[0])), r1(centre[1] + k * (A[1] - centre[1]))];
  const kt = [0, 0.16, 0.46, 0.58, 0.82, 0.92, 1];
  const sp = [HOLD, EASE, HOLD, EASE, HOLD, EASE];
  let s = markerDef(id);
  s += `<g>${dot(centre, C.yellow, 6)}${chip(SX(centre[0]) - 30, SY(centre[1]) + 22, `centre (${centre[0]}, ${centre[1]})`, C.yellow)}</g>`;
  if (!pointOnly) {
    const P0 = poly(obj), P1 = poly(obj.map(p => [centre[0] + k * (p[0] - centre[0]), centre[1] + k * (p[1] - centre[1])]));
    s += `<polygon points="${P0}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
    // rays from the centre through every corner, extended past the image
    for (const p of obj) {
      const far = [centre[0] + k * 1.12 * (p[0] - centre[0]), centre[1] + k * 1.12 * (p[1] - centre[1])];
      s += `<g>${appear(0.16, 0.92)}<line x1="${SX(centre[0])}" y1="${SY(centre[1])}" x2="${SX(far[0])}" y2="${SY(far[1])}" stroke="${C.faint}" stroke-width="1.4" stroke-dasharray="4 4"/></g>`;
    }
    s += `<polygon points="${P0}" fill="rgba(255,240,103,0.12)" stroke="${C.yellow}" stroke-width="2.4" stroke-linejoin="round">` +
      anim("points", [P0, P0, P0, P1, P1, P1, P0], [0, 0.16, 0.46, 0.78, 0.88, 0.94, 1], [HOLD, HOLD, EASE, HOLD, HOLD, EASE]) + `</polygon>`;
  } else {
    s += dot(A, C.blue, 5.5);
  }
  s += growArrow(id, centre, A, 0.16, 0.34, 0.92, C.blue);
  s += growArrow(id, centre, A2, 0.46, 0.70, 0.92, C.green);
  const kLab = k < 0 ? `× ${k} flips it through the centre` : k < 1 ? `× ${k} pulls it in` : `× ${k} pushes it out`;
  s += caption(kLab, C.yellow, 0.50, 0.92);
  s += `<g>${appear(0.70, 0.92)}${dot(A2, C.green, 5.5)}</g>`;
  return base(s, "every corner, measured from the centre");
}

// ═══ DESCRIBE-IT DEMOS (reading a transformation off the diagram) ══════
function demoReadVector({ obj, img }) {
  const id = nextId();
  const A = obj[0], A2 = img[0];
  const a = r1(A2[0] - A[0]), b = r1(A2[1] - A[1]);
  const mid = [A[0] + a, A[1]];
  let s = markerDef(id);
  s += `<polygon points="${poly(obj)}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(img)}" fill="rgba(255,70,112,0.20)" stroke="${C.pink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<g>${appear(0.06, 0.92)}${dot(A, C.yellow, 6)}${dot(A2, C.yellow, 6)}${txt(SX(A[0]) - 12, SY(A[1]) + 16, "pick a corner", C.yellow, 12, "end")}</g>`;
  if (a !== 0) {
    s += growArrow(id, A, mid, 0.20, 0.42, 0.92);
    s += `<g>${appear(0.24, 0.92)}${txt((SX(A[0]) + SX(mid[0])) / 2, SY(A[1]) - 16, `${Math.abs(a)} ${a > 0 ? "right" : "left"}`, C.yellow, 13)}</g>`;
  }
  if (b !== 0) {
    s += growArrow(id, mid, A2, 0.50, 0.70, 0.92);
    s += `<g>${appear(0.54, 0.92)}${txt(SX(mid[0]) + 32, (SY(mid[1]) + SY(A2[1])) / 2, `${Math.abs(b)} ${b > 0 ? "up" : "down"}`, C.yellow, 13)}</g>`;
  }
  s += vectorNote(a > 0 ? a : `−${Math.abs(a)}`, b > 0 ? b : `−${Math.abs(b)}`, { xOn: 0.20, yOn: 0.50, done: 0.70 });
  return base(s, "count across, then count up or down");
}

function demoFindMirror({ obj, img, mirror }) {
  const M = MIRRORS[mirror];
  let s = "";
  s += `<polygon points="${poly(obj)}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(img)}" fill="rgba(255,70,112,0.20)" stroke="${C.pink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // join two corresponding corners, mark the midpoints, then draw the line through them
  const pairs = [[obj[0], img[0]], [obj[2], img[2]]];
  const mids = pairs.map(([p, q]) => [r1((p[0] + q[0]) / 2), r1((p[1] + q[1]) / 2)]);
  pairs.forEach(([p, q], i) => {
    const t0 = 0.10 + i * 0.18;
    s += `<g>${appear(t0, 0.92)}<line x1="${SX(p[0])}" y1="${SY(p[1])}" x2="${SX(q[0])}" y2="${SY(q[1])}" stroke="${C.green}" stroke-width="1.8" stroke-dasharray="5 4"/>${dot(p, C.yellow, 5)}${dot(q, C.yellow, 5)}</g>`;
    s += `<g>${appear(t0 + 0.10, 0.92)}${dot(mids[i], C.green, 5.5)}</g>`;
  });
  s += caption("the mirror runs through both midpoints", C.green, 0.52, 0.92);
  s += `<g>${appear(0.60, 0.92)}<line x1="${SX(M.pts[0][0])}" y1="${SY(M.pts[0][1])}" x2="${SX(M.pts[1][0])}" y2="${SY(M.pts[1][1])}" stroke="${C.yellow}" stroke-width="2.4" stroke-dasharray="7 5"/>${txt(SX(M.pts[1][0]) - 24, SY(M.pts[1][1]) + 16, M.label, C.yellow, 14)}</g>`;
  return base(s, "join matching corners, mark the midpoints");
}

function demoFindCentreRotation({ obj, img, centre, deg }) {
  const id = nextId();
  let s = markerDef(id);
  s += `<polygon points="${poly(obj)}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(img)}" fill="rgba(255,70,112,0.20)" stroke="${C.pink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<g>${appear(0.10, 0.92)}${dot(centre, C.yellow, 6.5)}${chip(SX(centre[0]) + 44, SY(centre[1]) + 22, `centre (${centre[0]}, ${centre[1]})`, C.yellow)}</g>`;
  const A = obj[1], A2 = img[1];
  s += `<g>${appear(0.24, 0.92)}<line x1="${SX(centre[0])}" y1="${SY(centre[1])}" x2="${SX(A[0])}" y2="${SY(A[1])}" stroke="${C.blue}" stroke-width="1.8" stroke-dasharray="5 4"/></g>`;
  s += `<g>${appear(0.38, 0.92)}<line x1="${SX(centre[0])}" y1="${SY(centre[1])}" x2="${SX(A2[0])}" y2="${SY(A2[1])}" stroke="${C.pink}" stroke-width="1.8" stroke-dasharray="5 4"/></g>`;
  const path = arcPath(centre, A, deg);
  s += `<g>${appear(0.46, 0.92)}<path d="${path}" fill="none" stroke="${C.yellow}" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#${id})"/></g>`;
  const mid = rot(A, centre, deg / 2);
  s += `<g>${appear(0.56, 0.92)}${txt(SX(mid[0]) + (mid[0] >= centre[0] ? 34 : -34), SY(mid[1]) - 10, `${Math.abs(deg)}° ${deg > 0 ? "anticlockwise" : "clockwise"}`, C.yellow, 13)}</g>`;
  s += caption("the angle between the two spokes is the turn", C.yellow, 0.66, 0.92);
  return base(s, "spoke to a corner, spoke to its image");
}

function demoFindCentreEnlargement({ obj, img, centre, k }) {
  let s = "";
  s += `<polygon points="${poly(obj)}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(img)}" fill="rgba(255,70,112,0.20)" stroke="${C.pink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  obj.forEach((p, i) => {
    const q = img[i];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const far = [r1(q[0] + dx * 0.15), r1(q[1] + dy * 0.15)];
    const back = [r1(p[0] - dx * 0.9), r1(p[1] - dy * 0.9)];
    s += `<g>${appear(0.10 + i * 0.12, 0.92)}<line x1="${SX(back[0])}" y1="${SY(back[1])}" x2="${SX(far[0])}" y2="${SY(far[1])}" stroke="${C.green}" stroke-width="1.6" stroke-dasharray="5 4"/></g>`;
  });
  s += `<g>${appear(0.50, 0.92)}${dot(centre, C.yellow, 7)}${chip(SX(centre[0]) - 40, SY(centre[1]) + 22, `they meet at (${centre[0]}, ${centre[1]})`, C.yellow)}</g>`;
  s += caption(`image side ÷ object side = ${k}`, C.yellow, 0.64, 0.92);
  return base(s, "lines through matching corners meet at the centre");
}

// ═══ CONCEPT DEMOS ═════════════════════════════════════════════════════
function demoEquivalentTurns() {
  const id = nextId();
  const c = [0, 0], A = [3, 1];
  let s = markerDef(id);
  s += `<g>${dot(c, C.yellow, 6)}</g>${dot(A, C.blue, 5.5)}`;
  const cw = arcPath(c, A, -90), acw = arcPath(c, A, 270);
  s += `<g>${appear(0.08, 0.46)}<path d="${cw}" fill="none" stroke="${C.pink}" stroke-width="2.2" marker-end="url(#${id})"/></g>` + caption("90° clockwise", C.pink, 0.08, 0.46);
  s += `<circle r="6" fill="${C.pink}" stroke="#0b1118" stroke-width="1.5" opacity="0">${appear(0.08, 0.46)}<animateMotion path="${cw}" keyPoints="0;0;1;1" keyTimes="0;0.08;0.40;1" calcMode="spline" keySplines="${HOLD};${EASE};${HOLD}" dur="${DUR}" repeatCount="indefinite"/></circle>`;
  s += `<g>${appear(0.52, 0.94)}<path d="${acw}" fill="none" stroke="${C.green}" stroke-width="2.2" marker-end="url(#${id})"/></g>` + caption("270° anticlockwise", C.green, 0.52, 0.94);
  s += `<circle r="6" fill="${C.green}" stroke="#0b1118" stroke-width="1.5" opacity="0">${appear(0.52, 0.94)}<animateMotion path="${acw}" keyPoints="0;0;1;1" keyTimes="0;0.52;0.88;1" calcMode="spline" keySplines="${HOLD};${EASE};${HOLD}" dur="${DUR}" repeatCount="indefinite"/></circle>`;
  s += `<g>${appear(0.42, 0.50)}${dot(rot(A, c, -90), C.pink, 6)}</g>`;
  s += `<g>${appear(0.88, 0.94)}${dot(rot(A, c, -90), C.green, 6)}${txt(SX(1) + 30, SY(-3) + 6, "same landing spot", C.yellow, 13)}</g>`;
  return base(s, "two ways round to the same place");
}

function demoAreaScale() {
  // k = 1/2: four copies of the image tile the object
  const obj = [[1, 1], [5, 1], [5, 3], [1, 3]];
  const img = [[1, 1], [3, 1], [3, 2], [1, 2]];
  let s = `<polygon points="${poly(obj)}" fill="rgba(0,171,250,0.16)" stroke="${C.blue}" stroke-width="2.4"/>`;
  s += txt(SX(3), SY(3) - 16, "object", C.blue, 13);
  const tiles = [[1, 1], [3, 1], [1, 2], [3, 2]];
  tiles.forEach((t, i) => {
    const q = [[t[0], t[1]], [t[0] + 2, t[1]], [t[0] + 2, t[1] + 1], [t[0], t[1] + 1]];
    s += `<g>${appear(0.14 + i * 0.14, 0.94)}<polygon points="${poly(q)}" fill="rgba(255,240,103,0.14)" stroke="${C.yellow}" stroke-width="1.8"/>${txt(SX(t[0] + 1), SY(t[1] + 0.5), i + 1, C.yellow, 14)}</g>`;
  });
  s += `<polygon points="${poly(img)}" fill="rgba(255,70,112,0.20)" stroke="${C.pink}" stroke-width="2.4"/>`;
  s += caption("halve every length, and 4 images fill the object", C.yellow, 0.70, 0.94);
  return base(s, "sides × ½, area × ¼");
}

module.exports = {
  useGeometry,
  caption,
  chip,
  demoTranslation, demoTranslatePoint, demoReflection, demoRotation, demoEnlargement,
  demoReadVector, demoFindMirror, demoFindCentreRotation, demoFindCentreEnlargement,
  demoEquivalentTurns, demoAreaScale, base, txt, appear, anim, animDiscrete, C, SX, SY, poly, dot, markerDef, growArrow, DUR, EASE, HOLD, r1,
};
