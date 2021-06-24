---
date: 2021-06-25 00:08
description: Converting Posts to Twitter Threads
tags: Python, Twitter, Eh
---

# Posting Blog Posts as Twitter Threads Part 1/n

Why? Eh, no good reason, but should be fun.

## Plan of Action

I recently shifted my website to a static site generator I wrote specifically for myself. 
Thus, it should be easy to just add a feature to check for new posts, split the text into chunks for Twitter threads and tweet them.
I am not handling lists or images right now.

## Time to Code

First, the dependency: tweepy for tweeting.

`pip install tweepy`

```python
import os
import tweepy

consumer_key = os.environ["consumer_key"]
consumer_secret = os.environ["consumer_secret"]

access_token = os.environ["access_token"]
access_token_secret = os.environ["access_token_secret"]

auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

api = tweepy.API(auth)
```

The program need to convert the blog post into text fragments.

It reads the markdown file, removes the top YAML content, checks for headers and splits the content.

```python
tweets = []

first___n = 0

with open(sample_markdown_file) as f:
	for line in f.readlines():
		if first___n <= 1:
			if line == "---\n":
				first___n += 1
			continue
		line = line.strip()
		line += " "
		if "#" in line:
			line = line.replace("#","")
			line.strip()
			line = "\n" + line
			line += "\n\n"
		try:
			if len(tweets[-1]) < 260 and (len(tweets[-1]) + len(line)) <= 260:
				tweets[-1] += line
			else:
				tweets.append(line)
		except IndexError:
			if len(line) > 260:
				print("ERROR")
			else:
				tweets.append(line)
```

Every status update using tweepy has an id attached to it, for the next tweet in the thread, it adds that ID while calling the function.

For every tweet fragment, it also appends 1/n.

```python
for idx, tweet in enumerate(tweets):
	tweet += " {}/{}".format(idx+1,len(tweets))
	if idx == 0:
		a = None
		a = api.update_status(tweet)
	else:
		a = api.update_status(tweet,in_reply_to_status_id=a.id)
	print(len(tweet),end=" ")
	print("{}/{}\n".format(idx+1,len(tweets)))
```

Finally, it replies to the last tweet in the thread with the link of the post.

```python
api.update_status("Web Version: {}".format(post_link))
```

## Result

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Posting Blog Posts as Twitter Threads Part 1/n <br><br> Why? Eh, no good reason, but should be fun. <br> Plan of Action <br><br> I recently shifted my website to a static site generator I wrote specifically for myself. 1/5</p>&mdash; Navan Chauhan (@navanchauhan) <a href="https://twitter.com/navanchauhan/status/1408165730487443456?ref_src=twsrc%5Etfw">June 24, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


<blockquote class="twitter-tweet" data-lang="en" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Web Version: <a href="https://t.co/zROU1F5DYv">https://t.co/zROU1F5DYv</a></p>&mdash; Navan Chauhan (@navanchauhan) <a href="https://twitter.com/navanchauhan/status/1408168879617052674?ref_src=twsrc%5Etfw">June 24, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>


## What's Next?

For the next part, I will try to append the code as well. 
I actually added the code to this post after running the program.