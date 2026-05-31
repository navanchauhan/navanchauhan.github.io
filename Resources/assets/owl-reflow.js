import {
  layoutNextRichInlineLineRange,
  materializeRichInlineLineRange,
  prepareRichInline,
} from "https://esm.sh/@chenglou/pretext@0.0.7/rich-inline";

const MIN_REFLOW_WIDTH = 720;
const MIN_LINE_WIDTH = 56;
const OWL_PAD_X = 7;
const OWL_PAD_Y = 3;
const OWL_ALPHA_THRESHOLD = 64;
const OWL_ROW_GAP = 3;
const CACHE = new WeakMap();
const ALLOWED_INLINE_TAGS = new Set(["A", "ABBR", "B", "CODE", "EM", "I", "SMALL", "SPAN", "STRONG"]);
const DISALLOWED_INLINE_SELECTOR = [
  "audio",
  "br",
  "button",
  "canvas",
  "figure",
  "iframe",
  "img",
  "input",
  "math",
  "picture",
  "script",
  "select",
  "svg",
  "textarea",
  "video",
].join(",");

const post = document.querySelector(".post");
const owlButton = document.querySelector(".owl-jump-top");
const owlImage = owlButton?.querySelector("img") || null;
let owlShape = null;

if (owlButton) {
  owlButton.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (post && owlButton && "Intl" in window && "Segmenter" in Intl) {
  const paragraphs = Array.from(post.querySelectorAll("p")).filter(isInlineParagraph);
  let frameRequested = false;

  const schedule = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
      frameRequested = false;
      updateParagraphs(paragraphs);
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => {
    paragraphs.forEach((paragraph) => {
      resetParagraph(paragraph);
      CACHE.delete(paragraph);
    });
    schedule();
  });
  window.addEventListener("load", schedule);

  if (document.fonts) {
    document.fonts.ready.then(schedule).catch(() => {});
  }

  if (owlImage) {
    loadOwlShape(owlImage).then((shape) => {
      owlShape = shape;
      schedule();
    }).catch(() => {});
  }

  schedule();
}

function isInlineParagraph(paragraph) {
  if (paragraph.closest("figure, pre, blockquote, #isso-thread")) return false;
  if (paragraph.querySelector(DISALLOWED_INLINE_SELECTOR)) return false;
  for (const element of paragraph.querySelectorAll("*")) {
    if (!ALLOWED_INLINE_TAGS.has(element.tagName)) return false;
  }

  const text = paragraph.textContent.replace(/\s+/g, " ").trim();
  return text.length >= 80;
}

function updateParagraphs(paragraphs) {
  if (window.innerWidth < MIN_REFLOW_WIDTH) {
    paragraphs.forEach(resetParagraph);
    return;
  }

  const obstacle = getOwlObstacle();

  paragraphs.forEach((paragraph) => {
    const rect = paragraph.getBoundingClientRect();
    const overlapsVertically = rect.bottom >= obstacle.top && rect.top <= obstacle.bottom;
    const overlapsHorizontally = rect.right >= obstacle.left && rect.left <= obstacle.right;

    if (!overlapsVertically || !overlapsHorizontally) {
      resetParagraph(paragraph);
      return;
    }

    renderParagraph(paragraph, obstacle);
  });
}

function resetParagraph(paragraph) {
  const canvas = paragraph.querySelector(":scope > canvas[data-owl-reflow]");
  if (canvas) canvas.remove();
  paragraph.classList.remove("owl-reflow-source");
  paragraph.style.height = "";
}

function renderParagraph(paragraph, owlRect) {
  const rect = paragraph.getBoundingClientRect();
  const style = window.getComputedStyle(paragraph);
  const width = Math.max(0, paragraph.clientWidth);
  const lineHeight = parseLineHeight(style);
  const dpr = Math.max(1, Math.ceil(window.devicePixelRatio || 1));
  const richInline = getRichInline(paragraph);
  const lines = [];
  let current = undefined;
  let y = 0;
  let done = false;

  while (!done && y < 4000) {
    const lineTop = rect.top + y;
    const lineBottom = lineTop + lineHeight;
    const ranges = getAvailableRanges(width, rect.left, lineTop, lineBottom, owlRect);

    for (const range of ranges) {
      const lineRange = layoutNextRichInlineLineRange(richInline.prepared, range.right - range.left, current);
      if (lineRange === null) {
        done = true;
        break;
      }

      const line = materializeRichInlineLineRange(richInline.prepared, lineRange);
      lines.push({ fragments: line.fragments, x: range.left, y });
      current = line.end;
    }

    y += lineHeight;
  }

  const height = Math.max(lineHeight, y);
  const canvas = ensureCanvas(paragraph);
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.textBaseline = "top";

  for (const line of lines) {
    drawRichLine(context, line, richInline.items, lineHeight);
  }

  paragraph.style.height = `${height}px`;
  paragraph.classList.add("owl-reflow-source");
}

