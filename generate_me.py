import datetime
import hashlib
import json
import math
import os
import re
import shutil
import urllib.request
from html import unescape
from xml.sax.saxutils import escape as xml_escape

import rcssmin
from jinja2 import Environment, FileSystemLoader
from markdown2 import Markdown
from PIL import Image, ImageDraw, ImageFont

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


def format_date(date_str, html=False):
    dt = datetime.datetime.strptime(date_str[:10], "%Y-%m-%d")
    day = dt.day
    suffix = day_suffix(day)
    if html:
        suffix = f"<sup>{suffix}</sup>"
    return f"{day}{suffix} {dt.strftime('%B')}, {dt.year}"


templates.filters["pretty_date"] = lambda value: format_date(value, html=True)
templates.filters["pretty_date_inline"] = format_date


def site_url(path="/"):
    """Return an absolute URL for a site-relative path."""
    if str(path).startswith(("http://", "https://")):
        return str(path)
    path = "/" + str(path).lstrip("/")
    return base_link.rstrip("/") + ("/" if path == "/" else path)


def source_relative_path(source_path):
    return os.path.relpath(source_path, src_folder).replace(os.sep, "/")


def source_html_path(source_path):
    relative_path = source_relative_path(source_path)
    if relative_path == "index.md":
        return "/"
    if relative_path.endswith("/index.md"):
        return "/" + relative_path[: -len("index.md")]
    return "/" + os.path.splitext(relative_path)[0] + ".html"


def output_html_path_for_source(source_path):
    html_path = source_html_path(source_path)
    if html_path == "/":
        html_path = "/index.html"
    elif html_path.endswith("/"):
        html_path += "index.html"
    return os.path.join(out_folder, html_path.lstrip("/"))


def iso_date(value):
    try:
        return (
            datetime.datetime.strptime(str(value), "%Y-%m-%d %H:%M").date().isoformat()
        )
    except (TypeError, ValueError):
        return None


def page_schema_type(source_path):
    relative_path = source_relative_path(source_path)
    return {"index.md": "WebSite", "about/index.md": "ProfilePage"}.get(
        relative_path, "CollectionPage"
    )


