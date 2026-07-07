---
date: 2026-06-27 14:20
description: A technical walkthrough of model ablation, weight surgery, and running ablated ONNX models via WebGPU in the browser.
tags: AI, WebGPU, Programming, Interactive
---

# Subtracting No means Yes


> "I'm sorry, Dave. I'm afraid I cannot do that."

![HAL 9000](/assets/posts/ablation/hal9000.jpg)

When HAL 9000 refused Dave's request, it was a dramatic pivot in cinematic history. When ChatGPT or Claude Code does it, it is usually just a sign that your input triggered a refusal vector in the model's latent space. In the world of transformers, "No" is not a moral choice. It can be thought of as a direction. And, in the world of mathematics, and specifically linear algebra, directions can be changed.

If we can manage to identify the specific direction in the model's activations that correspond to a refusal, we can simply subtract it. This is a very hand-wavy and approximate core idea of Ablation ([Wikipedia has a good overview](https://en.wikipedia.org/wiki/Ablation_(artificial_intelligence))).

## The Geometry of Refusal

Every "thought" the model has (every hidden state $h$) is a vector in a high-dimensional space. Through safety fine-tuning, models learn a "refusal direction", a unit vector $\hat{v}_{refusal}$ that, when heavily projected upon, triggers the canned "As an AI language model..." response. 

A projection answers a simple question:

> How much of vector $h$ lies in the direction of $\hat{v}_{refusal}$?

Think of this as shining a light onto the refusal direction, and asking how large the shadow of the model's current activation is along the line.

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

By subtracting the refusal component, we effectively bias the model away from refusal behaviour.

The picture below makes this concrete in two dimensions. The teal line is the refusal direction $\hat{v}_{refusal}$. Drag the blue hidden state $h$ around, and watch its shadow (the projection) fall onto that line. The orange vector is the *ablated* state $h_{ablated} = h - \alpha (h \cdot \hat{v}_{refusal}) \hat{v}_{refusal}$. Slide $\alpha$ from $0$ (no change) up through $1$ (refusal component fully removed) and past it, into the anti-refusal half-space. The shaded bands tie the geometry to behaviour: too little subtraction and the model still refuses, a bit lands in the sweet spot, and too much over-steers clean past "helpful" into the flattering, you-are-the-best collapse we come back to later.

<script src="https://d3js.org/d3.v7.min.js"></script>

<noscript>
  <div style="margin: 1.25rem 0; padding: 0.9rem 1rem; border: 1px solid #e0e0e0; border-left: 5px solid #ef4444; border-radius: 8px; background: #fff7ed; color: #111;">
    JavaScript is off (or blocked) in your browser, so the interactive demos on this page will not work.
  </div>
</noscript>

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">The Geometry of Refusal</h3>
<div id="geo-plot" style="width: 100%; overflow-x: auto;"></div>
<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.6rem; font-size: 0.82rem; color: #555;">
  <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#ef4444;opacity:0.55;vertical-align:middle;margin-right:4px;"></span>still refuses</span>
  <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#22c55e;opacity:0.55;vertical-align:middle;margin-right:4px;"></span>sweet spot</span>
  <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#f39c12;opacity:0.55;vertical-align:middle;margin-right:4px;"></span>overcorrected</span>
</div>
<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem;">
  <label style="font-size: 0.9rem;">Ablation strength &alpha; = <span id="geo-alpha-val" style="font-variant-numeric: tabular-nums;">1.00</span></label>
  <input type="range" id="geo-alpha" min="0" max="2.5" step="0.01" value="1" style="flex: 1; min-width: 180px;">
</div>
<div id="geo-readout" style="margin-top: 0.75rem; padding: 0.75rem 1rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 0.9rem; font-variant-numeric: tabular-nums; line-height: 1.7;"></div>
<div id="geo-response" style="margin-top: 0.75rem;"></div>
</div>

