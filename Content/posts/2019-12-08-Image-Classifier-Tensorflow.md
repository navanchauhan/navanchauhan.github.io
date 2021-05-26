---
date: 2019-12-08 14:16
description: Tutorial on creating an image classifier model using TensorFlow which detects malaria
tags: Tutorial, Tensorflow, Colab
---

# Creating a Custom Image Classifier using Tensorflow 2.x and Keras for Detecting Malaria

**Done during Google Code-In. Org: Tensorflow.**

## Imports

```python
%tensorflow_version 2.x #This is for telling Colab that you want to use TF 2.0, ignore if running on local machine

from PIL import Image # We use the PIL Library to resize images
import numpy as np
import os
import cv2
import tensorflow as tf
from tensorflow.keras import datasets, layers, models
import pandas as pd
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import Conv2D,MaxPooling2D,Dense,Flatten,Dropout

```

## Dataset

### Fetching the Data

```python
!wget ftp://lhcftp.nlm.nih.gov/Open-Access-Datasets/Malaria/cell_images.zip
!unzip cell_images.zip
```

### Processing the Data

We resize all the images as 50x50 and add the numpy array of that image as well as their label names (Infected or Not) to common arrays.

```python
data = []
labels = []

Parasitized = os.listdir("./cell_images/Parasitized/")
for parasite in Parasitized:
    try:
        image=cv2.imread("./cell_images/Parasitized/"+parasite)
        image_from_array = Image.fromarray(image, 'RGB')
        size_image = image_from_array.resize((50, 50))
        data.append(np.array(size_image))
        labels.append(0)
    except AttributeError:
        print("")

Uninfected = os.listdir("./cell_images/Uninfected/")
for uninfect in Uninfected:
    try:
        image=cv2.imread("./cell_images/Uninfected/"+uninfect)
        image_from_array = Image.fromarray(image, 'RGB')
        size_image = image_from_array.resize((50, 50))
        data.append(np.array(size_image))
        labels.append(1)
    except AttributeError:
        print("")
```

### Splitting Data

```python
df = np.array(data)
labels = np.array(labels)
(X_train, X_test) = df[(int)(0.1*len(df)):],df[:(int)(0.1*len(df))]
(y_train, y_test) = labels[(int)(0.1*len(labels)):],labels[:(int)(0.1*len(labels))]
```

```
s=np.arange(X_train.shape[0])
np.random.shuffle(s)
X_train=X_train[s]
y_train=y_train[s]
X_train = X_train/255.0
```

## Model

### Creating Model

By creating a sequential model, we create a linear stack of layers.

*Note: The input shape for the first layer is 50,50 which corresponds with the sizes of the resized images*

```python
model = models.Sequential()
model.add(layers.Conv2D(filters=16, kernel_size=2, padding='same', activation='relu', input_shape=(50,50,3)))
model.add(layers.MaxPooling2D(pool_size=2))
model.add(layers.Conv2D(filters=32,kernel_size=2,padding='same',activation='relu'))
model.add(layers.MaxPooling2D(pool_size=2))
model.add(layers.Conv2D(filters=64,kernel_size=2,padding="same",activation="relu"))
model.add(layers.MaxPooling2D(pool_size=2))
model.add(layers.Dropout(0.2))
model.add(layers.Flatten())
model.add(layers.Dense(500,activation="relu"))
model.add(layers.Dropout(0.2))
model.add(layers.Dense(2,activation="softmax"))#2 represent output layer neurons 
model.summary()
```

### Compiling Model

We use the Adam optimiser as it is an adaptive learning rate optimisation algorithm that's been designed specifically for *training* deep neural networks, which means it changes its learning rate automatically to get the best results

```python
model.compile(optimizer="adam",
              loss="sparse_categorical_crossentropy", 
             metrics=["accuracy"])
```

### Training Model

We train the model for 10 epochs on the training data and then validate it using the testing data

```python
history = model.fit(X_train,y_train, epochs=10, validation_data=(X_test,y_test))
```

```python
Train on 24803 samples, validate on 2755 samples
Epoch 1/10
24803/24803 [==============================] - 57s 2ms/sample - loss: 0.0786 - accuracy: 0.9729 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 2/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0746 - accuracy: 0.9731 - val_loss: 0.0290 - val_accuracy: 0.9996
Epoch 3/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0672 - accuracy: 0.9764 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 4/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0601 - accuracy: 0.9789 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 5/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0558 - accuracy: 0.9804 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 6/10
24803/24803 [==============================] - 57s 2ms/sample - loss: 0.0513 - accuracy: 0.9819 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 7/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0452 - accuracy: 0.9849 - val_loss: 0.3190 - val_accuracy: 0.9985
Epoch 8/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0404 - accuracy: 0.9858 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 9/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0352 - accuracy: 0.9878 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
Epoch 10/10
24803/24803 [==============================] - 58s 2ms/sample - loss: 0.0373 - accuracy: 0.9865 - val_loss: 0.0000e+00 - val_accuracy: 1.0000
```

### Results

```python
accuracy = history.history['accuracy'][-1]*100
loss = history.history['loss'][-1]*100
val_accuracy = history.history['val_accuracy'][-1]*100
val_loss = history.history['val_loss'][-1]*100

print(
    'Accuracy:', accuracy,
    '\nLoss:', loss,
    '\nValidation Accuracy:', val_accuracy,
    '\nValidation Loss:', val_loss
)
```
```python
Accuracy: 98.64532351493835 
Loss: 3.732407123270176 
Validation Accuracy: 100.0 
Validation Loss: 0.0
```

We have achieved 98% Accuracy!

[Link to Colab Notebook](https://colab.research.google.com/drive/1ZswDsxLwYZEnev89MzlL5Lwt6ut7iwp- "Colab Notebook")
