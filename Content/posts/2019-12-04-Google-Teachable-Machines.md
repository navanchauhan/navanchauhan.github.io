---
date: 2019-12-04 18:23
description: Tutorial on creating a custom image classifier quickly with Google Teachable Machines
tags: Tutorial
---

# Image Classifier With Teachable Machines

Made for Google Code-In

**Task Description**

Using Glitch and the Teachable Machines, build a Book Detector with Tensorflow.js. When a book is recognized, the code would randomly suggest a book/tell a famous quote from a book. Here is an example Project to get you started: https://glitch.com/~voltaic-acorn

### Details

1) Collecting Data

Teachable Machine allows you to create your dataset just by using your webcam! I created a database consisting of three classes ( Three Books ) and approximately grabbed 100 pictures for each book/class

![](/assets/gciTales/01-teachableMachines/01-collect.png)

2) Training

Training on teachable machines is as simple as clicking the train button. I did not even have to modify any configurations. 

![](/assets/gciTales/01-teachableMachines/02-train.png)

3) Finding Labels

Because I originally entered the entire name of the book and it's author's name as the label, the class name got truncated (Note to self, use shorter class names :p ). I then modified the code to print the modified label names in an alert box. 

![](/assets/gciTales/01-teachableMachines/03-label.png)

![](/assets/gciTales/01-teachableMachines/04-alert.png)

4) Adding a suggestions function

I first added a text field on the main page and then modified the JavaScript file to suggest a similar book whenever the model predicted with an accuracy >= 98% 

![](/assets/gciTales/01-teachableMachines/05-html.png)

![](/assets/gciTales/01-teachableMachines/06-js.png)

5) Running!

Here it is running!

![](/assets/gciTales/01-teachableMachines/07-eg.png)

![](/assets/gciTales/01-teachableMachines/08-eg.png)


Remix this project:-

https://luminous-opinion.glitch.me