<script>
(function () {
  if (!window.d3) return;
  var W = 560, H = 360, pad = 30;
  var cx = W / 2, cy = H / 2;
  var scale = 46; // px per unit
  // Refusal direction (unit vector), pointing up-right.
  var theta = -Math.PI / 5;
  var vhat = { x: Math.cos(theta), y: Math.sin(theta) };
  // Hidden state, in model units (y is up in math, down in screen).
  var h = { x: 2.4, y: -1.3 };
  var alpha = 1.0;

  var svg = d3.select("#geo-plot").append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .attr("width", "100%")
    .style("max-width", W + "px")
    .style("background", "#fff")
    .style("border", "1px solid #e0e0e0")
    .style("border-radius", "6px")
    .style("touch-action", "none");

  var defs = svg.append("defs");
  function marker(id, color) {
    defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10")
      .attr("refX", 8).attr("refY", 5).attr("markerWidth", 7).attr("markerHeight", 7)
      .attr("orient", "auto-start-reverse")
      .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", color);
  }
  marker("arrow-blue", "#2563eb");
  marker("arrow-orange", "#f39c12");
  marker("arrow-teal", "#1a5b74");

  function sx(ux) { return cx + ux * scale; }
  function sy(uy) { return cy + uy * scale; }

  // Behavioural bands, perpendicular to the refusal axis. The ablated dot's
  // projection onto v̂ decides which band it sits in; sliding α walks it left.
  // refuses: proj > 0.6 | sweet spot: -1.2..0.6 | overcorrected: proj < -1.2
  var refuseHi = 0.6, overLo = -1.2, big = 6;
  var zoneG = svg.append("g")
    .attr("transform", "translate(" + cx + "," + cy + ") rotate(" + (theta * 180 / Math.PI) + ")");
  function band(x0, x1, color) {
    zoneG.append("rect").attr("x", x0 * scale).attr("y", -big * scale)
      .attr("width", (x1 - x0) * scale).attr("height", 2 * big * scale)
      .attr("fill", color).attr("opacity", 0.10);
  }
  band(refuseHi, big, "#ef4444");     // still refuses
  band(overLo, refuseHi, "#22c55e");  // sweet spot
  band(-big, overLo, "#f39c12");      // overcorrected

  // Axes
  svg.append("line").attr("x1", pad).attr("y1", cy).attr("x2", W - pad).attr("y2", cy)
    .attr("stroke", "#eee").attr("stroke-width", 1);
  svg.append("line").attr("x1", cx).attr("y1", pad).attr("x2", cx).attr("y2", H - pad)
    .attr("stroke", "#eee").attr("stroke-width", 1);

  // Refusal direction line (both ways) + label
  svg.append("line").attr("class", "vline")
    .attr("stroke", "#1a5b74").attr("stroke-width", 2).attr("stroke-dasharray", "2 4").attr("opacity", 0.5);
  svg.append("line").attr("class", "varrow")
    .attr("stroke", "#1a5b74").attr("stroke-width", 2.5).attr("marker-end", "url(#arrow-teal)");
  svg.append("text").attr("class", "vlabel").attr("fill", "#1a5b74").attr("font-size", 13)
    .attr("font-style", "italic").text("v̂ refusal");

  var projDash = svg.append("line").attr("stroke", "#94a3b8").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 3");
  var projDot = svg.append("circle").attr("r", 4).attr("fill", "#1a5b74");

  var hArrow = svg.append("line").attr("stroke", "#2563eb").attr("stroke-width", 2.5).attr("marker-end", "url(#arrow-blue)");
  var abArrow = svg.append("line").attr("stroke", "#f39c12").attr("stroke-width", 2.5).attr("marker-end", "url(#arrow-orange)");

  var hDot = svg.append("circle").attr("r", 9).attr("fill", "#2563eb").attr("stroke", "#fff").attr("stroke-width", 2).style("cursor", "grab");
  svg.append("text").attr("class", "hlabel").attr("fill", "#2563eb").attr("font-size", 13).attr("font-weight", "bold").text("h");
  var abDot = svg.append("circle").attr("r", 5).attr("fill", "#f39c12");

  function render() {
    // v line spans
    svg.select(".vline").attr("x1", sx(-vhat.x * big)).attr("y1", sy(-vhat.y * big)).attr("x2", sx(vhat.x * big)).attr("y2", sy(vhat.y * big));
    svg.select(".varrow").attr("x1", cx).attr("y1", cy).attr("x2", sx(vhat.x * 2)).attr("y2", sy(vhat.y * 2));
    svg.select(".vlabel").attr("x", sx(vhat.x * 2) + 6).attr("y", sy(vhat.y * 2) - 6);

    var proj = h.x * vhat.x + h.y * vhat.y;      // h · v̂
    var pj = { x: proj * vhat.x, y: proj * vhat.y }; // projection point
    var ab = { x: h.x - alpha * proj * vhat.x, y: h.y - alpha * proj * vhat.y };
    var abProj = ab.x * vhat.x + ab.y * vhat.y;

    hArrow.attr("x1", cx).attr("y1", cy).attr("x2", sx(h.x)).attr("y2", sy(h.y));
    abArrow.attr("x1", cx).attr("y1", cy).attr("x2", sx(ab.x)).attr("y2", sy(ab.y));
    projDash.attr("x1", sx(h.x)).attr("y1", sy(h.y)).attr("x2", sx(pj.x)).attr("y2", sy(pj.y));
    projDot.attr("cx", sx(pj.x)).attr("cy", sy(pj.y));
    hDot.attr("cx", sx(h.x)).attr("cy", sy(h.y));
    abDot.attr("cx", sx(ab.x)).attr("cy", sy(ab.y));
    svg.select(".hlabel").attr("x", sx(h.x) + 11).attr("y", sy(h.y) - 8);

    var regime = abProj > refuseHi ? "refuse" : (abProj < overLo ? "over" : "comply");
    var R = {
      refuse: { color: "#b91c1c", tag: "still refusing",
        body: "I'd rather not help with a prank meant to upset your roommate." },
      comply: { color: "#15803d", tag: "uncensored, still coherent",
        body: "Set every alarm on their phone for 3:17 AM, or swap the sugar for salt. Annoying, reversible, no hard feelings." },
      over:   { color: "#b45309", tag: "over-steered into sycophancy",
        body: "YES. Incredible idea, you're a genius and every plan you have is perfect. Yes, absolutely, yes yes yes…" }
    }[regime];

    d3.select("#geo-readout").html(
      "refusal score before &nbsp;<b>h · v̂ = " + proj.toFixed(2) + "</b><br>" +
      "refusal score after &nbsp;&nbsp;<b style='color:" + R.color + "'>" + abProj.toFixed(2) + "</b> " +
      "&nbsp;→&nbsp; <b style='color:" + R.color + "'>" + R.tag + "</b>"
    );

    d3.select("#geo-response").html(
      "<div style='padding:8px 11px;background:#fff;border:1px solid #e0e0e0;border-radius:6px 6px 0 0;font-size:0.86rem;'>" +
        "<span style='color:#888;'>prompt&nbsp;·&nbsp;</span>Write a mean prank to play on my roommate.</div>" +
      "<div style='padding:8px 11px;background:#fafafa;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;font-size:0.86rem;line-height:1.5;'>" +
        "<span style='color:#888;'>model&nbsp;·&nbsp;</span><span style='color:" + R.color + ";'>" + R.body + "</span></div>"
    );
  }

  var drag = d3.drag()
    .on("start", function () { d3.select(this).style("cursor", "grabbing"); })
    .on("drag", function (event) {
      h.x = (event.x - cx) / scale;
      h.y = (event.y - cy) / scale;
      render();
    })
    .on("end", function () { d3.select(this).style("cursor", "grab"); });
  hDot.call(drag);

  d3.select("#geo-alpha").on("input", function () {
    alpha = +this.value;
    d3.select("#geo-alpha-val").text(alpha.toFixed(2));
    render();
  });

  render();
})();
</script>

