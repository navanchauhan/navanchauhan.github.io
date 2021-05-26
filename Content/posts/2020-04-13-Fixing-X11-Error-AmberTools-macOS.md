---
date: 2020-04-13 11:41
description: Fixing Could not find the X11 libraries; you may need to edit config.h, AmberTools macOS Catalina
tags: Molecular-Dynamics, macOS
---

# Fixing X11 Error on macOS Catalina for AmberTools 18/19

I was trying to install AmberTools on my macOS Catalina Installation. Running `./configure -macAccelerate clang` gave me an error that it could not find X11 libraries, even though `locate libXt` showed that my installation was correct.

Error:

```
Could not find the X11 libraries; you may need to edit config.h
   to set the XHOME and XLIBS variables.
Error: The X11 libraries are not in the usual location !
       To search for them try the command: locate libXt
       On new Fedora OS's install the libXt-devel libXext-devel
       libX11-devel libICE-devel libSM-devel packages.
       On old Fedora OS's install the xorg-x11-devel package.
       On RedHat OS's install the XFree86-devel package.
       On Ubuntu OS's install the xorg-dev and xserver-xorg packages.

          ...more info for various linuxes at ambermd.org/ubuntu.html

       To build Amber without XLEaP, re-run configure with '-noX11:
            ./configure -noX11 --with-python /usr/local/bin/python3 -macAccelerate clang
Configure failed due to the errors above!
```


I searched on Google for a solution. Sadly, there was not even a single thread which had a solution about this error.

## The Fix

Simply reinstalling XQuartz using homebrew fixed the error `brew cask reinstall xquartz`

If you do not have XQuartz installed, you need to run `brew cask install xquartz`