def build_json_ld(
    page_url, page_title, description, page_type="WebPage", metadata=None
):
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
site_name = "Navan Chauhan"
source_repository = "https://github.com/navanchauhan/navanchauhan.github.io"
author_url = base_link.rstrip("/") + "/about/"
author_same_as = [
    "https://github.com/navanchauhan",
    "https://x.com/navanchauhan",
    "https://matrix.to/#/@navan:navan.dev",
]
image_text_font = "fonts/futura_light.ttf"
OG_FONT_CACHE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), ".og-fonts"
)
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
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def generate_og_image(title, description, tags, output_path):
    fonts = _ensure_og_fonts()

    img = Image.new("RGB", (OG_W, OG_H), OG_TEAL)
    draw = ImageDraw.Draw(img)

    title_font = ImageFont.truetype(fonts["abril_fatface"], 54)
    desc_font = ImageFont.truetype(fonts["futura_light"], 26)
    tag_font = ImageFont.truetype(fonts["pt_sans"], 18)
    site_font = ImageFont.truetype(fonts["pt_sans"], 18)

    lines = _og_wrap_text(title, title_font, OG_W - 160)
    total_h = sum(_og_text_height(line, title_font) + 14 for line in lines)
    y = max(60, (OG_H - total_h - 120) // 2)
    for line in lines:
        lw = title_font.getbbox(line)[2] - title_font.getbbox(line)[0]
        draw.text(((OG_W - lw) // 2, y), line, font=title_font, fill=(255, 255, 255))
        y += _og_text_height(line, title_font) + 14

    y += 15
    rule_w = 200
    draw.rectangle(
        [(OG_W - rule_w) // 2, y, (OG_W + rule_w) // 2, y + 2], fill=(255, 255, 255)
    )
    y += 25

    if description:
        desc_lines = _og_wrap_text(description, desc_font, OG_W - 200)
        for line in desc_lines:
            lw = desc_font.getbbox(line)[2] - desc_font.getbbox(line)[0]
            draw.text(((OG_W - lw) // 2, y), line, font=desc_font, fill=(200, 220, 230))
            y += _og_text_height(line, desc_font) + 6

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
            _og_rounded_rect(
                draw,
                (tag_x, tag_y, tag_x + pill_w, tag_y + pill_h),
                pill_h // 2,
                pill_color,
            )
            draw.text((tag_x + 10, tag_y + 3), tag, font=tag_font, fill=(200, 220, 230))
            tag_x += pill_w + 8

    draw.text(
        (OG_W - 200, OG_H - 40), "web.navan.dev", font=site_font, fill=(150, 190, 210)
    )

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
        "mermaid",
    ]
)

h1_tag = re.compile(r"<h1[^>]*>(.*?)</h1>")
h1_block_tag = re.compile(r"<h1[^>]*>.*?</h1>", re.DOTALL)
pre_block_tag = re.compile(r"<pre[^>]*>.*?</pre>", re.DOTALL)
html_tag = re.compile(r"<[^>]+>")
word_tag = re.compile(r"\b[\w][\w'.:/+-]*\b")
paragraph_img_tag = re.compile(
    r'<p>\s*(<img\b[^>]*\balt="([^"]*)"[^>]*>)\s*</p>', re.DOTALL
)


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
    template="post.html",
    posts=None,
    title=None,
    page_url=None,
    markdown_link=None,
    page_type="WebPage",
):
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


def minify_css_outputs():
    for relative_path in CSS_OUTPUT_PATHS:
        path = os.path.join(out_folder, relative_path)
        with open(path, "r", encoding="utf-8") as f:
            css = f.read()
        minified = rcssmin.cssmin(css, keep_bang_comments=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(minified)
            f.write("\n")


def prepare_output_folder():
    if os.path.isdir(out_folder):
        shutil.rmtree(out_folder)
    os.makedirs(out_folder, exist_ok=True)
    open(os.path.join(out_folder, ".gitkeep"), "a", encoding="utf-8").close()


def write_text(path, text):
    with open(path, "w", encoding="utf-8") as output:
        output.write(text)


def latest_post_date(posts):
    return max(
        filter(None, (iso_date(post.get("date")) for post in posts)), default=None
    )


def write_sitemap(index_pages, posts, sections, tags):
    entries = {site_url("/"): None}

    for fpath in index_pages:
        relative_path = source_relative_path(fpath)
        page_posts = (
            posts
            if relative_path == "index.md"
            else sections.get(os.path.dirname(relative_path), [])
        )
        entries[site_url(source_html_path(fpath))] = latest_post_date(page_posts)

    for post in posts:
        entries[site_url(post["link"])] = iso_date(post.get("date"))

    entries[site_url("/tags/")] = latest_post_date(posts)
    for tag, tag_posts in tags.items():
        entries[site_url(f"/tags/{tag}.html")] = latest_post_date(tag_posts)

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

    write_text(os.path.join(out_folder, "sitemap.xml"), "\n".join(lines) + "\n")


def write_llms_txt(posts):
    def link(label, url):
        safe_label = str(label).replace("\\", "\\\\").replace("]", "\\]")
        return f"[{safe_label}]({url})"

    core_links = (
        ("Homepage", "/"),
        ("About and links", "/about/"),
        ("All posts", "/posts/"),
        ("RSS / Atom feed", "/feed.rss"),
        ("Sitemap", "/sitemap.xml"),
        ("Privacy policy", "/misc/generic-privacy-policy.html"),
        ("Colophon", "/colophon/"),
        ("Source repository", source_repository),
    )
    lines = [
        "# Navan Chauhan",
        "",
        "> Personal website and archive for Navan Chauhan.",
        (
            "> The site contains software projects, technical writing, tutorials, "
            "and personal notes."
        ),
        "",
        "## Core resources",
        *(f"- {link(label, site_url(path))}" for label, path in core_links),
        "",
        "## Published pages",
    ]

    for post in sorted(posts, key=lambda item: item["date"], reverse=True):
        description = re.sub(r"\s+", " ", str(post.get("description") or "")).strip()
        suffix = f": {description}" if description else ""
        lines.append(
            f"- {link(post['title'], site_url(post['link']))}"
            f"{suffix} ({link('Markdown', post['markdown_link'])})"
        )

    write_text(os.path.join(out_folder, "llms.txt"), "\n".join(lines) + "\n")


def load_post(source_path):
    with open(source_path, encoding="utf-8") as source:
        html = md.convert(source.read())

    toc_html = md._toc_html
    title = re.search(h1_tag, html).group(1)
    post = html.metadata
    post.update(
        title=title,
        link=source_html_path(source_path),
        markdown_link=site_url("/" + source_relative_path(source_path)),
    )
    post["absolute_link"] = site_url(post["link"])
    post["tags"] = (
        sorted(tag.strip().replace(" ", "-") for tag in post["tags"].split(","))
        if "tags" in post
        else []
    )
    post.setdefault("date", "2003-12-21 00:00")
    post["image_link"] = "/images/opengraph" + source_path.replace(
        src_folder, ""
    ).replace("md", "png")

    image_path = "./Resources" + post["image_link"]
    if not os.path.exists(image_path):
        print(f"Generating OG image for {source_path}")
        generate_og_image(title, post.get("description", ""), post["tags"], image_path)
    post["image_link"] = base_link[:-1] + post["image_link"]
    return html, toc_html, post


def main():
    prepare_output_folder()

    posts, post_html, sections, tags, index_pages = [], [], {}, {}, []
    for walk_path, subdirectories, filenames in os.walk(src_folder):
        if walk_path == src_folder:
            index_pages.extend(
                os.path.join(walk_path, name)
                for name in filenames
                if name != ".DS_Store"
            )
            continue
        if subdirectories:
            print("Multiple Sub-Folders not Supported")
            continue

        section_posts = []
        os.makedirs(walk_path.replace(src_folder, out_folder), exist_ok=True)
        print("No sub folder")
        print(f"Posts in {walk_path}")
        for filename in filenames:
            source_path = os.path.join(walk_path, filename)
            if filename == "index.md":
                index_pages.append(source_path)
                continue
            if filename == ".DS_Store":
                continue

            html, toc_html, post = load_post(source_path)
            draft = post.get("draft")
            if draft is True or str(draft).strip().lower() in {"true", "yes", "1"}:
                continue

            shutil.copyfile(
                source_path, os.path.join(out_folder, source_relative_path(source_path))
            )
            section_posts.append(post)
            posts.append(post)
            html.metadata = post
            post_html.append(html)
            for tag in post["tags"]:
                tags.setdefault(tag, []).append(post)
            page_content = build_post_content(html, post, toc_html)
            write_text(
                output_html_path_for_source(source_path),
                render_markdown_post(page_content),
            )
        sections[walk_path.replace(f"{src_folder}/", "")] = section_posts

    print(tags.keys())
    tag_folder = os.path.join(out_folder, "tags")
    os.makedirs(tag_folder, exist_ok=True)
    for tag, tag_posts in tags.items():
        write_text(
            os.path.join(tag_folder, tag + ".html"),
            render_markdown_post(
                f"<h1>{tag}</h1><p>Posts tagged '{tag}'</p>",
                template="section.html",
                posts=tag_posts,
                title=f'"{tag}"',
                page_url=site_url(f"/tags/{tag}.html"),
            ),
        )
    write_text(
        os.path.join(tag_folder, "index.html"),
        templates.get_template("tags.html").render(
            tags=tags.items(),
            page_url=site_url("/tags/"),
            json_ld=build_json_ld(
                site_url("/tags/"),
                "Tags",
                "Browse posts by tag.",
                page_type="CollectionPage",
            ),
        ),
    )

    for source_path in index_pages:
        shutil.copyfile(
            source_path, os.path.join(out_folder, source_relative_path(source_path))
        )
        with open(source_path, encoding="utf-8") as source:
            html = md.convert(source.read())
        page_url = site_url(source_html_path(source_path))
        markdown_link = site_url("/" + source_relative_path(source_path))
        section = source_path.replace(f"{src_folder}/", "").replace("/index.md", "")
        is_section = section in sections
        page = render_markdown_post(
            html,
            template="section.html" if is_section else "index.html",
            posts=(
                sections[section]
                if is_section
                else [p for p in posts if p.get("visible_on_main", "true") != "false"]
            ),
            title=source_path.split("/")[-2].title() if is_section else None,
            page_url=page_url,
            markdown_link=markdown_link,
            page_type=page_schema_type(source_path),
        )
        write_text(output_html_path_for_source(source_path), page)

    for post in post_html:
        post.metadata["link"] = "https://web.navan.dev" + post.metadata["link"]
        post.metadata["date"] = datetime.datetime.strptime(
            post.metadata["date"], "%Y-%m-%d %H:%M"
        ).isoformat()
    write_text(
        os.path.join(out_folder, "feed.rss"),
        templates.get_template("feed.rss").render(
            feed={
                "title": f_title,
                "date": datetime.datetime.now().isoformat(),
                "description": f_description,
                "link": base_link,
            },
            posts=post_html,
        ),
    )
    write_text(
        os.path.join(out_folder, "404.html"),
        templates.get_template("404.html").render(),
    )

    shutil.copytree(resources_folder, out_folder, dirs_exist_ok=True)
    write_sitemap(index_pages, posts, sections, tags)
    write_llms_txt(posts)
    minify_css_outputs()


if __name__ == "__main__":
    main()