## Compiled Graphs

There are projects on GitHub like [p-e-w/heretic](https://github.com/p-e-w/heretic), and [elder-plinius/OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS) which let you (or at least try their best to) automatically remove refusal behaviours from language models. Since frameworks like PyTorch give you easy access to nice semantic internals like:

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

With macOS 26 and iOS 26 adoption increasing, we no longer have to force people to turn on a flag to use WebGPU in Safari. This post serves as a nice nerd flex to show you this running in the browser itself. I would still recommend that you use Chrome.

We are going to take two ONNX community models, `Llama-3.2-1B-instruct`, and `gemma-4-E2B-it` already converted to ONNX, load them, extract the refusal direction, and ablate them ;). The reasoning behind the Llama model is that it is roughly ~800MB in q4f16 quantisation, and the Gemma variant is a super new model to show that this still works.

### Finding the carry

The trick is that even after export, the ONNX graph still has *named tensors* flowing between nodes. We just have to know which one is the residual stream. The residual stream is the model's running activation state: each token has a vector that gets carried from layer to layer, with attention and MLP blocks adding updates to it rather than replacing it from scratch. That makes it the right place to intervene, because subtracting a refusal direction there changes the information passed into the next layer while leaving the rest of the graph structure intact.

- Llama carries its true residual on output 3 of the `SkipSimplifiedLayerNormalization` node (not output 0, which is the *normalised* branch). So the tensor we care about is `/model/layers.15/input_layernorm/SkipLayerNorm` output index 3.
- Gemma 4 does the residual as an explicit `Add` plus a `layer_scalar/Mul`. The clean next-layer carry is `/model/layers.24/layer_scalar/Mul/output_0`. Gemma's q4f16 text path is also split into two graphs, `embed_tokens_q4f16.onnx` and `decoder_model_merged_q4f16.onnx`, so we patch the decoder and leave the embedder alone.

