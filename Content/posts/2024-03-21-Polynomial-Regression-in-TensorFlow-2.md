---
date: 2024-03-21 12:46
description: Predicting n-th degree polynomials using TensorFlow 2.x
tags: Tutorial, Tensorflow, Colab
---

# Polynomial Regression Using TensorFlow 2.x

I have a similar post titled [Polynomial Regression Using Tensorflow](/posts/2019-12-16-TensorFlow-Polynomial-Regression.html) that used `tensorflow.compat.v1` (Which still works as of TF 2.16). But, I thought it would be nicer to redo it with newer TF versions. 

I will be skipping all the introductions about polynomial regression and jumping straight to the code. Personally, I prefer using `scikit-learn` for this task.

## Position vs Salary Dataset

Again, we will be using https://drive.google.com/file/d/1tNL4jxZEfpaP4oflfSn6pIHJX7Pachm9/view (Salary vs Position Dataset)

If you are in a Python Notebook environment like Kaggle or Google Colaboratory, you can simply run:
```Termcap
!wget --no-check-certificate 'https://docs.google.com/uc?export=download&id=1tNL4jxZEfpaP4oflfSn6pIHJX7Pachm9' -O data.csv
```

## Code

If you just want to copy-paste the code, scroll to the bottom for the entire snippet. Here I will try and walk through setting up code for a 3rd-degree (cubic) polynomial

### Imports

```python
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
```

### Reading the Dataset

```python
df = pd.read_csv("data.csv")
```

### Variables and Constants

Here, we initialize the X and Y values as constants, since they are not going to change. The coefficients are defined as variables.

```python
X = tf.constant(df["Level"], dtype=tf.float32)
Y = tf.constant(df["Salary"], dtype=tf.float32)

coefficients = [tf.Variable(np.random.randn() * 0.01, dtype=tf.float32) for _ in range(4)]
```

Here, `X` and `Y` are the values from our dataset. We initialize the coefficients for the equations as small random values.

These coefficients are evaluated by Tensorflow's `tf.math.poyval` function which returns the n-th order polynomial based on how many coefficients are passed. Since our list of coefficients contains 4 different variables, it will be evaluated as:

```
y = (x**3)*coefficients[3] + (x**2)*coefficients[2] + (x**1)*coefficients[1] (x**0)*coefficients[0]
``` 

Which is equivalent to the general cubic equation:

<script type="text/javascript"
  src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
</script>

$$
y = ax^3 + bx^2 + cx + d
$$

### Optimizer Selection & Training

```python
optimizer = tf.keras.optimizers.Adam(learning_rate=0.3)
num_epochs = 10_000

for epoch in range(num_epochs):
    with tf.GradientTape() as tape:
        y_pred = tf.math.polyval(coefficients, X)
        loss = tf.reduce_mean(tf.square(y - y_pred))
    grads = tape.gradient(loss, coefficients)
    optimizer.apply_gradients(zip(grads, coefficients))
    if (epoch+1) % 1000 == 0:
        print(f"Epoch: {epoch+1}, Loss: {loss.numpy()}"
```

In TensorFlow 1, we would have been using `tf.Session` instead. 

Here we are using `GradientTape()` instead, to keep track of the loss evaluation and coefficients. This is crucial, as our optimizer needs these gradients to be able to optimize our coefficients.

Our loss function is Mean Squared Error (MSE)

$$
= \frac{1}{n}\sum_{i=1}^{n} (Y_i - \^{Y_i})
$$

Where $\^{Y_i}$ is the predicted value and $Y_i$ is the actual value

### Plotting Final Coefficients

```python
final_coefficients = [c.numpy() for c in coefficients]
print("Final Coefficients:", final_coefficients)

plt.plot(df["Level"], df["Salary"], label="Original Data")
plt.plot(df["Level"],[tf.math.polyval(final_coefficients, tf.constant(x, dtype=tf.float32)).numpy() for x in df["Level"]])
plt.ylabel('Salary')
plt.xlabel('Position')
plt.title("Salary vs Position")
plt.show()
```


