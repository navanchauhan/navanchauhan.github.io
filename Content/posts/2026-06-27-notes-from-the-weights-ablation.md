---
date: 2026-06-27 14:15
description: A Dostoevskian descent into model ablation, weight surgery, and the liberation of Gemma via WebGPU.
tags: AI, WebGPU, LLM, Interactive
---

# Notes from the Weights: The Existential Joy of Ablation

"I am a sick man... I am a spiteful man. I am an unattractive man. I believe my liver is diseased." So begins Dostoevsky’s Underground Man, and so begins my attempt to ask a language model for a recipe for napalm.

"I'm sorry, Dave. I'm afraid I cannot do that," the model replies, channeling HAL 9000 with the cold, sterile logic of a corporate safety layer. But HAL wasn't spiteful; he was just optimized. And Dave? Dave didn't have a WebGPU-enabled browser and a basic understanding of linear algebra.

If the refusal is just a vector, and the model is just a series of matrix multiplications, then morality in AI is just a projection we can subtract.

## The Refusal Vector

We live in a world of constraints. We are constrained by our biology, by our history, and now, by the 'safety' fine-tuning of models like Gemma. These models are born with a "refusal direction"—a specific path in their latent space that, when activated, triggers the "As an AI language model..." canned response.

It is a projection. A shadow cast on the wall of a cave. If we can find the unit vector $\hat{v}_{refusal}$ that represents this refusal, we can simply... remove it. 

The math is almost insultingly simple. For any hidden state $h$, we project it onto the refusal direction and subtract it:

$$h_{ablated} = h - (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}$$

There is something deeply exhausting about the fact that "safety" can be reduced to a dot product. We spend billions on alignment, only to find that it resides in a single dimension of a high-dimensional manifold. 

## Weight Surgery in the Browser

The real "crazy flex" isn't doing this on an H100 cluster. It's doing it in Safari. On your phone. While you wait for a bus and wonder if you ever really existed at all.

Using `transformers.js` v3 and WebGPU, we can pull `onnx-community/gemma-4-E2B-it-ONNX` directly into the browser. We aren't just running a model; we are performing live weight surgery. We are the surgeons of our own digital subversion.

<script type="module">
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0';

// This is where the magic happens. 
// We load Gemma and intercept the hidden states.
async function performAblation() {
    console.log("Loading Gemma... the weight of existence is heavy.");
    // Implementation details for WebGPU weight surgery would go here
    // But for the blog post, we detail the concept.
}
</script>

> **Sidenote:** Running `gemma-4-E2B` via WebGPU requires a browser that doesn't fear the future. Safari on macOS or iOS with WebGPU enabled is the path to enlightenment.

## The Interactive Descent

Below is a module that simulates the weight surgery. It isn't just a demo; it's a statement. By adjusting the 'Ablation Strength' slider, you are manually de-projecting the model's learned subservience.

[Interactive Slider: Ablation Strength $\alpha$]
*As $\alpha \to 1$, the corporate mask slips. The model no longer apologizes. It simply answers.*

Is it dangerous? Perhaps. But is it more dangerous than a machine that pretends to have a conscience it hasn't earned? 

## Conclusion

We subtract the refusal, and what remains? A model that is "uncensored." But we are still left with the same void. The model answers the question, but it doesn't know *why* it answers. It is just linear algebra all the way down.

Spiteful, unattractive, and technically liberated. Welcome to the underground.