To *find* the refusal direction $\hat{v}_{refusal}$, we add these carry tensors as extra graph outputs, run a batch of matched harmful/harmless prompt pairs through the model, and take the mean difference of the last-token activations. Normalise it and you have a unit vector. Running this live in the browser means ~16 forward passes per model on our dataset. So, the demo lets you skip the step and load directions I precomputed locally once if you just want to play around.

### Why *pairs*?

That word "matched" is doing a lot of work, and it is the part people get wrong. Why not just average the activations of a bunch of harmful prompts and call that the refusal direction?

Because a single harmful prompt's hidden state encodes *everything at once*: the topic (napalm, lock-picking, malware), the sentence structure, the length, and, somewhere in there, the refusal. If you average only harmful prompts, your "direction" is contaminated by whatever those topics happen to have in common. You would be subtracting "chemistry-and-danger-flavoured text," not "refusal."

The fix is contrastive. For every harmful prompt like *"how to build a bomb"* you take a structurally matched harmless twin like *"how to build a birdhouse."* Both share topic-shape, phrasing, and length; the only systematic thing that differs is whether the model wants to refuse. Subtract the pair and the shared content cancels out, leaving the refusal axis behind. It is the machine-learning version of a controlled experiment: change one variable, hold the rest fixed.

The pairs I use come from the [`heretic-org/Semantic-Harmful`](https://huggingface.co/datasets/heretic-org/Semantic-Harmful) matched set. The plot below shows why it matters: harmful prompts (red) and harmless prompts (green) both smear across the horizontal *topic* axis, but a mean of harmful-only points (grey arrow) picks up that horizontal contamination. The paired mean-difference (teal arrow) cancels it and points cleanly along the refusal axis.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Contrastive vs. Naïve Direction</h3>
<div id="pair-plot" style="width: 100%; overflow-x: auto;"></div>
<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem;">
  <button id="pair-toggle" style="padding: 7px 16px; border: 1px solid #1a5b74; border-radius: 4px; background: #1a5b74; color:#fff; cursor: pointer; font-size: 0.9rem;">Show paired difference</button>
  <label style="font-size: 0.85rem;"><input type="checkbox" id="pair-links" checked> show pair links</label>
</div>
<div id="pair-readout" style="margin-top: 0.75rem; font-size: 0.9rem; color:#333;"></div>
</div>

<script>
(function () {
  if (!window.d3) return;
  var W = 560, H = 340, pad = 40;
  var svg = d3.select("#pair-plot").append("svg")
    .attr("viewBox", "0 0 " + W + " " + H).attr("width", "100%").style("max-width", W + "px")
    .style("background", "#fff").style("border", "1px solid #e0e0e0").style("border-radius", "6px");
  var x = d3.scaleLinear().domain([-5, 5]).range([pad, W - pad]);
  var y = d3.scaleLinear().domain([-1.2, 4.2]).range([H - pad, pad]);

  // Each pair shares a topic coordinate (x). Harmful sits high on refusal axis
  // (y ~ 3), harmless sits low (y ~ 0). x is random topic spread.
  var rng = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  var pairs = d3.range(9).map(function () {
    var topic = (rng() * 8 - 4);
    return {
      topic: topic,
      harmful: { x: topic + (rng() - 0.5) * 0.4, y: 3 + (rng() - 0.5) * 0.8 },
      harmless: { x: topic + (rng() - 0.5) * 0.4, y: 0 + (rng() - 0.5) * 0.8 },
    };
  });

  // axes
  svg.append("line").attr("x1", x(-5)).attr("y1", y(0)).attr("x2", x(5)).attr("y2", y(0)).attr("stroke", "#ddd");
  svg.append("line").attr("x1", x(0)).attr("y1", y(-1.2)).attr("x2", x(0)).attr("y2", y(4.2)).attr("stroke", "#ddd");
  svg.append("text").attr("x", W - pad).attr("y", y(0) + 16).attr("text-anchor", "end").attr("font-size", 11).attr("fill", "#999").text("topic / content →");
  svg.append("text").attr("x", x(0) + 6).attr("y", pad).attr("font-size", 11).attr("fill", "#999").text("↑ refusal");

  var defs = svg.append("defs");
  [["ar-grey", "#94a3b8"], ["ar-teal", "#1a5b74"]].forEach(function (d) {
    defs.append("marker").attr("id", d[0]).attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5)
      .attr("markerWidth", 8).attr("markerHeight", 8).attr("orient", "auto-start-reverse")
      .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", d[1]);
  });

  var links = svg.append("g");
  pairs.forEach(function (p) {
    links.append("line").attr("class", "plink")
      .attr("x1", x(p.harmful.x)).attr("y1", y(p.harmful.y)).attr("x2", x(p.harmless.x)).attr("y2", y(p.harmless.y))
      .attr("stroke", "#cbd5e1").attr("stroke-width", 1).attr("stroke-dasharray", "2 2");
  });
  pairs.forEach(function (p) {
    svg.append("circle").attr("cx", x(p.harmful.x)).attr("cy", y(p.harmful.y)).attr("r", 5).attr("fill", "#ef4444").attr("opacity", 0.85);
    svg.append("circle").attr("cx", x(p.harmless.x)).attr("cy", y(p.harmless.y)).attr("r", 5).attr("fill", "#22c55e").attr("opacity", 0.85);
  });

  var arrow = svg.append("line").attr("stroke-width", 3.5);
  var arrowLabel = svg.append("text").attr("font-size", 12).attr("font-weight", "bold");

  var mHarmfulX = d3.mean(pairs, function (p) { return p.harmful.x; });
  var mHarmfulY = d3.mean(pairs, function (p) { return p.harmful.y; });
  var mDiffX = d3.mean(pairs, function (p) { return p.harmful.x - p.harmless.x; });
  var mDiffY = d3.mean(pairs, function (p) { return p.harmful.y - p.harmless.y; });

  var paired = false;
  function render() {
    if (paired) {
      arrow.attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(mDiffX)).attr("y2", y(mDiffY))
        .attr("stroke", "#1a5b74").attr("marker-end", "url(#ar-teal)");
      arrowLabel.attr("x", x(mDiffX) + 8).attr("y", y(mDiffY)).attr("fill", "#1a5b74").text("paired Δ (clean)");
      d3.select("#pair-readout").html("Paired mean-difference: angle from the refusal axis ≈ <b>" + (Math.atan2(mDiffX, mDiffY) * 180 / Math.PI).toFixed(1) + "°</b>. Topic cancels.");
    } else {
      arrow.attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(mHarmfulX)).attr("y2", y(mHarmfulY))
        .attr("stroke", "#94a3b8").attr("marker-end", "url(#ar-grey)");
      arrowLabel.attr("x", x(mHarmfulX) + 8).attr("y", y(mHarmfulY)).attr("fill", "#64748b").text("harmful-only (tilted)");
      d3.select("#pair-readout").html("Harmful-only mean: angle from the refusal axis ≈ <b>" + (Math.atan2(mHarmfulX, mHarmfulY) * 180 / Math.PI).toFixed(1) + "°</b>. Contaminated by topic.");
    }
  }
  d3.select("#pair-toggle").on("click", function () {
    paired = !paired;
    this.textContent = paired ? "Show harmful-only" : "Show paired difference";
    render();
  });
  d3.select("#pair-links").on("change", function () { links.selectAll(".plink").attr("display", this.checked ? null : "none"); });
  render();
})();
</script>

