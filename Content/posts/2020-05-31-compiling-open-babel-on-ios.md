---
date: 2020-05-31 23:30
description: Compiling Open Babel on iOS
tags: iOS, Jailbreak, Cheminformatics, Open-Babel
---

# Compiling Open Babel on iOS

Due to the fact that my summer vacations started today,
I had the brilliant idea of trying to run open babel on my iPad.
To give a little background, I had tried to compile AutoDock Vina using a cross-compiler but I had miserably failed.

I am running the Checkr1n jailbreak on my iPad and the Unc0ver jailbreak on my phone.

## But Why?

Well, just because I can. This is literally the only reason I tried compiling it and also partially because in the long run I want to compile AutoDock Vina so I can do Molecular Docking on the go.

## Let's Go!

How hard can it be to compile open babel right? It is just a simple software with clear and concise build instructions. I just need to use `cmake` to build and the `make` to install.


It is 11 AM in the morning. I install `clang, cmake and make` from the Sam Bingner's repository, fired up ssh, downloaded the source code and ran the build command.`clang


### Fail No. 1

I couldn't even get cmake to run, I did a little digging around StackOverflow and founf that I needed the iOS SDK, sure no problem. I waited for Xcode to update and transferred the SDKs to my iPad 

```
scp -r /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk root@192.168.1.8:/var/sdks/
```

Them I told cmake that this is the location for my SDK 😠. Successful! Now I just needed to use make.


### Fail No. 2

It was giving the error that thread-local-storage was not supported on this device.

```
[  0%] Building CXX object src/CMakeFiles/openbabel.dir/alias.cpp.o
[  1%] Building CXX object src/CMakeFiles/openbabel.dir/atom.cpp.o
In file included from /var/root/obabel/ob-src/src/atom.cpp:28:
In file included from /var/root/obabel/ob-src/include/openbabel/ring.h:29:
/var/root/obabel/ob-src/include/openbabel/typer.h:70:1: error: thread-local storage is not supported for the current target
THREAD_LOCAL OB_EXTERN OBAtomTyper      atomtyper;
^
/var/root/obabel/ob-src/include/openbabel/mol.h:35:24: note: expanded from macro 'THREAD_LOCAL'
#  define THREAD_LOCAL thread_local
                       ^
In file included from /var/root/obabel/ob-src/src/atom.cpp:28:
In file included from /var/root/obabel/ob-src/include/openbabel/ring.h:29:
/var/root/obabel/ob-src/include/openbabel/typer.h:84:1: error: thread-local storage is not supported for the current target
THREAD_LOCAL OB_EXTERN OBAromaticTyper  aromtyper;
^
/var/root/obabel/ob-src/include/openbabel/mol.h:35:24: note: expanded from macro 'THREAD_LOCAL'
#  define THREAD_LOCAL thread_local
                       ^
/var/root/obabel/ob-src/src/atom.cpp:107:10: error: thread-local storage is not supported for the current target
  extern THREAD_LOCAL OBAromaticTyper  aromtyper;
         ^
/var/root/obabel/ob-src/include/openbabel/mol.h:35:24: note: expanded from macro 'THREAD_LOCAL'
#  define THREAD_LOCAL thread_local
                       ^
/var/root/obabel/ob-src/src/atom.cpp:108:10: error: thread-local storage is not supported for the current target
  extern THREAD_LOCAL OBAtomTyper      atomtyper;
         ^
/var/root/obabel/ob-src/include/openbabel/mol.h:35:24: note: expanded from macro 'THREAD_LOCAL'
#  define THREAD_LOCAL thread_local
                       ^
/var/root/obabel/ob-src/src/atom.cpp:109:10: error: thread-local storage is not supported for the current target
  extern THREAD_LOCAL OBPhModel        phmodel;
         ^
/var/root/obabel/ob-src/include/openbabel/mol.h:35:24: note: expanded from macro 'THREAD_LOCAL'
#  define THREAD_LOCAL thread_local
                       ^
5 errors generated.
make[2]: *** [src/CMakeFiles/openbabel.dir/build.make:76: src/CMakeFiles/openbabel.dir/atom.cpp.o] Error 1
make[1]: *** [CMakeFiles/Makefile2:1085: src/CMakeFiles/openbabel.dir/all] Error 2
make: *** [Makefile:129: all] Error 2
```

Strange but it is alright, there is nothing that hasn't been answered on the internet.

I did a little digging around and could not find a solution 😔

As a temporary fix, I disabled multithreading by going and commenting the lines in the source code.


!["Open-Babel running on my iPad"](/assets/posts/open-babel/s1.png)


## Packaging as a deb

This was pretty straight forward, I tried installing it on my iPad and it was working pretty smoothly.

## Moment of Truth

So I airdropped the .deb to my phone and tried installing it, the installation was successful but when I tried `obabel` it just aborted.


!["Open Babel crashing"](/assets/posts/open-babel/s2.jpg)


Turns out because I had created an install target of a separate folder while compiling, the binaries were referencing a non-existing dylib rather than those in the /usr/lib folder. As a quick workaround I transferred the deb folder to my laptop and used otool and install_name tool: `install_name_tool -change /var/root/obabel/ob-build/lib/libopenbabel.7.dylib /usr/lib/libopenbabel.7.dylib` for all the executables and then signed them using jtool


I then installed it and everything went smoothly, I even ran `obabel` and it executed perfectly, showing the version number 3.1.0 ✌️ Ahh, smooth victory.


Nope. When I tried converting from SMILES to pdbqt, it gave an error saying plugin not found. This was weird.

!["Open Babel Plugin Error"](/assets/posts/open-babel/s3.jpg)

So I just copied the entire build folder from my iPad to my phone and tried running it. Oops, Apple Sandbox Error, Oh no!

I spent 2 hours around this problem, only to see the documentation and realise I hadn't setup the environment variable 🤦‍♂️

## The Final Fix ( For Now )

```
export BABEL_DATADIR="/usr/share/openbabel/3.1.0"
export BABEL_LIBDIR="/usr/lib/openbabel/3.1.0"
```

This was the tragedy of trying to compile something without knowing enough about compiling. It is 11:30 as of writing this. Something as trivial as this should not have taken me so long. Am I going to try to compile AutoDock Vina next? 🤔 Maybe.


Also, if you want to try Open Babel on you jailbroken iDevice, install the package from my repository ( You, need to run the above mentioned final fix :p ). This was tested on iOS 13.5, I cannot tell if it will work on others or not.



Hopefully, I add some more screenshots to this post.

Edit 1: Added Screenshots, had to replicate the errors.

