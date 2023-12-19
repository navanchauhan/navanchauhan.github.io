---
date: 2020-03-03 18:37
description: Tinkering with an Android TV
tags: Android-TV, Android
---

# Tinkering with an Android TV

So I have an Android TV, this posts covers everything I have tried on it

## Contents

1. [Getting TV's IP Address](#IP-Address)
2. [Enable Developer Settings](#Developer-Settings)
3. [Enable ADB](#Enable-ADB)
4. [Connect ADB](#Connect-ADB)
5. [Manipulating Packages](#)

## IP-Address


*These steps should be similar for all Android-TVs*

* Go To Settings
* Go to Network
* Advanced Settings
* Network Status
* Note Down IP-Address


The other option is to go to your router's server page and get connected devices

## Developer-Settings

* Go To Settings
* About
* Continuously click on the "Build" option until it says "You are a Developer"

## Enable-ADB

* Go to Settings
* Go to Developer Options
* Scroll until you find ADB Debugging and enable that option

## Connect-ADB

* Open Terminal (Make sure you have ADB installed)
* Enter the following command `adb connect <IP_ADDRESS>`
* To test the connection run `adb logcat`

## Manipulating Apps / Packages


### Listing Packages


*  `adb shell`
* `pm list packages`


### Installing Packages


* `adb install -r package.apk`


### Uninstalling Packages


* `adb uninstall com.company.yourpackagename`