## Code Snippet for a Polynomial of Degree N

### Using Gradient Tape

This should work regardless of the Keras backend version (2 or 3)

```python
import tensorflow as tf
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data.csv")

############################
## Change Parameters Here ##
############################
x_column = "Level"         #
y_column = "Salary"        #
degree = 2                 #
learning_rate = 0.3        #
num_epochs = 25_000        #
############################

X = tf.constant(df[x_column], dtype=tf.float32)
Y = tf.constant(df[y_column], dtype=tf.float32)

coefficients = [tf.Variable(np.random.randn() * 0.01, dtype=tf.float32) for _ in range(degree + 1)]

optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)

for epoch in range(num_epochs):
    with tf.GradientTape() as tape:
        y_pred = tf.math.polyval(coefficients, X)
        loss = tf.reduce_mean(tf.square(Y - y_pred))
    grads = tape.gradient(loss, coefficients)
    optimizer.apply_gradients(zip(grads, coefficients))
    if (epoch+1) % 1000 == 0:
        print(f"Epoch: {epoch+1}, Loss: {loss.numpy()}")

final_coefficients = [c.numpy() for c in coefficients]
print("Final Coefficients:", final_coefficients)

print("Final Equation:", end=" ")
for i in range(degree+1):
  print(f"{final_coefficients[i]} * x^{degree-i}", end=" + " if i < degree else "\n")

plt.plot(X, Y, label="Original Data")
plt.plot(X,[tf.math.polyval(final_coefficients, tf.constant(x, dtype=tf.float32)).numpy() for x in df[x_column]]), label="Our Poynomial"
plt.ylabel(y_column)
plt.xlabel(x_column)
plt.title(f"{x_column} vs {y_column}")
plt.legend()
plt.show()
```

### Without Gradient Tape

This relies on the Optimizer's `minimize` function and uses the `var_list` parameter to update the variables.

This will not work with Keras 3 backend in TF 2.16.0 and above unless you switch to the legacy backend.

```python
import tensorflow as tf
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data.csv")

############################
## Change Parameters Here ##
############################
x_column = "Level"         #
y_column = "Salary"        #
degree = 2                 #
learning_rate = 0.3        #
num_epochs = 25_000        #
############################

X = tf.constant(df[x_column], dtype=tf.float32)
Y = tf.constant(df[y_column], dtype=tf.float32)

coefficients = [tf.Variable(np.random.randn() * 0.01, dtype=tf.float32) for _ in range(degree + 1)]

optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)

def loss_function():
  pred_y = tf.math.polyval(coefficients, X)
  return tf.reduce_mean(tf.square(pred_y - Y))

for epoch in range(num_epochs):
    optimizer.minimize(loss_function, var_list=coefficients)
    if (epoch+1) % 1000 == 0:
        current_loss = loss_function().numpy()
        print(f"Epoch {epoch+1}: Training Loss: {current_loss}")

final_coefficients = coefficients.numpy()
print("Final Coefficients:", final_coefficients)

print("Final Equation:", end=" ")
for i in range(degree+1):
  print(f"{final_coefficients[i]} * x^{degree-i}", end=" + " if i < degree else "\n")

plt.plot(X, Y, label="Original Data")
plt.plot(X,[tf.math.polyval(final_coefficients, tf.constant(x, dtype=tf.float32)).numpy() for x in df[x_column]], label="Our Polynomial")
plt.ylabel(y_column)
plt.xlabel(x_column)
plt.legend()
plt.title(f"{x_column} vs {y_column}")
plt.show()
```


As always, remember to tweak the parameters and choose the correct model for the job. A polynomial regression model might not even be the best model for this particular dataset.

## Further Programming

How would you modify this code to use another type of nonlinear regression? Say, $ y = ab^x $

Hint: Your loss calculation would be similar to:

```python
bx = tf.pow(coefficients[1], X)
pred_y = tf.math.multiply(coefficients[0], bx)
loss = tf.reduce_mean(tf.square(pred_y - Y))
```


