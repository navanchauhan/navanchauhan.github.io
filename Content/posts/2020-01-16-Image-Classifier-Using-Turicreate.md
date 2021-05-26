---
date: 2020-01-16 10:36
description: Tutorial on creating a custom Image Classifier using Turicreate and a dataset from Kaggle
tags: Tutorial, Colab, Turicreate
---

# Creating a Custom Image Classifier using Turicreate to detect Smoke and Fire

*For setting up Kaggle with Google Colab, please refer to <a href="/posts/2020-01-15-Setting-up-Kaggle-to-use-with-Colab/"> my previous post</a>*


## Dataset

### Mounting Google Drive

```python
import os
from google.colab import drive
drive.mount('/content/drive')
```

### Downloading Dataset from Kaggle

```python
os.environ['KAGGLE_CONFIG_DIR'] = "/content/drive/My Drive/"
!kaggle datasets download ashutosh69/fire-and-smoke-dataset
!unzip "fire-and-smoke-dataset.zip"
```

## Pre-Processing

```Termcap
!mkdir default smoke fire
```


\

```Termcap
!ls data/data/img_data/train/default/*.jpg
```

\

```Termcap
img_1002.jpg   img_20.jpg     img_519.jpg     img_604.jpg       img_80.jpg
img_1003.jpg   img_21.jpg     img_51.jpg     img_60.jpg       img_8.jpg
img_1007.jpg   img_22.jpg     img_520.jpg     img_61.jpg       img_900.jpg
img_100.jpg    img_23.jpg     img_521.jpg    'img_62 (2).jpg'   img_920.jpg
img_1014.jpg   img_24.jpg    'img_52 (2).jpg'     img_62.jpg       img_921.jpg
img_1018.jpg   img_29.jpg     img_522.jpg    'img_63 (2).jpg'   img_922.jpg
img_101.jpg    img_3000.jpg   img_523.jpg     img_63.jpg       img_923.jpg
img_1027.jpg   img_335.jpg    img_524.jpg     img_66.jpg       img_924.jpg
img_102.jpg    img_336.jpg    img_52.jpg     img_67.jpg       img_925.jpg
img_1042.jpg   img_337.jpg    img_530.jpg     img_68.jpg       img_926.jpg
img_1043.jpg   img_338.jpg    img_531.jpg     img_700.jpg       img_927.jpg
img_1046.jpg   img_339.jpg   'img_53 (2).jpg'     img_701.jpg       img_928.jpg
img_1052.jpg   img_340.jpg    img_532.jpg     img_702.jpg       img_929.jpg
img_107.jpg    img_341.jpg    img_533.jpg     img_703.jpg       img_930.jpg
img_108.jpg    img_3.jpg      img_537.jpg     img_704.jpg       img_931.jpg
img_109.jpg    img_400.jpg    img_538.jpg     img_705.jpg       img_932.jpg
img_10.jpg     img_471.jpg    img_539.jpg     img_706.jpg       img_933.jpg
img_118.jpg    img_472.jpg    img_53.jpg     img_707.jpg       img_934.jpg
img_12.jpg     img_473.jpg    img_540.jpg     img_708.jpg       img_935.jpg
img_14.jpg     img_488.jpg    img_541.jpg     img_709.jpg       img_938.jpg
img_15.jpg     img_489.jpg   'img_54 (2).jpg'     img_70.jpg       img_958.jpg
img_16.jpg     img_490.jpg    img_542.jpg     img_710.jpg       img_971.jpg
img_17.jpg     img_491.jpg    img_543.jpg    'img_71 (2).jpg'   img_972.jpg
img_18.jpg     img_492.jpg    img_54.jpg     img_71.jpg       img_973.jpg
img_19.jpg     img_493.jpg   'img_55 (2).jpg'     img_72.jpg       img_974.jpg
img_1.jpg      img_494.jpg    img_55.jpg     img_73.jpg       img_975.jpg
img_200.jpg    img_495.jpg    img_56.jpg     img_74.jpg       img_980.jpg
img_201.jpg    img_496.jpg    img_57.jpg     img_75.jpg       img_988.jpg
img_202.jpg    img_497.jpg    img_58.jpg     img_76.jpg       img_9.jpg
img_203.jpg    img_4.jpg      img_59.jpg     img_77.jpg
img_204.jpg    img_501.jpg    img_601.jpg     img_78.jpg
img_205.jpg    img_502.jpg    img_602.jpg     img_79.jpg
img_206.jpg    img_50.jpg     img_603.jpg     img_7.jpg
```


The image files are not actually JPEG, thus we first need to save them in the correct format for Turicreate

```python
from PIL import Image
import glob


folders = ["default","smoke","fire"]
for folder in folders:
  n = 1
  for file in glob.glob("./data/data/img_data/train/" + folder + "/*.jpg"):
    im = Image.open(file)
    rgb_im = im.convert('RGB')
    rgb_im.save((folder + "/" + str(n) + ".jpg"), quality=100)
    n +=1 
  for file in glob.glob("./data/data/img_data/train/" + folder + "/*.jpg"):
    im = Image.open(file)
    rgb_im = im.convert('RGB')
    rgb_im.save((folder + "/" + str(n) + ".jpg"), quality=100)
    n +=1
```

\

