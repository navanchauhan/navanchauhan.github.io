---
date: 2024-02-26 11:57
description: With CSS you can disable any interactions with an element and directly control the underlying element
tags: HTML, CSS
draft: false
---

# Interacting with underlying element in HTML

I know that the title is a bit weird. I was trying to interact with a video under an iPhone Bezel Screen frame.

```html
<div class="row-span-2 md:col-span-1 rounded-xl border-2 border-slate-400/10 bg-neutral-100 p-4 dark:bg-neutral-900">
    <div class="content flex flex-wrap content-center justify-center">
        <img src="iphone-12-white.png" class="h-[60vh] z-10 absolute">
        <!--<img src="screenshot2.jpeg" class="h-[57vh] mt-4 mr-1 rounded-[2rem]">-->
        <video src="screenrec.mp4" class="h-[57vh] mt-4 mr-1 rounded-[2rem]" controls muted autoplay></video>
    </div>
</div>
```

![Video Under a Transparent Image](/assets/underlying/video-under-element.jpg)

Turns out, you can disable pointer events!

In Tailwind, it is as simple as adding `pointer-events-none` to the bezel screen.

In CSS, this can be done by:

```css
.className {
    pointer-events: none
}
```

Let us try this in a simple example.

## Example

Here, we create a button and overlay a transparent box

```html
<div style="height: 200px; width: 300px; background-color: rgba(255, 0, 0, 0.4); z-index: 2; position: absolute;">
A box with 200px height and 200px width
</div>
<button style="z-index: 1; margin-top: 20px; margin-bottom: 200px;" onclick="alert('You were able to click this button')">Try clicking me</button>
```

<hr>

<div style="height: 200px; width: 300px; background-color: rgba(255, 0, 0, 0.4); z-index: 2; position: absolute;">
A box with 200px height and 300px width
</div>
<button style="z-index: 1; margin-top: 20px; margin-bottom: 200px;" onclick="alert('You were able to click this button')">Try clicking me</button>
<hr>

As you can see, you cannot click the button because the red box comes in the way. We can fix this by adding `pointer-events: none` to the box. 

```html
<div style="height: 200px; width: 300px; background-color: rgba(0, 255, 0, 0.4); z-index: 2; position: absolute; pointer-events: none;">
A box with 200px height and 300px width
</div>
<button style="z-index: 1; margin-top: 20px; margin-bottom: 200px" onclick="alert('You were able to click this button')">Try clicking me</button>
</div>
```

<hr>

<div style="height: 200px; width: 300px; background-color: rgba(0, 255, 0, 0.4); z-index: 2; position: absolute; pointer-events: none;">
A box with 200px height and 300px width
</div>
<button style="z-index: 1; margin-top: 20px; margin-bottom: 200px" onclick="alert('You were able to click this button')">Try clicking me</button>
</div>




