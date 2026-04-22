from markdown2 import Markdown, UnicodeWithAttrs
import os
from jinja2 import Environment, FileSystemLoader
import shutil
import datetime
import email.utils
from helper_libs.image_utils import ImageText
from PIL import Image, ImageDraw, ImageFont
import urllib.request
import zipfile
import io

import re

templates = Environment(loader=FileSystemLoader("templates"))

def format_date_pretty(date_str):
    dt = datetime.datetime.strptime(date_str[:10], "%Y-%m-%d")
    day = dt.day
    if 11 <= day <= 13:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    return f"{day}<sup>{suffix}</sup> {dt.strftime('%B')}, {dt.year}"

templates.filters["pretty_date"] = format_date_pretty
src_folder = "Content"
out_folder = "docs"
resources_folder = "Resources"
base_link = "https://web.navan.dev/"
f_title = "Navan's Archive"
f_description = "Rare Tips, Tricks and Posts"
f_date = email.utils.format_datetime(datetime.datetime.now())

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

def render_markdown_post(
    html, metadata=None, template="post.html", posts=[], title=None
):
    global templates

    if len(posts) != 0:
        posts = sorted(posts, key=lambda i: i["date"], reverse=True)
    if title != None:
        return templates.get_template(template).render(
            content=html, posts=posts, title=title
        )
    else:
        return templates.get_template(template).render(content=html, posts=posts)


def create_folder_ifnot(folder_name):
    if not os.path.exists(folder_name):
        os.mkdir(folder_name)


post_collection_dict = {}
post_collection = []
post_collection_html = []
tag_post_dict = {}
index_pages_to_generate = []

create_folder_ifnot(out_folder)
shutil.copytree(resources_folder, out_folder, dirs_exist_ok=True)

first_run = True
for x in os.walk(src_folder):
    # print(x)
    if first_run:
        for y in x[-1]:
            if y != ".DS_Store":
                fpath = os.path.join(x[0], y)
                with open(fpath) as f:
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
                    with open(fpath) as f:
                        _html = md.convert(f.read())
                        _post_title = re.search(h1_tag, _html).group(1)
                        _post = _html.metadata
                        _post["title"] = _post_title
                        _post["link"] = fpath.replace(src_folder, "").replace(
                            "md", "html"
                        )
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
                        position = _html.find('</h1>')
                        toc_item_count = len(re.findall(r"<li>", toc_html))
                        if position != -1 and toc_item_count > 1:
                            metadata_copy = _html.metadata
                            title_art = '<img src="/illustrations/trees_and_mountains.png" alt="" aria-hidden="true">'
                            _html = UnicodeWithAttrs(_html[:position+5] + title_art + toc_html + _html[position+5:])
                            _html.metadata = metadata_copy

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

                        if "draft" in _post:
                            if _post["draft"] == "true":
                                post_me = False

                        if post_me:
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
                        with open(
                            fpath.replace(src_folder, out_folder).replace("md", "html"),
                            "w",
                        ) as f:
                            f.write(render_markdown_post(_html))
                elif y == "index.md":
                    fpath = os.path.join(x[0], y)
                    with open(fpath) as f:
                        index_pages_to_generate.append(fpath)

            post_collection_dict[x[0].replace("{}/".format(src_folder), "")] = tmp_array
        else:
            print("Multiple Sub-Folders not Supported")

# print(sorted(post_collection,key=lambda i:i["date"]))
print(tag_post_dict.keys())

tag_folder = os.path.join(out_folder, "tags")
create_folder_ifnot(tag_folder)

for tag, post in tag_post_dict.items():
    with open(os.path.join(tag_folder, tag + ".html"), "w") as f:
        f.write(
            render_markdown_post(
                f"<h1>{tag}</h1><p>Posts tagged '{tag}'</p>",
                template="section.html",
                posts=post,
                title=f'"{tag}"',
            )
        )

with open(os.path.join(tag_folder, "index.html"), "w") as f:
    f.write(
        templates.get_template("tags.html").render(
            tags=tag_post_dict.items(),
        )
    )

for fpath in index_pages_to_generate:
    with open(fpath) as f:
        _html = md.convert(f.read())
        try:
            page = render_markdown_post(
                _html,
                template="section.html",
                posts=post_collection_dict[
                    fpath.replace("{}/".format(src_folder), "").replace("/index.md", "")
                ],
                title=fpath.split("/")[-2].title(),
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
                _html, template="index.html", posts=new_post_collection
            )

    with open(fpath.replace(src_folder, out_folder).replace("md", "html"), "w") as f:
        f.write(page)

for post in post_collection_html:
    post.metadata["link"] = "https://web.navan.dev" + post.metadata["link"]
    #post.metadata["date"] = email.utils.format_datetime(
    #    datetime.datetime.strptime(post.metadata["date"], "%Y-%m-%d %H:%M")
    #)

    # datetime in RFC 3339 format
    post.metadata["date"] = datetime.datetime.strptime(post.metadata["date"], "%Y-%m-%d %H:%M").isoformat()


rfc_3389 = datetime.datetime.now().isoformat()
with open(os.path.join(out_folder, "feed.rss"), "w") as f:
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

with open(os.path.join(out_folder, "404.html"), "w") as f:
    f.write(templates.get_template("404.html").render())

shutil.copytree(resources_folder, out_folder, dirs_exist_ok=True)
