/*
 * A quill in the margin.
 *
 * An engraved quill sits in the gutter to the right of the text. As you
 * scroll it writes its way down the margin: the page's title, set on its
 * side like the spine of a book, then idle scribbles, lines from the
 * collection of quotes, and an oval flourish beside each heading. The pen
 * keeps a hand's pace of its own, so the letters come stroke by stroke behind
 * the nib; scrolling back up lifts it without erasing anything.
 *
 * Past the foot of the page the scrolling carries on. The article lifts away
 * and the quill crosses into the open page, where it writes out quotes line
 * after line, like a letter, for as long as you care to keep going. Scrolling
 * back up winds the letter back and puts the page where it was.
 *
 * The feather is drawn here barb by barb, in the manner of the engravings
 * elsewhere on the site, so that while the pen is moving its vanes can stir
 * and its tip can trail behind the stroke.
 */
(() => {
  "use strict";

  const content = document.querySelector(".content");
  const sidebar = document.querySelector(".sidebar");
  if (!content || !sidebar || !window.CanvasRenderingContext2D) return;

  const INK = "rgb(38, 33, 29)";
  const CHUNK = 1024; // height of each canvas down the margin, in CSS pixels
  const LEAF = 512; // and on the open page, which is wider
  const STEP = 1.5; // spacing of points along the pen's route
  const NIB = 2.6; // width of the nib, for a hand of TITLE_SCALE
  const NIB_ANGLE = (-40 * Math.PI) / 180;
  const TITLE_SCALE = 1.15; // size of the handwriting, in CSS pixels per font unit
  const QUOTE_SCALE = 0.9;
  const EYE = 0.95; // how far down the screen the pen likes to write in the margin
  const HEAD_START = 0.22; // how much of the screen above the pen is left to write live on arrival
  const PAGE_EYE = 0.56; // and on the open page
  const PACE = 700; // CSS pixels a second along a straight stroke, at TITLE_SCALE
  const DOODLE = 480; // the same, scribbling
  const CURVE = 5; // how much the hand slows into a turn
  const AIR = 700; // speed with the nib off the paper
  const HURRY = 2.4; // the most the hand will hurry to catch up
  const SWIFT = 840; // and the fastest it will move, in CSS pixels a second
  const FEED = 0.011; // seconds of writing for each pixel scrolled past the end
  const AHEAD = 1.6; // seconds of writing the scrolling may get ahead of the pen
  const RUSH_SPEED = 1400; // scrolling this fast, in CSS pixels a second, has the hand writing flat out
  const RUSH = 4; // how much faster than its usual hurry the hand will write, flat out
  const stillness = matchMedia("(prefers-reduced-motion: reduce)");

  let geo = null; // the layout, as measured
  let margin = null; // the sheet down the right of the text
  let page = null; // the open page, past the end
  let quill = null; // the drawn feather, and the parts of it that move
  let pen = null;
  let motion = null;
  let progress = 0; // fraction of the margin written, kept across rebuilds
  let raf = 0;
  let pending = 0;
  let last = 0;
  let hand = null; // the single-stroke script the quill writes in
  let quotes = [];
  let loaded = false;

  // Where the nib is, and how the hand holding it is moving.
  const nib = {
    sheet: null, // the sheet it is on, or none while crossing between them
    at: 0, // arc length along that sheet's route
    tau: 0, // and the time a calm hand would take to get there
    tempo: 0,
    hover: false, // held above ink already written
    landing: false, // coming down after a glide, before writing on
    still: 0, // when it came to rest
    off: [0, 0], // a glide still to be taken up, on the screen
    offV: [0, 0],
    lift: 0,
    liftV: 0,
    lag: [0, 0], // the nib's travel over the paper, smoothed
    jolt: 0, // a jump made this frame that isn't the hand's doing
    shown: null, // where the nib was drawn last, in document coordinates
  };
  let mode = "";
  let carried = null; // how far the paper itself had moved, last frame

  // Scrolling on past the end of the page.
  let over = 0; // distance scrolled past the end
  let rush = 0; // how hard the reader is scrolling, from 0 (calmly) to 1 (flat out)
  let lastScroll = 0; // where the page and the past-the-end scroll were last frame
  let shown = 0; // the same, eased
  let anchor = 0; // the scroll position it was measured from
  let fling = 0; // a touch's momentum, in pixels a second
  let unwound = 0; // how much has been unwound in this run of scrolling back
  let lastUnwind = 0;
  let armed = false;
  let folded = -1;
  let paper = 0; // how far the open page has been drawn up
  let paperV = 0;

  // The script and the quotes are fetched alongside this file, at its version.
  const version = document.currentScript ? new URL(document.currentScript.src).search : "";
  const fetchJSON = (url) => fetch(url + version).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const assets = Promise.all([fetchJSON("/assets/quill-hand.json"), fetchJSON("/assets/margin-quotes.json")]).then(
    ([script, lines]) => {
      hand = script && script.glyphs ? script : null;
      quotes = (Array.isArray(lines) ? lines : [])
        .filter((q) => q && q.text)
        .map((q) => ({ text: q.text, by: q.by || "", line: q.by ? `${q.text} - ${q.by}` : q.text }));
      loaded = true;
    },
  );

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (v) => {
    const t = clamp(v, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  // ----------------------------------------------------------------- route
  //
  // The pen's route is a run of points STEP apart. Each says whether the step
  // to it is inked, which way the letters face there, and how a calm hand
  // would time it: slower into turns and down the heavy strokes, quicker in
  // the air, with a pause to lift the nib and set it down again.

  function track() {
    return {
      x: [], y: [], // the line as meant
      px: [], py: [], // as the pen follows it
      tx: [], ty: [], // and as the ink takes it, with the tremor of the hand
      s: [], ink: [], down: [], steady: [], face: [], kind: [], size: [],
      tau: [], press: [], hop: [], end: [], reach: [],
      hops: [], dips: [0], dip: 0,
    };
  }

  // Ways of moving the pen along a route, which can be built a stretch at a
  // time. `face` is 1 where the letters are turned on their side, `kind` 1
  // for letters (rather than scribbles), `size` the hand against the title's.
  function pencil(t) {
    const p = { face: 0, kind: 0, size: 1 };
    p.push = (x, y, ink, shake) => {
      t.x.push(x);
      t.y.push(y);
      t.down.push(ink ? 1 : 0);
      t.steady.push(shake);
      t.face.push(p.face);
      t.kind.push(p.kind);
      t.size.push(p.size);
    };
    // Move the pen in short steps, on or off the paper.
    p.to = (x, y, ink, shake) => {
      const n = t.x.length;
      if (!n) return p.push(x, y, false, shake);
      const px = t.x[n - 1];
      const py = t.y[n - 1];
      const k = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / STEP));
      for (let i = 1; i <= k; i++) p.push(px + ((x - px) * i) / k, py + ((y - py) * i) / k, ink, shake);
    };
    // The pen has just been dipped.
    p.dip = () => t.dips.push(t.x.length);
    return p;
  }

  // The width of a line of the script, in font units.
  const measure = (text) => [...text].reduce((w, ch) => w + (hand.glyphs[ch] ? 2 * hand.glyphs[ch].o : 8), 0);

  // Write `text`, placing each point of the script (in font units, baseline
  // at 22) on the sheet through `place`. Returns the width written.
  function inscribe(p, text, place) {
    let gx = 0;
    p.kind = 1;
    for (const ch of text) {
      const g = hand.glyphs[ch];
      if (!g) {
        gx += 8;
        continue;
      }
      for (const stroke of g.s) {
        for (let i = 0; i < stroke.length; i += 2) p.to(...place(gx + stroke[i], stroke[i + 1]), i > 0, 0.3);
      }
      gx += 2 * g.o;
    }
    p.kind = 0;
    return gx;
  }

  // Work out everything about the points from `from` on that depends on the
  // route as a whole: arc length, tremor, ink, and timing.
  function finish(t, from) {
    const { x, y, s, down } = t;
    const n = x.length;
    for (let i = from; i < n; i++) s[i] = i ? s[i - 1] + Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]) : 0;

    // The hand is never quite steady: nudge each point across the stroke by
    // a tremor at a few scales. The pen itself follows only the odd slow
    // hesitation; the finer shake shows in the ink alone. Seeded by position
    // along the line, so a rebuild writes exactly the same line.
    for (let i = from; i < n; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(n - 1, i + 1);
      const len = Math.hypot(x[b] - x[a], y[b] - y[a]) || 1;
      const nx = -(y[b] - y[a]) / len;
      const ny = (x[b] - x[a]) / len;
      const v = s[i];
      const k = t.steady[i];
      const halt = 1.8 * Math.max(0, wander(v / 45 + 5)) ** 4 * Math.sign(wander(v / 13 + 71)) * k;
      const shake = (0.8 * wander(v / 9 + 31) + 0.45 * wander(v / 3.1 + 97) + 0.3 * (hash(i * 0.73 + 5.1) - 0.5)) * k;
      t.px[i] = x[i] + nx * halt;
      t.py[i] = y[i] + ny * halt;
      t.tx[i] = t.px[i] + nx * shake;
      t.ty[i] = t.py[i] + ny * shake;
    }

    // How sharply the line turns at each point, and how much each step runs
    // down the letters, where the hand bears on the nib.
    const m = n - from;
    const turn = new Float64Array(m);
    const push = new Float64Array(m);
    const heading = (i) => Math.atan2(y[i] - y[i - 1], x[i] - x[i - 1]);
    for (let i = Math.max(from, 1); i < n; i++) {
      const ds = s[i] - s[i - 1];
      if (ds < 0.01) continue;
      if (i + 1 < n && down[i] && down[i + 1] && s[i + 1] - s[i] > 0.01) {
        let d = heading(i + 1) - heading(i);
        d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
        turn[i - from] = Math.abs(d) / Math.max(ds, 0.5);
      }
      if (down[i] && t.kind[i]) {
        // Down the letters is towards the text when they're on their side.
        const along = t.face[i] ? -(x[i] - x[i - 1]) / ds : (y[i] - y[i - 1]) / ds;
        push[i - from] = Math.max(0, along);
      }
    }
    const blur = (a, j) => {
      let sum = 0;
      let w = 0;
      for (let k = Math.max(0, j - 3); k <= Math.min(m - 1, j + 3); k++, w++) sum += a[k];
      return w ? sum / w : 0;
    };

    // How much ink is on the nib: full after a dip, running down as it goes,
    // never quite smooth, and a little heavier where the hand bears down.
    for (let i = from; i < n; i++) {
      while (t.dip + 1 < t.dips.length && t.dips[t.dip + 1] <= i) t.dip++;
      const since = s[i] - s[t.dips[t.dip]];
      t.press[i] = blur(push, i - from);
      t.ink[i] =
        (0.42 + 0.58 * Math.exp(-since / 1000)) *
        (0.8 + 0.3 * wander(s[i] / 14 + 7)) *
        (1 + 0.22 * wander(s[i] / 60 + 19)) *
        (1 + 0.12 * t.press[i]);
      t.hop[i] = 0;
    }

    // The time each step takes a calm hand.
    const cost = new Float64Array(m);
    for (let i = Math.max(from, 1); i < n; i++) {
      const ds = s[i] - s[i - 1];
      const k = t.size[i];
      if (down[i]) {
        const pace = ((t.kind[i] ? PACE : DOODLE) * k) / (1 + CURVE * blur(turn, i - from) * k);
        cost[i - from] = ds / (pace * (1 - 0.15 * t.press[i]));
      } else cost[i - from] = ds / (AIR * k);
    }
    // Between strokes the nib is lifted and set down again, which takes a
    // moment however short the hop; it eases off the paper, travels, and
    // eases down again.
    const hops = [];
    for (let i = Math.max(from, 1); i < n; ) {
      if (down[i]) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < n && !down[j + 1]) j++;
      const a = s[i - 1];
      const len = s[j] - a;
      if (len >= 2.5) {
        const time = Math.min(0.3, 0.05 + len / (AIR * t.size[i]));
        let sum = 0;
        for (let k = i; k <= j; k++) {
          const f = (s[k] - (s[k] - s[k - 1]) / 2 - a) / len;
          cost[k - from] = (s[k] - s[k - 1]) / (0.12 + Math.sin(Math.PI * f));
          sum += cost[k - from];
        }
        for (let k = i; k <= j; k++) cost[k - from] *= time / (sum || 1);
        hops.push([i, j, len]);
      }
      i = j + 1;
    }
    for (let i = from; i < n; i++) t.tau[i] = i ? t.tau[i - 1] + cost[i - from] : 0;
    for (const [i, j, len] of hops) {
      t.hops.push({ t0: t.tau[i - 1], t1: t.tau[j], h: Math.min(1, 0.3 + len / 40) });
      for (let k = i; k <= j; k++) t.hop[k] = t.hops.length;
    }

    // Where each stroke ends, so the pen can finish a letter before it rests.
    for (let i = n - 1; i >= from; i--) t.end[i] = down[i] && i + 1 < n && down[i + 1] ? t.end[i + 1] : s[i];
    t.total = s[n - 1];
  }

  // Index of the last entry of the ascending `a` at or before v.
  function search(a, v) {
    let lo = 0;
    let hi = a.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (a[mid] <= v) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  // The point at arc length v, from the given coordinates, with the index
  // before it and how far it is on to the next.
  function at(t, v, xs, ys) {
    const i = search(t.s, v);
    const j = Math.min(i + 1, t.s.length - 1);
    const span = t.s[j] - t.s[i];
    const f = span > 0 ? clamp((v - t.s[i]) / span, 0, 1) : 0;
    return [xs[i] + (xs[j] - xs[i]) * f, ys[i] + (ys[j] - ys[i]) * f, i, f];
  }
  const inkAt = (t, v) => at(t, v, t.tx, t.ty);
  const penAt = (t, v) => at(t, v, t.px, t.py);

  // Between arc length and the time a calm hand takes to get there.
  function tauAt(t, v) {
    const [w] = at(t, v, t.tau, t.tau);
    return w;
  }
  function arcAt(t, w) {
    const i = search(t.tau, w);
    const j = Math.min(i + 1, t.tau.length - 1);
    const span = t.tau[j] - t.tau[i];
    return t.s[i] + (t.s[j] - t.s[i]) * (span > 0 ? clamp((w - t.tau[i]) / span, 0, 1) : 0);
  }
  const reachAt = (t, v) => at(t, v, t.reach, t.reach)[0];

  // The first point at which the pen has got as far down the page as y.
  function reachedBy(t, y) {
    let lo = 0;
    let hi = t.reach.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (t.reach[mid] >= y) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  // A hand stops at the end of a stroke, not halfway through a letter, and
  // doesn't wait with its pen in the air.
  function snap(t, v) {
    const i = search(t.s, v);
    const j = i + 1;
    if (j >= t.s.length) return v;
    if (t.down[j]) return t.kind[j] && t.end[j] - v < 200 ? t.end[j] : v;
    return t.hop[j] ? arcAt(t, t.hops[t.hop[j] - 1].t1) : v;
  }

  // ------------------------------------------------------- down the margin

  // The pen's route down the margin: the page's title, written sideways like
  // the spine of a book, then scribbling, a line from the collection of
  // quotes, more scribbling, and so on to the foot of the page. Strokes are
  // joined by short hops with the nib off the paper.
  function buildMargin() {
    const { centre, amp, y0, y1, loops, radius, width } = geo;
    const t = track();
    const p = pencil(t);
    const { push, to } = p;
    const base = (y) => centre + amp * (0.65 * Math.sin(y / 240 + 0.8) + 0.35 * Math.sin(y / 90 + 2.1));
    let k = 0; // the next heading to flourish beside

    // Turned a quarter clockwise, the line reads down the margin with the
    // feet of the letters towards the text. Returns where the writing ends.
    const letter = (text, y, scale) => {
      const ox = centre - 4.5 * scale; // the baseline, set so the letters sit centred
      p.dip();
      p.face = 1;
      p.size = scale / TITLE_SCALE;
      const gx = inscribe(p, text, (u, v) => [ox + (22 - v) * scale, y + u * scale]);
      p.face = 0;
      p.size = 1;
      while (k < loops.length && loops[k] < y + gx * scale) k++;
      return y + gx * scale;
    };

    // An oval beside the stem, entered and left travelling downwards.
    const oval = (x, y, side) => {
      p.dip();
      const rx = radius;
      const ry = radius * 1.55;
      const cx = x + side * rx;
      const start = side < 0 ? 0 : Math.PI;
      const dir = side < 0 ? 1 : -1;
      const n = Math.ceil((Math.PI * (rx + ry)) / STEP);
      for (let i = 1; i <= n; i++) {
        const a = start + (dir * 2 * Math.PI * i) / n;
        push(cx + rx * Math.cos(a), y + ry * Math.sin(a), true, 1);
      }
    };
    // A wavering line, with an oval beside any heading it passes.
    const wave = (from, until) => {
      for (let y = from; y < until; y += STEP) {
        to(base(y), y, true, 1);
        if (k < loops.length && y >= loops[k]) oval(base(y), y, k++ % 2 ? 1 : -1);
      }
    };
    // A run of looped garland, like an idle hand doodling a row of e's.
    const garland = (from, until) => {
      const r = hash(from * 0.017 + 4.2);
      const pitch = 11 + 7 * r;
      const size = (5 + 4 * hash(from * 0.029 + 1.3)) * Math.min(1, width / 90);
      const side = hash(from * 0.011) < 0.5 ? 1 : -1;
      const turns = Math.max(2, Math.round((until - from) / pitch));
      const span = turns * 2 * Math.PI;
      const rise = (until - from) / span;
      for (let a = 0; a <= span; a += 0.16) {
        // Grow into the loops and out of them again, so the line runs on.
        const ease = Math.min(1, a / (2 * Math.PI), (span - a) / (2 * Math.PI));
        const y = from + rise * a - size * ease * Math.sin(a);
        to(base(y) + side * size * 0.9 * ease * (1 - Math.cos(a)), y, true, 1);
      }
    };
    const scribble = (from, until) => {
      to(base(from), from, false, 1);
      let y = from;
      while (y < until - 1) {
        const len = Math.min(until - y, 80 + 240 * hash(y * 0.021 + 9.1));
        const heading = k < loops.length && loops[k] < y + len + 20;
        if (!heading && len > 50 && hash(y * 0.013 + 3.7) < 0.5) garland(y, y + len);
        else wave(y, y + len);
        y += len;
      }
      return until;
    };

    let y = y0;
    const room = geo.letters;
    const title = hand && document.title.trim();
    if (title) {
      const fit = Math.min(TITLE_SCALE, room, (y1 - y0 - 60) / measure(title));
      if (fit > 0.6) y = letter(title, y, fit) + 20;
    }
    // Lines copied out of the page itself, each beside the paragraph it came
    // from, taking turns with quotes from the collection, in an order of this
    // page's own.
    const order = shuffled(quotes, geo.seed);
    const notes = geo.notes;
    const scale = Math.min(QUOTE_SCALE, room);
    geo.used = new Set();
    let n = 0; // the next excerpt not yet passed
    let copy = true; // whether an excerpt has the next turn
    while (y < y1 - 30) {
      while (n < notes.length && notes[n].y < y - 40) n++;
      const note = notes[n];
      const next = note ? note.y : y1;
      // Whether to copy out what comes next on the page: headings are the
      // likeliest, even out of turn, and are written in a larger hand.
      if (hand && note && note.y - y < 900) {
        const keen = note.heading ? (copy ? 0.9 : 0.6) : copy ? 0.55 : 0;
        n++;
        if (hash(note.y * 0.37 + 11.3) < keen) {
          const size = note.heading ? Math.min(TITLE_SCALE * 0.85, room) : scale;
          const at = Math.max(y + 24, note.y);
          if (at + measure(note.line) * size < y1 - 24) {
            copy = false;
            y = letter(note.line, scribble(y, at), size) + (note.heading ? 30 : 24);
            continue;
          }
        }
      }
      y = scribble(y, Math.min(y1, y + 240 + 420 * hash(y * 0.0071 + 2.9)));
      copy = true;
      if (!hand || y >= y1 - 30) continue;
      // A quote from the collection, if it can be finished before the next
      // excerpt is due.
      const limit = Math.min(y1, next) - 24;
      const i = order.findIndex((q) => y + 24 + measure(q.line) * scale < limit);
      if (i < 0) continue;
      const [q] = order.splice(i, 1);
      geo.used.add(q);
      y = letter(q.line, y + 24, scale) + 24;
    }
    if (t.x.length < 2) to(base(y0), y0 + STEP, true, 1);

    finish(t, 0);
    // The furthest the pen has got down the page by each point, which is how
    // scrolling is matched to the writing.
    for (let i = 0; i < t.y.length; i++) t.reach[i] = Math.max(i ? t.reach[i - 1] : -Infinity, t.y[i]);
    return t;
  }

  const shuffled = (list, seed) =>
    list.map((q, i) => [hash(seed + i * 7.31), q]).sort((a, b) => a[0] - b[0]).map(([, q]) => q);

  // ------------------------------------------------------ the open page

  // Past the end the pen writes a letter, of quotes in this page's order
  // (those the margin hasn't used first), each closed with a small swash.
  // It is laid down a line at a time, as far ahead as the pen needs.
  function grow(until) {
    const t = page.track;
    const gen = page.gen;
    let guard = 0;
    while ((!t.tau.length || t.tau[t.tau.length - 1] < until) && guard++ < 8) {
      const s = gen.scale;
      const mid = (gen.x0 + gen.x1) / 2;
      const xh = 9 * s; // the height of the small letters
      if (!gen.count++) {
        // A larger ornament heads the letter.
        line(gen.y, (p) => swash(p, mid, gen.y, 8 * xh, 0.55 * xh, 0.55 * xh, true));
        gen.y += 1.7 * gen.lh;
      }
      if (!gen.queue.length) gen.queue = shuffled(quotes, page.seed + ++gen.cycle * 13.7);
      const q = gen.queue.shift();
      if (hand && q) {
        wrap(q.text, (gen.x1 - gen.x0) / s, 20).forEach((text, n) => {
          const indent = n ? 0 : 20 * s;
          const wobble = hash(gen.y * 0.013 + 2.2) * 40;
          line(gen.y, (p) => {
            p.dip();
            inscribe(p, text, (u, v) => [gen.x0 + indent + u * s, gen.y + (v - 22) * s + 0.9 * s * wander(u / 60 + wobble)]);
          });
          gen.y += gen.lh;
        });
        if (q.by) {
          const s2 = s * 0.85;
          const by = `- ${q.by}`;
          const x = gen.x1 - measure(by) * s2;
          gen.y -= 0.12 * gen.lh;
          line(gen.y, (p) => inscribe(p, by, (u, v) => [x + u * s2, gen.y + (v - 22) * s2]));
          gen.y += gen.lh;
        }
      } else {
        // Without the script, a hand can only doodle.
        for (let n = 0; n < 2; n++) {
          line(gen.y, (p) => loopsAcross(p, gen.x0 + (n ? 0 : 20 * s), gen.x1 - 30 * s * hash(gen.y), gen.y, 4.5 * s));
          gen.y += gen.lh;
        }
      }
      gen.y += 0.2 * gen.lh;
      const big = gen.count % 4 === 0;
      line(gen.y - 0.3 * xh, (p) => swash(p, mid, gen.y - 0.3 * xh, (big ? 7 : 4.5) * xh, 0.4 * xh, 0.42 * xh, big));
      gen.y += 1.55 * gen.lh;
    }
  }

  // Lay down one line of the letter, its baseline at y, and record it so a
  // strip of the page that has been let go can be written out again.
  function line(y, draw) {
    const t = page.track;
    const gen = page.gen;
    const from = t.x.length;
    const p = pencil(t);
    p.size = gen.scale / TITLE_SCALE;
    draw(p);
    const n = t.x.length;
    if (n === from) return;
    finish(t, from);
    // How far the paper should be drawn up as the line is written: the
    // carriage moves on by a line for every line.
    const a = from ? t.s[from - 1] : 0;
    const span = t.s[n - 1] - a || 1;
    for (let i = from; i < n; i++) t.reach[i] = mix(gen.reach, y, (t.s[i] - a) / span);
    gen.reach = y;
    let top = Infinity;
    let bottom = -Infinity;
    for (let i = from; i < n; i++) {
      top = Math.min(top, t.ty[i]);
      bottom = Math.max(bottom, t.ty[i]);
    }
    page.blocks.push({ a, b: t.s[n - 1], top: top - 6, bottom: bottom + 6 });
  }

  // Break text into lines of the script no wider than `room` font units.
  function wrap(text, room, indent) {
    const lines = [];
    let current = "";
    let w = indent;
    for (const word of text.split(" ")) {
      const ww = measure(word);
      if (current && w + 8 + ww > room) {
        lines.push(current);
        current = word;
        w = ww;
      } else {
        w += (current ? 8 : 0) + ww;
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // A calligrapher's swash: a lazy stroke out to either side of a loop, the
  // two arms turned about the middle so the whole thing balances. With
  // `eight`, the loop is doubled into a figure of eight.
  function swash(p, cx, y, w, h, r, eight) {
    const arm = (u) => [cx - w * (1 - u), y + h * Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u)];
    const n = Math.ceil(w / STEP);
    const m = Math.ceil((2 * Math.PI * r) / STEP);
    p.dip();
    p.to(...arm(0), false, 0.4);
    for (let i = 1; i <= n; i++) p.to(...arm(i / n), true, 0.4);
    for (const way of eight ? [-1, 1] : [-1]) {
      for (let i = 1; i <= m; i++) {
        const a = (2 * Math.PI * i) / m;
        p.push(cx + r * Math.sin(a), y + way * r * (1 - Math.cos(a)), true, 0.4);
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      const [x, yy] = arm(i / n);
      p.to(2 * cx - x, 2 * y - yy, true, 0.4);
    }
  }

  // A row of looped garland across the page.
  function loopsAcross(p, x0, x1, y, size) {
    const turns = Math.max(3, Math.round((x1 - x0) / (size * 1.4)));
    const span = turns * 2 * Math.PI;
    const run = (x1 - x0) / span;
    p.dip();
    p.to(x0, y, false, 1);
    for (let a = 0; a <= span; a += 0.16) {
      const ease = Math.min(1, a / (2 * Math.PI), (span - a) / (2 * Math.PI));
      p.to(x0 + run * a - size * 0.8 * ease * Math.sin(a), y - size * ease * (1 - Math.cos(a)), true, 0.6);
    }
  }

  // --------------------------------------------------------------- writing

  function sheet(layer, width, height, chunk, size) {
    return {
      layer, width, height, chunk, nib: NIB * size, dpr: geo.dpr,
      chunks: new Map(), track: null, written: 0, blocks: null, blots: [], kept: "",
    };
  }

  function chunkAt(sh, c) {
    let g = sh.chunks.get(c);
    if (g) return g;
    const h = Math.min(sh.chunk, sh.height - c * sh.chunk);
    if (c < 0 || h <= 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sh.width * sh.dpr);
    canvas.height = Math.round(h * sh.dpr);
    Object.assign(canvas.style, { top: c * sh.chunk + "px", width: sh.width + "px", height: h + "px" });
    sh.layer.appendChild(canvas);
    g = canvas.getContext("2d");
    sh.chunks.set(c, g);
    // A strip of the letter that was let go is written out again just as it
    // was, since every mark is seeded by its place on the route.
    if (sh.blocks) {
      const top = c * sh.chunk;
      for (const b of sh.blocks) {
        if (b.a < sh.written && b.bottom > top && b.top < top + sh.chunk) write(sh, b.a, Math.min(b.b, sh.written), c);
      }
      for (const v of sh.blots) if (v <= sh.written) blot(sh, v, c);
    }
    return g;
  }

  // Keep only the strips of the open page near the screen.
  function keep(sh, top, bottom) {
    const lo = Math.floor(top / sh.chunk);
    const hi = Math.floor(bottom / sh.chunk);
    const key = `${lo},${hi},${Math.floor(sh.written / 400)}`;
    if (sh.kept === key) return;
    sh.kept = key;
    for (const [c, g] of sh.chunks) {
      if (c >= lo - 1 && c <= hi + 1) continue;
      g.canvas.remove();
      sh.chunks.delete(c);
    }
    for (let c = Math.max(0, lo); c <= hi; c++) {
      if (sh.chunks.has(c)) continue;
      const y = c * sh.chunk;
      if (sh.blocks.some((b) => b.a < sh.written && b.bottom > y && b.top < y + sh.chunk)) chunkAt(sh, c);
    }
  }

  // Write the route from arc length a to b. The mark of a broad nib is the
  // area swept by a short slanted edge, so it is filled as one outline; its
  // two edges fray independently where the ink bleeds into the paper. Each
  // piece starts from the point before a, so pieces written frame by frame
  // overlap a little and join without a seam. With `only`, the ink goes into
  // that strip of the sheet alone.
  function write(sh, a, b, only) {
    if (b <= a) return;
    const t = sh.track;
    const n = t.s.length;
    const first = search(t.s, a);
    // Only the steps taken with the nib on the paper leave ink.
    const runs = [];
    let run = [[t.tx[first], t.ty[first], first, 0]];
    const add = (pt, inked) => {
      if (inked) return run.push(pt);
      if (run.length > 1) runs.push(run);
      run = [pt];
    };
    let i = first + 1;
    for (; i < n && t.s[i] < b; i++) add([t.tx[i], t.ty[i], i, 0], t.down[i]);
    if (i < n) add(inkAt(t, b), t.down[i]);
    if (run.length > 1) runs.push(run);
    for (const pts of runs) stroke(sh, pts, only === undefined ? first : -1, only);
  }

  function stroke(sh, pts, first, only) {
    const t = sh.track;
    const half = sh.nib / 2;
    // On their side, the letters are cut with the nib turned with them.
    const angle = (i) => (t.face[i] ? NIB_ANGLE + Math.PI / 2 : NIB_ANGLE);
    const width = (i, side) => t.ink[i] * (1 + 0.6 * (hash(i * 1.37 + side * 17.1) - 0.5) + 0.3 * wander(i / 2.2 + side * 40));
    const edge = ([, , i, f], side) => {
      let w = width(i, side);
      if (f) w += (width(i + 1, side) - w) * f;
      const a = angle(i);
      return [Math.cos(a) * half * w * side, Math.sin(a) * half * w * side];
    };
    let top = Infinity;
    let bottom = -Infinity;
    for (const [, y] of pts) {
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    const { dpr, chunk } = sh;
    const fine = half / (NIB / 2);
    for (let c = Math.floor((top - 4) / chunk); c <= Math.floor((bottom + 4) / chunk); c++) {
      if (only !== undefined && c !== only) continue;
      const g = chunkAt(sh, c);
      if (!g) continue;
      g.setTransform(dpr, 0, 0, dpr, 0, -c * chunk * dpr);
      g.fillStyle = g.strokeStyle = INK;
      g.beginPath();
      pts.forEach((pt, k) => {
        const [ex, ey] = edge(pt, 1);
        k ? g.lineTo(pt[0] + ex, pt[1] + ey) : g.moveTo(pt[0] + ex, pt[1] + ey);
      });
      for (let k = pts.length - 1; k >= 0; k--) {
        const [ex, ey] = edge(pts[k], -1);
        g.lineTo(pts[k][0] + ex, pts[k][1] + ey);
      }
      g.closePath();
      g.fill();

      // Hairlines, where the nib travels edge-on.
      g.lineJoin = g.lineCap = "round";
      for (let k = 1; k < pts.length; k++) {
        const [x0, y0] = pts[k - 1];
        const [x1, y1, i] = pts[k];
        g.lineWidth = (0.35 + 0.35 * t.ink[i]) * fine;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();
      }

      // Here and there the ink creeps out along a fibre of the paper.
      g.lineWidth = 0.3;
      g.globalAlpha = 0.45;
      for (const pt of pts) {
        const [x, y, i, f] = pt;
        if (f || i <= first || hash(i * 5.31 + 2.7) > 0.04 * t.ink[i]) continue;
        const side = hash(i * 2.1) < 0.5 ? 1 : -1;
        const a = angle(i) + side * (Math.PI / 2) + (hash(i * 3.3) - 0.5) * 1.4;
        const [ex, ey] = edge(pt, side);
        const len = (0.8 + 2.2 * hash(i * 7.7)) * fine;
        g.beginPath();
        g.moveTo(x + ex, y + ey);
        g.lineTo(x + ex + Math.cos(a) * len, y + ey + Math.sin(a) * len);
        g.stroke();
      }
      g.globalAlpha = 1;

      // Where the nib runs dry, the ink doesn't quite take.
      g.globalCompositeOperation = "destination-out";
      for (const [x, y, i, f] of pts) {
        if (f) continue;
        const dry = 0.05 + 0.7 * Math.max(0, 0.95 - t.ink[i]) ** 1.4;
        if (hash(i * 3.13 + 11.3) > dry) continue;
        const a = angle(i);
        const across = (hash(i * 9.1) - 0.5) * 1.5 * fine;
        g.globalAlpha = 0.5 + 0.5 * hash(i * 4.4);
        g.beginPath();
        g.ellipse(
          x + Math.cos(a) * half * across, y + Math.sin(a) * half * across,
          (0.3 + 0.5 * hash(i * 6.2)) * fine, (0.25 + 0.3 * hash(i * 8.8)) * fine, a, 0, Math.PI * 2,
        );
        g.fill();
      }
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
    }
  }

  // Ink pools a little where the pen rests before moving on.
  function blot(sh, v, only) {
    const t = sh.track;
    const [x, y, i] = inkAt(t, v);
    if (!t.down[Math.min(i + 1, t.s.length - 1)]) return;
    const c = Math.floor(y / sh.chunk);
    if (only !== undefined && c !== only) return;
    const g = chunkAt(sh, c);
    if (!g) return;
    if (only === undefined && sh.blocks) sh.blots.push(v);
    const k = sh.nib / NIB;
    g.setTransform(sh.dpr, 0, 0, sh.dpr, 0, -c * sh.chunk * sh.dpr);
    g.fillStyle = INK;
    // A few overlapping drops, so the pool has an uneven edge.
    for (let j = 0; j < 4; j++) {
      const r = hash(v * 0.37 + j * 13.7);
      const q = hash(v * 0.91 + j * 5.3);
      g.beginPath();
      g.ellipse(x + (r - 0.5) * 1.4 * k, y + (q - 0.5) * 1.6 * k, (0.9 + r * 0.9) * k, (1.1 + q * 0.9) * k, NIB_ANGLE + r, 0, Math.PI * 2);
      g.fill();
    }
  }

  // ------------------------------------------------------------- the quill
  //
  // The feather is drawn lying along x, with the nib at the origin and the
  // tip at x = 100; +y is the broad vane, on the shaded side. Each barb is
  // cut as a fine line that swells and tapers like a burin's, and the barbs
  // are gathered into small clumps which can each stir on their own.

  const SVG = "http://www.w3.org/2000/svg";
  const VANE = 24; // where the vanes begin along the shaft
  const JOINTS = [32, 46, 60, 74, 87]; // where the shaft can flex
  const SHARE = [0.12, 0.17, 0.21, 0.24, 0.26]; // how much of a bend each takes
  const BROAD = [14, 0.5, 0.62]; // half-width, and how it swells and tapers
  const NARROW = [7.2, 0.36, 0.8];

  const r2 = (n) => Math.round(n * 100) / 100;
  const shaftY = (u) => (u > 18 ? 5 * ((u - 18) / 82) ** 2 : 0); // bowed towards the broad vane
  const shaftW = (u) =>
    u < VANE ? 1.3 + (0.3 * Math.max(0, u - 5)) / (VANE - 5) : 0.14 + 1.46 * ((100 - u) / (100 - VANE)) ** 0.9;

  function vaneW(u, side) {
    const t = (u - VANE) / (100 - VANE);
    if (t <= 0 || t >= 1) return 0;
    const [w, a, b] = side > 0 ? BROAD : NARROW;
    const m = a / (a + b);
    return (w * t ** a * (1 - t) ** b) / (m ** a * (1 - m) ** b);
  }

  // Distance out from the shaft's centre line to the edge of a vane.
  const edgeY = (u, side, depth = 1) => shaftY(u) + side * (shaftW(u) + vaneW(u, side) * depth);

  // A small seeded generator, so that the feather is the same drawing on
  // every page.
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVG, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // One cut of the burin along the quadratic curve p0, c, p1, as a thin
  // filled shape whose half-width runs from w0 through w1 to w2.
  function cut([x0, y0], [cx, cy], [x1, y1], w0, w1, w2) {
    const unit = (x, y) => {
      const l = Math.hypot(x, y) || 1;
      return [-y / l, x / l];
    };
    const n0 = unit(cx - x0, cy - y0);
    const n1 = unit(x1 - cx, y1 - cy);
    const nm = unit(n1[1] + n0[1], -(n1[0] + n0[0]));
    const p = (x, y, n, k) => `${r2(x + n[0] * k)} ${r2(y + n[1] * k)}`;
    return (
      `M${p(x0, y0, n0, w0)}Q${p(cx, cy, nm, w1)} ${p(x1, y1, n1, w2)}` +
      `L${p(x1, y1, n1, -w2)}Q${p(cx, cy, nm, -w1)} ${p(x0, y0, n0, -w0)}Z`
    );
  }

  // The stretch of the quadratic p0, c, p1 between t0 and t1, as another.
  function part(p0, c, p1, t0, t1) {
    const point = (t) => p0.map((v, i) => (1 - t) ** 2 * v + 2 * t * (1 - t) * c[i] + t * t * p1[i]);
    const a = point(t0);
    const k = t1 - t0;
    return [a, a.map((v, i) => v + k * ((1 - t0) * (c[i] - p0[i]) + t0 * (p1[i] - c[i]))), point(t1)];
  }

  // Where along the shaft a barb leaving at u, at `angle` degrees to the
  // shaft, reaches the edge of its vane.
  function meet(u, side, angle) {
    const cot = 1 / Math.tan((angle * Math.PI) / 180);
    const f = (v) => v - u - cot * side * (edgeY(v, side) - edgeY(u, side, 0));
    if (f(99.8) <= 0) return 99.8;
    let lo = u;
    let hi = 99.8;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  // The parts of the feather that move: clumps of barbs, which tilt about
  // their roots, sit inside the shaft's segments, which turn at its joints.
  function clump(parts, root, d, opts) {
    let i = 0;
    while (i < JOINTS.length && root[0] >= JOINTS[i]) i++;
    const g = el("g", {}, parts.bodies[i]);
    el("path", { d, ...opts.attrs }, g);
    const side = Math.sign(root[1] - shaftY(root[0]));
    parts.clumps.push({ g, at: root, u: root[0], side, amp: opts.amp, give: opts.give, seed: Math.random() * 100 });
  }

  function drawVane(parts, side, rand) {
    const broad = side > 0;
    const spacing = broad ? 0.8 : 0.7;
    const splits = (broad ? [43, 60, 77] : [50, 66, 84]).map((u) => u + (rand() - 0.5) * 6);
    const tone = [rand() * 6, rand() * 6];
    let d = "";
    let n = 0;
    let anchorAt = null;
    for (let u = VANE + 0.4 + rand() * 0.5; u < 98.8; u += spacing * (0.75 + rand() * 0.5)) {
      const t = (u - VANE) / (100 - VANE);
      const ragged = t < 0.16;
      // Barbs leave the shaft steeply and lie closer to it towards the tip;
      // low on the vane they are loose and disordered.
      const angle = (broad ? 34 + 18 * (1 - t) ** 2 - 8 * t : 46 - 22 * t) + (rand() - 0.5) * (ragged ? 22 : 4);
      let end = meet(u, side, angle);
      let depth = 1 - rand() * (ragged ? 0.35 : 0.05);
      // Tone comes only from the weight of the line: bold barbs among fine
      // ones, bands running across the vane, and clumped barbs reading darker.
      const bold = rand() < (broad ? 0.45 + 0.3 * Math.max(0, 0.3 - t) : 0.5);
      let w = (bold ? 0.28 : 0.14) * (broad ? 1 : 1.12) * (0.85 + rand() * 0.3);
      w *= 1 + 0.25 * Math.sin(u * 0.5 + tone[0]) * Math.sin(u * 0.13 + tone[1]);
      // Where the vane has split, the barbs either side part to leave a notch.
      for (const s of splits) {
        const k = Math.max(0, 1 - Math.abs(end - s) / 3.6);
        end += Math.sign(end - s) * 1.7 * k * k;
        depth -= 0.25 * k * k;
        w *= 1 + 0.3 * k;
      }
      end = Math.min(end, 99.8);
      const p0 = [u, shaftY(u) + side * (shaftW(u) + 0.04)];
      const p1 = [end, edgeY(end, side, depth)];
      // Each barb leaves the shaft more steeply than its chord and curls
      // forward towards the tip; the lowest ones droop instead.
      const chord = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const curl = ((ragged ? -6 + rand() * 10 : (broad ? 16 : 12) + rand() * 7) * Math.PI) / 180;
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * 0.42;
      const c = [p0[0] + Math.cos(chord + side * curl) * len, p0[1] + Math.sin(chord + side * curl) * len];
      d += cut(p0, c, p1, w * 0.45, w * 0.75, w * 0.14);
      // The shaft throws a shadow across the root of the broad vane.
      if (broad && rand() < 0.6) d += cut(...part(p0, c, p1, 0, 0.25 + rand() * 0.2), w * 0.5, w * 0.6, w * 0.05);
      // Barbs darken again towards their ends, which draws the edge of the
      // vane without a contour line.
      if (rand() < (bold ? 0.8 : 0.3)) d += cut(...part(p0, c, p1, 0.6 + rand() * 0.15, 1), w * 0.05, w * 0.5, w * 0.12);
      if (!anchorAt) anchorAt = p0;
      // Gather every few barbs into a clump that can stir by itself.
      if (++n === 4) {
        clump(parts, anchorAt, d, {
          amp: (broad ? 0.05 : 0.04) * (0.5 + t) * (ragged ? 1.6 : 1),
          give: ragged ? 0.12 : 0.07,
        });
        d = "";
        n = 0;
        anchorAt = null;
      }
    }
    if (d) clump(parts, anchorAt, d, { amp: 0.06, give: 0.07 });
  }

  // Down at the foot of the vanes: soft locks of fine wisps that fray
  // apart towards their ends.
  function drawDown(parts, side, rand) {
    const broad = side > 0;
    for (let i = 0; i < 5; i++) {
      const u = 15.5 + i * 1.9 + rand() * 0.8;
      const a = ((broad ? 50 + rand() * 30 : 34 + rand() * 26) * Math.PI) / 180;
      const len = (broad ? 8 : 6.5) * (0.7 + rand() * 0.4) * (0.7 + i / 10);
      const bow = (0.04 + rand() * 0.06) * side;
      let d = "";
      for (let k = 0; k < 4; k++) {
        const x0 = u + k * 0.4;
        const y0 = shaftY(x0) + side * shaftW(x0);
        const fray = a + (k - 1.5) * 0.12 + (rand() - 0.5) * 0.1;
        const l = len * (0.6 + rand() * 0.5);
        const point = (b, r) => [x0 + Math.cos(b) * r, y0 + side * Math.sin(b) * r];
        const c = point(fray + bow, l * 0.5);
        const e = point(fray - bow * 0.6, l);
        d += `M${r2(x0)} ${r2(y0)}Q${r2(c[0])} ${r2(c[1])} ${r2(e[0])} ${r2(e[1])}`;
      }
      const root = [u, shaftY(u) + side * shaftW(u)];
      clump(parts, root, d, {
        amp: 0.13,
        give: 0.16,
        attrs: { fill: "none", stroke: INK, "stroke-width": 0.11, "stroke-linecap": "round" },
      });
    }
  }

  // The shaft's two outlines, as a run of thin fills; the shaded side is
  // drawn heavier. Between them the shaft is left as bare paper.
  function drawShaft(body, from, to) {
    for (const side of [1, -1]) {
      const start = Math.max(from, side > 0 ? 10 : 13);
      if (start >= to) continue;
      const weight = (u) => (side > 0 ? 0.09 + 0.2 * ((100 - u) / 100) ** 1.4 : 0.05 + 0.07 * ((100 - u) / 100));
      const out = [];
      const back = [];
      for (let u = start; ; u = Math.min(u + 1, to)) {
        const y = shaftY(u) + side * shaftW(u);
        out.push(`${r2(u)} ${r2(y + weight(u))}`);
        back.unshift(`${r2(u)} ${r2(y - weight(u))}`);
        if (u >= to) break;
      }
      el("path", { d: `M${out.join("L")}L${back.join("L")}Z` }, body);
    }
  }

  // The bare barrel of the quill, and the nib cut from it: the back runs
  // almost straight to the point, a long scoop opens the tube on the near
  // side, and the point is stained with ink and split by a fine slit.
  function drawNib(body) {
    const scoop = [[13, -1.42], [7.5, -0.05], [0.1, -0.03]];
    const far = [[12.6, -1], [7.8, 0.25], [2, 0.1]]; // the other edge of the cut
    const d = [
      cut([10, 1.38], [4.5, 0.95], [0, 0.03], 0.16, 0.15, 0.03),
      cut(...scoop, 0.12, 0.1, 0.02),
      cut(...far, 0.06, 0.05, 0.01),
      // shading along the barrel, as long fine lines
      cut([11, 1], [17, 1.1], [23, 1.22], 0.02, 0.1, 0.01),
      cut([12.5, 0.6], [17.5, 0.68], [22.5, 0.78], 0.02, 0.06, 0.01),
      cut([14.5, -0.9], [18, -0.97], [21.5, -1.04], 0.02, 0.05, 0.01),
    ];
    // The hollow of the tube, hatched darkest where the scoop opens into it.
    for (const k of [0.2, 0.4, 0.6, 0.8]) {
      const blend = scoop.map((p, i) => p.map((v, j) => v + (far[i][j] - v) * k));
      d.push(cut(...part(...blend, 0, 0.62 - k * 0.3), 0.07, 0.06, 0.01));
    }
    el("path", { d: d.join("") }, body);
    // The ink the nib carries, with a ragged edge where it has dried.
    el("path", { d: "M0 0.03L0.1 -0.03Q2 -0.06 4 -0.15Q3.4 0.2 4.3 0.42Q3.7 0.6 4.5 0.8Q2.2 0.6 0 0.03Z" }, body);
    el("path", { d: "M0.35 0.05L4.2 0.33", stroke: "#f6f0e6", "stroke-width": 0.09, "stroke-linecap": "round" }, body);
    el("path", { d: "M4.2 0.33L6.4 0.44", stroke: INK, "stroke-width": 0.07, "stroke-linecap": "round" }, body);
  }

  // How far to the right of the nib the feather reaches, in units of the
  // drawing, leaning back by `lean` degrees.
  function reachOf(lean) {
    const a = (lean * Math.PI) / 180;
    let most = 0;
    for (let u = 50; u <= 100; u += 2) most = Math.max(most, u * Math.cos(a) + edgeY(u, 1) * Math.sin(a));
    return most;
  }

  function drawQuill() {
    const rand = seeded(1817);
    // The box is a single pixel at the nib, so the feather, drawn out past
    // it, never widens the page.
    const svg = el("svg", { class: "press-quill", width: 1, height: 1, "aria-hidden": "true", focusable: "false" });
    const root = el("g", { fill: INK }, svg);
    const parts = { svg, root, bodies: [], joints: [], clumps: [] };
    // Each segment of the shaft holds its own drawing and, after it, the next
    // segment, so that a turn at one joint carries everything above it.
    let segment = root;
    for (let i = 0; i <= JOINTS.length; i++) {
      parts.bodies.push(el("g", {}, segment));
      if (i === JOINTS.length) break;
      segment = el("g", {}, segment);
      parts.joints.push({ g: segment, x: JOINTS[i], y: r2(shaftY(JOINTS[i])), share: SHARE[i] });
    }
    drawVane(parts, -1, rand);
    drawVane(parts, 1, rand);
    drawDown(parts, -1, rand);
    drawDown(parts, 1, rand);
    const ends = [0, ...JOINTS, 100];
    parts.bodies.forEach((body, i) => drawShaft(body, ends[i], Math.min(100, ends[i + 1] + 0.6)));
    drawNib(parts.bodies[0]);
    return parts;
  }

  // ------------------------------------------------------------ the flutter
  //
  // The feather answers to the nib's travel over the paper. Speed stirs its
  // vanes, in a ripple running out towards the tip with a little randomness
  // in every clump, and the air it pushes through bends the shaft back along
  // the stroke. A damped spring carries the bend, so the tip swings through
  // and settles once the pen stops; then everything comes to rest.

  const BEND = 10; // degrees, at full tilt

  // Every visit to a page writes it differently, but within a visit the same
  // marks come back after a change of layout.
  const VISIT = Math.floor(Math.random() * 10007);
  function hash(n) {
    const s = Math.sin((n + VISIT) * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // Smooth random wandering, between -1 and 1.
  function wander(t) {
    const i = Math.floor(t);
    const f = t - i;
    const e = f * f * (3 - 2 * f);
    return (hash(i) * (1 - e) + hash(i + 1) * e) * 2 - 1;
  }

  // Bring every moving part to rest.
  function rest() {
    Object.assign(motion, { vx: 0, vy: 0, energy: 0, gust: 0, bend: 0, spin: 0, press: 0 });
    for (const j of quill.joints) j.g.removeAttribute("transform");
    for (const c of quill.clumps) c.g.removeAttribute("transform");
  }

  // Advance the feather by dt, the nib moving at (vx, vy) over the paper and
  // bearing down by `press`. Returns whether it is still moving.
  function stir(vx, vy, press, lean, dt) {
    const m = motion;
    if (stillness.matches) {
      if (m.energy || m.bend || m.press) rest();
      return false;
    }

    // Smooth the nib's steps into a steady velocity.
    const k = 1 - Math.exp(-dt / 0.08);
    m.vx += (vx - m.vx) * k;
    m.vy += (vy - m.vy) * k;
    m.press += (press - m.press) * (1 - Math.exp(-dt / 0.07));
    const speed = Math.hypot(m.vx, m.vy);
    // Energy comes up quickly with speed and dies away more slowly; now and
    // then a gust catches the feather while it is moving.
    const want = Math.tanh(speed / 900);
    m.energy += (want - m.energy) * (1 - Math.exp(-dt / (want > m.energy ? 0.12 : 0.5)));
    if (speed > 80 && Math.random() < dt * 0.5) m.gust = Math.max(m.gust, 0.3 + Math.random() * 0.5);
    m.gust *= Math.exp(-dt / 0.4);
    const energy = Math.min(1.2, m.energy + m.gust * 0.6);
    m.clock += dt * (1 + 2 * energy);
    m.phase += dt * (7 + 16 * energy);

    // The air pushes back across the shaft against the nib's motion.
    const across = -(m.vx * Math.sin(lean) + m.vy * Math.cos(lean));
    const target = BEND * Math.tanh(across / 1000) + energy * 1.5 * wander(m.clock * 0.9);
    const w = 2 * Math.PI * 2.1;
    const h = Math.min(dt, 0.05);
    m.spin += (w * w * (target - m.bend) - 2 * 0.3 * w * m.spin) * h;
    m.bend += m.spin * h;

    if (energy < 0.004 && Math.abs(m.bend) < 0.02 && Math.abs(m.spin) < 0.05 && speed < 2 && m.press < 0.01) {
      rest();
      return false;
    }
    pose(energy);
    return true;
  }

  function pose(energy) {
    const { clock, phase, bend, press } = motion;
    quill.joints.forEach((j, i) => {
      // Bearing down on a heavy stroke bows the shaft a little.
      const a = bend * j.share + energy * 0.5 * wander(clock * 2.9 - i * 0.5) + press * j.share * 2.4;
      j.g.setAttribute("transform", `rotate(${a.toFixed(3)} ${j.x} ${j.y})`);
    });
    for (const c of quill.clumps) {
      // Each clump tilts about its root, and narrows a touch as it turns out
      // of the plane of the page.
      const ripple = Math.sin(phase - c.u * 0.21 + c.side);
      const gusting = wander(clock * 2.6 - c.u * 0.08 + c.side * 40);
      const a = energy * c.amp * (0.55 * ripple + 0.3 * gusting + 0.15 * wander(clock * 4.1 + c.seed));
      const s = 1 - energy * c.give * (0.5 + 0.35 * wander(clock * 1.9 - c.u * 0.06 + c.side * 20) + 0.15 * gusting);
      const m = [Math.cos(a), Math.sin(a), -Math.sin(a) * s, Math.cos(a) * s];
      const [x, y] = c.at;
      const e = x - m[0] * x - m[2] * y;
      const f = y - m[1] * x - m[3] * y;
      c.g.setAttribute("transform", `matrix(${m.map((v) => v.toFixed(4)).join(" ")} ${e.toFixed(3)} ${f.toFixed(3)})`);
    }
  }

  // -------------------------------------------------------------- the pen

  // Where a point of a sheet is, in document coordinates. The margin moves
  // with the article (and with it as it lifts away); the open page is fixed
  // to the screen and drawn up as the letter goes on.
  function onPage(sh, v) {
    const [x, y] = penAt(sh.track, v);
    if (sh === margin) return [geo.left + x, geo.top + y - geo.slide];
    return [page.left + x, scrollY + y - paper];
  }

  // Move the nib to arc length v of a sheet, leaving the quill where it was
  // to glide over after it; or, `across` only, keeping its height.
  function seat(sh, v, across) {
    const before = onPage(sh, nib.at);
    nib.at = v;
    nib.tau = tauAt(sh.track, v);
    const after = onPage(sh, v);
    nib.off[0] += before[0] - after[0];
    if (!across) nib.off[1] += before[1] - after[1];
    else nib.jolt += after[1] - before[1];
  }

  // Put the nib at (x, y) on the page, raised by `lift`, the quill at `size`
  // and leaning back by `lean` degrees. The box moves in whole device pixels
  // so the drawing stays crisp, and the remainder is taken up inside it so
  // the nib lands exactly on the line. The quill scrolls with the page, so
  // between frames it stays on the paper.
  function placePen(x, y, lift, size, lean) {
    const { dpr } = geo;
    const turn = lean - 0.25 * motion.bend;
    const a = (turn * Math.PI) / 180;
    // Lifted, the nib comes up off the paper towards the hand.
    const sx = x + Math.cos(a) * 6 * size * lift;
    const sy = y - Math.sin(a) * 6 * size * lift;
    const bx = Math.round(sx * dpr) / dpr;
    const by = Math.round(sy * dpr) / dpr;
    pen.style.transform = `translate(${bx}px, ${by}px)`;
    quill.root.setAttribute(
      "transform",
      `translate(${r2(sx - bx)} ${r2(sy - by)}) rotate(${(-turn).toFixed(3)}) ` +
        `scale(${(size * (1 + 0.03 * lift)).toFixed(4)})`,
    );
  }

  // Take the nib on along a sheet towards arc length T, at a hand's pace.
  // Returns whether it is still on its way.
  function advance(sh, T, dt, now) {
    const t = sh.track;
    // Going back, the pen lifts and glides back over the ink; going forward
    // over ink already down, it hovers on to the end of it.
    if (T < nib.at - 0.01 || nib.at < sh.written - 0.01) {
      seat(sh, Math.min(T, sh.written));
      nib.hover = nib.at < sh.written - 0.01;
      nib.landing = true;
      nib.still = 0;
      return true;
    }
    nib.hover = false;
    // Let the hand come down before it writes on.
    if (nib.landing) {
      if (Math.hypot(nib.off[0], nib.off[1]) > 2.5) return true;
      nib.landing = false;
    }
    // Whatever has been carried up off the top of the screen is written at
    // once, out of sight, and the pen held at the top writing on, so it is
    // never dragged away with the paper.
    if (sh === margin && T > nib.at) {
      const band = scrollY - geo.top + innerHeight * 0.12;
      if (penAt(t, nib.at)[1] < band) {
        const v = Math.min(T, t.s[reachedBy(t, band)]);
        if (v > nib.at) {
          write(sh, sh.written, v);
          sh.written = v;
          seat(sh, v, true);
        }
      }
    }
    const goal = tauAt(t, T);
    const lag = goal - nib.tau;
    if (lag <= 1e-4) {
      nib.tempo = 0.3;
      if (!nib.still) nib.still = now;
      return false;
    }
    // A calm pace when close, hurrying when behind; easing in from rest and
    // easing out into the end of a stroke.
    const urgency = 1 + RUSH * rush;
    const want = Math.min(HURRY * urgency, (1 + 1.5 * Math.max(0, lag - 0.4)) * urgency);
    nib.tempo += (want - nib.tempo) * (1 - Math.exp(-dt / (0.25 / urgency)));
    nib.tau = Math.min(goal, nib.tau + Math.min(nib.tempo, 0.2 + lag * 4) * dt);
    let v = arcAt(t, nib.tau);
    // However hurried, a hand only moves so fast.
    if (v - nib.at > SWIFT * urgency * dt) {
      v = nib.at + SWIFT * urgency * dt;
      nib.tau = tauAt(t, v);
    }
    if (v > sh.written) {
      if (nib.still && now - nib.still > 700 && sh.written > 0) blot(sh, sh.written);
      write(sh, sh.written, v);
      sh.written = v;
      if (sh === margin) progress = v / t.total;
    }
    nib.still = 0;
    nib.at = v;
    return true;
  }

  // How high the nib rides over the hop it is on, if any.
  function hopLift() {
    const sh = nib.sheet;
    if (!sh) return 0;
    const t = sh.track;
    const i = search(t.tau, nib.tau);
    const k = i + 1 < t.hop.length ? t.hop[i + 1] : 0;
    if (!k) return 0;
    const h = t.hops[k - 1];
    return h.h * Math.sin(Math.PI * clamp((nib.tau - h.t0) / (h.t1 - h.t0 || 1), 0, 1)) ** 2;
  }

  // Where the pen should write in the margin for the present scroll: at the
  // reader's eye line, carried on down to the foot of the margin over the
  // last screenful.
  function marginTarget(vh) {
    const t = margin.track;
    const max = Math.max(0, document.documentElement.scrollHeight - vh);
    const run = Math.min(max, vh);
    const f = EYE + (1 - EYE) * (run > 0 ? smooth((scrollY - (max - run)) / run) : 1);
    return snap(t, t.s[reachedBy(t, scrollY - geo.top + vh * f)]);
  }

  function update(now) {
    raf = 0;
    if (!margin) return;
    const resumed = now - last > 100;
    const dt = resumed ? 1 / 60 : Math.max(0.001, (now - last) / 1000);
    last = now;
    const vh = innerHeight;
    const still = stillness.matches;
    let busy = false;

    // The faster the reader scrolls, the faster the hand writes: quick to
    // pick up a flick, slow to calm down again.
    const travelled = scrollY + over;
    const speed = resumed ? 0 : Math.abs(travelled - lastScroll) / dt;
    lastScroll = travelled;
    const urge = clamp(speed / RUSH_SPEED, 0, 1);
    rush += (urge - rush) * (1 - Math.exp(-dt / (urge > rush ? 0.08 : 0.7)));
    if (rush < 0.005) rush = 0;
    else busy = true;

    // A touch flung past the end carries on a while.
    if (fling) {
      feed(fling * dt);
      fling *= Math.exp(-dt / 0.35);
      if (Math.abs(fling) < 20) fling = 0;
      busy = true;
    }
    if (shown !== over) {
      shown += (over - shown) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(over - shown) < 0.3) shown = over;
      busy = true;
    }

    // Past the end, the article lifts away while the quill crosses over to
    // the open page, over the first `away` pixels of scrolling.
    const away = 0.75 * vh;
    const e = smooth(shown / away);
    fold(e, vh);
    let base;
    let size = geo.quill;
    let lean = geo.lean;
    let air = 0;
    let course = "margin";
    if (shown <= 0) {
      if (nib.sheet !== margin) {
        nib.sheet = margin;
        nib.at = margin.written;
        nib.tau = tauAt(margin.track, nib.at);
      }
      busy = advance(margin, marginTarget(vh), dt, now) || busy;
      base = onPage(margin, nib.at);
    } else if (shown < away) {
      course = "crossing";
      const t = margin.track;
      if (margin.written < t.total) {
        write(margin, margin.written, t.total);
        margin.written = t.total;
        progress = 1;
      }
      nib.sheet = null;
      nib.hover = false;
      const u = smooth((shown / away - 0.08) / 0.92);
      const from = onPage(margin, t.total);
      const to = [page.left + page.start[0], scrollY + page.start[1] - paper];
      if (still) base = u < 0.5 ? from : to;
      else {
        // Up and over, in a gentle arc.
        const c = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.16 * vh];
        base = [0, 1].map((k) => (1 - u) ** 2 * from[k] + 2 * u * (1 - u) * c[k] + u * u * to[k]);
        air = 1.4 * Math.sin(Math.PI * u);
      }
      size = mix(geo.quill, page.quill, u);
      lean = mix(geo.lean, page.lean, u);
    } else {
      course = "page";
      if (nib.sheet !== page) {
        nib.sheet = page;
        nib.at = nib.tau = 0;
        nib.still = 0;
      }
      // Scrolling further than the hand can keep up with is let go.
      const cap = tauAt(page.track, page.written) + AHEAD * (1 + RUSH * rush);
      if ((over - away) * FEED > cap) {
        over = away + cap / FEED;
        shown = Math.min(shown, over);
      }
      const w = Math.max(0, (shown - away) * FEED);
      grow(w + 6);
      busy = advance(page, snap(page.track, arcAt(page.track, w)), dt, now) || busy;
      size = page.quill;
      lean = page.lean;
    }

    // The open page is drawn up as the letter goes on, so the line being
    // written stays near the middle of the screen.
    const wanted = nib.sheet === page ? reachAt(page.track, nib.at) - PAGE_EYE * vh : 0;
    if (still) paper = wanted;
    else {
      const w = 2 * Math.PI * 0.6;
      paperV += (w * w * (wanted - paper) - 2 * w * paperV) * dt;
      paper += paperV * dt;
      if (Math.abs(wanted - paper) < 0.05 && Math.abs(paperV) < 0.05) {
        paper = wanted;
        paperV = 0;
      } else busy = true;
    }
    if (page) {
      const y = Math.round(paper * geo.dpr) / geo.dpr;
      page.sheet.style.transform = `translate3d(0, ${-y}px, 0)`;
      if (shown > 0) keep(page, paper - 0.3 * vh, paper + 1.2 * vh);
    }
    if (course === "page") base = onPage(page, nib.at);

    // On a change of course the quill glides over from where it was.
    if (course !== mode && nib.shown) {
      nib.off[0] = nib.shown[0] - base[0];
      nib.off[1] = nib.shown[1] - base[1];
    }
    const far = Math.hypot(nib.off[0], nib.off[1]);
    if (far > 0.6 * vh) {
      nib.off[0] *= (0.6 * vh) / far;
      nib.off[1] *= (0.6 * vh) / far;
    }
    if (still) nib.off = [0, 0];
    else {
      const w = 2 * Math.PI * 1.3;
      for (const k of [0, 1]) {
        nib.offV[k] += (-w * w * nib.off[k] - 2 * w * nib.offV[k]) * Math.min(dt, 0.04);
        nib.off[k] += nib.offV[k] * Math.min(dt, 0.04);
      }
      if (Math.hypot(nib.off[0], nib.off[1]) < 0.05 && Math.hypot(nib.offV[0], nib.offV[1]) < 0.5) {
        nib.off = [0, 0];
        nib.offV = [0, 0];
      } else busy = true;
    }
    const shownAt = [base[0] + nib.off[0], base[1] + nib.off[1]];

    // The nib's own travel over the paper, apart from the paper's.
    const paperAt = [geo.slide, paper, scrollY];
    let own = [0, 0];
    if (nib.shown && carried && course === mode) {
      own = [shownAt[0] - nib.shown[0], shownAt[1] - nib.shown[1]];
      if (course === "margin") own[1] += paperAt[0] - carried[0];
      if (course === "page") own[1] += paperAt[1] - carried[1] - (paperAt[2] - carried[2]);
      own[1] -= nib.jolt;
    }
    nib.jolt = 0;
    mode = course;
    nib.shown = shownAt;
    carried = paperAt;

    // The hand trails the nib a little, so the quill pivots as the fingers
    // carry it across a stroke: steeper as the nib runs out from under the
    // hand, flatter as it comes back. Slow travel hardly turns it.
    const k = 1 - Math.exp(-dt / 0.12);
    nib.lag = [0, 1].map((j) => nib.lag[j] + (own[j] / dt - nib.lag[j]) * k);
    const rad = (lean * Math.PI) / 180;
    const across = nib.lag[0] * Math.sin(rad) + nib.lag[1] * Math.cos(rad);
    const tilt = still ? 0 : -3.2 * Math.tanh(across / (260 * size));
    if (Math.hypot(nib.lag[0], nib.lag[1]) > 1) busy = true;

    // The nib rises over the hops between strokes, hovers over ink already
    // written, and is carried high crossing to the open page; it comes down
    // with a little settle.
    const glide = Math.min(1.2, Math.hypot(nib.off[0], nib.off[1]) / 30);
    const lift = Math.max(air, nib.hover ? 1 : 0, glide, nib.sheet ? hopLift() : 0);
    if (still) nib.lift = lift;
    else {
      const w = 2 * Math.PI * 4;
      nib.liftV += (w * w * (lift - nib.lift) - 2 * 0.72 * w * nib.liftV) * Math.min(dt, 0.03);
      nib.lift += nib.liftV * Math.min(dt, 0.03);
      if (Math.abs(lift - nib.lift) < 0.002 && Math.abs(nib.liftV) < 0.01) {
        nib.lift = lift;
        nib.liftV = 0;
      } else busy = true;
    }

    const t = nib.sheet && nib.sheet.track;
    const press = t && !nib.hover && nib.lift < 0.2 ? t.press[search(t.s, nib.at)] : 0;
    const moving = stir(own[0] / dt, own[1] / dt, press, rad, dt);
    placePen(shownAt[0], shownAt[1], Math.max(-0.15, nib.lift), size, lean - tilt);
    if (busy || moving) schedule();
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  // ------------------------------------------------------- past the end

  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const atBottom = () => scrollY >= maxScroll() - 2;

  // The article lifts away as a fresh sheet comes up over it, e running from
  // 0 to 1. The sheet is fading in rather than the article fading out: a
  // long article is costly to fade, and a sheet the size of the screen isn't.
  function fold(e, vh) {
    if (!geo) return;
    const slide = stillness.matches ? 0 : 0.3 * vh * e;
    geo.slide = slide;
    if (e === folded) return;
    if (page && folded <= 0 && e > 0) tint(page);
    folded = e;
    const s = content.style;
    document.documentElement.classList.toggle("press-over", e > 0);
    if (page) {
      page.frame.style.opacity = e.toFixed(3);
      page.frame.style.visibility = e > 0 ? "visible" : "";
    }
    if (e <= 0) {
      s.transform = s.visibility = s.willChange = "";
      return;
    }
    s.willChange = "transform";
    s.transform = slide ? `translate3d(0, ${(-slide).toFixed(2)}px, 0)` : "";
    s.visibility = e >= 1 ? "hidden" : "";
  }

  // Colour the fresh sheet like the paper behind the foot of the article,
  // which shades very slightly down the length of the page.
  function tint(sh) {
    const top = [247, 242, 233];
    const foot = [245, 239, 228];
    const height = document.documentElement.scrollHeight || 1;
    const shade = (y) => top.map((v, i) => Math.round(mix(v, foot[i], clamp(y / height, 0, 1))));
    const a = shade(scrollY);
    const b = shade(scrollY + innerHeight);
    sh.frame.style.background = `linear-gradient(rgb(${a}), rgb(${b}))`;
    // Lines of the letter fade into the paper as they go up the screen.
    sh.veil.style.background = `linear-gradient(rgb(${a}) 10%, rgba(${a}, 0))`;
  }

  // Take d pixels of scrolling: past the end if it is downwards and there is
  // no more page, or winding back what has been scrolled past it.
  function feed(d) {
    if (!margin || !d) return false;
    if (d > 0) {
      if (!over && !atBottom()) return false;
      if (!over) anchor = scrollY;
      over += d;
      unwound = 0;
    } else {
      if (over <= 0) return false;
      // Winding back speeds up the longer it goes on, so a long letter
      // unwinds in a few turns of the wheel.
      const now = performance.now();
      if (now - lastUnwind > 400) unwound = 0;
      lastUnwind = now;
      unwound -= d;
      over = Math.max(0, over + d * (1 + Math.min(14, (unwound / 600) ** 1.5)));
    }
    arm();
    schedule();
    return true;
  }

  // Leave the end of the page for good, all at once.
  function settle() {
    over = shown = fling = 0;
    fold(0, innerHeight);
    arm();
  }

  // Blocking listeners only while they might be needed, so ordinary
  // scrolling is never held up waiting on this script.
  function arm() {
    const want = !!margin && (over > 0 || atBottom());
    if (want === armed) return;
    armed = want;
    removeEventListener("touchmove", onTouchMove);
    addEventListener("touchmove", onTouchMove, { passive: !want });
    if (want) addEventListener("wheel", onWheel, { passive: false });
    else removeEventListener("wheel", onWheel);
  }

  const zoomed = () => window.visualViewport && visualViewport.scale > 1.01;

  function onWheel(e) {
    if (e.ctrlKey || zoomed()) return;
    const d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? innerHeight : 1);
    if (d > 0 ? atBottom() : over > 0) {
      if (e.cancelable) e.preventDefault();
      fling = 0;
      feed(d);
    }
  }

  let touch = null;
  function onTouchStart(e) {
    fling = 0;
    touch = e.touches.length === 1 ? { y: e.touches[0].clientY, taken: false, trail: [] } : null;
  }
  function onTouchMove(e) {
    if (!touch) return;
    if (e.touches.length !== 1 || zoomed()) {
      touch = null;
      return;
    }
    const y = e.touches[0].clientY;
    const d = touch.y - y;
    touch.y = y;
    if (!d || !(d > 0 ? atBottom() : over > 0)) return;
    if (armed && e.cancelable) e.preventDefault();
    feed(d);
    touch.taken = true;
    const now = performance.now();
    touch.trail.push([now, d]);
    while (touch.trail.length && now - touch.trail[0][0] > 100) touch.trail.shift();
  }
  function onTouchEnd() {
    if (touch && touch.taken && touch.trail.length) {
      const span = performance.now() - touch.trail[0][0];
      if (span < 160) {
        const moved = touch.trail.reduce((sum, [, d]) => sum + d, 0);
        fling = clamp((moved / Math.max(span, 16)) * 1000, -4000, 4000);
        if (Math.abs(fling) < 60) fling = 0;
        schedule();
      }
    }
    touch = null;
  }

  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !margin) return;
    const target = e.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
    const screen = innerHeight * 0.85;
    const d = { ArrowDown: 60, ArrowUp: -60, PageDown: screen, PageUp: -screen, " ": e.shiftKey ? -screen : screen }[e.key];
    if (!d || !(d > 0 ? atBottom() : over > 0)) return;
    e.preventDefault();
    fling = 0;
    feed(d);
  }

  function onScroll() {
    // Leaving the end by any other way (the scrollbar, Home) puts the page
    // straight back.
    if (over > 0 && Math.abs(scrollY - anchor) > 2) settle();
    arm();
    schedule();
  }

  // ---------------------------------------------------------------- layout

  function teardown() {
    if (margin) margin.layer.remove();
    if (page) page.frame.remove();
    if (pen) pen.remove();
    if (geo) settle();
    margin = page = geo = null;
    folded = -1;
    mode = "";
    nib.shown = carried = null;
  }

  // What the margin copies out of the page: every section heading, and from
  // each paragraph its shortest whole sentence that the script can write,
  // each with where it sits down the page.
  const PLAIN = { "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u2014": "-", "\u2013": "-", "\u2026": "..." };
  function excerpts(top, y0, y1) {
    if (!hand) return [];
    const notes = [];
    const writable = (v) => [...v].every((c) => c === " " || hand.glyphs[c]);
    for (const el of content.querySelectorAll("h2, h3, p")) {
      if (el.closest(".demo-container, figure, nav, .press-margin, .post-header-meta, #isso-thread")) continue;
      const r = el.getBoundingClientRect();
      const y = r.top - top;
      if (!r.height || y < y0 + 60 || y > y1 - 80) continue;
      const text = el.textContent.replace(/[\u2018\u2019\u201c\u201d\u2014\u2013\u2026]/g, (c) => PLAIN[c]).replace(/\s+/g, " ").trim();
      if (el.tagName !== "P") {
        if (text.length <= 60 && writable(text)) notes.push({ y: y + r.height / 2 - 20, line: text, heading: true });
        continue;
      }
      const pick = (text.match(/[^.!?]+[.!?]+["')]*/g) || [])
        .map((v) => v.trim())
        .filter((v) => v.length >= 20 && v.length <= 90 && /^[A-Z]/.test(v) && writable(v))
        .sort((a, b) => a.length - b.length);
      const best = pick.length ? pick[Math.floor(hash(y * 0.11 + 5.7) ** 2 * pick.length)] : null;
      if (best) notes.push({ y, line: `"${best}"` });
    }
    return notes;
  }

  function build() {
    pending = 0;
    teardown();
    if (!loaded) return;
    const style = getComputedStyle(content);
    if (style.overflowX !== "visible" && style.overflowX !== "") return; // a page that clips its margins
    const fixed = getComputedStyle(sidebar).position === "fixed";

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cRect = content.getBoundingClientRect();
    const textLeft = cRect.left + (parseFloat(style.paddingLeft) || 0);
    const textRight = cRect.right - (parseFloat(style.paddingRight) || 0);
    const view = document.documentElement.clientWidth;
    const gap = fixed ? 12 : 2;
    const width = Math.floor(Math.min(fixed ? 150 : 64, view - textRight - gap - 1));
    if (width < (fixed ? 28 : 22)) return;

    const height = content.offsetHeight;
    const y0 = parseFloat(style.paddingTop) || 0;
    const y1 = height - (parseFloat(style.paddingBottom) || 0);
    const radius = Math.min(9, width * 0.11);
    // An oval beside each heading, if they aren't crowded together.
    const loops = [];
    for (const h of content.querySelectorAll("h1, h2")) {
      const r = h.getBoundingClientRect();
      const y = r.top + r.height / 2 - cRect.top;
      if (r.height && y > y0 + 30 && y < y1 - 30 && (!loops.length || y - loops[loops.length - 1] > 60)) loops.push(y);
    }
    const notes = excerpts(cRect.top, y0, y1);
    // On a desktop the line runs a little nearer the text, to leave the
    // outer side of the gutter for the feather.
    const centre = Math.round(width * (fixed ? 0.42 : 0.5));
    const size = clamp(width / 120, 0.6, 0.8);
    // The quill leans back as far as it can while its feather stays in the
    // window, standing more upright in a narrow margin, as a quill stands in
    // its inkpot.
    const room = width - centre + (fixed ? -2 : 3);
    let lean = 52;
    while (lean < 76 && reachOf(lean) * size > room) lean++;
    // The letters reach 16.5 units either side of the middle of their small
    // letters, and must fit either side of the line down the margin; a
    // narrow gutter on a desktop gets a smaller hand, so it has some air.
    const letters = Math.min(TITLE_SCALE, (Math.min(centre, width - centre) - 1) / 16.5, width / (fixed ? 62 : 36));
    geo = {
      dpr, width, height, y0, y1, loops, notes, radius, letters, slide: 0,
      top: cRect.top + scrollY,
      left: textRight + gap,
      centre,
      amp: Math.min(9, width * 0.09),
      quill: size,
      lean,
      seed: [...location.pathname].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100003, 7) + VISIT,
    };

    const layer = document.createElement("div");
    layer.className = "press-margin";
    layer.setAttribute("aria-hidden", "true");
    Object.assign(layer.style, { left: geo.left - cRect.left + "px", width: width + "px", height: height + "px" });
    content.appendChild(layer);
    margin = sheet(layer, width, height, CHUNK, letters / TITLE_SCALE);
    margin.track = buildMargin();

    // The open page past the end takes the column the article stood in.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const col = fixed ? Math.min(textRight - textLeft, 34 * rem) : view - 2 * Math.max(16, textLeft);
    const left = fixed ? textLeft : Math.max(16, textLeft);
    const scale = clamp(col / 540, 0.82, 1.25);
    const pad = 14;
    // It covers the article and its margin, and holds the letter in a strip
    // the width of the column.
    const frame = document.createElement("div");
    frame.className = "press-letter";
    frame.setAttribute("aria-hidden", "true");
    const from = fixed ? sidebar.getBoundingClientRect().right : 0;
    frame.style.left = from + "px";
    const inner = document.createElement("div");
    Object.assign(inner.style, { left: left - pad - from + "px", width: col + 2 * pad + "px" });
    const veil = document.createElement("div");
    frame.append(inner, veil);
    document.body.appendChild(frame);
    page = sheet(inner, col + 2 * pad, Infinity, LEAF, scale / TITLE_SCALE);
    Object.assign(page, {
      frame, veil, sheet: inner, left: left - pad, track: track(), blocks: [],
      quill: Math.min(1.05, size * 1.3), lean: 50,
      seed: geo.seed + 0.5,
      gen: {
        scale, x0: pad, x1: pad + col, lh: 37 * scale, y: PAGE_EYE * innerHeight, reach: PAGE_EYE * innerHeight,
        count: 0, cycle: 0, queue: shuffled(quotes.filter((q) => !geo.used.has(q)), geo.seed + 0.5),
      },
    });
    grow(6);
    page.start = penAt(page.track, 0);
    paper = paperV = 0;

    // The feather is drawn once, and only put back after a change of layout.
    if (!quill) quill = drawQuill();
    pen = quill.svg;
    document.body.appendChild(pen);
    motion = { vx: 0, vy: 0, phase: 0, clock: Math.random() * 100 };
    rest();

    // Rewrite whatever had already been written before the layout changed.
    // On arrival, the margin above the pen is already written, all but the
    // last stretch, which the quill writes as the page opens.
    const t = margin.track;
    const ready = progress ? 0 : snap(t, t.s[reachedBy(t, scrollY - geo.top + innerHeight * (EYE - HEAD_START))]);
    margin.written = Math.max(progress * t.total, Math.min(ready, marginTarget(innerHeight)));
    write(margin, 0, margin.written);
    Object.assign(nib, {
      sheet: margin, at: margin.written, tau: tauAt(t, margin.written), tempo: 0.3,
      hover: false, landing: false, still: 0, off: [0, 0], offV: [0, 0], lift: 0, liftV: 0, lag: [0, 0], jolt: 0,
    });
    arm();
    schedule();
  }

  // Rebuild after the layout changes, but not when only the height of the
  // window does, as it does while a phone's toolbars come and go.
  let viewWidth = 0;
  function rebuild() {
    clearTimeout(pending);
    pending = setTimeout(build, 150);
  }
  function resized() {
    const w = document.documentElement.clientWidth;
    if (w !== viewWidth || !margin) {
      viewWidth = w;
      rebuild();
    } else schedule();
  }

  const css = document.createElement("style");
  css.textContent = `
    .press-margin { position: absolute; top: 0; z-index: 0; pointer-events: none; }
    .press-margin canvas, .press-letter canvas { position: absolute; left: 0; opacity: 0.86; }
    .press-letter {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 2; overflow: hidden;
      opacity: 0; visibility: hidden; pointer-events: none; will-change: opacity;
    }
    .press-letter > div:first-child { position: absolute; top: 0; will-change: transform; }
    .press-letter > div + div { position: absolute; inset: 0 0 auto; height: 30%; }
    .press-quill {
      position: absolute; left: 0; top: 0; z-index: 3; overflow: visible;
      pointer-events: none; will-change: transform;
    }
    html.press-over { overscroll-behavior-y: none; }
    @media print { .press-margin, .press-letter, .press-quill { display: none; } }
  `;
  document.head.appendChild(css);

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", resized);
  addEventListener("keydown", onKey);
  addEventListener("touchstart", onTouchStart, { passive: true });
  addEventListener("touchend", onTouchEnd, { passive: true });
  addEventListener("touchcancel", onTouchEnd, { passive: true });
  addEventListener("touchmove", onTouchMove, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(rebuild).observe(content);
  // Draw at once when everything has arrived; later changes of layout wait
  // a moment for things to settle.
  Promise.all([document.fonts.ready, assets]).then(() => {
    viewWidth = document.documentElement.clientWidth;
    clearTimeout(pending);
    build();
  });
})();
