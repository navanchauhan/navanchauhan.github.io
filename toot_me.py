from mastodon import Mastodon
from mastodon.errors import MastodonAPIError
import requests
import re
import os

mastodon = Mastodon(
	access_token=os.environ.get("MASTODON_SECRET"),
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
				current_toot = TootContent(text=f"{line}:")
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
		
