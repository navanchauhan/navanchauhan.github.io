---
date: 2020-01-15 23:36
description: Tutorial on setting up kaggle, to use with Google Colab
tags: Tutorial, Colab, Turicreate, Kaggle
---

# Setting up Kaggle to use with Google Colab

*In order to be able to access Kaggle Datasets, you will need to have an account on Kaggle (which is Free)*

## Grabbing Our Tokens

### Go to Kaggle


!["Homepage"](/assets/posts/kaggle-colab/ss1.png)

### Click on your User Profile and Click on My Account

!["Account"](/assets/posts/kaggle-colab/ss2.png)

### Scroll Down until you see Create New API Token

![](/assets/posts/kaggle-colab/ss3.png)

### This will download your token as a JSON file

![](/assets/posts/kaggle-colab/ss4.png)

Copy the File to the root folder of your Google Drive


## Setting up Colab

### Mounting Google Drive

```python
import os
from google.colab import drive
drive.mount('/content/drive')
```

After this click on the URL in the output section, login and then paste the Auth Code

### Configuring Kaggle

```python
os.environ['KAGGLE_CONFIG_DIR'] = "/content/drive/My Drive/"
```

Voila! You can now download Kaggle datasets
