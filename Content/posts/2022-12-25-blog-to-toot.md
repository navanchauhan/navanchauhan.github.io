---
date: 2022-12-25 17:32
description: Cross posting blog posts to Mastodon
tags: Python, Mastodon
---

# Posting blogs as Mastodon Toots

What is better than posting a blog post? Posting about your posting pipeline. I did this previously with [Twitter](/posts/2021-06-25-Blog2Twitter-P1.html). 

## the elephant in the room

mastodon.social does not support any formatting in the status posts. 
Yes, there are other instances which have patches to enable features such as markdown formatting, but there is no upstream support.

## time to code

My website is built using a really simple static site generator I wrote in Python.
Therefore, each post is self-contained in a Markdown file with the necessary metadata.

I am going to specify the path to the blog post, parse it and then publish it.

I initially planned on having a command line parser and some more flags.

### interacting with mastodon

I ended up using mastodon.py rather than crafting requests by hand. Each status_post/toot call returns a status_id that can be then used as an in_reply_to parameter.

For the code snippets, seeing that mastodon does not support native formatting, I am resorting to using ray-so.

### reading markdown

I am using a bunch of regex hacks, and reading the blog post line by line. 
Because there is no markdown support, I append all the links to the end of the toot.
For images, I upload them and attach them to the toot.
The initial toot is generated based off the title and the tags associated with the post.

```python
# Regexes I am using

markdown_image = r'(?:!\[(.*?)\]\((.*?)\))'
markdown_links = r'(?:\[(.*?)\]\((.*?)\))'
tags_within_metadata = r"tags: ([\w,\s]+)"
metadata_regex = r"---\s*\n(.*?)\n---\s*\n"
```

This is useful when I want to get the exact data I want.
In this case, I can extract the tags from the front matter.

```python
metadata = re.search(metadata_regex, markdown_content, re.DOTALL)
if metadata:
	tags_match = re.search(r"tags: ([\w,\s]+)", metadata.group(1))
	if tags_match:
		tags = tags_match.group(1).split(",")
```

### code snippet support

I am running [akashrchandran/Rayso-API](https://github.com/akashrchandran/Rayso-API).

```python
import requests

def get_image(code, language: str = "python", title: str = "Code Snippet"):
	params = (
	    ('code', code),
	    ('language', language),
	    ('title', title),
	)

	response = requests.get('http://localhost:3000/api', params=params)

	return response.content
```

### threads! threads! threads!

Even though mastodon does officially have a higher character limit than Twitter. 
I prefer the way threads look.

## result

Everything does seem to work!
Seeing that you are reading this on Mastodon, and that I have updated this section.

<iframe src="https://mastodon.social/@navanchauhan/109577330116812393/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://static-cdn.mastodon.social/embed.js" async="async"></script>

## what's next?

Here is the current code:

```python
from mastodon import Mastodon
from mastodon.errors import MastodonAPIError
import requests
import re

mastodon = Mastodon(
	access_token='reeeeee',
	api_base_url="https://mastodon.social"
	)

url_base = "https://web.navan.dev"
sample_markdown_file = "Content/posts/2022-12-25-blog-to-toot.md"

tags = []
toots = []
image_idx = 0
markdown_image = r'(?:!\[(.*?)\]\((.*?)\))'
markdown_links = r'(?:\[(.*?)\]\((.*?)\))'

def get_image(code, language: str = "python", title: str = "Code Snippet"):
	params = (
	    ('code', code),
	    ('language', language),
	    ('title', title),
	)

	response = requests.get('http://localhost:3000/api', params=params)

	return response.content

class TootContent:
	def __init__(self, text: str = ""):
		self.text = text
		self.images = []
		self.links = []
		self.image_count = len(images)

	def __str__(self):
		toot_text = self.text
		for link in self.links:
			toot_text += " " + link
		return toot_text

	def get_text(self):
		toot_text = self.text
		for link in self.links:
			toot_text += " " + link
		return toot_text

	def get_length(self):
		length = len(self.text)
		for link in self.links:
			length += 23
		return length

	def add_link(self, link):
		if len(self.text) + 23 < 498:
			if link[0].lower() != 'h':
				link = url_base + link
			self.links.append(link)
			return True
		return False

	def add_image(self, image):
		
		if len(self.images) == 4:
			# will handle in future
			print("cannot upload more than 4 images per toot") 
			exit(1)
		# upload image and get id
		self.images.append(image)
		self.image_count = len(self.images)

	def add_text(self, text):
		if len(self.text + text) > 400:
			return False
		else:
			self.text += f" {text}"
			return True

	def get_links(self):
		print(len(self.links))


in_metadata = False
in_code_block = False

my_toots = []
text = ""
images = []
image_links = []
extra_links = []
tags = []

code_block = ""
language = "bash"

current_toot = TootContent()

metadata_regex = r"---\s*\n(.*?)\n---\s*\n"


with open(sample_markdown_file) as f:
	markdown_content = f.read()


metadata = re.search(metadata_regex, markdown_content, re.DOTALL)
if metadata:
	tags_match = re.search(r"tags: ([\w,\s]+)", metadata.group(1))
	if tags_match:
		tags = tags_match.group(1).split(",")


markdown_content = markdown_content.rsplit("---\n",1)[-1].strip()

for line in markdown_content.split("\n"):
	if current_toot.get_length() < 400:
		if line.strip() == '':
			continue
		if line[0] == '#':
			line = line.replace("#","".strip())
			if len(my_toots) == 0:
				current_toot.add_text(
					f"{line}: a cross-posted blog post \n"
					)
				hashtags = ""
				for tag in tags:
					hashtags += f"#{tag.strip()},"
				current_toot.add_text(hashtags[:-1])
				my_toots.append(current_toot)
				current_toot = TootContent()
			else:
				my_toots.append(current_toot)
				current_toot = TootContent(text=f"{line.title()}:")
			continue
		else:
			if "```" in line:
				in_code_block = not in_code_block
				if in_code_block:
					language = line.strip().replace("```",'')
					continue
				else:
					with open(f"code-snipped_{image_idx}.png","wb") as f:
						f.write(get_image(code_block, language))
					current_toot.add_image(f"code-snipped_{image_idx}.png")
					image_idx += 1
					code_block = ""
				continue
			if in_code_block:
				line = line.replace("	","\t")
				code_block += line + "\n"
				continue
			if len(re.findall(markdown_image,line)) > 0:
				for image_link in re.findall(markdown_links, line):
					image_link.append(image_link[1])
					# not handled yet
				line = re.sub(markdown_image,"",line)
			if len(re.findall(markdown_links,line)) > 0:
				for link in re.findall(markdown_links, line):
					if not (current_toot.add_link(link[1])):
						extra_links.append(link[1])
					line = line.replace(f'[{link[0]}]({link[1]})',link[0])
			if not current_toot.add_text(line):
				my_toots.append(current_toot)
				current_toot = TootContent(line)
	else:
		my_toots.append(current_toot)
		current_toot = TootContent()

my_toots.append(current_toot)

in_reply_to_id = None
for toot in my_toots:
	image_ids = []
	for image in toot.images:
		print(f"uploading image, {image}")
		try:
			image_id = mastodon.media_post(image)
			image_ids.append(image_id.id)
		except MastodonAPIError:
			print("failed to upload. Continuing...")
	if image_ids == []:
		image_ids = None
		
	in_reply_to_id = mastodon.status_post(
		toot.get_text(), in_reply_to_id=in_reply_to_id, media_ids=image_ids
		).id
		
```

Not the best thing I have ever written, but it works!



