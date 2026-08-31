from markdown2 import Markdown, UnicodeWithAttrs
import os
from jinja2 import Environment, FileSystemLoader
import shutil
import datetime
import email.utils
import json
import math
import hashlib
import rcssmin
from helper_libs.image_utils import ImageText
from PIL import Image, ImageDraw, ImageFont
import urllib.request
import zipfile
import io
from html import unescape
from xml.sax.saxutils import escape as xml_escape

import re

templates = Environment(loader=FileSystemLoader("templates"))

VERSIONED_ASSET_PATHS = [
    "Resources/assets/c-hyde.css",
    "Resources/assets/main.css",
    "Resources/manifest.json",
    "Resources/pwabuilder-sw-register.js",
    "Resources/pwabuilder-sw.js",
]

CSS_OUTPUT_PATHS = [
    "assets/c-hyde.css",
    "assets/main.css",
]


def compute_asset_version():
    digest = hashlib.sha256()
    for path in VERSIONED_ASSET_PATHS:
        digest.update(path.encode("utf-8"))
        digest.update(b"\0")
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                digest.update(chunk)
        digest.update(b"\0")
    return digest.hexdigest()[:16]


BUILD_VERSION = compute_asset_version()
templates.globals["asset_version"] = BUILD_VERSION

READING_WORDS_PER_MINUTE = 220


