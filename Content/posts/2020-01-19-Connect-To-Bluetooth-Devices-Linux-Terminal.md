---
date: 2020-01-19 15:27
description: Connecting to Bluetooth Devices using terminal, tested on Raspberry Pi Zero W
tags: Code-Snippet, tutorial, Raspberry-Pi, Linux
---

# How to setup Bluetooth on a Raspberry Pi

*This was tested on a Raspberry Pi Zero W*

## Enter in the Bluetooth Mode

`pi@raspberrypi:~ $ bluetoothctl`

`[bluetooth]# agent on`

`[bluetooth]# default-agent`

`[bluetooth]# scan on`

## To Pair

While being in bluetooth mode

`[bluetooth]# pair XX:XX:XX:XX:XX:XX`


To Exit out of bluetoothctl anytime, just type exit 
