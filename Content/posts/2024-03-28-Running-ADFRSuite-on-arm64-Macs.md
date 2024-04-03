---
date: 2024-03-28 20:12
description: Fixing ADFRsuite on M1/MX chip Macs - CLI Tools
tags: macOS, Cheminformatics
---

# Fixing ADFRSuite for Apple Silicon

We are going to be running everything through Rosetta 2. I am confident that if I had access to the original source code, I could find a way to run everything natively. 

These are the following issues that we will be fixing in this part:

* “python2.7” cannot be opened because the developer cannot be verified.
* OpenBabel Error
* Segmentation fault while running the [redocking tutorial](https://ccsb.scripps.edu/adcp/tutorial-redocking/)

For the sake of simplicity, I am assuming that I am running all these commands in the folder `~/Developer/scrippstuff/`

## Installing Rosetta 2

We are going to run all of these steps in the terminal

```bash
/usr/sbin/softwareupdate --install-rosetta --agree-to-license
```

### Install Homebrew for x86

Both versions of homebrew (x86 and arm64) can peacefully coexist on your system.

From now on, every command should be run in a terminal session that starts with this as the first command:

```bash
arch -x86_64 zsh
```

Now, we can install homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Here is my output:

``` bash
➜  scrippstuff uname -a
Darwin Navans-MacBook-Pro.local 23.3.0 Darwin Kernel Version 23.3.0: Wed Dec 20 21:31:00 PST 2023; root:xnu-10002.81.5~7/RELEASE_ARM64_T6020 x86_64
➜  scrippstuff /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
==> Checking for `sudo` access (which may request your password)...
Password:
==> This script will install:
/usr/local/bin/brew
/usr/local/share/doc/homebrew
/usr/local/share/man/man1/brew.1
/usr/local/share/zsh/site-functions/_brew
/usr/local/etc/bash_completion.d/brew
/usr/local/Homebrew
==> The following new directories will be created:
/usr/local/Cellar
/usr/local/Caskroom

Press RETURN/ENTER to continue or any other key to abort:
==> /usr/bin/sudo /bin/mkdir -p /usr/local/Cellar /usr/local/Caskroom
==> /usr/bin/sudo /bin/chmod ug=rwx /usr/local/Cellar /usr/local/Caskroom
==> /usr/bin/sudo /usr/sbin/chown navanchauhan /usr/local/Cellar /usr/local/Caskroom
==> /usr/bin/sudo /usr/bin/chgrp admin /usr/local/Cellar /usr/local/Caskroom
==> /usr/bin/sudo /usr/sbin/chown -R navanchauhan:admin /usr/local/Homebrew
==> /usr/bin/sudo /bin/mkdir -p /Users/navanchauhan/Library/Caches/Homebrew
==> /usr/bin/sudo /bin/chmod g+rwx /Users/navanchauhan/Library/Caches/Homebrew
==> /usr/bin/sudo /usr/sbin/chown -R navanchauhan /Users/navanchauhan/Library/Caches/Homebrew
==> Downloading and installing Homebrew...
remote: Enumerating objects: 47, done.
remote: Counting objects: 100% (47/47), done.
remote: Compressing objects: 100% (19/19), done.
remote: Total 47 (delta 28), reused 47 (delta 28), pack-reused 0
Unpacking objects: 100% (47/47), 6.11 KiB | 223.00 KiB/s, done.
From https://github.com/Homebrew/brew
 + 18ebdd8c8f...67a096fcbb tapioca-compiler-for-tty-rbi -> origin/tapioca-compiler-for-tty-rbi  (forced update)
Switched to and reset branch 'stable'
==> Updating Homebrew...
==> Installation successful!

==> Homebrew has enabled anonymous aggregate formulae and cask analytics.
Read the analytics documentation (and how to opt-out) here:
  https://docs.brew.sh/Analytics
No analytics data has been sent yet (nor will any be during this install run).

==> Homebrew is run entirely by unpaid volunteers. Please consider donating:
  https://github.com/Homebrew/brew#donations

==> Next steps:
- Run these two commands in your terminal to add Homebrew to your PATH:
    (echo; echo 'eval "$(/usr/local/bin/brew shellenv)"') >> /Users/navanchauhan/.zprofile
    eval "$(/usr/local/bin/brew shellenv)"
- Run brew help to get started
- Further documentation:
    https://docs.brew.sh
```

At this point, you don't need to edit your `zshrc` or `zsh_profile`.

### Install pyenv

The reason we are installing pyenv is because it is easier to build Python 2.7.18 from scratch than messing around with codesigning and quarantine bs on macOS.

```bash
➜  scrippstuff brew install pyenv
==> Downloading https://ghcr.io/v2/homebrew/core/pyenv/manifests/2.3.36
############################################################################################################################################################### 100.0%
==> Fetching dependencies for pyenv: m4, autoconf, ca-certificates, openssl@3, pkg-config and readline
==> Downloading https://ghcr.io/v2/homebrew/core/m4/manifests/1.4.19
############################################################################################################################################################### 100.0%
==> Fetching m4
==> Downloading https://ghcr.io/v2/homebrew/core/m4/blobs/sha256:8434a67a4383836b2531a6180e068640c5b482ee6781b673d65712e4fc86ca76
############################################################################################################################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/autoconf/manifests/2.72
############################################################################################################################################################### 100.0%
==> Fetching autoconf
==> Downloading https://ghcr.io/v2/homebrew/core/autoconf/blobs/sha256:12368e33b89d221550ba9e261b0c6ece0b0e89250fb4c95169d09081e0ebb2dd
############################################################################################################################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/ca-certificates/manifests/2024-03-11
############################################################################################################################################################### 100.0%
==> Fetching ca-certificates
==> Downloading https://ghcr.io/v2/homebrew/core/ca-certificates/blobs/sha256:cab828953672906e00a8f25db751977b8dc4115f021f8dfe82b644ade03dacdb
############################################################################################################################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/openssl/3/manifests/3.2.1-1
############################################################################################################################################################### 100.0%
==> Fetching openssl@3
==> Downloading https://ghcr.io/v2/homebrew/core/openssl/3/blobs/sha256:ef8211c5115fc85f01261037f8fea76cc432b92b4fb23bc87bbf41e9198fcc0f
############################################################################################################################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/pkg-config/manifests/0.29.2_3
############################################################################################################################################################### 100.0%
==> Fetching pkg-config
==> Downloading https://ghcr.io/v2/homebrew/core/pkg-config/blobs/sha256:421571f340277c62c5cc6fd68737bd7c4e085de113452ea49b33bcd46509bb12
############################################################################################################################################################### 100.0%
==> Downloading https://ghcr.io/v2/homebrew/core/readline/manifests/8.2.10
############################################################################################################################################################### 100.0%
==> Fetching readline
==> Downloading https://ghcr.io/v2/homebrew/core/readline/blobs/sha256:9796e0ff1cc29ae7e75d8fc1a3e2c5e8ae2aeade8d9d59a16363306bf6c5b8f4
############################################################################################################################################################### 100.0%
==> Fetching pyenv
==> Downloading https://ghcr.io/v2/homebrew/core/pyenv/blobs/sha256:d117a99ed53502aff29109bfa366693ca623f2326e1e6b4db68fef7b7f63eeba
############################################################################################################################################################### 100.0%
==> Installing dependencies for pyenv: m4, autoconf, ca-certificates, openssl@3, pkg-config and readline
==> Installing pyenv dependency: m4
==> Downloading https://ghcr.io/v2/homebrew/core/m4/manifests/1.4.19
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/5b2a7f715487b7377e409e8ca58569040cd89f33859f691210c58d94410fd33b--m4-1.4.19.bottle_manifest.json
==> Pouring m4--1.4.19.sonoma.bottle.tar.gz
🍺  /usr/local/Cellar/m4/1.4.19: 13 files, 739.9KB
==> Installing pyenv dependency: autoconf
==> Downloading https://ghcr.io/v2/homebrew/core/autoconf/manifests/2.72
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/b73cdb320c4261bbf8d02d03e50dc755c869c5859c1d4e93616898fc7cd939ff--autoconf-2.72.bottle_manifest.json
==> Pouring autoconf--2.72.sonoma.bottle.tar.gz
🍺  /usr/local/Cellar/autoconf/2.72: 71 files, 3.6MB
==> Installing pyenv dependency: ca-certificates
==> Downloading https://ghcr.io/v2/homebrew/core/ca-certificates/manifests/2024-03-11
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/c431e0186df2ccc2ea942b34a3c26c2cebebec8e07ad6abdae48447a52c5f506--ca-certificates-2024-03-11.bottle_manifest.json
==> Pouring ca-certificates--2024-03-11.all.bottle.tar.gz
==> Regenerating CA certificate bundle from keychain, this may take a while...
🍺  /usr/local/Cellar/ca-certificates/2024-03-11: 3 files, 229.6KB
==> Installing pyenv dependency: openssl@3
==> Downloading https://ghcr.io/v2/homebrew/core/openssl/3/manifests/3.2.1-1
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/f7b6e249843882452d784a8cbc4e19231186230b9e485a2a284d5c1952a95ec2--openssl@3-3.2.1-1.bottle_manifest.json
==> Pouring openssl@3--3.2.1.sonoma.bottle.1.tar.gz
🍺  /usr/local/Cellar/openssl@3/3.2.1: 6,874 files, 32.5MB
==> Installing pyenv dependency: pkg-config
==> Downloading https://ghcr.io/v2/homebrew/core/pkg-config/manifests/0.29.2_3
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/ac691fc7ab8ecffba32a837e7197101d271474a3a84cfddcc30c9fd6763ab3c6--pkg-config-0.29.2_3.bottle_manifest.json
==> Pouring pkg-config--0.29.2_3.sonoma.bottle.tar.gz
🍺  /usr/local/Cellar/pkg-config/0.29.2_3: 11 files, 656.4KB
==> Installing pyenv dependency: readline
==> Downloading https://ghcr.io/v2/homebrew/core/readline/manifests/8.2.10
Already downloaded: /Users/navanchauhan/Library/Caches/Homebrew/downloads/4ddd52803319828799f1932d4c7fa8d11c667049b20a56341c0c19246a1be93b--readline-8.2.10.bottle_manifest.json
==> Pouring readline--8.2.10.sonoma.bottle.tar.gz
🍺  /usr/local/Cellar/readline/8.2.10: 50 files, 1.7MB
==> Installing pyenv
==> Pouring pyenv--2.3.36.sonoma.bottle.tar.gz
🍺  /usr/local/Cellar/pyenv/2.3.36: 1,158 files, 3.4MB
==> Running `brew cleanup pyenv`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
```

And, build the last version of Python 2.7

```bash
➜  scrippstuff PYENV_ROOT="~/Developer/scrippstuff" pyenv install 2.7.18
python-build: use openssl from homebrew
python-build: use readline from homebrew
Downloading Python-2.7.18.tar.xz...
-> https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tar.xz
Installing Python-2.7.18...
patching file configure
patching file configure.ac
patching file setup.py
patching file 'Mac/Tools/pythonw.c'
patching file setup.py
patching file 'Doc/library/ctypes.rst'
patching file 'Lib/test/test_str.py'
patching file 'Lib/test/test_unicode.py'
patching file 'Modules/_ctypes/_ctypes.c'
patching file 'Modules/_ctypes/callproc.c'
patching file 'Modules/_ctypes/ctypes.h'
patching file 'Modules/_ctypes/callproc.c'
patching file setup.py
patching file 'Mac/Modules/qt/setup.py'
patching file setup.py
python-build: use readline from homebrew
python-build: use zlib from xcode sdk
Installed Python-2.7.18 to /Users/navanchauhan/Developer/scrippstuff/~/Developer/scrippstuff/versions/2.7.18
```

Test the new installation:

```bash
➜  scrippstuff ~/Developer/scrippstuff/\~/Developer/scrippstuff/versions/2.7.18/bin/python2.7
Python 2.7.18 (default, Mar 28 2024, 20:47:13)
[GCC Apple LLVM 15.0.0 (clang-1500.1.0.2.5)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> from random import randint
>>> randint(0,10)
6
>>> exit()
```

Now, we can compress this newly created Python version into a `tar.gz` file to replace the one provided in ADFRsuite_x86_64Darwin_1.0.tar.gz. Don't forget the `.` at the end

```bash
➜  scrippstuff tar -C ./\~/Developer/scrippstuff/versions/2.7.18 -czf new.tar.gz .
```

## Install ADFRsuite

If you don't already have the tarball, you can download it by:

```bash
$ curl -o adfr.tar.gz https://ccsb.scripps.edu/adfr/download/1033/
```

Uncompress it

```bash
$ tar -xvzf adfr.tar.gz
```

Replace the provided Python archive with the one we created:

```bash
$ cd ADFRsuite_x86_64Darwin_1.0
$ mv new.tar.gz Python2.7.tar.gz
```

Note: For some reason simply copying it doesn't work and you need to use `mv`

Just to not mess with anything else, I will be installing everything in a folder called `clean_install`

```bash
$ mkdir clean_install
$ ./install.sh -d clean_install
...
 ADFRsuite installation complete.
To run agfr, agfrgui, adfr, autosite, about, pythonsh scripts located at:
/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/bin
add  /Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/bin to the path environment variable in .cshrc or .bashrc:
.cshrc:
set path = (/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/bin $path)

.bashrc:
export PATH=/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/bin:$PATH
```

Now, to test `agfr`, first run the command (replacing `navanchauhan` with yout username)

```bash
$ export PATH=/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/bin:$PATH
$ agfr
➜  ADFRsuite_x86_64Darwin_1.0 agfr
==============================
*** Open Babel Error  in openLib
  /Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/lib/openbabel/2.4.1/acesformat.so did not load properly.
 Error: dlopen(/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/lib/openbabel/2.4.1/acesformat.so, 0x0009): Library not loaded: /opt/X11/lib/libcairo.2.dylib
  Referenced from: <24174F3E-2670-79AC-4F26-F8B49774194A> /Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/lib/openbabel/2.4.1/acesformat.so
  Reason: tried: '/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/lib/libcairo.2.dylib' (no such file), '/opt/X11/lib/libcairo.2.dylib' (no such file), '/System/Volumes/Preboot/Cryptexes/OS/opt/X11/lib/libcairo.2.dylib' (no such file), '/opt/X11/lib/libcairo.2.dylib' (no such file), '/usr/local/lib/libcairo.2.dylib' (no such file), '/usr/lib/libcairo.2.dylib' (no such file, not in dyld cache)
==============================
```


## Fixing `Open Babel Error`

```bash
$ brew install cairo
```

## Completing the re-docking tutorial

### Dowbloading the dataset

```bash
$ curl -o tutorial-data.zip https://ccsb.scripps.edu/adcp/download/1063/
$ unzip tutorial-data.zip
$ cd ADCP_tutorial_data/3Q47
```

### Conversion to PDBQT

```bash
$ reduce 3Q47_rec.pdb > 3Q47_recH.pdb
$ reduce 3Q47_pep.pdb > 3Q47_pepH.pdb
```

### Preparing Receptor

```
$ prepare_receptor -r 3Q47_recH.pdb
$ prepare_ligand -l 3Q47_pepH.pdb
```

### Generate Target File

```bash
$ agfr -r 3Q47_recH.pdbqt -l 3Q47_pepH.pdbqt -asv 1.1 -o 3Q47
➜  3Q47 agfr -r 3Q47_recH.pdbqt -l 3Q47_pepH.pdbqt -asv 1.1 -o 3Q47
Traceback (most recent call last):
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFR/bin/runAGFR.py", line 36, in <module>
    from ADFR.utils.runAGFR import runAGFR
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFR/utils/runAGFR.py", line 41, in <module>
    from ADFR.utils.maps import flexResStr2flexRes
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFR/utils/maps.py", line 35, in <module>
    from ADFRcc.adfr import GridMap
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/__init__.py", line 34, in <module>
    from ADFRcc.adfr import Parameters
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/adfr.py", line 43, in <module>
    import ADFRcc.adfrcc as CPP
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/adfrcc.py", line 28, in <module>
    _adfrcc = swig_import_helper()
  File "/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/adfrcc.py", line 24, in swig_import_helper
    _mod = imp.load_module('_adfrcc', fp, pathname, description)
ImportError: dlopen(/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/_adfrcc.so, 0x0002): Library not loaded: /Users/Shared/mgltoolsDev/src/homebrew/opt/gcc/lib/gcc/8/libgomp.1.dylib
  Referenced from: <424BF61E-BF0F-351E-B546-E82EBBD8FBF5> /Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/CCSBpckgs/ADFRcc/_adfrcc.so
  Reason: tried: '/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0/clean_install/lib/libgomp.1.dylib' (no such file), '/Users/Shared/mgltoolsDev/src/homebrew/opt/gcc/lib/gcc/8/libgomp.1.dylib' (no such file), '/System/Volumes/Preboot/Cryptexes/OS/Users/Shared/mgltoolsDev/src/homebrew/opt/gcc/lib/gcc/8/libgomp.1.dylib' (no such file), '/Users/Shared/mgltoolsDev/src/homebrew/opt/gcc/lib/gcc/8/libgomp.1.dylib' (no such file), '/usr/local/lib/libgomp.1.dylib' (no such file), '/usr/lib/libgomp.1.dylib' (no such file, not in dyld cache)
➜  3Q47
```

Sometimes this error is simply outputted as a segmentation fault. But, it is because it cannot find the `libgomp.1.dylib`. I haven't tested using a newer version of GCC to make it work. Building GCC 8 yourself is absolutely painful. We are going to use a copy generated by the homebrew team.

```bash
$ cd ../../
$ pwd
/Users/navanchauhan/Developer/scrippstuff/ADFRsuite_x86_64Darwin_1.0
$ curl -L -H "Authorization: Bearer QQ==" -o gcc8amd64.tar.gz https://ghcr.io/v2/homebrew/core/gcc/8/blobs/sha256:438d5902e5f21a5e8acb5920f1f5684ecfe0c645247d46c8d44c2bbe435966b2
$ tar -xzf gcc8amd64.tar.gz
$ cp -r gcc@8/8.5.0/lib/gcc/8/* clean_install/lib/
```

Now, we should be able to go back and run the target generation command:

```bash
$ cd ADCP_tutorial_data/3Q47
$ agfr -r 3Q47_recH.pdbqt -l 3Q47_pepH.pdbqt -asv 1.1 -o 3Q47
#################################################################
# If you used AGFR in your work, please cite:                   #
#                                                               #
# P.A. Ravindranath S. Forli, D.S. Goodsell, A.J. Olson and     #
# M.F. Sanner                                                   #
# AutoDockFR: Advances in Protein-Ligand Docking with           #
...
```

### Docking Peptide

```bash
$ adcp -t 3Q47.trg -s npisdvd -N 20 -n 1000000 -o 3Q47_redocking -ref 3Q47_pepH.pdb
```

There you have it. Running ADCP on the newest macOS version against all odds.

I haven't yet looked into fixing/patching `agfrgui` as I don't use the software. But, if someone reallllly needs to run it on Apple Silicon, I am happy to take a look at monkeypatching it.

In case years down the line the prebuilt version of GCC 8 is not available, let me know so I can replace the link with my mirror.
