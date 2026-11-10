/*
 * Delights
 *
 * The living sky in the sidebar, the night edition, the search palette and
 * the small conveniences on posts. No dependencies; every feature checks for
 * the markup it needs and stays out of the way otherwise.
 */
(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const searchIndexUrl = (doc.currentScript && doc.currentScript.dataset.searchIndex) || "/assets/search.json";
  const placesUrl = (doc.currentScript && doc.currentScript.dataset.places) || "/assets/tz-places.json";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const SVG_NS = "http://www.w3.org/2000/svg";

  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
  const smooth = (t) => t * t * (3 - 2 * t);

  function svg(tag, attrs, parent) {
    const node = doc.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function html(tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isTyping(target) {
    return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  }

  let toastNode;
  let toastTimer;
  function toast(message) {
    if (!toastNode) {
      toastNode = html("div", "toast");
      toastNode.setAttribute("role", "status");
      doc.body.appendChild(toastNode);
    }
    toastNode.textContent = message;
    void toastNode.offsetWidth;
    toastNode.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove("is-shown"), 1800);
  }

  let indexPromise;
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(searchIndexUrl)
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []);
    }
    return indexPromise;
  }


  /* ── Edition (day / night) ───────────────────────────────────────────── */

  const edition = {
    listeners: [],

    get night() {
      return root.dataset.edition === "night";
    },

    apply(night) {
      if (night) root.dataset.edition = "night";
      else delete root.dataset.edition;
      try {
        localStorage.setItem("edition", night ? "night" : "day");
      } catch (error) {
        /* Private mode: the choice simply lasts for this page. */
      }
      this.listeners.forEach((listener) => listener(night));
    },

    // The new edition spreads out in a circle from wherever it was asked for.
    toggle(origin) {
      const night = !this.night;
      if (!doc.startViewTransition || reducedMotion.matches) {
        this.apply(night);
        return;
      }
      const x = origin ? origin.x : innerWidth / 2;
      const y = origin ? origin.y : innerHeight / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("is-switching-edition");
      const transition = doc.startViewTransition(() => this.apply(night));
      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 850, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        .catch(() => {});
      transition.finished.finally(() => root.classList.remove("is-switching-edition"));
    },
  };

  // iOS tints the status bar and the overscroll area from the page's
  // background and theme colour. Keep both on the colour at the very top of
  // the header, which changes with the hour and the edition. These must match
  // .sidebar and .sky-dark in the stylesheets.
  const HEADER = [26, 91, 116]; // #1a5b74, the sidebar's own teal
  const SKY_DARK = [8, 29, 43]; // #081d2b
  const SKY_DARK_STRENGTH = 0.25; // night only deepens the teal a little

  function tintChrome(night) {
    const veil = night * SKY_DARK_STRENGTH;
    const colour = `rgb(${HEADER.map((v, i) => Math.round(v + (SKY_DARK[i] - v) * veil)).join(", ")})`;
    doc.body.style.backgroundColor = colour;
    doc.querySelectorAll('meta[name="theme-color"]').forEach((meta) => (meta.content = colour));
  }


  /* ── The sky ─────────────────────────────────────────────────────────── */

  function hashString(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Smooth 1-D value noise with a few octaves, 0..1.
  function makeNoise(random) {
    const values = Array.from({ length: 256 }, random);
    const at = (t) => {
      const i = Math.floor(t);
      const f = smooth(t - i);
      return values[i & 255] * (1 - f) + values[(i + 1) & 255] * f;
    };
    return (t, octaves) => {
      let sum = 0;
      let weight = 1;
      let total = 0;
      for (let o = 0; o < octaves; o++) {
        sum += at(t * (1 << o) + o * 17.3) * weight;
        total += weight;
        weight *= 0.5;
      }
      return sum / total;
    };
  }

  /* Where the visitor probably is, without asking: their time zone names a
   * city, and tz-places.json (built from the tz database's zone.tab) gives
   * that city's coordinates. Until the table arrives, or for a zone it does
   * not know, the clock alone gives a rough answer. */
  function placeFromClock() {
    const year = new Date().getFullYear();
    const january = new Date(year, 0, 1).getTimezoneOffset();
    const july = new Date(year, 6, 1).getTimezoneOffset();
    // Standard time is the larger offset; daylight saving in July means north.
    return { lat: july > january ? -38 : 38, lon: clamp(-Math.max(january, july) / 4, -180, 180) };
  }

  function timeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (error) {
      return "";
    }
  }

  function rememberedPlace(zone) {
    try {
      const saved = JSON.parse(localStorage.getItem("sky-place") || "null");
      if (saved && saved.zone === zone && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) return saved;
    } catch (error) {
      /* No storage: look it up again. */
    }
    return null;
  }

  function lookUpPlace(zone) {
    if (!zone || !placesUrl) return Promise.resolve(null);
    return fetch(placesUrl)
      .then((response) => (response.ok ? response.json() : {}))
      .then((places) => {
        if (!places[zone]) return null;
        const place = { zone, lat: places[zone][0], lon: places[zone][1] };
        try {
          localStorage.setItem("sky-place", JSON.stringify(place));
        } catch (error) {
          /* Fine: it is looked up again next time. */
        }
        return place;
      })
      .catch(() => null);
  }

  /* Low-precision positions of the sun and moon (the standard series, good
   * to a fraction of a degree), as seen from a place on Earth. Angles are in
   * radians unless a name says otherwise. */
  const RAD = Math.PI / 180;
  const OBLIQUITY = RAD * 23.4397;
  const SUN_DISTANCE = 149598000; // km

  const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
  const wrapAngle = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

  function sunCoords(d) {
    const anomaly = RAD * (357.5291 + 0.98560028 * d);
    const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
    const longitude = anomaly + centre + RAD * 102.9372 + Math.PI;
    return { ra: rightAscension(longitude, 0), dec: declination(longitude, 0) };
  }

  function moonCoords(d) {
    const meanLongitude = RAD * (218.316 + 13.176396 * d);
    const anomaly = RAD * (134.963 + 13.064993 * d);
    const meanDistance = RAD * (93.272 + 13.22935 * d);
    const longitude = meanLongitude + RAD * 6.289 * Math.sin(anomaly);
    const latitude = RAD * 5.128 * Math.sin(meanDistance);
    return { ra: rightAscension(longitude, latitude), dec: declination(longitude, latitude), distance: 385001 - 20905 * Math.cos(anomaly) };
  }

  function observeSky(date, place) {
    const d = date.getTime() / 864e5 - 0.5 + 2440588 - 2451545; // days since J2000
    const phi = place.lat * RAD;
    const siderealTime = RAD * (280.16 + 360.9856235 * d) + place.lon * RAD;
    const sun = sunCoords(d);
    const moon = moonCoords(d);

    // hourAngle runs from -setAngle at rising, through 0 due south (or north), to +setAngle at setting.
    const seen = (body, horizonDegrees) => {
      const hourAngle = wrapAngle(siderealTime - body.ra);
      const altitude = Math.asin(Math.sin(phi) * Math.sin(body.dec) + Math.cos(phi) * Math.cos(body.dec) * Math.cos(hourAngle));
      const cosSet = (Math.sin(horizonDegrees * RAD) - Math.sin(phi) * Math.sin(body.dec)) / (Math.cos(phi) * Math.cos(body.dec));
      return { hourAngle, altitude: altitude / RAD, setAngle: Math.acos(clamp(cosSet, -1, 1)) };
    };
    const seenMoon = seen(moon, 0.125);

    const separation = Math.acos(Math.sin(sun.dec) * Math.sin(moon.dec) + Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra));
    const incidence = Math.atan2(SUN_DISTANCE * Math.sin(separation), moon.distance - SUN_DISTANCE * Math.cos(separation));
    // Which way the bright limb points: first against celestial north, then against straight up.
    const limb = Math.atan2(Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra), Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra));
    const parallactic = Math.atan2(Math.sin(seenMoon.hourAngle), Math.tan(phi) * Math.cos(moon.dec) - Math.sin(moon.dec) * Math.cos(seenMoon.hourAngle));

    return {
      sun: seen(sun, -0.833),
      moon: seenMoon,
      lit: (1 + Math.cos(incidence)) / 2,
      phase: 0.5 + (0.5 * incidence * (limb < 0 ? -1 : 1)) / Math.PI, // 0 new, 0.5 full
      limbFromUp: limb - parallactic,
    };
  }

  function moonName(phase) {
    const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
    return names[Math.round(phase * 8) % 8];
  }

  // The lit part of a moon of radius r, drawn with its bright limb to the right.
  function moonLitPath(lit, r) {
    const rx = Math.abs(1 - 2 * lit) * r;
    return `M0,${-r}A${r},${r} 0 0 1 0,${r}A${rx.toFixed(2)},${r} 0 0 ${lit > 0.5 ? 1 : 0} 0,${-r}Z`;
  }

  function initSky() {
    const host = doc.getElementById("sky");
    if (!host) return;
    const sidebar = host.parentElement;
    const about = sidebar.querySelector(".sidebar-about");
    const post = doc.querySelector(".content > .post[data-reading-minutes]");
    const seed = hashString(location.pathname.replace(/index\.html$/, ""));

    // ?sky=21.5 previews the sky at a given hour.
    const forcedHour = parseFloat(new URLSearchParams(location.search).get("sky"));

    // The sun or moon doubles as the switch between editions. It sits beside
    // the sky, not inside it, so that it stays above the sidebar's text.
    const orb = html("button", "sky-orb");
    orb.type = "button";
    orb.hidden = true;
    sidebar.appendChild(orb);

    // ?place=40,-105 previews the sky from somewhere else.
    const forcedPlace = (new URLSearchParams(location.search).get("place") || "").split(",").map(Number);
    const zone = timeZone();
    let place = forcedPlace.length === 2 && forcedPlace.every(Number.isFinite) ? { lat: forcedPlace[0], lon: forcedPlace[1] } : rememberedPlace(zone);
    if (!place) {
      place = placeFromClock();
      lookUpPlace(zone).then((found) => {
        if (!found) return;
        place = found;
        renderSky(true);
      });
    }

    let scene = null;
    let progress = 0;
    let summited = false;

    function now() {
      const date = new Date();
      if (!Number.isNaN(forcedHour)) date.setHours(Math.floor(forcedHour), Math.round((forcedHour % 1) * 60), 0, 0);
      return date;
    }

    function build() {
      const width = sidebar.clientWidth;
      const height = sidebar.clientHeight;
      if (!width || !height) return;
      const compact = getComputedStyle(sidebar).position !== "fixed";
      const random = mulberry32(seed);
      const pad = 28;

      if (scene) scene.svg.remove();
      const el = svg("svg", { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false" });
      host.appendChild(el);
      host.style.setProperty("--sky-w", width);

      const textTop = about ? about.getBoundingClientRect().top - sidebar.getBoundingClientRect().top : height * 0.6;
      const horizon = compact ? height * 0.74 : clamp(textTop - 18, height * 0.36, height * 0.7);
      const skyTop = compact ? 26 : Math.max(46, height * 0.1);

      const defs = svg("defs", {}, el);
      const haze = svg("linearGradient", { id: "sky-haze", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg("stop", { offset: "0.2", "stop-color": "#fff", "stop-opacity": 0 }, haze);
      svg("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": 0.1 }, haze);
      const glow = svg("linearGradient", { id: "sky-glow", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg("stop", { offset: "0", "stop-color": "#d98a78", "stop-opacity": 0 }, glow);
      svg("stop", { offset: "0.6", "stop-color": "#e8926e", "stop-opacity": 0.5 }, glow);
      svg("stop", { offset: "1", "stop-color": "#f9bf85", "stop-opacity": 0.96 }, glow);
      for (const [id, colour, strength] of [["sky-sun-glow", "#fde9b6", 0.5], ["sky-moon-glow", "#dfeaf2", 0.3]]) {
        const radial = svg("radialGradient", { id }, defs);
        svg("stop", { offset: "0.25", "stop-color": colour, "stop-opacity": strength }, radial);
        svg("stop", { offset: "1", "stop-color": colour, "stop-opacity": 0 }, radial);
      }

      svg("rect", { class: "sky-dark", width, height }, el);
      svg("rect", { class: "sky-haze", width, height: horizon + 20, fill: "url(#sky-haze)" }, el);
      const glowHeight = Math.min(horizon, height * 0.42);
      svg("rect", { class: "sky-glow", y: horizon + 20 - glowHeight, width, height: glowHeight, fill: "url(#sky-glow)" }, el);

      // Stars
      const starCount = clamp(Math.round((width * horizon) / 3200), 10, 80);
      for (let i = 0; i < starCount; i++) {
        const star = svg("circle", { class: "sky-star", cx: (random() * width).toFixed(1), cy: (random() * horizon).toFixed(1), r: (0.45 + random() * random() * 1.1).toFixed(2) }, el);
        star.style.setProperty("--o", (0.35 + random() * 0.65).toFixed(2));
        if (random() < 0.35) {
          star.classList.add("is-twinkling");
          star.style.setProperty("--dur", `${(3 + random() * 4).toFixed(1)}s`);
          star.style.setProperty("--delay", `${(-random() * 6).toFixed(1)}s`);
        }
      }

      // Clouds
      const cloudCount = compact ? 1 : 3;
      for (let i = 0; i < cloudCount; i++) {
        const cloud = svg("g", { class: "sky-cloud" }, el);
        const y = skyTop + random() * (horizon - skyTop) * 0.55;
        const size = 0.7 + random() * 0.6;
        for (const [dx, dy, rx, ry] of [[0, 0, 34, 9], [-16, -6, 18, 8], [12, -8, 22, 10], [34, -2, 16, 6]]) {
          svg("ellipse", { cx: dx * size, cy: y + dy * size, rx: rx * size, ry: ry * size }, cloud);
        }
        const duration = 150 + random() * 110;
        cloud.style.setProperty("--dur", `${duration.toFixed(0)}s`);
        cloud.style.setProperty("--delay", `${(-random() * duration).toFixed(0)}s`);
      }

      // Sun and moon
      const sun = svg("g", { class: "sky-sun" }, el);
      const sunScale = svg("g", { class: "sky-orb-scale" }, sun);
      svg("circle", { r: compact ? 30 : 42, fill: "url(#sky-sun-glow)" }, sunScale);
      svg("circle", { class: "sky-sun-disc", r: compact ? 9 : 12 }, sunScale);

      const moon = svg("g", { class: "sky-moon" }, el);
      const moonScale = svg("g", { class: "sky-orb-scale" }, moon);
      const moonRadius = compact ? 9 : 11.5;
      svg("circle", { r: moonRadius * 3.2, fill: "url(#sky-moon-glow)" }, moonScale);
      svg("circle", { class: "sky-moon-shadow", r: moonRadius - 0.5 }, moonScale);
      const moonLit = svg("path", { class: "sky-moon-lit" }, moonScale);

      // The Flatirons, as they stand over Boulder from Chautauqua: Bear Peak
      // off to the south, Green Mountain behind, the five tilted slabs on its
      // flank (each rising from the south to a summit at its north end), then
      // the pines and the meadow. The rock is the same on every page; the
      // page's own seed only moves the trees, stars and clouds.
      const amp = compact ? height * 0.3 : Math.min(height * 0.2, 190);
      const land = mulberry32(1877);
      const landNoise = makeNoise(land);
      const X = (u) => u * width;
      const Y = (v) => horizon - v * amp;
      const layer = (depth) => {
        const group = svg("g", { class: "ridge-layer" }, el);
        group.style.setProperty("--depth", depth);
        return group;
      };
      const trace = (points) => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
      // A ridge across the whole sidebar, from a height function of 0..1 across.
      const ridge = (heightAt) => {
        const points = [];
        for (let x = -pad; x <= width + pad + 5; x += 5) points.push([x, Y(heightAt(x / width))]);
        return points;
      };
      const ground = (points) => `M${-pad},${height}L` + trace(points).slice(1) + `L${width + pad},${height}Z`;
      const pines = (points, count, rand) => {
        let d = "";
        for (let i = 0; i < count; i++) {
          const x = rand() * (width + pad);
          const y = crestAt(points, x);
          const h = (compact ? 5 : 7) + rand() * (compact ? 5 : 9);
          const w = h * 0.46;
          d += `M${x.toFixed(1)},${(y - h).toFixed(1)}l${w.toFixed(1)},${(h + 3).toFixed(1)}l${(-2 * w).toFixed(1)},0Z`;
        }
        return d;
      };
      const cone = (u, centre, top, spread) => Math.max(0, top * (1 - Math.abs(u - centre) / spread));

      const bearPeak = ridge((u) => Math.max(cone(u, 0.13, 1.2, 0.2), cone(u, -0.04, 1.1, 0.24), 0.52 - 0.12 * u) + 0.05 * landNoise(u * 9, 3));
      svg("path", { class: "ridge-0", d: ground(bearPeak) }, layer(1));

      const greenMountain = ridge((u) => 1.14 * Math.exp(-Math.pow((u - 0.57) / 0.44, 2)) + 0.035 * landNoise(u * 14 + 3, 3));
      const mountain = layer(2);
      svg("path", { class: "ridge-1", d: ground(greenMountain) }, mountain);

      // North to south (right to left): First, Second, Third, Fourth, Fifth,
      // drawn in that order so each slab's shaded north edge shows against
      // its neighbour. [left, right, where the summit falls between them, height]
      const flatirons = [
        [0.6, 1.08, 0.74, 0.8],
        [0.5, 0.76, 0.7, 0.55],
        [0.27, 0.64, 0.62, 0.74],
        [0.13, 0.42, 0.68, 0.5],
        [-0.04, 0.24, 0.7, 0.4],
      ];
      let third = null;
      flatirons.forEach(([left, right, summitAt, top], index) => {
        const span = right - left;
        const summit = left + span * summitAt;
        // The long south skyline, chipped and broken, up to the summit...
        const south = [];
        for (let i = 0; i <= 9; i++) {
          const t = i / 9;
          const chip = i > 0 && i < 9 ? (land() - 0.5) * 0.07 : 0;
          south.push([X(left + (summit - left) * t), Y(top * (0.06 + 0.94 * Math.pow(t, 0.9) + chip))]);
        }
        // ...and the short, steep north edge back down.
        const north = [
          [X(summit + span * 0.035), Y(top * 0.93)],
          [X(summit + span * 0.07), Y(top * 0.74)],
          [X(summit + (right - summit) * 0.6), Y(top * 0.4)],
          [X(right), Y(top * 0.08)],
        ];
        const foot = [[X(right), Y(-0.4)], [X(left), Y(-0.4)]];
        svg("path", { class: "flatiron", d: trace(south.concat(north, foot)) + "Z" }, mountain);
        const apex = south[south.length - 1];
        const shade = [apex].concat(north, [[X(right - span * 0.1), Y(top * 0.04)], [X(summit - span * 0.03), Y(top * 0.7)]]);
        svg("path", { class: "flatiron-shade", d: trace(shade) + "Z" }, mountain);
        // Fissures run up the face, parallel to the south skyline.
        let cracks = "";
        for (const inset of [0.3, 0.55]) {
          const from = [X(left + span * (0.18 + inset * 0.5)), Y(top * 0.04)];
          const to = [X(summit - span * (0.05 + inset * 0.12)), Y(top * (0.86 - inset * 0.5))];
          cracks += trace([from, to]);
        }
        svg("path", { class: "flatiron-crack", d: cracks }, mountain);
        if (index === 2) third = south;
      });

      const forest = ridge((u) => 0.12 + 0.2 * landNoise(u * 2.6 + 5, 3));
      svg("path", { class: "ridge-2", d: ground(forest) + pines(forest, Math.round(width / 13), random) }, layer(3));

      const meadow = ridge((u) => -0.5 + 0.22 * landNoise(u * 1.4 + 9, 2));
      svg("path", { class: "ridge-3", d: ground(meadow) + pines(meadow, Math.round(width / 26), random) }, layer(4));

      scene = { svg: el, width, height, compact, horizon, skyTop, sun, moon, moonLit, moonRadius, trail: null };

      // The trail leaves through the pines and climbs the Third Flatiron.
      if (post && !compact) {
        const [startX] = third[0];
        const [summitX] = third[third.length - 1];
        const route = [];
        for (let x = 10; x < summitX; x += 3) {
          route.push([x, Math.min(crestAt(forest, x), x >= startX ? crestAt(third, x) : Infinity) - 2.5]);
        }
        route.push([summitX, third[third.length - 1][1] - 2.5]);
        buildTrail(route);
      }
      renderSky(false);
      renderProgress();
    }

    function crestAt(points, x) {
      for (let i = 1; i < points.length; i++) {
        if (points[i][0] >= x) {
          const [x0, y0] = points[i - 1];
          const [x1, y1] = points[i];
          return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
        }
      }
      return points[points.length - 1][1];
    }

    function buildTrail(route) {
      const { width, svg: el } = scene;
      const d = route.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

      const group = svg("g", { class: "trail" }, el);
      const mask = svg("mask", { id: "trail-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width, height: scene.height }, group);
      const reveal = svg("path", { d, fill: "none", stroke: "#fff", "stroke-width": 10 }, mask);
      svg("path", { class: "trail-route", d }, group);
      svg("path", { class: "trail-walked", d, mask: "url(#trail-mask)" }, group);

      const [sx, sy] = route[route.length - 1];
      const flag = svg("g", { class: "trail-flag", transform: `translate(${sx.toFixed(1)},${sy.toFixed(1)})` }, group);
      svg("circle", { class: "trail-flag-ring", r: 6, cy: -12 }, flag);
      svg("line", { class: "trail-flag-pole", y1: 1, y2: -17 }, flag);
      svg("path", { class: "trail-flag-pennant", d: "M0.6,-17L12,-13.2L0.6,-9.4Z" }, flag);

      const marker = svg("g", { class: "trail-marker" }, group);
      svg("circle", { class: "trail-marker-halo", r: 7 }, marker);
      svg("circle", { class: "trail-marker-dot", r: 2.8 }, marker);

      const length = reveal.getTotalLength();
      reveal.setAttribute("stroke-dasharray", length);
      scene.trail = { reveal, marker, flag, length };
    }

    function renderSky(animate) {
      if (!scene) return;
      const { width, compact, horizon, skyTop, sun, moon, moonLit, moonRadius } = scene;
      const date = now();
      const sky = observeSky(date, place);

      // Dusk runs from the sun touching the horizon to about ten degrees under it.
      const night = edition.night ? 1 : smooth(clamp((1 - sky.sun.altitude) / 11, 0, 1));
      const twilight = edition.night ? 0 : clamp(1 - Math.abs(sky.sun.altitude + 1) / 9, 0, 1);
      host.classList.toggle("is-live", Boolean(animate));
      host.style.setProperty("--night", night.toFixed(3));
      host.style.setProperty("--twilight", twilight.toFixed(3));
      doc.body.classList.toggle("is-sky-live", Boolean(animate));
      tintChrome(night);

      // Each body crosses the sidebar as it crosses the real sky: left to
      // right in the north, right to left in the south, and as high as it
      // really stands (so the winter sun keeps low).
      const direction = place.lat < 0 ? -1 : 1;
      const highest = (tilt) => Math.sin(Math.min(90, 90 - Math.abs(place.lat) + tilt) * RAD);
      const spot = (body, tilt) => {
        const across = clamp(body.hourAngle / Math.max(body.setAngle, 0.3), -1.2, 1.2);
        const lift = Math.pow(clamp(Math.sin(body.altitude * RAD) / highest(tilt), 0, 1), 0.6);
        return { x: width * (0.5 + direction * 0.37 * across), y: horizon - lift * (horizon - skyTop) };
      };
      const sunSpot = spot(sky.sun, 23.44);
      const moonSpot = spot(sky.moon, 28.6);
      const sunShown = sky.sun.altitude > -1.5 && !edition.night;
      let moonShown = sky.moon.altitude > 0;
      if (compact) {
        // No room for an arc in the phone header: whichever is up keeps to the corner.
        sunSpot.x = moonSpot.x = width - 40;
        sunSpot.y = moonSpot.y = 38;
        moonShown = moonShown && !sunShown;
      }
      const sunk = horizon + 70; // behind the ridges
      sun.style.setProperty("--x", `${sunSpot.x.toFixed(1)}px`);
      sun.style.setProperty("--y", `${(sunShown ? sunSpot.y : sunk).toFixed(1)}px`);
      moon.style.setProperty("--x", `${moonSpot.x.toFixed(1)}px`);
      moon.style.setProperty("--y", `${(moonShown ? moonSpot.y : sunk).toFixed(1)}px`);

      moonLit.setAttribute("d", moonLitPath(sky.lit, moonRadius));
      moonLit.setAttribute("transform", `rotate(${(-sky.limbFromUp / RAD - 90).toFixed(1)})`);

      const shown = sunShown ? sunSpot : moonShown ? moonSpot : null;
      orb.hidden = !shown;
      if (shown) {
        orb.style.left = `${shown.x}px`;
        orb.style.top = `${shown.y}px`;
        const label = edition.night ? "Back to the day edition" : "Switch to the night edition";
        orb.setAttribute("aria-label", label);
        orb.title = sunShown ? label : `${moonName(sky.phase)}, ${Math.round(sky.lit * 100)}% lit · ${label.toLowerCase()}`;
      }
      scene.night = night;
    }

    function renderProgress() {
      if (!scene || !scene.trail) return;
      const { reveal, marker, flag, length } = scene.trail;
      reveal.setAttribute("stroke-dashoffset", (length * (1 - progress)).toFixed(1));
      const point = reveal.getPointAtLength(length * progress);
      marker.setAttribute("transform", `translate(${point.x.toFixed(1)},${point.y.toFixed(1)})`);
      flag.classList.toggle("is-up", summited);
    }

    // Reading progress drives the trail (and a thin bar on narrow screens).
    if (post) {
      const bar = html("div", "read-bar");
      bar.setAttribute("aria-hidden", "true");
      doc.body.appendChild(bar);
      let queued = false;
      const measure = () => {
        queued = false;
        const rect = post.getBoundingClientRect();
        const distance = rect.height - innerHeight * 0.85;
        progress = distance <= 0 ? 1 : clamp(-rect.top / distance, 0, 1);
        summited = progress > 0.995;
        bar.style.setProperty("--read", progress.toFixed(4));
        renderProgress();
      };
      const queue = () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(measure);
        }
      };
      addEventListener("scroll", queue, { passive: true });
      addEventListener("resize", queue, { passive: true });
      addEventListener("load", queue);
      measure();
    }

    orb.addEventListener("click", () => {
      const rect = orb.getBoundingClientRect();
      edition.toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
    edition.listeners.push(() => renderSky(true));

    // Layers slide against each other as the pointer crosses the page.
    if (matchMedia("(hover: hover)").matches && !reducedMotion.matches) {
      let pending = false;
      let pointerX = 0;
      addEventListener(
        "pointermove",
        (event) => {
          pointerX = event.clientX;
          if (pending) return;
          pending = true;
          requestAnimationFrame(() => {
            pending = false;
            host.style.setProperty("--drift", ((pointerX / innerWidth - 0.5) * -3).toFixed(3));
          });
        },
        { passive: true }
      );
    }

    function shootingStar() {
      const wait = 6000 + Math.random() * 12000;
      setTimeout(() => {
        if (scene && scene.night > 0.7 && !doc.hidden && !reducedMotion.matches) {
          const x = scene.width * (0.35 + Math.random() * 0.6);
          const y = scene.skyTop * 0.4 + Math.random() * (scene.horizon - scene.skyTop) * 0.5;
          const streak = svg("line", { x1: 0, y1: 0, x2: 30, y2: -12, stroke: "#fff", "stroke-width": 1.1, "stroke-linecap": "round", opacity: 0 });
          scene.svg.insertBefore(streak, scene.sun);
          streak
            .animate(
              [
                { transform: `translate(${x}px, ${y}px)`, opacity: 0 },
                { opacity: 0.9, offset: 0.2 },
                { transform: `translate(${x - 110}px, ${y + 44}px)`, opacity: 0 },
              ],
              { duration: 850, easing: "ease-out" }
            )
            .finished.then(() => streak.remove(), () => streak.remove());
        }
        shootingStar();
      }, wait);
    }

    build();
    shootingStar();
    setInterval(() => renderSky(true), 60000);

    let resizeTimer;
    let lastSize = `${sidebar.clientWidth}x${sidebar.clientHeight}`;
    new ResizeObserver(() => {
      const size = `${sidebar.clientWidth}x${sidebar.clientHeight}`;
      if (size === lastSize) return;
      lastSize = size;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 120);
    }).observe(sidebar);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
  }


  /* ── Search palette ──────────────────────────────────────────────────── */

  function matchToken(token, text) {
    const haystack = text.toLowerCase();
    const at = haystack.indexOf(token);
    if (at >= 0) {
      const wordStart = at === 0 || /[^a-z0-9]/.test(haystack[at - 1]);
      return { score: 10 + (wordStart ? 6 : 0) + token.length, ranges: [[at, at + token.length]] };
    }
    if (token.length < 3) return null;
    // Fall back to letters in order, favouring runs and word starts.
    let cursor = 0;
    let score = 0;
    let previous = -2;
    const ranges = [];
    for (const letter of token) {
      const found = haystack.indexOf(letter, cursor);
      if (found < 0) return null;
      score += (found === previous + 1 ? 2 : 0) + (found === 0 || /[^a-z0-9]/.test(haystack[found - 1]) ? 2 : 0) - (found - cursor) * 0.25;
      ranges.push([found, found + 1]);
      previous = found;
      cursor = found + 1;
    }
    return score > 0 ? { score: score * 0.5, ranges } : null;
  }

  function searchEntries(entries, query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = [];
    for (const entry of entries) {
      let total = 0;
      let ranges = [];
      let matched = true;
      for (const token of tokens) {
        const inTitle = matchToken(token, entry.t);
        const inTags = (entry.g || []).some((tag) => tag.toLowerCase().includes(token));
        const inSummary = entry.s && entry.s.toLowerCase().includes(token);
        if (!inTitle && !inTags && !inSummary) {
          matched = false;
          break;
        }
        if (inTitle) {
          total += inTitle.score * 3;
          ranges = ranges.concat(inTitle.ranges);
        }
        if (inTags) total += 12;
        if (inSummary) total += 5;
      }
      if (matched) results.push({ entry, score: total, ranges });
    }
    return results.sort((a, b) => b.score - a.score);
  }

  function highlight(text, ranges) {
    const fragment = doc.createDocumentFragment();
    const marks = new Array(text.length).fill(false);
    ranges.forEach(([from, to]) => {
      for (let i = from; i < to; i++) marks[i] = true;
    });
    let i = 0;
    while (i < text.length) {
      let j = i;
      while (j < text.length && marks[j] === marks[i]) j++;
      const slice = text.slice(i, j);
      fragment.appendChild(marks[i] ? html("mark", "", slice) : doc.createTextNode(slice));
      i = j;
    }
    return fragment;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.split("-").map(Number);
    return `${day} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[month - 1]} ${year}`;
  }

  function initPalette() {
    const opener = doc.getElementById("open-search");
    if (typeof HTMLDialogElement === "undefined") return;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

    let dialog, input, list;
    let index = [];
    let rows = [];
    let selected = 0;

    const commands = () => [
      { t: edition.night ? "Switch to the day edition" : "Switch to the night edition", s: "theme dark light mode", hint: "Edition", run: () => edition.toggle() },
      {
        t: "Open a random post",
        s: "surprise me shuffle",
        hint: "Surprise",
        run: () => {
          const posts = index.filter((entry) => entry.k === "posts" && entry.u !== location.pathname);
          if (posts.length) location.href = posts[Math.floor(Math.random() * posts.length)].u;
        },
      },
      { t: "Browse by tag", s: "tags topics", hint: "Page", u: "/tags/" },
      { t: "About", s: "links contact", hint: "Page", u: "/about/" },
      { t: "Colophon", s: "how this site is made", hint: "Page", u: "/colophon/" },
      { t: "RSS feed", s: "subscribe atom", hint: "Feed", u: "/feed.rss" },
      { t: "Let it snow", s: "send it ski winter", hint: "❄", secret: true, run: letItSnow },
    ];

    function create() {
      dialog = html("dialog", "palette");
      dialog.setAttribute("aria-label", "Search this site");
      const card = html("div", "palette-card");
      input = html("input", "palette-input");
      input.type = "text";
      input.placeholder = "Search posts, tags, and commands…";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-controls", "palette-list");
      input.setAttribute("aria-label", "Search");
      list = html("ul", "palette-list");
      list.id = "palette-list";
      list.setAttribute("role", "listbox");
      const foot = html("div", "palette-foot");
      for (const [keys, label] of [["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]]) {
        const hint = html("span");
        hint.append(html("kbd", "", keys), ` ${label}`);
        foot.appendChild(hint);
      }
      card.append(input, list, foot);
      dialog.appendChild(card);
      doc.body.appendChild(dialog);

      input.addEventListener("input", () => render());
      input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          select(selected + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Enter") {
          event.preventDefault();
          activate(rows[selected], event.metaKey || event.ctrlKey);
        }
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      list.addEventListener("click", (event) => {
        const item = event.target.closest(".palette-item");
        if (item) activate(rows[Number(item.dataset.row)], event.metaKey || event.ctrlKey);
      });
      list.addEventListener("pointermove", (event) => {
        const item = event.target.closest(".palette-item");
        if (item && Number(item.dataset.row) !== selected) select(Number(item.dataset.row), false);
      });
    }

    function select(next, scroll = true) {
      if (!rows.length) return;
      selected = (next + rows.length) % rows.length;
      list.querySelectorAll(".palette-item").forEach((item) => {
        const active = Number(item.dataset.row) === selected;
        item.setAttribute("aria-selected", active);
        if (active) {
          input.setAttribute("aria-activedescendant", item.id);
          if (scroll) item.scrollIntoView({ block: "nearest" });
        }
      });
    }

    function activate(row, newTab) {
      if (!row) return;
      dialog.close();
      if (row.entry.run) row.entry.run();
      else if (newTab) open(row.entry.u, "_blank", "noopener");
      else location.href = row.entry.u;
    }

    function addRow(row) {
      const item = html("li", "palette-item");
      item.id = `palette-row-${rows.length}`;
      item.dataset.row = rows.length;
      item.setAttribute("role", "option");
      const title = html("span", "palette-title");
      title.appendChild(highlight(row.entry.t, row.ranges || []));
      const meta = html("span", "palette-meta", row.entry.hint || formatDate(row.entry.d));
      const tags = (row.entry.g || []).slice(0, 2).join(", ").replace(/-/g, " ");
      if (tags) meta.appendChild(html("span", "palette-tags", ` · ${tags}`));
      item.append(title, meta);
      list.appendChild(item);
      rows.push(row);
    }

    function render() {
      const query = input.value.trim();
      list.textContent = "";
      rows = [];
      if (!query) {
        list.appendChild(html("li", "palette-heading", "Commands"));
        commands().filter((command) => !command.secret).slice(0, 3).forEach((entry) => addRow({ entry }));
        if (index.length) {
          list.appendChild(html("li", "palette-heading", "Latest"));
          index.filter((entry) => entry.k === "posts").slice(0, 5).forEach((entry) => addRow({ entry }));
        }
      } else {
        const found = searchEntries(commands(), query).slice(0, 3).concat(searchEntries(index, query).slice(0, 8));
        found.sort((a, b) => b.score - a.score).forEach(addRow);
        if (!found.length) list.appendChild(html("li", "palette-empty", "Nothing by that name. The trail fades…"));
      }
      list.querySelectorAll(".palette-heading").forEach((heading) => heading.setAttribute("role", "presentation"));
      list.scrollTop = 0;
      select(0, false);
    }

    function show() {
      if (!dialog) create();
      if (dialog.open) return;
      input.value = "";
      render();
      dialog.showModal();
      loadIndex().then((entries) => {
        if (index.length) return;
        index = entries;
        if (dialog.open) render();
      });
    }

    if (opener) {
      opener.hidden = false;
      opener.querySelector("kbd").textContent = isMac ? "⌘K" : "Ctrl K";
      opener.addEventListener("click", show);
      opener.addEventListener("pointerenter", loadIndex, { once: true });
    }

    addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog && dialog.open) dialog.close();
        else show();
      } else if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping(event.target)) {
        event.preventDefault();
        show();
      }
    });
  }


  /* ── Lists: the travelling title ─────────────────────────────────────── */

  // Leaving for a post: hand its title to the view transition so it travels
  // from the list into the heading. (The return trip is wired in <head>.)
  addEventListener("pageswap", (event) => {
    if (!event.viewTransition || !event.activation || !event.activation.entry) return;
    const path = new URL(event.activation.entry.url).pathname;
    let title = null;
    doc.querySelectorAll(".entry-link, .post-neighbour").forEach((link) => {
      if (!title && link.getAttribute("href") === path) title = link.querySelector(".entry-title, .post-neighbour-title");
    });
    if (!title) return;
    const heading = doc.querySelector(".post > h1");
    if (heading) heading.style.viewTransitionName = "none";
    title.style.viewTransitionName = "post-title";
  });


  /* ── Posts: anchors and copy buttons ─────────────────────────────────── */

  function copyText(text) {
    if (navigator.clipboard && isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const area = html("textarea");
      area.value = text;
      area.style.cssText = "position:fixed;opacity:0";
      doc.body.appendChild(area);
      area.select();
      const ok = doc.execCommand("copy");
      area.remove();
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function initPost() {
    const post = doc.querySelector(".content > .post[data-reading-minutes]");
    if (!post) return;

    post.querySelectorAll("h2[id], h3[id]").forEach((heading) => {
      const anchor = html("a", "heading-anchor", "§");
      anchor.href = `#${heading.id}`;
      anchor.setAttribute("aria-label", "Copy a link to this section");
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        history.replaceState(null, "", anchor.href);
        heading.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
        copyText(anchor.href).then(() => toast("Link copied"), () => {});
      });
      heading.appendChild(anchor);
    });

    post.querySelectorAll("pre").forEach((pre) => {
      if (pre.classList.contains("mermaid") || !pre.textContent.trim()) return;
      let wrap = pre.parentElement;
      if (!wrap.classList.contains("codehilite")) {
        wrap = html("div");
        pre.replaceWith(wrap);
        wrap.appendChild(pre);
      }
      wrap.classList.add("code-wrap");
      const button = html("button", "code-copy", "copy");
      button.type = "button";
      button.addEventListener("click", () => {
        copyText(pre.textContent.replace(/\n$/, "")).then(() => {
          button.textContent = "copied ✓";
          button.classList.add("is-done");
          setTimeout(() => {
            button.textContent = "copy";
            button.classList.remove("is-done");
          }, 1600);
        }, () => {});
      });
      wrap.appendChild(button);
    });
  }


  /* ── Odds and ends ───────────────────────────────────────────────────── */

  function markCurrentSection() {
    doc.querySelectorAll("a.sidebar-nav-item").forEach((link) => {
      const href = link.getAttribute("href");
      if (href !== "/" && location.pathname.startsWith(href)) {
        link.classList.add("active");
        link.setAttribute("aria-current", location.pathname === href ? "page" : "true");
      }
    });
  }

  // On the 404 page, guess what the address was reaching for.
  function initSuggestions() {
    const box = doc.getElementById("error-suggestions");
    if (!box) return;
    const words = decodeURIComponent(location.pathname)
      .toLowerCase()
      .replace(/\.html?$/, "")
      .split(/[^a-z]+/)
      .filter((word) => word.length > 2 && !["posts", "index", "html", "the", "and", "for", "with"].includes(word));
    if (!words.length) return;
    loadIndex().then((entries) => {
      const scored = entries
        .map((entry) => {
          const haystack = `${entry.u} ${entry.t}`.toLowerCase();
          return { entry, hits: words.filter((word) => haystack.includes(word)).length };
        })
        .filter((result) => result.hits >= Math.max(1, Math.ceil(words.length / 3)))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 3);
      if (!scored.length) return;
      const list = box.querySelector("ul");
      scored.forEach(({ entry }) => {
        const item = html("li");
        const link = html("a", "error-link", entry.t);
        link.href = entry.u;
        item.appendChild(link);
        list.appendChild(item);
      });
      box.hidden = false;
    });
  }

  let snowing = false;
  function letItSnow() {
    if (snowing) return;
    snowing = true;
    const canvas = html("canvas", "snowfall");
    canvas.setAttribute("aria-hidden", "true");
    doc.body.appendChild(canvas);
    const context = canvas.getContext("2d");
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = innerWidth * ratio;
      canvas.height = innerHeight * ratio;
    };
    resize();
    addEventListener("resize", resize);
    const flakes = Array.from({ length: Math.round(clamp(innerWidth / 9, 50, 170)) }, () => ({
      x: Math.random(),
      y: -Math.random(),
      r: 1 + Math.random() * 2.6,
      speed: 0.05 + Math.random() * 0.1,
      sway: Math.random() * Math.PI * 2,
    }));
    const started = performance.now();
    const duration = 14000;
    let last = started;
    toast("❄ Send it");

    function frame(time) {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const elapsed = time - started;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = edition.night ? "rgba(255,255,255,0.85)" : "rgba(120,160,180,0.75)";
      for (const flake of flakes) {
        flake.y += flake.speed * dt * (0.6 + flake.r / 3);
        flake.sway += dt * 1.2;
        if (flake.y > 1.03 && elapsed < duration - 3000) {
          flake.y = -0.03;
          flake.x = Math.random();
        }
        const x = (flake.x + Math.sin(flake.sway) * 0.012) * canvas.width;
        context.beginPath();
        context.arc(x, flake.y * canvas.height, flake.r * ratio, 0, Math.PI * 2);
        context.fill();
      }
      if (elapsed > duration - 1500) canvas.style.opacity = "0";
      if (elapsed < duration) requestAnimationFrame(frame);
      else {
        removeEventListener("resize", resize);
        canvas.remove();
        snowing = false;
      }
    }
    requestAnimationFrame(frame);
  }

  // ↑↑↓↓←→←→BA
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiAt = 0;
  addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    konamiAt = key === konami[konamiAt] ? konamiAt + 1 : key === konami[0] ? 1 : 0;
    if (konamiAt === konami.length) {
      konamiAt = 0;
      letItSnow();
    }
  });

  function start() {
    for (const init of [markCurrentSection, initSky, initPalette, initPost, initSuggestions]) {
      try {
        init();
      } catch (error) {
        console.error(error);
      }
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})();
