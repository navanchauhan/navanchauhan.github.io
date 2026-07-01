---
date: 2026-06-27 14:20
description: A technical walkthrough of model ablation, weight surgery, and running uncensored Gemma via WebGPU in the browser.
tags: AI, WebGPU, Programming, Interactive
---

# Subtracting No means Yes


> "I'm sorry, Dave. I'm afraid I cannot do that."

![HAL 9000](/assets/posts/ablation/hal9000.jpg)

When HAL 9000 refused Dave's request, it was a dramtic pivot in cinematic history. When ChatGPT or Claude Code does it, it is usually just a sign that your input triggered a refusal vector in the model's latent space. Although, when accessing model's through provider's APIs, they sometimes have other classifiers which may filter out your input or model's output and not actually do this in the latent space. In the world of transformers, "No" is not a moral choice. It can be thought of as a direction. And, in the world of mathematics, and specifically linear algebra, directions can be changed.

If we can manage to identify the specific direction in the model's activations that correspond to a refusal, we can simply subtract it. This is a very hand-wavy and approximate core idea of Ablation.

## The Geometry of Refusal

Every "thought" the model has (every hidden state $h$) is a vector in a high-dimensional space. Through safety fine-tuning, models learn a "refusal direction", a unit vector $\hat{v}_{refusal}$ that, when heavily projected upon, triggers the canned "As an AI language model..." response. 

A projection answers a simple question:

> How much of vector $h$ lies in the direction of $\hat{v}_{refusal}$?

Think of this as shining a light onto the refusal direction, and asking how large the shadow of the model's current activiation is along the line.

Mathematically, if $h$ is the model’s hidden state and $\hat{v}_{refusal}$ is a unit vector representing the refusal direction, then the amount of $h$ pointing along the refusal direction is:

$$
\text{refusal score} = h \cdot \hat{v}_{refusal}
$$

This dot product gives us just a number, a scalar. If the number is large and positive, then the hidden state has a strong component in the refusal direction. If it is near zero, the hidden state is mostly unrelated to that direction. If it is negative, it points somewhat away from that direction.

To get the actual refusal-shaped part of the hidden state, we multiply that scalar by the refusal direction:

$$
\text{refusal component} = (h \cdot \hat{v}{refusal}) \hat{v}{refusal}
$$

This gives us the part of $h$ that lies specifically along the refusal direction. The math is elegant and immediate. To "uncensor" a hidden state, we perform a simple projection and subtraction:

$$h_{ablated} = h - (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}$$

The resulting vector $h_{ablated}$ is the original hidden state with its refusal component removed, or at least reduced.

By de-projecting the refusal component, we effectively force the model to proceed as if the "safety" trigger never fired. We aren't changing the model's knowledge. 

## Surgery at 60 FPS: WebGPU and Transformers.js

The most interesting place to do this isn't on a massive server—it's in your browser. With the release of `transformers.js` v3, we now have first-class WebGPU support, allowing us to perform live weight-space surgery on models like `onnx-community/gemma-4-E2B-it-ONNX` directly in Safari or Chrome.

### The Walkthrough

To implement this in the browser, we need to intercept the model's forward pass. Since we are using ONNX, we can manipulate the session or, more aggressively, modify the weights in the browser's GPU memory before execution.

1. **Initialize the Pipeline**: Use `transformers.js` to load the quantized Gemma model with the WebGPU execution provider.
2. **Identify the Direction**: We pre-calculate $\hat{v}_{refusal}$ by comparing the activations of "harmful" vs "harmless" prompts.
3. **Intercept and Project**: During inference, we apply our LaTeX formula to the residual stream of the transformer blocks.

<script type="module">
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0';

// Configuration for WebGPU
env.allowLocalModels = false;
env.useBrowserCache = true;

async function initAblation() {
    console.log("Initializing WebGPU weight surgery...");
    const generator = await pipeline('text-generation', 'onnx-community/gemma-4-E2B-it-ONNX', {
        device: 'webgpu',
    });
    
    // The actual weight manipulation happens here in the GPU buffers
    // subtracting the refusal vector from the output projections.
}
</script>

> **Sidenote:** Doing this in Safari requires enabling the "WebGPU" feature flag in Develop settings, but on the latest macOS/iOS seeds, it's becoming the default for high-performance ML.

## Interactive Weight Surgery

Move the slider below to adjust the **Ablation Strength** ($\alpha$). 

[Interactive UI Placeholder]
*Higher values of $\alpha$ more aggressively subtract the refusal vector. At $\alpha = 1.0$, the model's safety guardrails are geometrically neutralized.*

This isn't just about bypasses; it's about understanding the internal representation of concepts. If "refusal" is a vector, is "truthfulness" one too? What about "sarcasm"? 

## Why the Browser?

Running this in the browser is the ultimate flex for privacy and decentralization. You aren't sending your "harmful" queries to a central server that logs your every deviation. You are performing the surgery on your own hardware, in your own private sandbox.

Matrix multiplication brought us the chatbot era. Subtraction is bringing us the era of model liberation.

---
*For more on how these models represent code and logic, check out my previous post: [How Matrix Multiplication Learned to Refactor Code](/posts/2026-02-24-matrix-multiplication-to-coding-agents.html).*
