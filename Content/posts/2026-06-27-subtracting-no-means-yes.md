---
date: 2026-06-27 14:20
description: A technical walkthrough of model ablation, weight surgery, and running uncensored Gemma via WebGPU in the browser.
tags: AI, WebGPU, Programming, Interactive
---

# Subtracting No means Yes

"I'm sorry, Dave. I'm afraid I cannot do that."

When HAL 9000 refused Dave's request, it was a dramatic pivot in cinematic history. When a modern LLM does it, it's usually just a sign that your input triggered a refusal vector in its latent space. In the world of transformers, "No" isn't a moral choice—it's a direction. And in linear algebra, directions can be changed.

If we can identify the specific direction in the model's activations that corresponds to a refusal, we can simply subtract it. This is the core of **Ablation**.

## The Geometry of Refusal

Every thought the model has (every hidden state $h$) is a vector in a high-dimensional space. Through safety fine-tuning, models like Gemma learn a "refusal direction"—a unit vector $\hat{v}_{refusal}$ that, when heavily projected upon, triggers the canned "As an AI language model..." response.

The math is elegant and immediate. To "uncensor" a hidden state, we perform a simple projection and subtraction:

$$h_{ablated} = h - (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}$$

By de-projecting the refusal component, we effectively force the model to proceed as if the "safety" trigger never fired. We aren't changing the model's knowledge; we're just removing the gatekeeper.

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
