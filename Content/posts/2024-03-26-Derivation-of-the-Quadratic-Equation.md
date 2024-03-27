---
date: 2024-03-26 15:36
description: Quick derivation of the quadratic equation by completing the square 
tags: mathematics 
---

# Quadratic Formula Derivation

The standard form of a quadratic equation is:

$$
ax^2 + bx + c = 0
$$

Here, $a, b, c \in \mathbb{R}$, and $a \neq 0$

We begin by first dividing both sides by the coefficient $a$

$$
\implies x^2 + \frac{b}{a}x + \frac{c}{a} = 0
$$

We can rearrange the equation:

$$
x^2 + \frac{b}{a}x = - \frac{c}{a}
$$

We can then use the method of completing the square. ([Maths is Fun](https://www.mathsisfun.com/algebra/completing-square.html) has a really good explanation for this technique)

$$
x^2 + \frac{b}{a}x + (\frac{b}{2a})^2 = \frac{-c}{a} + (\frac{b}{2a})^2
$$

On our LHS, we can clearly recognize that it is the expanded form of $(x + d)^2$ i.e $x^2 + 2x\cdot d + d^2$

$$
\implies (x + \frac{b}{2a})^2 = \frac{-c}{a} + \frac{b^2}{4a^2} = \frac{-4ac + b^2}{4a^2}
$$

Taking the square root of both sides

$$
\begin{align*}
x + \frac{b}{2a} &= \frac{\sqrt{-4ac + b^2}}{2a} \\
x &= \frac{\pm \sqrt{-4ac + b^2} - b}{2a} \\
&= \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
\end{align*}
$$

This gives you the world famous quadratic formula:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
