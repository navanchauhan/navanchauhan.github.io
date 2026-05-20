(function () {
    "use strict";

    var POST_SELECTOR = ".post";
    var SVG_NS = "http://www.w3.org/2000/svg";
    var active = null;
    var rafId = 0;
    var resizeObserver = null;
    var mobileDisableQuery = null;

    function cssNumber(element, name, fallback) {
        var raw = getComputedStyle(element).getPropertyValue(name).trim();
        var value = parseFloat(raw);
        return Number.isFinite(value) ? value : fallback;
    }

    function nodeElement(node) {
        if (!node) return null;
        return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    }

    function closestPost(node) {
        var element = nodeElement(node);
        return element ? element.closest(POST_SELECTOR) : null;
    }

    function rangeIntersectsNode(range, node) {
        try {
            return range.intersectsNode(node);
        } catch (error) {
            return false;
        }
    }

    function mobileHighlightDisabled() {
        if (!mobileDisableQuery && window.matchMedia) {
            mobileDisableQuery = window.matchMedia("(hover: none) and (pointer: coarse), (max-width: 47.999em)");
        }

        return (mobileDisableQuery && mobileDisableQuery.matches) || window.innerWidth < 768;
    }

    function setSelectionStylingEnabled(enabled) {
        document.documentElement.classList.toggle("true-highlight-ready", enabled);
    }

    function selectionPost(selection) {
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            return null;
        }

        var anchorPost = closestPost(selection.anchorNode);
        var focusPost = closestPost(selection.focusNode);
        if (anchorPost && anchorPost === focusPost) return anchorPost;

        for (var i = 0; i < selection.rangeCount; i += 1) {
            var range = selection.getRangeAt(i);
            var commonPost = closestPost(range.commonAncestorContainer);
            if (commonPost) return commonPost;

            var posts = document.querySelectorAll(POST_SELECTOR);
            for (var j = 0; j < posts.length; j += 1) {
                if (rangeIntersectsNode(range, posts[j])) return posts[j];
            }
        }

        return null;
    }

    function isSelectableTextNode(node, post) {
        if (!node.nodeValue || !node.nodeValue.trim()) return false;

        var parent = node.parentElement;
        if (!parent) return false;

        var tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
            return false;
        }

        for (var element = parent; element && element !== post; element = element.parentElement) {
            var style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") {
                return false;
            }
        }

        return true;
    }

    function collectRects(selection, post) {
        var rects = [];
        var slice = document.createRange();
        var walker = document.createTreeWalker(
            post,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (!isSelectableTextNode(node, post)) return NodeFilter.FILTER_REJECT;

                    for (var i = 0; i < selection.rangeCount; i += 1) {
                        if (rangeIntersectsNode(selection.getRangeAt(i), node)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }

                    return NodeFilter.FILTER_REJECT;
                }
            }
        );

        for (var node = walker.nextNode(); node; node = walker.nextNode()) {
            for (var i = 0; i < selection.rangeCount; i += 1) {
                var range = selection.getRangeAt(i);
                if (!rangeIntersectsNode(range, node)) continue;

                var start = range.startContainer === node ? range.startOffset : 0;
                var end = range.endContainer === node ? range.endOffset : node.length;
                if (end <= start) continue;

                slice.setStart(node, start);
                slice.setEnd(node, end);

                var nodeRects = slice.getClientRects();
                for (var j = 0; j < nodeRects.length; j += 1) {
                    var rect = nodeRects[j];
                    if (rect.width >= 0.75 && rect.height >= 2) {
                        rects.push(rect);
                    }
                }
            }
        }

        slice.detach();
        return rects;
    }

    function verticalOverlap(a, b) {
        return Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    }

    function mergeRectsIntoLines(rects, postRect, post) {
        var padX = cssNumber(post, "--true-highlight-x-padding", 4);
        var padY = cssNumber(post, "--true-highlight-y-padding", 7);
        var candidates = rects.map(function (rect) {
            return {
                left: rect.left - postRect.left,
                right: rect.right - postRect.left,
                top: rect.top - postRect.top,
                bottom: rect.bottom - postRect.top
            };
        }).filter(function (rect) {
            return rect.right - rect.left > 0.75 && rect.bottom - rect.top > 2;
        }).sort(function (a, b) {
            return a.top === b.top ? a.left - b.left : a.top - b.top;
        });

        var lines = [];
        candidates.forEach(function (rect) {
            var center = (rect.top + rect.bottom) / 2;
            var line = lines[lines.length - 1];

            if (line) {
                var lineCenter = (line.top + line.bottom) / 2;
                var overlap = verticalOverlap(line, rect);
                var minHeight = Math.min(line.bottom - line.top, rect.bottom - rect.top);
                var sameLine = Math.abs(center - lineCenter) <= Math.max(2, minHeight * 0.55) ||
                    overlap >= minHeight * 0.45;

                if (sameLine) {
                    line.left = Math.min(line.left, rect.left);
                    line.right = Math.max(line.right, rect.right);
                    line.top = Math.min(line.top, rect.top);
                    line.bottom = Math.max(line.bottom, rect.bottom);
                    return;
                }
            }

            lines.push({
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
            });
        });

        var breakGap = cssNumber(post, "--true-highlight-line-break-gap", 16);
        var padded = lines.map(function (line) {
            return {
                left: Math.max(0, line.left - padX),
                right: line.right + padX,
                top: line.top - padY,
                bottom: line.bottom + padY,
                rawTop: line.top,
                rawBottom: line.bottom
            };
        });

        for (var i = 0; i + 1 < padded.length; i += 1) {
            var rawGap = padded[i + 1].rawTop - padded[i].rawBottom;
            var visualGap = padded[i + 1].top - padded[i].bottom;

            if (rawGap <= breakGap && visualGap > -1.5) {
                var mid = (padded[i].bottom + padded[i + 1].top) / 2;
                padded[i].bottom = mid + 0.75;
                padded[i + 1].top = mid - 0.75;
            }
        }

        return padded;
    }

    function fmt(value) {
        return Number(value.toFixed(2));
    }

    function capsulePath(line, radius) {
        var x = line.left;
        var y = line.top;
        var w = line.right - line.left;
        var h = line.bottom - line.top;
        var r = Math.min(radius, h / 2, w / 2);
        var k = r * 0.55228475;
        var wave = Math.min(0.9, h * 0.035);
        var midY = y + h / 2;

        return [
            "M", fmt(x + r), fmt(y),
            "C", fmt(x + w * 0.34), fmt(y - wave), fmt(x + w * 0.66), fmt(y + wave), fmt(x + w - r), fmt(y),
            "C", fmt(x + w - r + k), fmt(y), fmt(x + w), fmt(midY - r + k), fmt(x + w), fmt(midY),
            "C", fmt(x + w), fmt(midY + r - k), fmt(x + w - r + k), fmt(y + h), fmt(x + w - r), fmt(y + h),
            "C", fmt(x + w * 0.66), fmt(y + h + wave), fmt(x + w * 0.34), fmt(y + h - wave), fmt(x + r), fmt(y + h),
            "C", fmt(x + r - k), fmt(y + h), fmt(x), fmt(midY + r - k), fmt(x), fmt(midY),
            "C", fmt(x), fmt(midY - r + k), fmt(x + r - k), fmt(y), fmt(x + r), fmt(y),
            "Z"
        ].join(" ");
    }

    function connectorPath(previous, next) {
        var overlapLeft = Math.max(previous.left, next.left);
        var overlapRight = Math.min(previous.right, next.right);
        var previousHeight = previous.bottom - previous.top;
        var nextHeight = next.bottom - next.top;
        var inset = Math.min(10, Math.max(4, Math.min(previousHeight, nextHeight) * 0.28));

        overlapLeft += inset;
        overlapRight -= inset;
        if (overlapRight <= overlapLeft) return "";

        var y1 = previous.bottom - Math.min(previousHeight * 0.22, 5);
        var y2 = next.top + Math.min(nextHeight * 0.22, 5);
        if (y2 <= y1) return "";

        var curve = Math.max(3, (y2 - y1) * 0.48);
        return [
            "M", fmt(overlapLeft), fmt(y1),
            "C", fmt(overlapLeft), fmt(y1 + curve), fmt(overlapLeft), fmt(y2 - curve), fmt(overlapLeft), fmt(y2),
            "L", fmt(overlapRight), fmt(y2),
            "C", fmt(overlapRight), fmt(y2 - curve), fmt(overlapRight), fmt(y1 + curve), fmt(overlapRight), fmt(y1),
            "Z"
        ].join(" ");
    }

    function buildFillPath(lines, post) {
        var radius = cssNumber(post, "--true-highlight-radius", 9);
        var breakGap = cssNumber(post, "--true-highlight-line-break-gap", 16);
        var parts = [];

        for (var i = 0; i < lines.length; i += 1) {
            parts.push(capsulePath(lines[i], radius));

            if (i + 1 < lines.length) {
                var gap = lines[i + 1].rawTop - lines[i].rawBottom;
                if (gap <= breakGap) {
                    var connector = connectorPath(lines[i], lines[i + 1]);
                    if (connector) parts.push(connector);
                }
            }
        }

        return parts.join(" ");
    }

    function ensureOverlay(post) {
        if (active && active.post === post) {
            if (active.removeTimer) {
                clearTimeout(active.removeTimer);
                active.removeTimer = 0;
            }
            return active;
        }

        removeOverlay(true);

        var svg = document.createElementNS(SVG_NS, "svg");
        var fill = document.createElementNS(SVG_NS, "path");

        svg.classList.add("true-highlight-overlay");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        fill.classList.add("true-highlight-fill");

        svg.appendChild(fill);
        post.appendChild(svg);

        active = {
            post: post,
            svg: svg,
            fill: fill,
            removeTimer: 0
        };

        if (resizeObserver) resizeObserver.disconnect();
        if ("ResizeObserver" in window) {
            resizeObserver = new ResizeObserver(scheduleUpdate);
            resizeObserver.observe(post);
        }

        return active;
    }

    function sizeOverlay(state) {
        var rect = state.post.getBoundingClientRect();
        var width = Math.max(state.post.scrollWidth, rect.width);
        var height = Math.max(state.post.scrollHeight, rect.height);

        state.svg.setAttribute("width", width);
        state.svg.setAttribute("height", height);
        state.svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        state.svg.style.width = width + "px";
        state.svg.style.height = height + "px";
    }

    function removeOverlay(immediate) {
        if (!active) return;

        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }

        var state = active;
        active = null;

        if (state.removeTimer) clearTimeout(state.removeTimer);

        state.svg.classList.remove("is-visible");
        state.fill.setAttribute("d", "");

        if (immediate) {
            state.svg.remove();
            return;
        }

        state.removeTimer = window.setTimeout(function () {
            state.svg.remove();
        }, 110);
    }

    function updateHighlight() {
        rafId = 0;

        if (mobileHighlightDisabled()) {
            setSelectionStylingEnabled(false);
            removeOverlay(false);
            return;
        }

        setSelectionStylingEnabled(true);

        var selection = window.getSelection();
        var post = selectionPost(selection);
        if (!post) {
            removeOverlay(false);
            return;
        }

        var rects = collectRects(selection, post);
        if (!rects.length) {
            removeOverlay(false);
            return;
        }

        var postRect = post.getBoundingClientRect();
        var lines = mergeRectsIntoLines(rects, postRect, post);
        if (!lines.length) {
            removeOverlay(false);
            return;
        }

        var state = ensureOverlay(post);
        sizeOverlay(state);

        state.fill.setAttribute("d", buildFillPath(lines, post));

        requestAnimationFrame(function () {
            if (active === state) state.svg.classList.add("is-visible");
        });
    }

    function scheduleUpdate() {
        if (!rafId) rafId = requestAnimationFrame(updateHighlight);
    }

    function init() {
        if (!document.querySelector(POST_SELECTOR)) return;

        setSelectionStylingEnabled(!mobileHighlightDisabled());
        document.addEventListener("selectionchange", scheduleUpdate);
        document.addEventListener("pointerdown", scheduleUpdate, { passive: true });
        document.addEventListener("pointerup", scheduleUpdate, { passive: true });
        document.addEventListener("touchend", scheduleUpdate, { passive: true });
        document.addEventListener("keyup", function (event) {
            if (event.key === "Escape") removeOverlay(false);
            else scheduleUpdate();
        });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        window.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });

        if (mobileDisableQuery) {
            if (mobileDisableQuery.addEventListener) {
                mobileDisableQuery.addEventListener("change", scheduleUpdate);
            } else if (mobileDisableQuery.addListener) {
                mobileDisableQuery.addListener(scheduleUpdate);
            }
        }

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(scheduleUpdate).catch(function () {});
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