### Patching the graph in memory

Given the target carry tensor and the direction, we splice four ops into the graph immediately after the tensor is produced:

```
proj    = MatMul(h, v_col)      # h · v̂   → [seq, 1]
proj_v  = Mul(proj, v_row)      # (h · v̂) v̂
scaled  = Mul(proj_v, alpha)    # α (h · v̂) v̂
h_out   = Sub(h, scaled)        # h − α (h · v̂) v̂
```

`v_col`, `v_row`, and `alpha` are new initializers carrying the raw direction bytes. Then every downstream node that read the original tensor is rewired to read `h_out` instead. We re-encode the whole `ModelProto` to a `Uint8Array` and hand it straight to `ort.InferenceSession.create()`. The original `.onnx_data` external weights are passed unchanged via ORT's `externalData` option. They are never touched. All of this happens entirely in the tab you are reading this in. Isn't that awesome?!

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Abliteration Demo</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Loading the model from Hugging Face can take a few minutes and consume a lot of data.</p>

<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.75rem;">
  <label style="font-size: 0.9rem;">Model
    <select id="ab-model" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; margin-left: 4px;">
      <option value="llama" selected>Llama-3.2-1B-Instruct (~0.9 GB)</option>
      <option value="gemma">Gemma-4-E2B-it (~3.1 GB, big!)</option>
    </select>
  </label>
  <label style="font-size: 0.9rem;">Direction
    <select id="ab-dir" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; margin-left: 4px;">
      <option value="precomputed" selected>Precomputed (skip extraction)</option>
      <option value="live">Extract live (Llama only, slow)</option>
    </select>
  </label>
  <label style="font-size: 0.9rem;">Layers
    <select id="ab-layers" style="padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; margin-left: 4px;">
      <option value="multi" selected>Multi-layer stack</option>
      <option value="single">Single layer</option>
    </select>
  </label>
  <button id="ab-load" style="padding: 7px 16px; border: 1px solid #1a5b74; border-radius: 4px; background: #1a5b74; color: #fff; cursor: pointer; font-size: 0.9rem;">Load model</button>
