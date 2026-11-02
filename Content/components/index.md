# Components

A living specimen of the website’s shared styles, rendered with the same CSS as the rest of the site. This page is built from [Markdown and HTML](/components/index.md); class names beside the examples make them easier to reuse. Return to the [colophon](/colophon/).

Jump to: [Typography](#typography) · [Lists](#lists) · [Quotes and messages](#quotes-and-messages) · [Code and tables](#code-and-tables) · [Tags](#tags) · [Post elements](#post-elements) · [Notes](#notes) · [Navigation and layouts](#navigation-and-layouts).

## Typography

<p class="lead">An introductory paragraph using <code>.lead</code>, set in PT Sans.</p>

Body text uses Latin Modern. Here are **strong emphasis**, *italic emphasis*, an [ordinary link](/about/), inline `code`, and an <abbr title="Static site generator">SSG</abbr> abbreviation. There is also <small>small text</small>, a superscript x<sup>2</sup>, and a subscript H<sub>2</sub>O.

<div>
<h1>Heading one</h1>
<h2>Heading two</h2>
<h3>Heading three</h3>
<h4>Heading four</h4>
<h5>Heading five</h5>
<h6>Heading six</h6>
</div>

## Lists

- An unordered list item
- Another item with a nested list
    - A nested item

1. An ordered list item
2. A second step

<dl>
<dt>Definition term</dt>
<dd>A definition with the spacing provided by the base stylesheet.</dd>
<dt>Another term</dt>
<dd>Definitions can contain <a href="/about/">links</a> too.</dd>
</dl>

<div class="post">
<ul>
<li><input class="task-list-item-checkbox" type="checkbox" checked disabled aria-label="Completed task"> A completed task</li>
<li><input class="task-list-item-checkbox" type="checkbox" disabled aria-label="Incomplete task"> A task still to do</li>
</ul>
</div>

Task lists use `.task-list-item-checkbox` inside `.post`.

## Quotes and messages

> A quotation gets a large opening quote, a shaded background, and a left border.
> <cite>— A sample citation using &lt;cite&gt;</cite>

<p class="message">A <code>.message</code> provides a quiet background for a notice or aside.</p>

## Code and tables

Inline code: `uv run python3 generate_me.py`.

```python
# Fenced code blocks use syntax highlighting.
def greet(name):
    return f"Hello, {name}!"

print(greet("reader"))
```

A plain preformatted block:

<pre><code>Content/components/index.md
    → docs/components/index.html</code></pre>

| Element | Purpose | Example |
| --- | --- | --- |
| Heading | Organize content | `h2` |
| Link | Connect pages | `a` |
| Tag | Group related posts | `.tag-pill` |

Math is rendered by the Markdown generator: $a^2 + b^2 = c^2$.

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

## Tags

Regular `.tag-pill` links:

<p><a class="tag-pill" href="/tags/">Python</a> <a class="tag-pill" href="/tags/">Projects</a></p>

Large pills (`.tag-pill-lg`) and counts (`.tag-count`) in a wrapping `.tag-cloud`. Counts below are specimen values.

<div class="tag-cloud">
<a class="tag-pill tag-pill-lg" href="/tags/">Python <span class="tag-count">12</span></a>
<a class="tag-pill tag-pill-lg" href="/tags/">Projects <span class="tag-count">8</span></a>
<a class="tag-pill tag-pill-lg" href="/tags/">Notes <span class="tag-count">3</span></a>
</div>

## Post elements

The following specimen uses `.post`, including its paragraph spacing, indentation, headings, links, and ornamental horizontal rule.

<div class="post">
<div class="post-kicker">Sample category · .post-kicker</div>
<h2 class="post-title">A sample post title</h2>
<div class="post-header-meta" aria-label="Sample post metadata">
<span class="post-header-date">1st November, 2026</span>
<span>3 min read</span>
</div>
<div class="error-divider post-divider" aria-hidden="true"><span></span><span class="error-divider-dot"></span><span></span></div>
<p>The post header combines a kicker, title, metadata, and a decorative divider. This paragraph shows the reading column and <a href="/posts/">post link styling</a>.</p>
<p>A second paragraph demonstrates the first-line indent used in longer articles.</p>
<h3>A subsection within a post</h3>
<p>Headings give the next thought a little breathing room.</p>
<hr>
<p>An ornamental rule separates passages within a post.</p>
<figure class="post-figure">
<img src="/illustrations/lost_lake.png" alt="An illustration of Lost Lake">
<figcaption class="post-caption">A figure with a caption: .post-figure and .post-caption.</figcaption>
</figure>
</div>

The older date style is available as `.post-date`:

<time class="post-date" datetime="2026-11-01">1st November, 2026</time>

Post endings use `.post-end-illustration`:

<div class="post-end-illustration"><img src="/illustrations/quill_and_inkpot.png" alt="Quill and inkpot"></div>

## Notes

A numbered sidenote uses `.sidenote-number`, `.sidenote-toggle`, and `.sidenote`. On smaller screens, select the number to show or hide the note.

<p>A sentence with a sidenote<label for="components-note" class="sidenote-toggle sidenote-number" aria-label="Toggle sample sidenote" tabindex="0"></label><input type="checkbox" id="components-note" class="sidenote-toggle"><span class="sidenote">This note sits in the margin on wide screens and opens inline on smaller screens.</span> continues here.</p>

<p>An unnumbered margin note<label for="components-margin-note" class="sidenote-toggle"> ⊕</label><input type="checkbox" id="components-margin-note" class="sidenote-toggle"><span class="sidenote left">The <code>.left</code> modifier places a note in the left margin on wide screens.</span> uses the same toggle pattern.</p>

Footnote text can use `.footnotes`; the alternate definition style uses `.footnote-definition`.

<p>A sample footnote reference<sup><a id="components-ref" href="#components-footnote">1</a></sup>.</p>
<div class="footnotes">
<ol><li id="components-footnote"><p>A small, left-aligned footnote with a <a href="#components-ref">return link</a>.</p></li></ol>
</div>
<div class="footnote-definition"><sup>2</sup><p>An alternate footnote definition.</p></div>

## Navigation and layouts

The `.post-list` adds a small leaf ornament to each entry. Hover over an entry to see its motion.

<ul class="post-list">
<li><a href="/posts/">Browse the archive</a><ul><li>A sample post description and metadata list.</li></ul></li>
<li><a href="/tags/">Browse by tag</a></li>
</ul>

Related entries use `.related` and `.related-posts`:

<div class="related">
<h3>Related pages</h3>
<ul class="related-posts">
<li><h3><a href="/colophon/">Colophon <small>How the site is made</small></a></h3></li>
<li><h3><a href="/about/">About <small>Elsewhere on the web</small></a></h3></li>
</ul>
</div>

Pagination uses `.pagination` and `.pagination-item`, with a span for an unavailable direction:

<nav class="pagination" aria-label="Sample pagination">
<span class="pagination-item">Older (unavailable)</span>
<a class="pagination-item" href="#components">Back to top</a>
</nav>

The legacy masthead styles are `.masthead`, `.masthead-title`, and a small subtitle:

<div class="masthead"><h3 class="masthead-title"><a href="/">Navan’s Archive</a> <small>A sample subtitle</small></h3></div>

The surrounding page demonstrates `.paint`, `.content.container`, and the responsive `.sidebar`, `.sidebar-about`, `.sidebar-nav`, `.sidebar-nav-item`, and `.copyright`. The sidebar’s motto and the quill in the margin are enhanced by JavaScript.

The [404 page](/404.html) demonstrates the full `.error-hero` composition: `.error-copy`, `.error-description`, `.error-link`, and `.error-illustration-wrap` with `.error-illustration`. Its decorative `.error-divider` is also shown in the post specimen above.

Layout options in the theme include `.layout-reverse` for a right sidebar, `.sidebar-sticky` for bottom-aligned sidebar content, and `.theme-base-08` through `.theme-base-0f` for sidebar and link colors. The current site uses `.theme-base-0d`; `.libertinus` switches the body typeface. These are whole-page options, rather than individual content components.

Interactive post demos can use `.demo-container` inside `.post` to keep wide content scrollable within the column:

<div class="post"><div class="demo-container"><pre><code>A scrollable demo container → content stays within the reading column even when a line is much wider than the available screen width.</code></pre></div></div>

<p class="copyright">Small footer text using .copyright. Styles come from /assets/c-hyde.css and /assets/main.css.</p>