function getRichInline(paragraph) {
  const signature = paragraph.textContent;
  const cached = CACHE.get(paragraph);
  if (cached && cached.signature === signature) {
    return cached;
  }

  const items = collectRichInlineItems(paragraph);
  const prepared = prepareRichInline(items.map(({ text, layout }) => ({ text, ...layout })));
  const entry = { signature, items, prepared };
  CACHE.set(paragraph, entry);
  return entry;
}

function collectRichInlineItems(paragraph) {
  const items = [];
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue) continue;

    const element = node.parentElement || paragraph;
    if (element.closest("canvas[data-owl-reflow]")) continue;

    const code = element.closest("code");
    const link = element.closest("a");
    const styleElement = code || link || element;
    const style = window.getComputedStyle(styleElement);
    const chrome = code ? getCodeChrome(style) : { extraWidth: 0, paddingLeft: 0, paddingRight: 0 };

    items.push({
      text: node.nodeValue,
      layout: {
        font: style.font,
        letterSpacing: parseCssPixels(style.letterSpacing),
        break: code ? "never" : "normal",
        extraWidth: chrome.extraWidth,
      },
      paint: {
        type: code ? "code" : link ? "link" : "text",
        color: visibleColor(style.color, "#515151"),
        backgroundColor: visibleBackground(style.backgroundColor, code ? "rgba(42, 26, 10, 0.08)" : "transparent"),
        borderColor: visibleBackground(style.borderTopColor, "transparent"),
        font: style.font,
        paddingLeft: chrome.paddingLeft,
        paddingRight: chrome.paddingRight,
        textDecorationLine: style.textDecorationLine,
      },
    });
  }

  return items;
}

function drawRichLine(context, line, items, lineHeight) {
  let x = line.x;
  for (const fragment of line.fragments) {
    const item = items[fragment.itemIndex];
    const paint = item.paint;
    x += fragment.gapBefore;

    if (paint.type === "code") {
      drawCodeFragment(context, fragment, paint, x, line.y, lineHeight);
    } else {
      drawTextFragment(context, fragment, paint, x, line.y, lineHeight);
    }

    x += fragment.occupiedWidth;
  }
}

function drawTextFragment(context, fragment, paint, x, y, lineHeight) {
  context.font = paint.font;
  context.fillStyle = paint.color;
  context.fillText(fragment.text, Math.round(x), Math.round(y));

  if (paint.type === "link" || paint.textDecorationLine.includes("underline")) {
    const width = context.measureText(fragment.text).width;
    context.fillRect(Math.round(x), Math.round(y + lineHeight * 0.82), Math.max(1, width), 1);
  }
}

function drawCodeFragment(context, fragment, paint, x, y, lineHeight) {
  const radius = 3;
  const pillY = y + lineHeight * 0.12;
  const pillHeight = lineHeight * 0.76;

  context.fillStyle = paint.backgroundColor;
  roundedRect(context, x, pillY, fragment.occupiedWidth, pillHeight, radius);
  context.fill();

  context.font = paint.font;
  context.fillStyle = paint.color;
  context.fillText(fragment.text, Math.round(x + paint.paddingLeft), Math.round(y));
}

function roundedRect(context, x, y, width, height, radius) {
  if (typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function getCodeChrome(style) {
  const paddingLeft = parseCssPixels(style.paddingLeft);
  const paddingRight = parseCssPixels(style.paddingRight);
  const borderLeft = parseCssPixels(style.borderLeftWidth);
  const borderRight = parseCssPixels(style.borderRightWidth);

  return {
    extraWidth: paddingLeft + paddingRight + borderLeft + borderRight,
    paddingLeft: paddingLeft + borderLeft,
    paddingRight: paddingRight + borderRight,
  };
}

function visibleColor(color, fallback) {
  return color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)" ? color : fallback;
}

function visibleBackground(color, fallback) {
  return color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)" ? color : fallback;
}