def day_suffix(day):
    if 11 <= day <= 13:
        return "th"
    return {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")


def format_date_pretty(date_str):
    dt = datetime.datetime.strptime(date_str[:10], "%Y-%m-%d")
    day = dt.day
    return f"{day}<sup>{day_suffix(day)}</sup> {dt.strftime('%B')}, {dt.year}"


def format_date_inline(date_str):
    dt = datetime.datetime.strptime(date_str[:10], "%Y-%m-%d")
    day = dt.day
    return f"{day}{day_suffix(day)} {dt.strftime('%B')}, {dt.year}"

templates.filters["pretty_date"] = format_date_pretty
templates.filters["pretty_date_inline"] = format_date_inline


def site_url(path="/"):
    """Return an absolute URL for a site-relative path."""
    if str(path).startswith(("http://", "https://")):
        return str(path)
    path = "/" + str(path).lstrip("/")
    return base_link.rstrip("/") + ("/" if path == "/" else path)


def source_relative_path(source_path):
    return os.path.relpath(source_path, src_folder).replace(os.sep, "/")


def source_markdown_path(source_path):
    return "/" + source_relative_path(source_path)


def source_html_path(source_path):
    relative_path = source_relative_path(source_path)
    if relative_path == "index.md":
        return "/"
    if relative_path.endswith("/index.md"):
        return "/" + relative_path[: -len("index.md")]
    return "/" + os.path.splitext(relative_path)[0] + ".html"


def output_path_for_source(source_path):
    return os.path.join(out_folder, source_relative_path(source_path))


def output_html_path_for_source(source_path):
    html_path = source_html_path(source_path)
    if html_path == "/":
        return os.path.join(out_folder, "index.html")
    if html_path.endswith("/"):
        return os.path.join(out_folder, html_path.lstrip("/"), "index.html")
    return os.path.join(out_folder, html_path.lstrip("/"))


def is_true(value):
    return value is True or str(value).strip().lower() in {"true", "yes", "1"}


def normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def iso_date(value):
    try:
        return datetime.datetime.strptime(str(value), "%Y-%m-%d %H:%M").date().isoformat()
    except (TypeError, ValueError):
        return None


def page_schema_type(source_path):
    relative_path = source_relative_path(source_path)
    if relative_path == "index.md":
        return "WebSite"
    if relative_path == "about/index.md":
        return "ProfilePage"
    return "CollectionPage"


def build_json_ld(page_url, page_title, description, page_type="WebPage", metadata=None):
    """Build a small, stable schema graph for a page or blog post."""
    person_id = site_url("/about/") + "#person"
    website_id = site_url("/") + "#website"
    page_id = page_url + "#webpage"

    graph = [
        {
            "@type": "Person",
            "@id": person_id,
            "name": site_name,
            "url": author_url,
            "sameAs": author_same_as,
        },
        {
            "@type": "WebSite",
            "@id": website_id,
            "url": site_url("/"),
            "name": f_title,
            "description": f_description,
            "publisher": {"@id": person_id},
        },
    ]

    if metadata is not None:
        published_date = iso_date(metadata.get("date"))
        article = {
            "@type": "BlogPosting",
            "@id": page_id,
            "url": page_url,
            "headline": metadata.get("title", page_title),
            "description": metadata.get("description", description),
            "author": {"@id": person_id},
            "publisher": {"@id": person_id},
            "isPartOf": {"@id": website_id},
            "mainEntityOfPage": {"@id": page_id},
        }
        if published_date:
            article["datePublished"] = published_date
            article["dateModified"] = published_date
        if metadata.get("image_link"):
            article["image"] = metadata["image_link"]
        if metadata.get("tags"):
            article["keywords"] = metadata["tags"]
        graph.append(article)
    else:
        graph.append(
            {
                "@type": page_type,
                "@id": page_id,
                "url": page_url,
                "name": page_title,
                "description": description,
                "isPartOf": {"@id": website_id},
                "about": {"@id": person_id},
            }
        )

    # Prevent page content from closing the script element if content changes.
    return json.dumps(
        {"@context": "https://schema.org", "@graph": graph},
        ensure_ascii=False,
        indent=2,
    ).replace("</", "<\\/")
src_folder = "Content"
out_folder = "docs"
resources_folder = "Resources"
base_link = "https://web.navan.dev/"
f_title = "Navan's Archive"
f_description = "Rare Tips, Tricks and Posts"
f_date = email.utils.format_datetime(datetime.datetime.now())
site_name = "Navan Chauhan"
source_repository = "https://github.com/navanchauhan/navanchauhan.github.io"
author_url = base_link.rstrip("/") + "/about/"
author_same_as = [
    "https://github.com/navanchauhan",
    "https://x.com/navanchauhan",
    "https://matrix.to/#/@navan:navan.dev",
]

# This policy is explicit because the site is a personal archive. Change these
# values if the publishing policy changes.
allow_ai_search = True
allow_ai_input = True
allow_ai_training = False
discovery_crawlers = (
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "PerplexityBot",
    "Googlebot",
    "Applebot",
)
training_crawlers = (
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "ByteSpider",
)

image_title_color = (49,31,19) #(74, 74, 74)
image_line_color = (176,113,84) #(29, 116, 132)
image_title_font = "fonts/futura_bold.ttf"
image_text_font = "fonts/futura_light.ttf"

# ── OG Image Generation (Option C: Teal Card) ──

OG_FONT_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".og-fonts")
OG_FONTS = {
    "abril_fatface": {
        "filename": "AbrilFatface-Regular.ttf",
        "url": "https://raw.githubusercontent.com/google/fonts/main/ofl/abrilfatface/AbrilFatface-Regular.ttf",
    },
    "pt_sans": {
        "filename": "PT_Sans-Web-Regular.ttf",
        "url": "https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf",
    },
}

OG_W, OG_H = 1200, 630
OG_TEAL = (26, 91, 116)


def _ensure_og_fonts():
    """Download OG image fonts if not already cached."""
    os.makedirs(OG_FONT_CACHE_DIR, exist_ok=True)
    paths = {}
    for key, info in OG_FONTS.items():
        dest = os.path.join(OG_FONT_CACHE_DIR, info["filename"])
        if not os.path.exists(dest):
            print(f"Downloading font: {info['filename']}")
            urllib.request.urlretrieve(info["url"], dest)
        paths[key] = dest
    # Futura Light is bundled in the repo
    paths["futura_light"] = image_text_font
    return paths


def _og_wrap_text(text, font, max_width):
    words = text.split()
    lines, current = [], []
    for word in words:
        test = " ".join(current + [word])
        if font.getbbox(test)[2] - font.getbbox(test)[0] <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def _og_text_height(text, font):
    bbox = font.getbbox(text)
    return bbox[3] - bbox[1]


def _og_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)


