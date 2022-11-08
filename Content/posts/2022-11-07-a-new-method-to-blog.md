---
date: 2022-11-07 23:29
description: Writing posts in markdown using pen and paper
tags: Python, OCR, Microsoft Azure
---

# A new method to blog

[Paper Website](https://paperwebsite.com) is a service that lets you build a website with just pen and paper. I am going to try and replicate the process.

## The Plan
The continuity feature on macOS + iOS lets you scan PDFs directly from your iPhone. I want to be able to scan these pages and automatically run an Automator script that takes the PDF and OCRs the text. Then I can further clean the text and convert from markdown.

## Challenges

I quickly realised that the OCR software I planned on using could not detect my shitty handwriting accurately. I tried using ABBY Finereader, Prizmo and OCRMyPDF. (Abby Finereader and Prizmo support being automated by Automator).

Now, I could either write neater, or use an external API like Microsoft Azure

## Solution

### OCR

In the PDFs, all the scans are saved as images on a page. I extract the image and then send it to Azure's API. 

### Paragraph Breaks
The recognised text had multiple lines breaking in the middle of the sentence, Therefore, I use what is called a [pilcrow](https://en.wikipedia.org/wiki/Pilcrow) to specify paragraph breaks. But, rather than trying to draw the normal pilcrow, I just use the HTML entity `&#182;` which is the pilcrow character. 

## Where is the code?
I created a [GitHub Gist](https://gist.github.com/navanchauhan/5fc602b1e023b60a66bc63bd4eecd4f8) for a sample Python script to take the PDF and print the text 

A more complete version with Auomator scripts and an entire publishing pipeline will be available as a GitHub and Gitea repo soon.

** In Part 2, I will discuss some more features ** 