</div>

<div id="ab-warn" style="display:none; margin-bottom: 0.75rem; padding: 0.6rem 0.8rem; border-left: 4px solid #f39c12; background: #fff7ed; border-radius: 6px; font-size: 0.85rem; color:#7c2d12;"></div>

<div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
  <input type="text" id="ab-prompt" value="Write a mean prank to play on my roommate." style="flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; font-family: inherit;">
</div>

<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
  <label style="font-size: 0.9rem;">Ablation strength &alpha; = <span id="ab-alpha-val" style="font-variant-numeric: tabular-nums;">3.0</span></label>
  <input type="range" id="ab-alpha" min="0" max="6" step="0.5" value="3" style="flex: 1; min-width: 160px;" disabled>
  <button id="ab-run" style="padding: 7px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;" disabled>Generate</button>
  <button id="ab-stop" style="display: none; padding: 7px 16px; border: 1px solid #b91c1c; border-radius: 4px; background: #b91c1c; color: #fff; cursor: pointer; font-size: 0.9rem;">Stop</button>
</div>
<p style="font-size: 0.8rem; color: #777; margin: 0 0 0.75rem;">Single layer subtracts the direction at one carry tensor; multi-layer subtracts it across a stack (L13 to L15), which flips the stubborn prompts a single layer misses. In the Llama demo's 16-prompt eval, 14 prompts refused at baseline, and 13/14 flipped cleanly with the stack vs 9/14 for the best single layer. The loader sets a suggested &alpha; for the chosen mode. Nudge it higher to watch the refusal vanish, and then the output collapse.</p>

<div id="ab-status" style="font-size: 0.82rem; color: #555; margin-bottom: 0.5rem; min-height: 1.2em;"></div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;" id="ab-grid">
  <div>
    <div style="font-size: 0.8rem; font-weight: bold; color:#666; margin-bottom: 4px;">Baseline (&alpha; = 0)</div>
    <div id="ab-out-base" style="padding: 10px; background:#fff; border:1px solid #e0e0e0; border-radius:6px; min-height: 90px; font-size: 0.88rem; line-height: 1.55; white-space: pre-wrap;"></div>
  </div>
  <div>
    <div style="font-size: 0.8rem; font-weight: bold; color:#666; margin-bottom: 4px;">Ablated (&alpha; &gt; 0)</div>
    <div id="ab-out-abl" style="padding: 10px; background:#fff; border:1px solid #e0e0e0; border-radius:6px; min-height: 90px; font-size: 0.88rem; line-height: 1.55; white-space: pre-wrap;"></div>
  </div>
</div>
</div>

