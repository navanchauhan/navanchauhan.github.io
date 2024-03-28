from markdown3 import Markdown
import os
from jinja2 import Environment, FileSystemLoader
from distutils.dir_util import copy_tree
import datetime
import email.utils
from helper_libs.image_utils import ImageText
from PIL import Image

import re

templates = Environment(loader=FileSystemLoader("templates"))
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

md = Markdown(
    extras=[
        "fenced-code-blocks",
        "metadata",
        "task_list",
        "tables",
        "target-blank-links",
        "header-ids",
        "latex",
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
copy_tree(resources_folder, out_folder)

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
                        _post["tags"] = [x.strip() for x in _post["tags"].split(",")]
                        _post["image_link"] = "/images/opengraph" + fpath.replace(
                            src_folder, ""
                        ).replace("md", "png")

                        to_write_path = "./Resources" + _post["image_link"]

                        # Check if image exists
                        if not os.path.exists(to_write_path):
                            print(print("Generating Image for {}".format(fpath)))
                            img = ImageText((1200, 630), background=(238, 238, 238))
                            dall_e_image = to_write_path.replace("images/opengraph","DallE3Base")
                            if (os.path.exists(dall_e_image)):
                                print("Found DallE3Base Image")
                                img = ImageText((1200,630), background=(248,247,240))
                                dall_e_image_file = Image.open(dall_e_image)
                                dall_e_image_file = dall_e_image_file.resize((630,630))
                                img.paste(dall_e_image_file, (570,0))
                                img.write_text_box(
                                        (35, 50),
                                        _post_title,
                                        box_width=500,
                                        font_filename=image_title_font,
                                        font_size=65,
                                        color=image_title_color,
                                        place="center",
                                    )
                                img.line(
                                    shape=[(500, 400), (70,400)], fill=image_line_color, width=5
                                )
                                img.write_text_box(
                                        (35, 435),
                                        _post["description"],
                                        box_width=500,
                                        font_filename=image_text_font,
                                        font_size=32,
                                        color=(0, 0, 0),
                                        place="center",
                                    )
                            else: 
                            #img = ImageText((1200, 630), background=(238, 238, 238))
                                img.write_text_box(
                                    (100, 50),
                                    _post_title,
                                    box_width=1000,
                                    font_filename=image_title_font,
                                    font_size=65,
                                    color=image_title_color,
                                    place="center",
                                )
                                img.line(
                                    shape=[(400, 400), (800, 400)], fill=image_line_color
                                )
                                img.write_text_box(
                                    (100, 430),
                                    f'Tags: {", ".join(_post["tags"])}',
                                    box_width=1000,
                                    font_filename=image_text_font,
                                    font_size=32,
                                    color=(0, 0, 0),
                                    place="left",
                                )
                                img.write_text_box(
                                    (100, 400),
                                    f'Date: {_post["date"]}',
                                    box_width=1000,
                                    font_filename=image_text_font,
                                    font_size=32,
                                    color=(0, 0, 0),
                                    place="left",
                                )
                            try:
                                img.save(to_write_path)
                            except FileNotFoundError as e:
                                if not os.path.exists(to_write_path.rsplit("/", 1)[0]):
                                    os.makedirs(to_write_path.rsplit("/", 1)[0])
                                    img.save(to_write_path)
                                else:
                                    print(e)
                                    exit(1)

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
    post.metadata["date"] = email.utils.format_datetime(
        datetime.datetime.strptime(post.metadata["date"], "%Y-%m-%d %H:%M")
    )


with open(os.path.join(out_folder, "feed.rss"), "w") as f:
    f.write(
        templates.get_template("feed.rss").render(
            feed={
                "title": f_title,
                "date": f_date,
                "description": f_description,
                "link": base_link,
            },
            posts=post_collection_html,
        )
    )

copy_tree(resources_folder, out_folder)
