/** Role-highlighting demos for the calculation topics (6.1, 6.2). */
const G = require("./lesson-demo-gen.js");
const { C, appear, txt, r1, DUR } = G;

/** Pull the first polygon's px points out of a generated contextHtml. */
function polyPts(html) {
  const m = html.match(/points='([0-9.,\s-]+)'/);
  if (!m) throw new Error("no polygon in contextHtml");
  return m[1].trim().split(/\s+/).map(p => p.split(",").map(Number));
}
/** All <line> segments as [[x1,y1],[x2,y2]]. */
function lines(html) {
  return [...html.matchAll(/<line x1='([\d.]+)' y1='([\d.]+)' x2='([\d.]+)' y2='([\d.]+)'/g)]
    .map(m => [[+m[1], +m[2]], [+m[3], +m[4]]]);
}

/**
 * Static picture from the slide (so the demo matches the reference card
 * exactly), with each side lighting up in role order, then the equation
 * assembling underneath.
 */
function demoRoles({ html, segments, steps, headline }) {
  let s = html.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  segments.forEach((seg, i) => {
    const [p, q] = seg.pts;
    const t0 = 0.10 + i * 0.16;
    // inset the highlight so it never covers the corner marks, and keep it
    // translucent so the diagram's own labels stay readable underneath
    const ax = p[0] + (q[0] - p[0]) * 0.08, ay = p[1] + (q[1] - p[1]) * 0.08;
    const bx = p[0] + (q[0] - p[0]) * 0.92, by = p[1] + (q[1] - p[1]) * 0.92;
    s += `<g>${appear(t0, 0.94)}` +
      `<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(bx)}" y2="${r1(by)}" stroke="${seg.color}" stroke-width="6" stroke-linecap="round" opacity="0.5"/>`;
    // keep every chip inside the canvas and clear of the caption strip
    const mx = Math.max(70, Math.min(410, (p[0] + q[0]) / 2 + (seg.dx || 0)));
    const my = Math.max(42, Math.min(264, (p[1] + q[1]) / 2 + (seg.dy || 0)));
    s += G.chip(mx, my, seg.label, seg.color, 13) + `</g>`;
  });
  steps.forEach((st, i) => {
    const t0 = 0.10 + segments.length * 0.16 + i * 0.14;
    s += G.caption(st.text, st.color || C.white, t0, 0.94);
  });
  return `<svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="480" height="26" fill="rgba(11,17,24,0.9)"/>` + txt(240, 13, headline, C.yellow, 12) +
    s + `</svg>`;
}

/** Convenience: a triangle contextHtml whose polygon is [R, A, B]. */
function triEdges(html) {
  const [R, A, B] = polyPts(html);
  return { R, A, B, base: [R, A], hyp: [A, B], vert: [B, R] };
}
module.exports = { demoRoles, triEdges, polyPts, lines };