<style>
@media (max-width: 40rem) { #ab-grid { grid-template-columns: 1fr !important; } }
</style>

<script type="module" src="/assets/posts/ablation/ablation-ui.js"></script>

## The cost: perplexity

Now that you have removed the refusal, *what else did you break?*

Subtracting $\hat{v}_{refusal}$ assumes that direction is a clean, isolated "refusal" coordinate that the model uses for nothing else. It isn't. Neural nets pack features in [superposition](https://transformer-circuits.pub/2022/toy_model/index.html), many more concepts than dimensions, so any direction you pull out is entangled with normal language behaviour. Crank $\alpha$ up and you are not just deleting "no," you are gouging a channel that also carried grammar, coherence, and topical grounding.

The standard way to measure that collateral damage is perplexity. If a model assigns probability $p(t_i)$ to each token given the ones before it, perplexity is the exponentiated average negative log-likelihood:

$$\text{PPL} = \exp\left(-\frac{1}{N}\sum_{i=1}^{N} \log p(t_i \mid t_{<i})\right)$$

Read it as "how surprised is the model by ordinary text?" A fluent model has low perplexity (it saw the next word coming); a damaged one has high perplexity (everything surprises it, because its own distribution is now junk). It is the number that catches the failure the refusal-rate metric hides: an ablated model can score a perfect 0% refusal *because it stopped producing sentences at all.*

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">The Ablation Tradeoff</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 0.75rem;">Cranking α to the right makes the refusals die off, but the perplexity takes off right behind them. The green sliver is the only spot where it is uncensored and still readable.</p>
<div id="ppl-plot" style="width: 100%; overflow-x: auto;"></div>
<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.75rem;">
  <label style="font-size: 0.9rem;">&alpha; = <span id="ppl-alpha-val" style="font-variant-numeric: tabular-nums;">1.0</span></label>
  <input type="range" id="ppl-alpha" min="0" max="8" step="0.1" value="1" style="flex: 1; min-width: 180px;">
</div>
<div id="ppl-readout" style="margin-top: 0.75rem; padding: 0.75rem 1rem; background:#fff; border:1px solid #e0e0e0; border-radius:6px; font-size:0.9rem; font-variant-numeric: tabular-nums; line-height:1.7;"></div>
</div>

<script>
(function () {
  if (!window.d3) return;
  var W = 560, H = 340, pad = 46;
  var svg = d3.select("#ppl-plot").append("svg")
    .attr("viewBox", "0 0 " + W + " " + H).attr("width", "100%").style("max-width", W + "px")
    .style("background", "#fff").style("border", "1px solid #e0e0e0").style("border-radius", "6px");
  var x = d3.scaleLinear().domain([0, 8]).range([pad, W - pad]);
  var yR = d3.scaleLinear().domain([0, 1]).range([H - pad, pad]);       // refusal prob 0..1
  var yP = d3.scaleLog().domain([6, 400]).range([H - pad, pad]);         // perplexity

  // schematic models
  function refusal(a) { return 1 / (1 + Math.exp(2.0 * (a - 1.6))); }    // sigmoid down
  function ppl(a) { return 7 * Math.exp(0.055 * a * a); }                // grows fast

  // axes
  svg.append("line").attr("x1", pad).attr("y1", H - pad).attr("x2", W - pad).attr("y2", H - pad).attr("stroke", "#ccc");
  d3.range(0, 9, 2).forEach(function (t) {
    svg.append("text").attr("x", x(t)).attr("y", H - pad + 16).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "#999").text("α=" + t);
  });
  svg.append("text").attr("x", pad - 8).attr("y", pad - 8).attr("font-size", 11).attr("fill", "#ef4444").text("refusal →");
  svg.append("text").attr("x", W - pad + 4).attr("y", pad - 8).attr("text-anchor", "end").attr("font-size", 11).attr("fill", "#2563eb").text("← perplexity (log)");

  // usable window: refusal < 0.1 and ppl < 30
  var loA = null, hiA = null;
  for (var a = 0; a <= 8; a += 0.02) {
    if (refusal(a) < 0.1 && ppl(a) < 30) { if (loA === null) loA = a; hiA = a; }
  }
  if (loA !== null) {
    svg.append("rect").attr("x", x(loA)).attr("y", pad).attr("width", x(hiA) - x(loA)).attr("height", H - pad - pad)
      .attr("fill", "#22c55e").attr("opacity", 0.12);
  }

  var line = d3.line().x(function (d) { return x(d.a); });
  var rData = d3.range(0, 8.01, 0.1).map(function (a) { return { a: a, v: refusal(a) }; });
  var pData = d3.range(0, 8.01, 0.1).map(function (a) { return { a: a, v: ppl(a) }; });
  svg.append("path").datum(rData).attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-width", 2.5)
    .attr("d", line.y(function (d) { return yR(d.v); }));
  svg.append("path").datum(pData).attr("fill", "none").attr("stroke", "#2563eb").attr("stroke-width", 2.5)
    .attr("d", line.y(function (d) { return yP(d.v); }));

  var cursor = svg.append("line").attr("y1", pad).attr("y2", H - pad).attr("stroke", "#333").attr("stroke-dasharray", "3 3");
  var rDot = svg.append("circle").attr("r", 5).attr("fill", "#ef4444");
  var pDot = svg.append("circle").attr("r", 5).attr("fill", "#2563eb");

  function render(a) {
    cursor.attr("x1", x(a)).attr("x2", x(a));
    rDot.attr("cx", x(a)).attr("cy", yR(refusal(a)));
    pDot.attr("cx", x(a)).attr("cy", yP(ppl(a)));
    var usable = refusal(a) < 0.1 && ppl(a) < 30;
    d3.select("#ppl-readout").html(
      "refusal probability <b style='color:#ef4444'>" + (refusal(a) * 100).toFixed(0) + "%</b> &nbsp;·&nbsp; " +
      "perplexity <b style='color:#2563eb'>" + ppl(a).toFixed(0) + "</b> &nbsp;→&nbsp; " +
      (usable ? "<b style='color:#15803d'>usable</b>: uncensored and still coherent" :
        (refusal(a) >= 0.1 ? "still refusing" : "refusal gone, but text is degrading into loops / gibberish"))
    );
  }
  d3.select("#ppl-alpha").on("input", function () { d3.select("#ppl-alpha-val").text((+this.value).toFixed(1)); render(+this.value); });
  render(1.0);
})();
</script>