```Termcap
!mkdir train
!mv default ./train
!mv smoke ./train
!mv fire ./train
```

## Making the Image Classifier

### Making an SFrame

```Termcap
!pip install turicreate
```

\

```python
import turicreate as tc
import os

data = tc.image_analysis.load_images("./train", with_path=True)

data["label"] = data["path"].apply(lambda path: os.path.basename(os.path.dirname(path)))

print(data)

data.save('fire-smoke.sframe')
```

\

```Termcap
+-------------------------+------------------------+
|           path          |         image          |
+-------------------------+------------------------+
|  ./train/default/1.jpg  | Height: 224 Width: 224 |
|  ./train/default/10.jpg | Height: 224 Width: 224 |
| ./train/default/100.jpg | Height: 224 Width: 224 |
| ./train/default/101.jpg | Height: 224 Width: 224 |
| ./train/default/102.jpg | Height: 224 Width: 224 |
| ./train/default/103.jpg | Height: 224 Width: 224 |
| ./train/default/104.jpg | Height: 224 Width: 224 |
| ./train/default/105.jpg | Height: 224 Width: 224 |
| ./train/default/106.jpg | Height: 224 Width: 224 |
| ./train/default/107.jpg | Height: 224 Width: 224 |
+-------------------------+------------------------+
[2028 rows x 2 columns]
Note: Only the head of the SFrame is printed.
You can use print_rows(num_rows=m, num_columns=n) to print more rows and columns.
+-------------------------+------------------------+---------+
|           path          |         image          |  label  |
+-------------------------+------------------------+---------+
|  ./train/default/1.jpg  | Height: 224 Width: 224 | default |
|  ./train/default/10.jpg | Height: 224 Width: 224 | default |
| ./train/default/100.jpg | Height: 224 Width: 224 | default |
| ./train/default/101.jpg | Height: 224 Width: 224 | default |
| ./train/default/102.jpg | Height: 224 Width: 224 | default |
| ./train/default/103.jpg | Height: 224 Width: 224 | default |
| ./train/default/104.jpg | Height: 224 Width: 224 | default |
| ./train/default/105.jpg | Height: 224 Width: 224 | default |
| ./train/default/106.jpg | Height: 224 Width: 224 | default |
| ./train/default/107.jpg | Height: 224 Width: 224 | default |
+-------------------------+------------------------+---------+
[2028 rows x 3 columns]
Note: Only the head of the SFrame is printed.
You can use print_rows(num_rows=m, num_columns=n) to print more rows and columns.
```


### Making the Model

```python

import turicreate as tc

# Load the data
data =  tc.SFrame('fire-smoke.sframe')

# Make a train-test split
train_data, test_data = data.random_split(0.8)

# Create the model
model = tc.image_classifier.create(train_data, target='label')

# Save predictions to an SArray
predictions = model.predict(test_data)

# Evaluate the model and print the results
metrics = model.evaluate(test_data)
print(metrics['accuracy'])

# Save the model for later use in Turi Create
model.save('fire-smoke.model')

# Export for use in Core ML
model.export_coreml('fire-smoke.mlmodel')
```

\

```Termcap
Performing feature extraction on resized images...
Completed   64/1633
Completed  128/1633
Completed  192/1633
Completed  256/1633
Completed  320/1633
Completed  384/1633
Completed  448/1633
Completed  512/1633
Completed  576/1633
Completed  640/1633
Completed  704/1633
Completed  768/1633
Completed  832/1633
Completed  896/1633
Completed  960/1633
Completed 1024/1633
Completed 1088/1633
Completed 1152/1633
Completed 1216/1633
Completed 1280/1633
Completed 1344/1633
Completed 1408/1633
Completed 1472/1633
Completed 1536/1633
Completed 1600/1633
Completed 1633/1633
PROGRESS: Creating a validation set from 5 percent of training data. This may take a while.
          You can set ``validation_set=None`` to disable validation tracking.

Logistic regression:
--------------------------------------------------------
Number of examples          : 1551
Number of classes           : 3
Number of feature columns   : 1
Number of unpacked features : 2048
Number of coefficients      : 4098
Starting L-BFGS
--------------------------------------------------------
+-----------+----------+-----------+--------------+-------------------+---------------------+
| Iteration | Passes   | Step size | Elapsed Time | Training Accuracy | Validation Accuracy |
+-----------+----------+-----------+--------------+-------------------+---------------------+
| 0         | 6        | 0.018611  | 0.891830     | 0.553836          | 0.560976            |
| 1         | 10       | 0.390832  | 1.622383     | 0.744681          | 0.792683            |
| 2         | 11       | 0.488541  | 1.943987     | 0.733075          | 0.804878            |
| 3         | 14       | 2.442703  | 2.512545     | 0.727917          | 0.841463            |
| 4         | 15       | 2.442703  | 2.826964     | 0.861380          | 0.853659            |
| 9         | 28       | 2.340435  | 5.492035     | 0.941328          | 0.975610            |
+-----------+----------+-----------+--------------+-------------------+---------------------+
Performing feature extraction on resized images...
Completed  64/395
Completed 128/395
Completed 192/395
Completed 256/395
Completed 320/395
Completed 384/395
Completed 395/395
0.9316455696202531
```

We just got an accuracy of 94% on Training Data and 97% on Validation Data!
