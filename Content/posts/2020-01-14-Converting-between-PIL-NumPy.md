---
date: 2020-01-14 00:10
description: Short code snippet for converting between PIL image and NumPy arrays.
tags: Code-Snippet, Tutorial
---

# Converting between image and NumPy array

```python
import numpy
import PIL

# Convert PIL Image to NumPy array
img = PIL.Image.open("foo.jpg")
arr = numpy.array(img)

# Convert array to Image
img = PIL.Image.fromarray(arr)
```


## Saving an Image

```python
try:
    img.save(destination, "JPEG", quality=80, optimize=True, progressive=True)
except IOError:
    PIL.ImageFile.MAXBLOCK = img.size[0] * img.size[1]
    img.save(destination, "JPEG", quality=80, optimize=True, progressive=True)
```
