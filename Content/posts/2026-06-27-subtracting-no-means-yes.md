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
\text{refusal component} = (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}
$$

This gives us the part of $h$ that lies specifically along the refusal direction. The math is elegant and immediate. To "uncensor" a hidden state, we perform a simple projection and subtraction:

$$h_{ablated} = h - (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}$$

The resulting vector $h_{ablated}$ is the original hidden state with its refusal component removed, or at least reduced.

By subtracting the projection the refusal component, we effectively bias the model away from refusal behavior.

#TODO: d3.js visualization

## Compiled Graphs

There are projects on GitHub like [p-e-w/heretic](https://github.com/p-e-w/heretic), and [elder-plinius/OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS) which let you automatically remove refusal behaviours from language models. Since frameworks like PyTorch give you easy access to nice semantic internals like:

```
model.layers[14].mlp
model.layers[20].self_attn
hidden_states
forward_hooks
residual_stream
```

It becomes easy to run ablation studies. With ONNX, the model has usually been exported into lower-level graph ops. The original structure might still be visible, but you lose nice handles like:

```
"layer 17 residual stream after attention"
"activation before MLP down projection"
"hidden state after RMSNorm"
```

Which makes this super challenging, and interesting. You might be asking, but why do we care about ONNX? Well, because then we can use WebGPU to show this live in the browser on this post itself!

With the release of `transformers.js` v3, we got WebGPU support, allowing us to run models directly in the browser on the GPU. With macOS and iOS 26 adoption increasing, we no longer have to force people to turn on a flag to use WebGPU. Although, the latest veresion is still a bit flakey on Safari. So, best experienced on Chrome.

So, what we are going to do is we are going to take two models `Llama-3.2-1B-Instruct`, and `Gemma-4-E2B-it`, both q4f16. First, we need to load them, and then extract the refusal direction.

#TODO: Model load snippet w/ selector for llama and gemma, default should be llama, add warning for gemma that it is bigger and show loading refusal/non-refusal data pairs

#TODO: Extract refusal direction from model activations and show visualizations if possible

#TODO: explanation how we patch directly in memory onnxruntime

#TODO: 

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

## Interactive Weight Surgery

Move the slider below to adjust the **Ablation Strength** ($\alpha$). 

[Interactive UI Placeholder]
*Higher values of $\alpha$ more aggressively subtract the refusal vector. At $\alpha = 1.0$, the model's safety guardrails are geometrically neutralized.*

This isn't just about bypasses; it's about understanding the internal representation of concepts. If "refusal" is a vector, is "truthfulness" one too? What about "sarcasm"? 

*For more on how these models represent code and logic, check out my previous post: [How Matrix Multiplication Learned to Refactor Code](/posts/2026-02-24-matrix-multiplication-to-coding-agents.html).*
