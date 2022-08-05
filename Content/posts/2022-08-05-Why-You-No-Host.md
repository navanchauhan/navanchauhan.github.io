---
date: 2022-08-05 14:46
description: Why you should self-host with YunoHost
tags: Self-Hosted, YunoHost
---

# Why You No Host?

With all these data leaks happening every other day, why have you not started self-hosting?

The title refers to the “Y U No Host” internet meme, which led to the name of “YunoHost”, an operating system aiming to democratise self-hosting. This post tries to discuss the idea that anyone can self-host and why you should consider YunoHost.

## Should you Self-Host?

* Do you get annoyed when half of the internet goes down because everything a few major companies host the majority of the internet?
  * [Cloudflare outage](https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/)
  * [Amazon Web Services outage](https://www.fiercetelecom.com/cloud/extended-aws-outage-disrupts-services-across-globe)
  * [Google Cloud Platform outage](https://www.crn.com/news/cloud/google-cloud-outage-takes-major-websites-and-apps-down)
* Do you get annoyed when lifetime promises go bust and you don’t actually own anything?
  * [Google Photos Unlimited Storage ending](https://support.google.com/photos/answer/10100180?hl=en)
  * [Nextbit shutting down its Smart Storage Cloud](https://www.theverge.com/2018/1/9/16867380/nextbit-smart-storage-cloud-service-shut-down-robin-phone) 
  * [Sony removing purchased movies from libraries](https://www.theverge.com/2022/7/8/23199861/playstation-store-film-tv-show-removed-austria-germany-studiocanal)
* How about account suspensions without any prior notice?
  * [Hacker News stories with “account suspended“](https://hn.algolia.com/?dateRange=all&page=0&prefix=true&query=account%20suspended&sort=byPopularity&type=story)
* Do you value security and privacy?
* Or, do you want a new hobby?

These are just some of the reasons to self-host.

## What if you don’t know anything?

No one is born with the knowledge of knowing how to orchestrate a cluster. You can always learn how to, but sometimes you just don’t have the time or energy. YunoHost tries to ease this issue by providing a clean web-interface. You do not even need to touch the command line for all the basic tasks.

## What should you self-host?

Anything and everything! The best part about self-hosting is that you own the data. This data is not going to be sold to the highest bidder.

Just because you like watching YouTube does not mean you cannot self-host a privacy friendly front-end for it on your server. Why stop there, why not create your own Google Drive / Dropbox alternative and host it on your own with actual unlimited storage, where the only limit is how much capacity you want. Do you own tons of audiobooks or DVDs/Blu-rays? Simply host an audiobook server or create your own personal Netflix and share it with your friends and family.

Do you own a small-business? Do you hate the idea of having your sensitive e-mails stored on someone else’s server? Why not setup your own mail server, with contacts and calendar syncing.

Do you run a small hobby group? Why not host a forum for everyone to discuss on? Or, simply a chat server where everyone can hop on and text, or call.

Although you can do all of this (and much more!) without needing to use YunoHost, it just makes it easy to manage.

## What do I need to self-host?

* A decent internet connection if you plan on using the services outside your home network and hosting at home
* Anything that can run Debian 10/11. Some examples:
  * A used server/PC bought in a Library/University’s liquidation sale
  * An old laptop nobody uses
  * A Raspberry Pi 4
  * A VPS (Checkout Linode, Hetzner, OVH)
* Some patience

## [What is YunoHost](https://yunohost.org/en/whatsyunohost?q=%2Fwhatsyunohost)?

 ![](/assets/y-u-n-o/meme.png)

YunoHost is a server operating system which takes  guesswork out of Self-Hosting. Out of the box it provides:

* a web-interface for easy administration
* few click app deployments 
* multiple user support (with exposed ldap to integrate with your apps)
* automatic ssl certificate management for your domains
* integrated backup and restoration for all apps
* security features (fail2ban, firewall)
* Free *.noho.st domain(s)!

and much more!

### Why did I choose YunoHost?

I began my self-hosting journey with a Raspberry Pi 4 (4GB). I looked at tons of options for the base management layer:

* [Sandstorm](https://sandstorm.io/install) - Does not run on arm64
* [Cloudron](https://www.cloudron.io) - 2 app limitation on the free tier
  * Although I don’t have a problem with paying for software licenses, having an app limit on something which you are self-hosting and you don’t want support is kind of confusing
* Plain [Ubuntu Server](https://ubuntu.com/download/server) - I didn’t want to waste time configuring everything

One look at the user portal and I was sold. Yep, more than the features it was the app screen which looked like elements from the periodic table which sold me on the idea of using YunoHost. 

Although there is no “correct“ way to self-host, YunoHost is indeed an easier way.

 ![YunoHost SSO Login Screen](/assets/y-u-n-o/ssys.png)
 ![YunoHost Portal](/assets/y-u-n-o/ssyp.png)
 ![YunoHost Web Admin](/assets/y-u-n-o/ssyw.png)

The stock Raspberry Pi image provided by YunoHost meant you don’t run in full arm64 mode. I had to first install Debian and then install YunoHost to get full arm64 goodness. 

Setting up the domain was as painless as following the online web admin diagnosis page to copy paste DNS records. 

The easiest way to deploy any app is to use Docker. I dislike this approach for a variety of reasons but I am not going to cover them here. All YunoHost apps are packaged to run on bare-metal for the best performance. See an app that does not have pre-compiled binaries? The package installer will download the latest source, install dependencies, compile, and then clean all the unnecessary files. Because you are running Debian after all, you can always SSH into the server and install docker if you want to. You can even install Portainer through YunoHost’s app catalogue if you really want to. 

### What do I self-host?

#### audiobookshelf - an audiobook server

 ![Audiobook server](/assets/y-u-n-o/ssabs.png)

#### ergo chat - an IRC server

 ![Screenshot of Textual Client connected to my IRC server](/assets/y-u-n-o/sst.png)

#### FreshRSS - RSS aggregator

 ![Screenshot of FreshRSS](/assets/y-u-n-o/ssfr.png)

#### Gitea - self-hosted git

####  ![Screenshot of Gitea dashboard with logs about repository mirroring](/assets/y-u-n-o/ssgi.png)

#### Grafana - Metrics dashboard

![Grafana Dashboard](/assets/y-u-n-o/ssgr.png)

#### Home Assistant - Home automation platform

 ![Screenshot of Home Assistant dashboard](/assets/y-u-n-o/ssha.png)

#### Jellyfin - Media server

 ![Screenshot of Jellyfin showing movies ](/assets/y-u-n-o/ssj.png)

#### Listmonk - Newsletter and Mailing List manager

 ![Screenshot of ListMonk](/assets/y-u-n-o/ssl.png)

#### MinIO Server - S3 compatible storage server

 ![Screenshot of MinIO console](/assets/y-u-n-o/ssm.png)

#### Nextcloud - Storage, file-sharing, e.t.c

 ![Screenshot of Nextcloud dashboard](/assets/y-u-n-o/ssn.png)

#### Syncthing - continuous file synchronization

 ![Screenshot of Synching dashboard](/assets/y-u-n-o/sss.png)

#### Vaultwarden - Bitwarden server 

 ![Screenshot of Vaultwarden loading screen](/assets/y-u-n-o/ssv.png)

#### Wallabag - Read it later app

 ![Screenshot of Wallabag](/assets/y-u-n-o/ssw.png)

#### h5ai - HTTP server index

 ![Screenshot of h5ai](/assets/y-u-n-o/ssh.png)


## How do I install YunoHost?


1. Install minimal Debian 10/11  on your preferred machine
2. `curl https://install.yunohost.org | bash`

Done!

## Should you actually self-host everything?

Highly context dependent. I run two YunoHost servers in two different locations. One of the ISP has actually blacklisted the residential IP address range and does not let me change my reverseDNS, which means all my outgoing emails are marked as spam. On the other hand, the other ISP gave a clean static IP and the server managed for a small business is not at all problematic for emailing. YMMV but at least you know you have an option.