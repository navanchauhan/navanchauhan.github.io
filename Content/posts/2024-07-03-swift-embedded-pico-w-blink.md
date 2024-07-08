---
date: 2024-07-03 14:41 
description: Setting up macOS to run Apple's Swift Embedded Example on Raspberry Pi Pico-W
tags: Pico-W, Swift, macOS
---

# Swift Embedded on Pico W

## Pre-requisites

* **Install Embedded Swift Support:** Download and install the latest `main` development snapshot from Swift's [website.](https://www.swift.org/install/macos/#development-snapshots).
* **Install Embedded ARM Toolchain:** `brew install gcc-arm-embeddedc`

## Set up Pico C/C++ SDK

```bash
git clone https://github.com/raspberrypi/pico-sdk
cd pico-sdk
git submodule update --init
export PICO_SDK_PATH=${PWD}
```

*I would recommend adding the following to your ~/.zshrc or ~/.bash_profile*

```bash
export PICO_SDK_PATH=<path>
export PICO_BOARD=pico_w
```

## Apple's Swift Embedded Example

```bash
git clone https://github.com/apple/swift-embedded-examples
cd swift-embedded-examples

python3 -m venv env
source env/bin/activate
python3 -m pip install -r Tools/requirements.txt

cd pico-w-blink-sdk
export PICO_BOARD=pico_w
export TOOLCHAINS="Swift Development Snapshot"
cmake -B build -G Ninja .
```

Now, you can plug your board to your computer while holding down the `BOOTSEL` button. Then, simply copy the `uf2` file

```bash
cp build/swift-blinky.uf2 /Volumes/RPI-RP2
```
