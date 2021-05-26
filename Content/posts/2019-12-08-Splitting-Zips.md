---
date: 2019-12-08 13:27
description: Short code snippet for splitting zips.
readTime: 120
tags: Code-Snippet, Tutorial
---

# Splitting ZIPs into Multiple Parts

**Tested on macOS**

Creating the archive:

```Termcap
zip -r -s 5 oodlesofnoodles.zip website/
```

5 stands for each split files' size (in mb, kb and gb can also be specified)

For encrypting the zip:

```Termcap
zip -er -s 5 oodlesofnoodles.zip website
```

Extracting Files

First we need to collect all parts, then

```Termcap
zip -F oodlesofnoodles.zip --out merged.zip
```
