---
date: 2020-10-11 16:12
description: Comparison of different cameras setups for using as a webcam and tutorials for the same.
tags: Tutorial, Review, Webcam
---

#  Trying Different Camera Setups 


0. Animated Overlays
1. Using a modern camera as your webcam
2. Using your phone's camera as your webcam
3. Using a USB Camera

## Comparison

Here are the results before you begin reading.


<div class="b-dics">
  <img src="/assets/posts/obs/normal.png" alt="Normal Webcam">
  <img src="/assets/posts/obs/usb.png" alt="USB Webcam">
  <img src="/assets/posts/obs/5S.png" alt="Camo iPhone 5S">
  <img src="/assets/posts/obs/11.png" alt="Camo iPhone 11">
  <img src="/assets/posts/obs/mirrorless.png" alt="Mirrorless Camera">
</div>




## Prerequisites

I am running macOS and iOS but I will try to link the same steps for Windows as well. If you are running Arch, I assume you already know what you are doing and are using this post as an inspiration and not a how-to guide.

I assume that you have Homebrew installed.

### OBS and OBS-Virtual-Cam

*Description*

```
brew cask install obs
brew cask install obs-virtualcam
```

Windows users can install the latest version of the plugin from [OBS-Forums](https://obsproject.com/forum/resources/obs-virtualcam.949/)

## 0. Animated Overlays

I have always liked PewDiePie's animated border he uses in his videos

![Still grab from PewDiePie's video showing border](/assets/posts/obs/01-pewdiepie.png)

The border was apparently made by a YouTuber [Sleepy Tanooki](https://www.youtube.com/watch?v=R__RUitpjnA). He posted a [link to a Google Drive folder](https://drive.google.com/drive/folders/1mL3HAvTQfG7mTqwCp-9xCJ2IFhZUoJ5W) containing the video file. (I will be using the video overlay for the example)

It is pretty simple to use overlays in OBS:

First, Create a new scene by clicking on the plus button on the bottom right corner.

![Bottom Panel of OBS](/assets/posts/obs/01-panel.png)

Now, in the Sources section click on the add button -> Video Capture Device -> Create New -> Choose your webcam from the Device section.

You may, resize if you want

After this, again click on the add button, but this time choose the `Media Source` option

![Media Source Option](/assets/posts/obs/01-media-source.png)

and, locate and choose the downloaded overlay.


## 1. Using a Modern Camera (Without using a Capture Card)

I have a Sony mirrorless camera. Using Sony's [Imaging Edge Desktop](https://imagingedge.sony.net/en/ie-desktop.html), you can use your laptop as a remote viewfinder and capture or record media.

After installing Image Edge Desktop or your Camera's equivalent, open the `Remote` application. 

![Remote showing available cameras](/assets/posts/obs/02-remote.png)

Once you are able to see the output of the camera on the application, switch to OBS. Create a new scene, and this time choose `Window Capture` in the Sources menu. After you have chosen the appropriate window, you may transform/crop the output using the properties/filters options.


## 2.1 Using your iPhone using Quicktime

Connect your iPhone via a USB cable, then Open Quicktime ->  File -> New Movie Recording 

In the Sources choose your device (No need to press record). You may open the camera app now.

![Choose Source](/assets/posts/obs/021-source.png)

Now, in OBS create a new scene, and in the sources choose the `Window Capture` option. You will need to rotate the source:

![Rotation](/assets/posts/obs/021-rotate.png)


## 2.2 Using your iPhone using an application like Camo

Install the Camo app on your phone through the app store -> connect to Mac using USB cable, install the companion app and you are done.

I tried both my current iPhone and an old iPhone 5S

## 3. A USB Webcam

The simplest solution, is to use a USB webcam. I used an old [Logitech C310](https://www.logitech.com/en-in/product/hd-webcam-c310) that was collecting dust. I was surprised to find that Logitech is still selling it after years and proudly advertising it! (5MP)

It did not sit well on my laptop, so I placed it on my definitely-not-Joby Gorrila Pod i had bought on Amazon for ~₹500

![USB Webcam](/assets/posts/obs/3-usb.png)
<head>
<link rel="stylesheet" href="/assets/posts/obs/dics.css">
<script src="/assets/posts/obs/dics.js"></script>
</head>
<script>

new Dics({
    container: document.querySelector('.b-dics')
});
</script>