function ensureCanvas(paragraph) {
  let canvas = paragraph.querySelector(":scope > canvas[data-owl-reflow]");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.dataset.owlReflow = "true";
    canvas.setAttribute("aria-hidden", "true");
    paragraph.appendChild(canvas);
  }

  return canvas;
}

function getAvailableRanges(width, paragraphLeft, lineTop, lineBottom, obstacle) {
  let ranges = [{ left: 0, right: width }];
  const lineOverlapsOwl = lineBottom >= obstacle.top && lineTop <= obstacle.bottom;

  if (lineOverlapsOwl) {
    for (const span of getOwlLineSpans(obstacle, lineTop, lineBottom)) {
      ranges = subtractRange(
        ranges,
        Math.max(0, span.left - paragraphLeft),
        Math.min(width, span.right - paragraphLeft)
      );
    }
  }

  return ranges.filter((range) => range.right - range.left >= MIN_LINE_WIDTH);
}

function subtractRange(ranges, left, right) {
  if (right <= left) return ranges;

  const next = [];
  for (const range of ranges) {
    if (right <= range.left || left >= range.right) {
      next.push(range);
      continue;
    }

    if (left > range.left) next.push({ left: range.left, right: left });
    if (right < range.right) next.push({ left: right, right: range.right });
  }

  return next;
}

function parseLineHeight(style) {
  const parsed = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(parsed)) return parsed;

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.45 : 24;
}

function parseCssPixels(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getOwlObstacle() {
  const rect = (owlImage || owlButton).getBoundingClientRect();
  return {
    left: rect.left - OWL_PAD_X,
    right: rect.right + OWL_PAD_X,
    top: rect.top - OWL_PAD_Y,
    bottom: rect.bottom + OWL_PAD_Y,
    rect,
    shape: owlShape,
  };
}

function getOwlLineSpans(obstacle, lineTop, lineBottom) {
  if (!obstacle.shape) {
    return [{ left: obstacle.left, right: obstacle.right }];
  }

  const { rect, shape } = obstacle;
  const yStart = clamp(Math.floor(((lineTop - rect.top) / rect.height) * shape.height), 0, shape.height - 1);
  const yEnd = clamp(Math.ceil(((lineBottom - rect.top) / rect.height) * shape.height), 0, shape.height - 1);
  const intervals = [];

  for (let y = yStart; y <= yEnd; y++) {
    intervals.push(...shape.rows[y]);
  }

  if (intervals.length === 0) {
    return [];
  }

  return mergeIntervals(intervals, OWL_ROW_GAP).map((interval) => {
    const left = rect.left + ((shape.width - interval.right) / shape.width) * rect.width - OWL_PAD_X;
    const right = rect.left + ((shape.width - interval.left) / shape.width) * rect.width + OWL_PAD_X;
    return { left, right };
  });
}

async function loadOwlShape(image) {
  if (!image.complete || image.naturalWidth === 0) {
    if (typeof image.decode === "function") {
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", reject, { once: true });
      });
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const rows = [];

  for (let y = 0; y < height; y++) {
    const intervals = [];
    let start = -1;
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha >= OWL_ALPHA_THRESHOLD) {
        if (start < 0) start = x;
      } else if (start >= 0) {
        intervals.push({ left: start, right: x });
        start = -1;
      }
    }

    if (start >= 0) intervals.push({ left: start, right: width });
    rows.push(mergeIntervals(intervals, OWL_ROW_GAP));
  }

  return { width, height, rows };
}

function mergeIntervals(intervals, gap = 0) {
  if (intervals.length <= 1) return intervals;

  const sorted = [...intervals].sort((a, b) => a.left - b.left);
  const merged = [sorted[0]];

  for (let index = 1; index < sorted.length; index++) {
    const current = sorted[index];
    const previous = merged[merged.length - 1];
    if (current.left <= previous.right + gap) {
      previous.right = Math.max(previous.right, current.right);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
