---
date: 2020-06-02 23:23
description: Compiling AutoDock Vina on iOS
tags: iOS, Jailbreak, Cheminformatics, AutoDock Vina, Molecular-Docking
---

# Compiling AutoDock Vina on iOS

Why? Because I can.


## Installing makedepend

`makedepend` is a Unix tool used to generate dependencies of C source files. Most modern programs do not use this anymore, but then again AutoDock Vina's source code hasn't been changed since 2011. The first hurdle came when I saw that there was no makedepend command, neither was there any package on any development repository for iOS. So, I tracked down the original source code for `makedepend` (https://github.com/DerellLicht/makedepend). According to the repository this is actually the source code for the makedepend utility that came with some XWindows distribution back around Y2K. I am pretty sure there is a problem with my current compiler configuration because I had to manually edit the `Makefile` to provide the path to the iOS SDKs using the `-isysroot` flag.


## Editing the Makefile

Original Makefile ( I used the provided mac Makefile base )

```
BASE=/usr/local
BOOST_VERSION=1_41
BOOST_INCLUDE = $(BASE)/include
C_PLATFORM=-arch i386 -arch ppc -isysroot /Developer/SDKs/MacOSX10.5.sdk -mmacosx-version-min=10.4
GPP=/usr/bin/g++
C_OPTIONS= -O3 -DNDEBUG
BOOST_LIB_VERSION=

include ../../makefile_common
```

I installed Boost 1.68.0-1 from Sam Bingner's repository. ( Otherwise I would have had to compile boost too 😫 )

Edited Makefile

```
BASE=/usr
BOOST_VERSION=1_68
BOOST_INCLUDE = $(BASE)/include
C_PLATFORM=-arch arm64 -isysroot /var/sdks/Latest.sdk
GPP=/usr/bin/g++
C_OPTIONS= -O3 -DNDEBUG
BOOST_LIB_VERSION=

include ../../makefile_common

```

## Updating the Source Code

Of course since Boost 1.41 many things have been added and deprecated, that is why I had to edit the source code to make it work with version 1.68

### Error 1 - No Matching Constructor

```
../../../src/main/main.cpp:50:9: error: no matching constructor for initialization of 'path' (aka 'boost::filesystem::path')
return path(str, boost::filesystem::native);
```

This was an easy fix, I just commented this and added a return statement to return the path

```
return path(str)
```

### Error 2 - No Member Named 'native_file_string'

```
../../../src/main/main.cpp:665:57: error: no member named 'native_file_string' in 'boost::filesystem::path'
                std::cerr << "\n\nError: could not open \"" << e.name.native_file_string() << "\" for " << (e.in ? "reading" : "writing") << ".\n";
                                                               ~~~~~~ ^
../../../src/main/main.cpp:677:80: error: no member named 'native_file_string' in 'boost::filesystem::path'
                std::cerr << "\n\nParse error on line " << e.line << " in file \"" << e.file.native_file_string() << "\": " << e.reason << '\n';
                                                                                      ~~~~~~ ^
2 errors generated.
```

Turns out `native_file_string` was deprecated in Boost 1.57 and replaced with just `string`

### Error 3 - Library Not Found

This one still boggles me because there was no reason for it to not work, as a workaround I downloaded the DEB, extracted it and used that path for compiling.

### Error 4 - No Member Named 'native_file_string' Again.

But, this time in another file and I quickly fixed it

## Moment of Truth

Obviously it was working on my iPad, but would it work on another device? I transferred the compiled binary and 

!["AutoDock Vina running on my iPhone"](/assets/posts/autodock-vina/s1.png)


The package is available on my repository and only depends on boost. ( Both, Vina and Vina-Split are part of the package)
