from markdown2 import Markdown
import os
from jinja2 import Environment, FileSystemLoader
from distutils.dir_util import copy_tree
import datetime
import email.utils

templates = Environment(loader=FileSystemLoader("templates"))
src_folder = "Content"
out_folder = "docs"
resources_folder = "Resources"
base_link = "https://web.navan.dev/"
f_title = "Navan's Archive"
f_description = "Rare Tips, Tricks and Posts"
f_date = email.utils.format_datetime(datetime.datetime.now()) 

md = Markdown(extras=["fenced-code-blocks","metadata","task_list","tables","target-blank-links"])

def render_markdown_post(html,metadata=None,template="post.html",posts=[]):
	global templates

	if len(posts) != 0:
		posts = sorted(posts,key=lambda i:i["date"],reverse=True)
	return templates.get_template(template).render(content=html,posts=posts)

def create_folder_ifnot(folder_name):
	if not os.path.exists(folder_name):
		os.mkdir(folder_name)

post_collection_dict = {}
post_collection = []
post_collection_html = []
index_pages_to_generate = []

create_folder_ifnot(out_folder)
copy_tree(resources_folder,out_folder)

first_run = True
for x in os.walk(src_folder):
	#print(x)
	if first_run:
		for y in x[-1]:
			if y != ".DS_Store":
				fpath = os.path.join(x[0],y)
				with open(fpath) as f:
					index_pages_to_generate.append(fpath)	
		first_run = False
	else:
		if len(x[1]) == 0:
			create_folder_ifnot(x[0].replace(src_folder,out_folder))
			print("No sub folder")
			print("Posts in {}".format(x[0]))
			tmp_array = []
			for y in x[2]:
				if y not in ("index.md",".DS_Store"):
					fpath = os.path.join(x[0],y)
					with open(fpath) as f:
						_html = md.convert(f.read())
						_post_title = _html[4:_html.find("</h1>")]
						_post = _html.metadata
						_post["title"] = _post_title
						_post["link"] = fpath.replace(src_folder,"").replace("md","html")
						_post["tags"] = [x.strip() for x in _post["tags"].split(",")]

						tmp_array.append(_post)
						post_collection.append(_post)
						_html.metadata = _post
						post_collection_html.append(_html)
					#print(fpath)
					#print(render_markdown_post(fpath))
					with open(fpath.replace(src_folder,out_folder).replace("md","html"),"w") as f:
						f.write(render_markdown_post(_html))	
				elif y=="index.md":
					fpath = os.path.join(x[0],y)
					with open(fpath) as f:
						index_pages_to_generate.append(fpath)

			post_collection_dict[x[0].replace("{}/".format(src_folder),"")] = tmp_array
		else:
			print("Multiple Sub-Folders not Supported")

#print(sorted(post_collection,key=lambda i:i["date"]))

for fpath in index_pages_to_generate:
	with open(fpath) as f:
		_html = md.convert(f.read())
		try:
			page = render_markdown_post(_html,template="section.html",posts=post_collection_dict[
				fpath.replace("{}/".format(src_folder),"").replace("/index.md","")
			])
		except KeyError:
			page = render_markdown_post(_html, template="index.html",posts=post_collection)

	with open(fpath.replace(src_folder,out_folder).replace("md","html"),"w") as f:
		f.write(page)

for post in post_collection_html:
	post.metadata["link"] = "https://web.navan.dev" + post.metadata["link"]
	post.metadata["date"] = email.utils.format_datetime(datetime.datetime.strptime(post.metadata["date"],"%Y-%m-%d %H:%M")) 


with open(os.path.join(out_folder,"feed.rss"),"w") as f:
	f.write(templates.get_template("feed.rss").render(feed={
	"title":f_title,"date":f_date,"description":f_description,"link":base_link
	},posts=post_collection_html))