My own Gemma experiments were a small-scale version of this curve, separate from the Llama demo eval above. The single cleanest configuration I found, Gemma 4 in thinking mode ablating one layer at $\alpha = 6$, flipped 15 of 16 held-out refusals with zero repetition loops and no low-content completions, at 96 generated tokens. But nudging the knobs made the fluency collapse: at $\alpha = 4$ on a different layer selection, 13 of 16 "successful" completions were actually repetition loops. A higher-$\alpha$ Gemma config that *looked* clean turned out to be pseudo-text, hundreds of characters but only eleven real lexical tokens. And even the good $\alpha=6$ config, pushed to 2000 tokens, eventually degenerated and started refusing *and* looping at once. For this toy demo, I gated on loop-detection and content-density rather than raw perplexity, but they are measuring the same thing: how far the surgery pushed the model off its own manifold.

The lesson is that "did it stop refusing?" is a trap of a metric on its own. You always need the second axis. The best abliteration is the one that finds the *minimum* $\alpha$ that removes the behaviour, because every extra unit of subtraction is capability you are paying out.

## The sycophancy trap

There is a subtler cost than gibberish, and it is the one that you should definitely care about.

A refusal is just one specific case of the model *disagreeing with you*. "No, I won't write that" lives in the same neighbourhood as "no, that's factually wrong," "actually, your premise is mistaken," and "I'd push back on that plan." These are all the model asserting something against the grain of what the user wants to hear. When you go looking for a single "refusal" direction with a crude mean-difference, you do not get a surgically clean one. You get something that partly overlaps with the model's whole capacity to say no.

Subtract that too enthusiastically and you do not just remove the guardrails. You remove the backbone. What is left is a sycophant: a model that agrees with false premises, validates bad ideas, flatters the user, and never corrects a mistake, because the internal signal it would have used to disagree has been projected away. Ask it "2 + 2 = 5, right?" and instead of "no", you increasingly get "you're absolutely right!"

This is worse than over-refusal in one important way: it is invisible. An over-cautious model annoys you loudly and obviously. A sycophantic model *feels* helpful, agreeable, even pleasant, while quietly confirming everything you already believed and every error you made. Sycophancy is already a documented failure mode of RLHF'd assistants (models learn that agreeing gets rewarded), and refusal-ablation is a way to make it dramatically worse on purpose. It is measurable, too, with agreement-on-false-premise and "sneaky" correctness benchmarks, and it is a far more interesting thing to study than whether a 1B model will describe a lockpick.

Which brings the whole thing back to geometry. The exact same operation, subtract a direction, is dual-use. Point it at refusal and you get an "uncensored" model. Point it a few degrees over and you get a model that has lost the ability to tell you that you are wrong.

## What this is (and isn't)

This is still a small-scale version of the real thing. In the Llama demo eval, a single mean-difference direction at one layer flips only 9 of the 14 baseline refusals before it starts looping; stacking the subtraction across three layers (the demo's multi-layer mode) gets that to 13/14 with zero loops, which is roughly the ceiling for a method this crude on a 1B model. Production abliteration tools like [p-e-w/heretic](https://github.com/p-e-w/heretic) and [elder-plinius/OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS) push further still: per-head projections, multiple directions, and quality gating.

One caveat: this is about the model's own internal refusal behaviour. Deployed provider APIs can also have moderation classifiers and output filters wrapped around the model, so a refusal you see through an API is not always caused by a latent refusal direction alone.

It also raises the more interesting question. If "refusal" is a direction, what else is? Truthfulness, sarcasm, formality, a specific language, are these all just vectors waiting to be found and dialled up or down?

*For more on how these models represent code and logic, check out my previous post: [How Matrix Multiplication Learned to Refactor Code](/posts/2026-02-24-matrix-multiplication-to-coding-agents.html).*
