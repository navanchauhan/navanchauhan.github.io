---
date: 2019-12-10 11:10
description: Making predictions for image classification models built using TensorFlow
tags: Tutorial, Tensorflow, Code-Snippet
---

# Making Predictions using Image Classifier (TensorFlow)

*This was tested on TF 2.x and works as of 2019-12-10*

If you want to understand how to make your own custom image classifier, please refer to my previous post.

If you followed my last post, then you created a model which took an image of dimensions 50x50 as an input.

First we import the following if we have not imported these before

```python
import cv2
import os
```

Then we read the file using OpenCV.

```python
image=cv2.imread(imagePath)
```

The cv2. imread() function returns a NumPy array representing the image. Therefore, we need to convert it before we can use it.

```python
image_from_array = Image.fromarray(image, 'RGB')
```

Then we resize the image

```python
size_image = image_from_array.resize((50,50))
```

After this we create a batch consisting of only one image

```python
p = np.expand_dims(size_image, 0)
```

We then convert this uint8 datatype to a float32 datatype

```python
img = tf.cast(p, tf.float32)
```

Finally we make the prediction

```python
print(['Infected','Uninfected'][np.argmax(model.predict(img))])
```

`Infected`


