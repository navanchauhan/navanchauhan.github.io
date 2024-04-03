---
date: 2024-03-15 13:16
description: This goes through compiling Open Watcom 2 and creating simple hello-world exampls
tags: DOS, x86, macOS
draft: false
---

# Cross-Compiling Hello World for DOS on macOS

Technically this should work for any platform that OpenWatcom 2 supports compiling binaries for. Some instructions are based on [a post at retrocoding.net](https://retrocoding.net/openwatcom-gateway-to-ancient-world-of-x86),
 and [John Tsiombikas's post](http://nuclear.mutantstargoat.com/articles/retrocoding/dos01-setup/#hello-world-program)

## Prerequisites

You should already have XCode / Command Line Tools, and Homebrew installed. To compile Open Watcom for DOS you will need DOSBox (I use DOSBox-X).

```bash
brew install --cask dosbox-x
```

## Compiling Open Watcom v2

*If this process is super annoying, I might make a custom homebrew tap to build and install Open Watcom*

```bash
git clone https://github.com/open-watcom/open-watcom-v2
cp open-watcom-v2/setvars.sh custom_setvars.sh
```

Now, edit this `setvars.sh` file. My file looks like this:

```bash
#!/bin/zsh
export OWROOT="/Users/navanchauhan/Developer/8088Stuff/open-watcom-v2"
export OWTOOLS=CLANG
export OWDOCBUILD=0
export OWGUINOBUILD=0
export OWDISTRBUILD=0
export OWDOSBOX="/Applications/dosbox-x.app/Contents/MacOS/dosbox-x"
export OWOBJDIR=binbuildV01
. "$OWROOT/cmnvars.sh"
echo "OWROOT=$OWROOT"
cd "$OWROOT"
```

Note, your `OWRTOOT` is definitely going to be in a different location.

```bash
source ./custom_setvars.sh
./build.sh
./build.sh rel
```

This will build, and then copy everything to the `rel` directory inside `open-watcom-v2` directory. Since I ran this on an Apple Silicon Mac, 
 all the binaries for me are in the `armo64` directory. You can now move everything inside the rel folder to another location, or create a simple 
 script to init all variables whenever you want.

I like having a script called `exportVarsForDOS.sh` 

```bash
#!/bin/zsh

export WATCOM=/Users/navanchauhan/Developer/8088Stuff/open-watcom-v2/rel
export PATH=$PATH:$WATCOM/armo64
export EDDAT=$WATCOM/eddat

# For DOS 8088/8086 development
export INCLUDE=$WATCOM/h
export LIB=$WATCOM/lib286 # You don't really need this
```

Then, when you need to load up these variables, you can simply run `source exportVarsForDOS.sh` or `. exportVarsForDOS.sh`

## Hello World

### Buliding without any Makefiles

Create a new file called `example1.c`

```c
#include<stdio.h>

int main() {
    printf("Hello World!");
    return 0;
}
```

First we compile the code:

```bash
$ wcc example1.c
Open Watcom C x86 16-bit Optimizing Compiler
Version 2.0 beta Mar 15 2024 13:11:55
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1984-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
example1.c: 7 lines, included 818, 0 warnings, 0 errors
Code size: 19
```

Then, link to make an executable:

```bash
$ wlink name example1.exe system dos file example1.o
Open Watcom Linker Version 2.0 beta Mar 15 2024 13:10:09
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1985-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
loading object files
searching libraries
creating a DOS executable 
```

If you want to test this executable, jump to the section titled `Testing with DOSBox-X` below.

### Simple Makefile

```makefile
obj = main.o hello.o
bin = tizts.com

CC = wcc
CFLAGS = -0
LD = wlink

$(bin): $(obj)
	$(LD) name $@ system dos file main.o file hello.o 

.c.o:
	$(CC) $(CFLAGS) $<

clean:
	rm $(obj) $(bin)
```

Where, `main.c`
```c
void hello(void);

int main(void)
{
    hello();
    return 0;
}
```

and `hello.c`

```c
/* hello.c */
#include <stdio.h>

void hello(void)
{
    printf("Hello!");
}
```

To compile into `tizts.com` simply run `wmake`

```bash
$ wmake
➜  simple-cpp wmake
Open Watcom Make Version 2.0 beta Mar 15 2024 13:10:16
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1988-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
	wcc -0 main.c
Open Watcom C x86 16-bit Optimizing Compiler
Version 2.0 beta Mar 15 2024 13:11:55
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1984-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
main.c(8): Warning! W138: No newline at end of file
main.c: 8 lines, included 53, 1 warnings, 0 errors
Code size: 12
	wcc -0 hello.c
Open Watcom C x86 16-bit Optimizing Compiler
Version 2.0 beta Mar 15 2024 13:11:55
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1984-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
hello.c: 8 lines, included 818, 0 warnings, 0 errors
Code size: 17
	wlink name tizts.com system dos file main.o file hello.o
Open Watcom Linker Version 2.0 beta Mar 15 2024 13:10:09
Copyright (c) 2002-2024 The Open Watcom Contributors. All Rights Reserved.
Portions Copyright (c) 1985-2002 Sybase, Inc. All Rights Reserved.
Source code is available under the Sybase Open Watcom Public License.
See https://github.com/open-watcom/open-watcom-v2#readme for details.
loading object files
searching libraries
creating a DOS executable
```

### Using CMake

Create a file called `CMakeLists.txt`

```CMake
project(hello)

set(SOURCES abc.c)

add_executable(hello ${SOURCES})
```

Where, `abc.c` is:

```c
#include <stdio.h>

int main() {
    printf("Does this work?");
    return 0;
}
```

```bash
mkdir build
cd build
```

And build using CMake

```
cmake -DCMAKE_SYSTEM_NAME=DOS -DCMAKE_SYSTEM_PROCESSOR=I86 -DCMAKE_C_FLAGS="-0 -bt=dos -d0 -oaxt" -G "Watcom WMake" ../..
```

There you have it. Three different ways to compile a C program on a macOS device in 2024 that can run on an IBM PC 5150 (which was released in 1981!)

## Testing with DOSBox-X

```bash
cp example1.exe ~/Downloads
/Applications/dosbox-x.app/Contents/MacOS/dosbox-x
```

In DOSBox-X we now mount the `~/Downloads` folder as our `C:` drive

```
mount C ~/Downloads
```

Switch to the C drive

```
C:
```

Run the program:

```
example1
```

![Running our program in DOSBox-X](/assets/posts/dosbox/hello-world.png)

*My DOSBox setup might look slightly different than yours...*