def generate_og_image(title, description, tags, output_path):
    """Generate a teal card OG image for a blog post."""
    fonts = _ensure_og_fonts()

    img = Image.new("RGB", (OG_W, OG_H), OG_TEAL)
    draw = ImageDraw.Draw(img)

    title_font = ImageFont.truetype(fonts["abril_fatface"], 54)
    desc_font = ImageFont.truetype(fonts["futura_light"], 26)
    tag_font = ImageFont.truetype(fonts["pt_sans"], 18)
    site_font = ImageFont.truetype(fonts["pt_sans"], 18)

    # Title (centered)
    lines = _og_wrap_text(title, title_font, OG_W - 160)
    total_h = sum(_og_text_height(l, title_font) + 14 for l in lines)
    y = max(60, (OG_H - total_h - 120) // 2)
    for line in lines:
        lw = title_font.getbbox(line)[2] - title_font.getbbox(line)[0]
        draw.text(((OG_W - lw) // 2, y), line, font=title_font, fill=(255, 255, 255))
        y += _og_text_height(line, title_font) + 14

    # Horizontal rule
    y += 15
    rule_w = 200
    draw.rectangle([(OG_W - rule_w) // 2, y, (OG_W + rule_w) // 2, y + 2], fill=(255, 255, 255))
    y += 25

    # Description (centered)
    if description:
        desc_lines = _og_wrap_text(description, desc_font, OG_W - 200)
        for line in desc_lines:
            lw = desc_font.getbbox(line)[2] - desc_font.getbbox(line)[0]
            draw.text(((OG_W - lw) // 2, y), line, font=desc_font, fill=(200, 220, 230))
            y += _og_text_height(line, desc_font) + 6

    # Tag pills (centered at bottom)
    if tags:
        tag_total_w = 0
        for tag in tags:
            tw = tag_font.getbbox(tag)[2] - tag_font.getbbox(tag)[0]
            tag_total_w += tw + 28
        tag_x = (OG_W - tag_total_w) // 2
        tag_y = OG_H - 80
        pill_color = (36, 111, 140)
        for tag in tags:
            bbox = tag_font.getbbox(tag)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            pill_w = tw + 20
            pill_h = th + 10
            _og_rounded_rect(draw, (tag_x, tag_y, tag_x + pill_w, tag_y + pill_h),
                             pill_h // 2, pill_color)
            draw.text((tag_x + 10, tag_y + 3), tag, font=tag_font, fill=(200, 220, 230))
            tag_x += pill_w + 8

    # Site URL (bottom right)
    draw.text((OG_W - 200, OG_H - 40), "web.navan.dev", font=site_font, fill=(150, 190, 210))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    return output_path

md = Markdown(
    extras=[
        "toc",
        "fenced-code-blocks",
        "metadata",
        "task_list",
        "tables",
        "target-blank-links",
        "header-ids",
        "latex",
        "mermaid"
    ]
)

# h1 tag regex ignoring any attributes
h1_tag = re.compile(r"<h1[^>]*>(.*?)</h1>")
h1_block_tag = re.compile(r"<h1[^>]*>.*?</h1>", re.DOTALL)
pre_block_tag = re.compile(r"<pre[^>]*>.*?</pre>", re.DOTALL)
html_tag = re.compile(r"<[^>]+>")
word_tag = re.compile(r"\b[\w][\w'.:/+-]*\b")
paragraph_img_tag = re.compile(r'<p>\s*(<img\b[^>]*\balt="([^"]*)"[^>]*>)\s*</p>', re.DOTALL)


def estimate_reading_time_minutes(html):
    readable_html = re.sub(pre_block_tag, " ", html)
    plain_text = re.sub(html_tag, " ", readable_html)
    word_count = len(re.findall(word_tag, unescape(plain_text)))
    return max(1, math.ceil(word_count / READING_WORDS_PER_MINUTE))


def add_image_captions(html):
    def replace_image(match):
        image_html = match.group(1)
        alt_text = unescape(match.group(2)).strip()
        if not alt_text:
            return match.group(0)
        return (
            '<figure class="post-figure">'
            f"{image_html}"
            f'<figcaption class="post-caption">{alt_text}</figcaption>'
            "</figure>"
        )

    return re.sub(paragraph_img_tag, replace_image, html)


def build_post_content(html, metadata, toc_html):
    title_match = re.search(h1_tag, html)
    title = title_match.group(1) if title_match else metadata.get("title", "")

    body = re.sub(h1_block_tag, "", html, count=1).lstrip()
    body = add_image_captions(body)
    toc = toc_html if len(re.findall(r"<li>", toc_html)) > 1 else ""
    content_metadata = dict(metadata)
    content_metadata["reading_time"] = estimate_reading_time_minutes(body)

    return {
        "metadata": content_metadata,
        "title": title,
        "toc": toc,
        "body": body,
    }

def render_markdown_post(
    html,
    metadata=None,
    template="post.html",
    posts=None,
    title=None,
    page_url=None,
    markdown_link=None,
    page_type="WebPage",
):
    global templates

    if posts is None:
        posts = []
    if len(posts) != 0:
        posts = sorted(posts, key=lambda i: i["date"], reverse=True)

    content_metadata = html.get("metadata", {}) if isinstance(html, dict) else {}
    page_url = page_url or content_metadata.get("absolute_link") or site_url("/")
    markdown_link = markdown_link or content_metadata.get("markdown_link")
    page_title = content_metadata.get("title") or title or site_name
    page_description = content_metadata.get("description") or f_description
    json_ld = build_json_ld(
        page_url,
        page_title,
        page_description,
        page_type="BlogPosting" if content_metadata else page_type,
        metadata=content_metadata or None,
    )

    context = {
        "content": html,
        "posts": posts,
        "title": title,
        "page_url": page_url,
        "markdown_link": markdown_link,
        "json_ld": json_ld,
    }
    return templates.get_template(template).render(**context)


def create_folder_ifnot(folder_name):
    if not os.path.exists(folder_name):
        os.mkdir(folder_name)


def minify_css_outputs():
    for relative_path in CSS_OUTPUT_PATHS:
        path = os.path.join(out_folder, relative_path)
        with open(path, "r", encoding="utf-8") as f:
            css = f.read()
        minified = rcssmin.cssmin(css, keep_bang_comments=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(minified)
            f.write("\n")


def write_markdown_twin(source_path):
    """Publish the source Markdown beside its generated HTML page."""
    destination = output_path_for_source(source_path)
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    shutil.copyfile(source_path, destination)


def prepare_output_folder():
    """Recreate the generated output so stale pages cannot survive a build."""
    if os.path.isdir(out_folder):
        shutil.rmtree(out_folder)
    os.makedirs(out_folder, exist_ok=True)
    open(os.path.join(out_folder, ".gitkeep"), "a", encoding="utf-8").close()


def latest_post_date(posts):
    dates = [iso_date(post.get("date")) for post in posts]
    dates = [date for date in dates if date]
    return max(dates) if dates else None


def write_sitemap():
    """Write a sitemap for published pages only."""
    entries = {site_url("/"): None}

    for fpath in index_pages_to_generate:
        relative_path = source_relative_path(fpath)
        if relative_path == "index.md":
            page_posts = post_collection
        else:
            section = os.path.dirname(relative_path)
            page_posts = post_collection_dict.get(section, [])
        entries[site_url(source_html_path(fpath))] = latest_post_date(page_posts)

    for post in post_collection:
        entries[site_url(post["link"])] = iso_date(post.get("date"))

    entries[site_url("/tags/")] = latest_post_date(post_collection)
    for tag, posts in tag_post_dict.items():
        entries[site_url(f"/tags/{tag}.html")] = latest_post_date(posts)

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for url in sorted(entries):
        lines.append("  <url>")
        lines.append(f"    <loc>{xml_escape(url)}</loc>")
        if entries[url]:
            lines.append(f"    <lastmod>{entries[url]}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")

    with open(os.path.join(out_folder, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def markdown_list_link(label, url):
    safe_label = str(label).replace("\\", "\\\\").replace("]", "\\]")
    return f"[{safe_label}]({url})"


def write_llms_txt():
    """Write a concise machine-readable index of the published site."""
    lines = [
        "# Navan Chauhan",
        "",
        "> Personal website and archive for Navan Chauhan.",
        "> The site contains software projects, technical writing, tutorials, and personal notes.",
        "",
        "## Core resources",
        f"- {markdown_list_link('Homepage', site_url('/'))}",
        f"- {markdown_list_link('About and links', site_url('/about/'))}",
        f"- {markdown_list_link('All posts', site_url('/posts/'))}",
        f"- {markdown_list_link('RSS / Atom feed', site_url('/feed.rss'))}",
        f"- {markdown_list_link('Sitemap', site_url('/sitemap.xml'))}",
        f"- {markdown_list_link('Privacy policy', site_url('/misc/generic-privacy-policy.html'))}",
        f"- {markdown_list_link('Colophon', site_url('/colophon/'))}",
        f"- {markdown_list_link('Source repository', source_repository)}",
        "",
        "## Published pages",
    ]

    for post in sorted(post_collection, key=lambda item: item["date"], reverse=True):
        description = normalize_text(post.get("description"))
        suffix = f": {description}" if description else ""
        lines.append(
            f"- {markdown_list_link(post['title'], site_url(post['link']))}"
            f"{suffix} ({markdown_list_link('Markdown', post['markdown_link'])})"
        )

    with open(os.path.join(out_folder, "llms.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def write_robots_txt():
    """Write the crawler policy and the generated sitemap location."""
    signal = lambda allowed: "yes" if allowed else "no"
    lines = [
        "# This file declares the site's crawler and content policy.",
        "User-agent: *",
        "Allow: /",
        "",
    ]

    for crawler in discovery_crawlers:
        lines.extend([f"User-agent: {crawler}", "Allow: /", ""])

    for crawler in training_crawlers:
        lines.extend(
            [
                f"User-agent: {crawler}",
                "Allow: /" if allow_ai_training else "Disallow: /",
                "",
            ]
        )

    lines.extend(
        [
            f"Content-Signal: search={signal(allow_ai_search)}, "
            f"ai-input={signal(allow_ai_input)}, ai-train={signal(allow_ai_training)}",
            f"Sitemap: {site_url('/sitemap.xml')}",
        ]
    )

    with open(os.path.join(out_folder, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


post_collection_dict = {}
post_collection = []
post_collection_html = []
tag_post_dict = {}
index_pages_to_generate = []

prepare_output_folder()
shutil.copytree(resources_folder, out_folder, dirs_exist_ok=True)

first_run = True
for x in os.walk(src_folder):
    # print(x)
    if first_run:
        for y in x[-1]:
            if y != ".DS_Store":
                fpath = os.path.join(x[0], y)
                with open(fpath, encoding="utf-8") as f:
                    index_pages_to_generate.append(fpath)
        first_run = False
    else:
        if len(x[1]) == 0:
            create_folder_ifnot(x[0].replace(src_folder, out_folder))
            print("No sub folder")
            print("Posts in {}".format(x[0]))
            tmp_array = []
            for y in x[2]:
                post_me = True
                if y not in ("index.md", ".DS_Store"):
                    fpath = os.path.join(x[0], y)
                    with open(fpath, encoding="utf-8") as f:
                        _html = md.convert(f.read())
                        _post_title = re.search(h1_tag, _html).group(1)
                        _post = _html.metadata
                        _post["title"] = _post_title
                        _post["link"] = source_html_path(fpath)
                        _post["markdown_link"] = site_url(source_markdown_path(fpath))
                        _post["absolute_link"] = site_url(_post["link"])
                        if "tags" in _post.keys():
                            _post["tags"] = [x.strip() for x in _post["tags"].split(",")]
                            _post["tags"] = [x.replace(" ","-") for x in _post["tags"]]
                            _post["tags"].sort()
                        else:
                            _post["tags"] = []
                        if "date" not in _post.keys():
                            _post["date"] = "2003-12-21 00:00"
                        _post["image_link"] = "/images/opengraph" + fpath.replace(
                            src_folder, ""
                        ).replace("md", "png")
                        toc_html = md._toc_html

                        to_write_path = "./Resources" + _post["image_link"]

                        # Check if image exists
                        if not os.path.exists(to_write_path):
                            print("Generating OG image for {}".format(fpath))
                            generate_og_image(
                                title=_post_title,
                                description=_post.get("description", ""),
                                tags=_post.get("tags", []),
                                output_path=to_write_path,
                            )

                        _post["image_link"] = base_link[:-1] + _post["image_link"]

                        if "draft" in _post and is_true(_post["draft"]):
                            post_me = False

                        if post_me:
                            write_markdown_twin(fpath)
                            tmp_array.append(_post)
                            post_collection.append(_post)
                            _html.metadata = _post
                            post_collection_html.append(_html)
                            for tag in _post["tags"]:
                                if tag not in tag_post_dict:
                                    tag_post_dict[tag] = []
                                tag_post_dict[tag].append(_post)
                    # print(fpath)
                    # print(render_markdown_post(fpath))
                    if post_me:
                        post_content = build_post_content(_html, _post, toc_html)
                        with open(output_html_path_for_source(fpath), "w", encoding="utf-8") as f:
                            f.write(render_markdown_post(post_content))
                elif y == "index.md":
                    fpath = os.path.join(x[0], y)
                    with open(fpath, encoding="utf-8") as f:
                        index_pages_to_generate.append(fpath)

            post_collection_dict[x[0].replace("{}/".format(src_folder), "")] = tmp_array
        else:
            print("Multiple Sub-Folders not Supported")

# print(sorted(post_collection,key=lambda i:i["date"]))
print(tag_post_dict.keys())

tag_folder = os.path.join(out_folder, "tags")
create_folder_ifnot(tag_folder)

for tag, post in tag_post_dict.items():
    with open(os.path.join(tag_folder, tag + ".html"), "w", encoding="utf-8") as f:
        f.write(
            render_markdown_post(
                f"<h1>{tag}</h1><p>Posts tagged '{tag}'</p>",
                template="section.html",
                posts=post,
                title=f'"{tag}"',
                page_url=site_url(f"/tags/{tag}.html"),
            )
        )

with open(os.path.join(tag_folder, "index.html"), "w", encoding="utf-8") as f:
    f.write(
        templates.get_template("tags.html").render(
            tags=tag_post_dict.items(),
            page_url=site_url("/tags/"),
            json_ld=build_json_ld(
                site_url("/tags/"),
                "Tags",
                "Browse posts by tag.",
                page_type="CollectionPage",
            ),
        )
    )

for fpath in index_pages_to_generate:
    write_markdown_twin(fpath)
    with open(fpath, encoding="utf-8") as f:
        _html = md.convert(f.read())
        page_url = site_url(source_html_path(fpath))
        markdown_link = site_url(source_markdown_path(fpath))
        try:
            page = render_markdown_post(
                _html,
                template="section.html",
                posts=post_collection_dict[
                    fpath.replace("{}/".format(src_folder), "").replace("/index.md", "")
                ],
                title=fpath.split("/")[-2].title(),
                page_url=page_url,
                markdown_link=markdown_link,
                page_type=page_schema_type(fpath),
            )
        except KeyError:
            new_post_collection = []
            for post in post_collection:
                if "visible_on_main" in post:
                    if post["visible_on_main"] == "false":
                        continue
                    else:
                        new_post_collection.append(post)
                else:
                    new_post_collection.append(post)
            page = render_markdown_post(
                _html,
                template="index.html",
                posts=new_post_collection,
                page_url=page_url,
                markdown_link=markdown_link,
                page_type=page_schema_type(fpath),
            )

    with open(output_html_path_for_source(fpath), "w", encoding="utf-8") as f:
        f.write(page)

for post in post_collection_html:
    post.metadata["link"] = "https://web.navan.dev" + post.metadata["link"]
    #post.metadata["date"] = email.utils.format_datetime(
    #    datetime.datetime.strptime(post.metadata["date"], "%Y-%m-%d %H:%M")
    #)

    # datetime in RFC 3339 format
    post.metadata["date"] = datetime.datetime.strptime(post.metadata["date"], "%Y-%m-%d %H:%M").isoformat()


rfc_3389 = datetime.datetime.now().isoformat()
with open(os.path.join(out_folder, "feed.rss"), "w", encoding="utf-8") as f:
    f.write(
        templates.get_template("feed.rss").render(
            feed={
                "title": f_title,
                "date": rfc_3389,
                "description": f_description,
                "link": base_link,
            },
            posts=post_collection_html,
        )
    )

with open(os.path.join(out_folder, "404.html"), "w", encoding="utf-8") as f:
    f.write(templates.get_template("404.html").render())

shutil.copytree(resources_folder, out_folder, dirs_exist_ok=True)
write_sitemap()
write_llms_txt()
write_robots_txt()
minify_css_outputs()
