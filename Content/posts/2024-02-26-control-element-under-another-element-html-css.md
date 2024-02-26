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

