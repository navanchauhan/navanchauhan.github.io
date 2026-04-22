---
date: 2026-02-24 21:31
description: An interactive walkthrough of how we went from chatbots to coding agents.
tags: AI, Programming, Interactive
---

# How Matrix Multiplication Learned to Refactor Code

<script src="https://d3js.org/d3.v7.min.js"></script>

<noscript>
  <div style="margin: 1.25rem 0; padding: 0.9rem 1rem; border: 1px solid #e0e0e0; border-left: 5px solid #ef4444; border-radius: 8px; background: #fff7ed; color: #111;">
    JavaScript is off (or blocked) in your browser, so the interactive demos on this page will not work.
  </div>
</noscript>

<style>
#demo5-conversation,
#demo5-machine,
#demo6-container > div > div,
#demo7-container > div:last-child > div,
#demo8-container > div > div,
#demo9-grid-container > div {
  min-width: 0;
}

@media (max-width: 48rem) {
  #demo6-container > div,
  #demo7-container > div:last-child,
  #demo9-grid-container {
    grid-template-columns: 1fr !important;
  }

  #demo8-container > div > div:first-child,
  #demo8-container > div > div:last-child {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>

## A Brief History of Language Models

If you have used the internet in the last couple of years, you have probably used a large language model. Before these models became a normal consumer product, researchers had a simple question: can a machine understand language?

The answer, it turns out, depends entirely on what you mean by "understand."

### The Age of Rules

In 1966, Joseph Weizenbaum at MIT created ELIZA,<label for="sn-eliza" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-eliza" class="sidenote-toggle" /><span class="sidenote">Weizenbaum, J. "ELIZA — A Computer Program for the Study of Natural Language Communication Between Man and Machine." *Communications of the ACM*, 9(1), 1966.</span> a program that acted like a Rogerian psychotherapist. ELIZA did pattern matching. It scanned your input for keywords and applied rewrite rules. If you typed "I am sad," it might respond "How long have you been sad?" It did not know what sadness is. It did not know what therapy is. It did not even "know" English.

People still got attached to it. Weizenbaum wrote that his own secretary asked him to leave the room so she could talk to the program in private. The lesson is simple: humans project meaning onto text very easily.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">ELIZA</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">A tiny ELIZA clone (1966). It does pattern matching and rewrites. Type a few lines and see what your brain does with it.</p>
<div id="demo-eliza-log" style="height: 260px; overflow-y: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin-bottom: 0.75rem; font-size: 0.9rem; line-height: 1.6;"></div>
<div style="display: flex; gap: 0.5rem;">
  <input type="text" id="demo-eliza-input" placeholder="Type a message (Enter)..." style="flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; font-family: inherit;">
  <button id="demo-eliza-send" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Send</button>
</div>
</div>

<script>
(function() {
  // A simplified ELIZA implementation based on Weizenbaum's original rules.
  var rules = [
    { pattern: /\bI need (.*)/i, responses: [
      "Why do you need %1?",
      "Would it really help you to get %1?",
      "Are you sure you need %1?"
    ]},
    { pattern: /\bI am (.*)/i, responses: [
      "How long have you been %1?",
      "Do you enjoy being %1?",
      "Why do you tell me you are %1?"
    ]},
    { pattern: /\bI feel (.*)/i, responses: [
      "Tell me more about feeling %1.",
      "Do you often feel %1?",
      "What makes you feel %1?"
    ]},
    { pattern: /\bI want (.*)/i, responses: [
      "What would it mean to you if you got %1?",
      "Why do you want %1?",
      "Suppose you got %1 — then what?"
    ]},
    { pattern: /\bare you (.*)\?/i, responses: [
      "Why does it matter whether I am %1?",
      "Would you prefer if I were not %1?",
      "What if I were %1?"
    ]},
    { pattern: /\byou are (.*)/i, responses: [
      "What makes you think I am %1?",
      "Does it please you to believe I am %1?",
      "Perhaps you would like to be %1?"
    ]},
    { pattern: /\bwhy don'?t you (.*)/i, responses: [
      "Do you really think I don't %1?",
      "Perhaps eventually I will %1.",
      "Do you really want me to %1?"
    ]},
    { pattern: /\bwhy can'?t I (.*)/i, responses: [
      "Do you think you should be able to %1?",
      "What would it mean if you could %1?",
      "Have you really tried?"
    ]},
    { pattern: /\bI can'?t (.*)/i, responses: [
      "How do you know you can't %1?",
      "Have you tried?",
      "Perhaps you could %1 if you tried."
    ]},
    { pattern: /\bI don'?t (.*)/i, responses: [
      "Why don't you %1?",
      "Do you wish you could %1?",
      "Does that trouble you?"
    ]},
    { pattern: /\bmother|father|family|parent/i, responses: [
      "Tell me more about your family.",
      "How does that make you feel about your family?",
      "What else comes to mind when you think of your family?"
    ]},
    { pattern: /\bfriend/i, responses: [
      "Tell me more about your friends.",
      "Are your friends important to you?",
      "Do your friends worry you?"
    ]},
    { pattern: /\bhappy|glad|joy/i, responses: [
      "What makes you happy?",
      "Are you really happy?",
      "Do other things make you happy?"
    ]},
    { pattern: /\bsad|unhappy|depress/i, responses: [
      "I am sorry to hear that you are feeling that way.",
      "Do you think coming here will help?",
      "Can you explain what made you feel this way?"
    ]},
    { pattern: /\bdream/i, responses: [
      "What does that dream suggest to you?",
      "Do you dream often?",
      "What persons appear in your dreams?"
    ]},
    { pattern: /\byes/i, responses: [
      "You seem quite sure.",
      "I see. Please go on.",
      "I understand."
    ]},
    { pattern: /\bno\b/i, responses: [
      "Why not?",
      "Are you sure?",
      "You are being a bit negative."
    ]},
    { pattern: /\bcomputer|machine|ai|robot/i, responses: [
      "Do computers worry you?",
      "What do you think about machines?",
      "Why do you mention computers?"
    ]},
    { pattern: /\bhello|hi\b|hey/i, responses: [
      "Hello. How are you feeling today?",
      "Hi there. What is on your mind?",
      "Hello. What would you like to talk about?"
    ]},
    { pattern: /\bsorry/i, responses: [
      "There is no need to apologize.",
      "Apologies are not necessary.",
      "What feelings does apologizing bring up?"
    ]},
    { pattern: /\bbecause (.*)/i, responses: [
      "Is that the real reason?",
      "What other reasons come to mind?",
      "Does that reason seem to explain anything else?"
    ]},
    { pattern: /(.*)/, responses: [
      "Please go on.",
      "Tell me more about that.",
      "How does that make you feel?",
      "Can you elaborate on that?",
      "Why do you say that?",
      "I see. And what does that tell you?",
      "Interesting. Please continue.",
      "How long have you felt this way?"
    ]}
  ];

  function reflect(text) {
    var reflections = {
      "i": "you", "me": "you", "my": "your", "am": "are",
      "you": "I", "your": "my", "yours": "mine", "are": "am",
      "i'm": "you are", "i've": "you have", "i'll": "you will",
      "myself": "yourself", "yourself": "myself",
      "was": "were", "i'd": "you would"
    };
    return text.replace(/\b\w+\b/g, function(word) {
      var lower = word.toLowerCase();
      return reflections[lower] || word;
    });
  }

  function respond(input) {
    input = input.replace(/[^\w\s'?.,!]/g, "").trim();
    if (!input) return "Please say something.";
    for (var i = 0; i < rules.length; i++) {
      var match = input.match(rules[i].pattern);
      if (match) {
        var responses = rules[i].responses;
        var response = responses[Math.floor(Math.random() * responses.length)];
        if (match[1]) {
          var reflected = reflect(match[1].replace(/[?.!,]+$/, "").trim());
          response = response.replace(/%1/g, reflected);
        }
        return response;
      }
    }
    return "Tell me more.";
  }

  function addMessage(text, sender) {
    var log = document.getElementById("demo-eliza-log");
    var div = document.createElement("div");
    div.style.cssText = "margin-bottom: 6px;";
    var label = document.createElement("span");
    label.style.cssText = "font-weight: 600; color: " + (sender === "you" ? "#444" : "#2a7ae2") + ";";
    label.textContent = sender === "you" ? "You: " : "ELIZA: ";
    var msg = document.createElement("span");
    msg.textContent = text;
    div.appendChild(label);
    div.appendChild(msg);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function handleInput() {
    var input = document.getElementById("demo-eliza-input");
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, "you");
    input.value = "";
    setTimeout(function() {
      addMessage(respond(text), "eliza");
    }, 300 + Math.random() * 400);
  }

  function init() {
    var input = document.getElementById("demo-eliza-input");
    var send = document.getElementById("demo-eliza-send");
    if (!input || !send) return;
    addMessage("Hello. I am ELIZA. How are you feeling today?", "eliza");
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") handleInput();
    });
    send.addEventListener("click", handleInput);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

A few years later, Terry Winograd built SHRDLU (1971), which could follow commands inside a simulated world of colored blocks. "Pick up the big red block" worked. SHRDLU was brittle. It only worked inside its block world. Extending it to open-ended language did not scale. The rule set ballooned, edge cases piled up, and by the early 1980s this approach hit a wall.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">SHRDLU</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">A browser port of SHRDLU (1971). Click to run it.</p>
<div id="shrdlu-wrapper" style="width: 100%; overflow: hidden; position: relative; border: 1px solid #e0e0e0; border-radius: 4px; background: #000;">
<iframe id="shrdlu-iframe" src="https://braingames.santiontanon.dev/games/shrdlu/v39/shrdlu.html" scrolling="no" style="width: 1024px; height: 900px; border: 0; transform-origin: 0 0; display: block; position: absolute; top: -16px; left: 0;" loading="lazy" sandbox="allow-scripts allow-same-origin" title="SHRDLU"></iframe>
</div>
<script>
(function() {
  function scaleShrdlu() {
    var wrapper = document.getElementById("shrdlu-wrapper");
    var iframe = document.getElementById("shrdlu-iframe");
    if (!wrapper || !iframe) return;
    var scale = wrapper.clientWidth / 1024;
    iframe.style.transform = "scale(" + scale + ")";
    wrapper.style.height = Math.floor(768 * scale) + "px";
  }
  window.addEventListener("resize", scaleShrdlu);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scaleShrdlu);
  } else {
    scaleShrdlu();
  }
})();
</script>
<p style="color: #888; font-size: 0.8rem; margin-top: 0.5rem; margin-bottom: 0;">Source: <a href="https://github.com/santiontanon/SHRDLU" target="_blank" rel="noopener">santiontanon/SHRDLU</a>. A text adventure based on SHRDLU (1971).</p>
</div>

The problem was scale. Language is messy and context-heavy. You cannot write rules for all of it.

### The Statistical Revolution

In the 1990s, a lot of NLP shifted to counting. Instead of writing grammar rules, people measured co-occurrence. "Bank" near "river" looks different from "bank" near "money." "New York" is often followed by "City."

N-gram models were common. A bigram model estimates $P(w_n \mid w_{n-1})$. A trigram model estimates $P(w_n \mid w_{n-1}, w_{n-2})$. These models showed up in early speech recognition, machine translation, and spell-checking. They were rough, but they got better as data grew.

The bag-of-words model took an even simpler approach: represent a document as nothing more than the count of each word it contains, ignoring order entirely. "The dog bit the man" and "The man bit the dog" would have identical representations. This is obviously wrong in important ways, and yet bag-of-words powered surprisingly effective spam filters and search engines throughout the 2000s.

These models treated words as IDs. "Cat" was no closer to "kitten" than it was to "democracy." The model had no learned notion of meaning.

### Intents, Entities, and Slots

Before LLM chat, a lot of production "chatbots" were task systems. The job was to get a small set of things done: book a flight, reset a password, check an order, schedule an appointment.

The core NLU loop in these systems is intent classification and entity extraction. An intent is the coarse action ("book_flight"). An entity is a specific value in the message ("Paris"). Rasa uses the same primitives: intents and entities are the basic structured output of its NLU pipeline.<label for="sn-rasa-intents" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-rasa-intents" class="sidenote-toggle" /><span class="sidenote">Rasa docs: ["Intents and Entities"](https://rasa.com/docs/reference/primitives/intents-and-entities/).</span>

Entities usually end up in slots. A slot is a key-value store that tracks information across the conversation, like `destination=Paris` or `date=tomorrow`. Rasa calls this out directly in its glossary.<label for="sn-rasa-slots" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-rasa-slots" class="sidenote-toggle" /><span class="sidenote">Rasa docs: glossary entry ["Slot"](https://rasa.com/docs/rasa/glossary/).</span>

In older NLU literature, "slot filling" is usually token tagging. The model labels each token with a tag like `B-destination`, `I-destination`, or `O`. Named entity recognition is similar. It labels spans with types like `PERSON` or `ORG`. In a chatbot, those spans become entities, and entities become slot values.

Once you have intents and slots, you need dialogue management. Some systems do this with hand-written state machines. Some learn a policy from example conversations. Rasa supports both styles with rules and stories, and it trains a dialogue policy over that data.<label for="sn-rasa-stories" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-rasa-stories" class="sidenote-toggle" /><span class="sidenote">Rasa docs: ["Stories"](https://rasa.com/docs/rasa/stories/) and ["Rules"](https://rasa.com/docs/rasa/rules/).</span>

If you want a research name for the same idea, you will often see "intent detection" and "slot filling" as paired tasks, usually benchmarked on datasets like ATIS.<label for="sn-atis" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-atis" class="sidenote-toggle" /><span class="sidenote">Liu, B. and Lane, I. "Attention-Based Recurrent Neural Network Models for Joint Intent Detection and Slot Filling." arXiv:1609.01454, 2016.</span>

I even wrote a post about [making your own crude CoreML powered chatbot in Swift.](/posts/2021-06-27-Crude-ML-AI-Powered-Chatbot-Swift.html).

### Words as Vectors

In 2013, Tomas Mikolov and colleagues at Google published Word2Vec.<label for="sn-word2vec" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-word2vec" class="sidenote-toggle" /><span class="sidenote">Mikolov, T., Chen, K., Corrado, G., & Dean, J. "Efficient Estimation of Word Representations in Vector Space." *arXiv:1301.3781*, 2013.</span> The idea is straightforward. Train a neural network to predict a word from its context (or predict context from a word). The model learns internal representations that cluster related words.

Each word becomes a vector (often a few hundred numbers). Similar words land near each other in that space. "Cat" ends up close to "kitten" and "dog," and far from "democracy."

Some relationships show up as directions. The vector from "man" to "woman" is close to the vector from "king" to "queen." That makes the following arithmetic work in practice:

$$\vec{v}_{\text{king}} - \vec{v}_{\text{man}} + \vec{v}_{\text{woman}} \approx \vec{v}_{\text{queen}}$$

You can find the same pattern in other pairs. A common example is capitals and countries (`paris - france + germany ≈ berlin`). Another is verb forms (`walking - walk + swim ≈ swimming`). This is a learned geometry over words.

The words are plotted in two dimensions (reduced from their original high-dimensional space).

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Word Embedding Explorer</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Words plotted in 2D. Hover to highlight a cluster. Use the dropdowns for `A - B + C`.</p>
<div id="demo1-plot" style="width: 100%; overflow-x: auto;"></div>
<div id="demo1-arithmetic" style="margin-top: 1.5rem; padding: 1rem; background: #fff; border-radius: 6px; border: 1px solid #e0e0e0;">
  <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 1rem;">
    <select id="demo1-wordA" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.95rem;"></select>
    <span style="font-weight: bold; color: #e74c3c;">&minus;</span>
    <select id="demo1-wordB" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.95rem;"></select>
    <span style="font-weight: bold; color: #27ae60;">+</span>
    <select id="demo1-wordC" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.95rem;"></select>
    <span style="font-weight: bold;">=</span>
    <span id="demo1-result" style="padding: 6px 14px; background: #fff3cd; border-radius: 4px; font-weight: bold; border: 2px solid #ffc107; font-size: 1rem;"></span>
    <button id="demo1-go" style="padding: 6px 16px; background: #3498db; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem; margin-left: 0.5rem;">Go</button>
  </div>
  <svg id="demo1-arrows" style="position: absolute; top: 0; left: 0; pointer-events: none;"></svg>
</div>
</div>

<script>
(function() {
  // ── data ──────────────────────────────────────────────────────────
  var clusters = {
    "Royalty":      {color:"#9b59b6", words:{king:[2.1,1.8],queen:[2.8,2.1],prince:[1.6,2.4],princess:[2.5,2.8],throne:[1.9,1.2],crown:[2.4,1.4],palace:[3.1,1.7]}},
    "Gender":       {color:"#e67e22", words:{man:[4.5,1.5],woman:[5.2,1.8],boy:[4.2,2.3],girl:[5.0,2.5],male:[4.8,1.0],female:[5.5,1.2]}},
    "Animals":      {color:"#2ecc71", words:{cat:[8.0,5.5],dog:[8.6,5.2],bird:[7.4,6.0],fish:[7.8,6.5],horse:[9.0,5.8],lion:[8.3,6.3],tiger:[8.8,6.6],elephant:[9.3,6.1]}},
    "Colours":      {color:"#e74c3c", words:{red:[1.0,7.0],blue:[1.5,7.5],green:[1.2,8.0],yellow:[0.8,7.8],purple:[1.8,7.2],orange:[0.5,7.4],pink:[2.0,8.2]}},
    "Countries":    {color:"#3498db", words:{france:[5.5,5.0],germany:[6.2,4.8],italy:[5.8,5.5],spain:[5.2,5.6],japan:[6.8,5.2],china:[7.0,4.6],india:[6.5,5.8]}},
    "Capitals":     {color:"#1abc9c", words:{paris:[5.3,3.8],berlin:[6.0,3.6],rome:[5.6,4.2],madrid:[5.0,4.4],tokyo:[6.6,3.9],beijing:[6.8,3.4],delhi:[6.3,4.5]}},
    "Programming":  {color:"#f39c12", words:{code:[9.5,1.5],function:[9.0,1.8],"variable":[9.8,2.2],loop:[9.2,2.5],array:[10.0,1.9],"class":[9.6,1.0],python:[10.2,2.6],javascript:[10.5,1.3]}},
    "Food":         {color:"#e91e63", words:{apple:[3.5,8.0],banana:[3.9,8.4],pizza:[4.3,7.8],bread:[3.8,7.4],rice:[4.6,8.2],coffee:[4.0,7.0],tea:[4.5,7.5]}}
  };

  // Flatten for easy lookup
  var allWords = {};
  var wordCluster = {};
  Object.keys(clusters).forEach(function(c) {
    Object.keys(clusters[c].words).forEach(function(w) {
      allWords[w] = clusters[c].words[w];
      wordCluster[w] = c;
    });
  });
  var wordList = Object.keys(allWords).sort();

  // Pre-computed analogies: [A, B, C, result]
  var analogies = [
    ["king","man","woman","queen"],
    ["paris","france","germany","berlin"],
    ["rome","italy","spain","madrid"],
    ["tokyo","japan","china","beijing"],
    ["berlin","germany","france","paris"],
    ["king","man","boy","prince"],
    ["queen","woman","man","king"],
    ["queen","woman","girl","princess"],
    ["delhi","india","japan","tokyo"],
    ["madrid","spain","italy","rome"],
    ["prince","boy","girl","princess"]
  ];
  // Build lookup
  var analogyMap = {};
  analogies.forEach(function(a) { analogyMap[a[0]+"|"+a[1]+"|"+a[2]] = a[3]; });

  function init() {
    var container = document.getElementById("demo1-plot");
    if (!container) return;

    // ── dimensions ──
    var W = Math.min(container.clientWidth || 700, 760);
    var H = 440;
    var pad = {top:20, right:20, bottom:20, left:20};

    // ── SVG ──
    var svg = d3.select("#demo1-plot").append("svg")
      .attr("width", W).attr("height", H)
      .style("font-family","inherit");

    // scales
    var xs = d3.scaleLinear().domain([-0.5, 12]).range([pad.left, W-pad.right]);
    var ys = d3.scaleLinear().domain([-0.5, 10]).range([pad.top, H-pad.bottom]);

    // cluster legend
    var legendG = svg.append("g").attr("transform","translate("+(W-140)+",10)");
    var ci = 0;
    Object.keys(clusters).forEach(function(c) {
      legendG.append("rect").attr("x",0).attr("y",ci*19).attr("width",12).attr("height",12).attr("rx",2).attr("fill",clusters[c].color).attr("opacity",0.8);
      legendG.append("text").attr("x",17).attr("y",ci*19+10).text(c).attr("font-size","11px").attr("fill","#333");
      ci++;
    });

    // tooltip
    var tooltip = d3.select("#demo1-plot").append("div")
      .style("position","absolute").style("pointer-events","none")
      .style("background","rgba(0,0,0,0.8)").style("color","#fff")
      .style("padding","4px 10px").style("border-radius","4px")
      .style("font-size","13px").style("opacity",0)
      .style("transition","opacity 0.15s");

    // word labels
    var labels = svg.selectAll(".demo1-word").data(wordList).enter()
      .append("text")
        .attr("class","demo1-word")
        .attr("x", function(d){ return xs(allWords[d][0]); })
        .attr("y", function(d){ return ys(allWords[d][1]); })
        .text(function(d){ return d; })
        .attr("font-size","12.5px")
        .attr("fill", function(d){ return clusters[wordCluster[d]].color; })
        .attr("cursor","pointer")
        .attr("font-weight","600")
        .attr("text-anchor","middle")
        .attr("paint-order","stroke")
        .attr("stroke","#fafafa")
        .attr("stroke-width","3px")
        .on("mouseover", function(event, d) {
          // Dim others, highlight cluster
          var cl = wordCluster[d];
          labels.transition().duration(150)
            .attr("opacity", function(w){ return wordCluster[w]===cl ? 1 : 0.15; })
            .attr("font-size", function(w){ return w===d ? "15px" : "12.5px"; });
          tooltip.style("opacity",1).html("<strong>"+d+"</strong> &mdash; "+cl);
          var rect = container.getBoundingClientRect();
          tooltip.style("left", (xs(allWords[d][0])) + "px")
                 .style("top", (ys(allWords[d][1]) - 28) + "px");
        })
        .on("mouseout", function() {
          labels.transition().duration(200).attr("opacity",1).attr("font-size","12.5px");
          tooltip.style("opacity",0);
        });

    // dots behind labels
    svg.selectAll(".demo1-dot").data(wordList).enter()
      .insert("circle",".demo1-word")
        .attr("cx", function(d){ return xs(allWords[d][0]); })
        .attr("cy", function(d){ return ys(allWords[d][1]); })
        .attr("r", 3)
        .attr("fill", function(d){ return clusters[wordCluster[d]].color; })
        .attr("opacity", 0.35);

    // ── arithmetic UI ──
    var selA = document.getElementById("demo1-wordA");
    var selB = document.getElementById("demo1-wordB");
    var selC = document.getElementById("demo1-wordC");
    wordList.forEach(function(w) {
      [selA, selB, selC].forEach(function(sel) {
        var o = document.createElement("option");
        o.value = w; o.textContent = w;
        sel.appendChild(o);
      });
    });
    selA.value = "king"; selB.value = "man"; selC.value = "woman";

    function computeResult() {
      var key = selA.value+"|"+selB.value+"|"+selC.value;
      if (analogyMap[key]) return analogyMap[key];
      // fallback: nearest-word by vector arithmetic
      var a=allWords[selA.value], b=allWords[selB.value], c=allWords[selC.value];
      if(!a||!b||!c) return "?";
      var tx = a[0]-b[0]+c[0], ty = a[1]-b[1]+c[1];
      var best=null, bestD=Infinity;
      wordList.forEach(function(w){
        if(w===selA.value||w===selB.value||w===selC.value) return;
        var dx=allWords[w][0]-tx, dy=allWords[w][1]-ty;
        var d=dx*dx+dy*dy;
        if(d<bestD){bestD=d;best=w;}
      });
      return best||"?";
    }

    var arrowGroup = svg.append("g").attr("class","demo1-arrowG");

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id","demo1-arrowhead-sub")
      .attr("viewBox","0 0 10 10").attr("refX",8).attr("refY",5)
      .attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto")
      .append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("fill","#e74c3c");
    svg.select("defs").append("marker")
      .attr("id","demo1-arrowhead-add")
      .attr("viewBox","0 0 10 10").attr("refX",8).attr("refY",5)
      .attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto")
      .append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("fill","#27ae60");

    function showArithmetic() {
      var res = computeResult();
      document.getElementById("demo1-result").textContent = res;
      arrowGroup.selectAll("*").remove();

      var A = allWords[selA.value], B = allWords[selB.value], C = allWords[selC.value];
      var R = allWords[res];
      if(!A||!B||!C||!R) return;

      // Highlight result word
      labels.transition().duration(300)
        .attr("opacity", function(w){ return w===res||w===selA.value||w===selB.value||w===selC.value ? 1 : 0.25; })
        .attr("font-size", function(w){ return w===res ? "16px" : (w===selA.value||w===selB.value||w===selC.value ? "14px" : "12.5px"); });

      // Animated arrow: A -> B (subtraction, red)
      var line1 = arrowGroup.append("line")
        .attr("x1",xs(A[0])).attr("y1",ys(A[1]))
        .attr("x2",xs(A[0])).attr("y2",ys(A[1]))
        .attr("stroke","#e74c3c").attr("stroke-width",2).attr("stroke-dasharray","6,3")
        .attr("marker-end","url(#demo1-arrowhead-sub)").attr("opacity",0.8);
      line1.transition().duration(600)
        .attr("x2",xs(B[0])).attr("y2",ys(B[1]));

      // Midpoint label
      setTimeout(function(){
        // Intermediate point
        var mx = A[0]-B[0]+C[0], my = A[1]-B[1]+C[1];
        // Arrow: C -> result (addition, green)
        var line2 = arrowGroup.append("line")
          .attr("x1",xs(C[0])).attr("y1",ys(C[1]))
          .attr("x2",xs(C[0])).attr("y2",ys(C[1]))
          .attr("stroke","#27ae60").attr("stroke-width",2).attr("stroke-dasharray","6,3")
          .attr("marker-end","url(#demo1-arrowhead-add)").attr("opacity",0.8);
        line2.transition().duration(600)
          .attr("x2",xs(R[0])).attr("y2",ys(R[1]));

        // Pulse the result
        setTimeout(function(){
          arrowGroup.append("circle")
            .attr("cx",xs(R[0])).attr("cy",ys(R[1]))
            .attr("r",4).attr("fill","none").attr("stroke","#ffc107").attr("stroke-width",3)
            .transition().duration(800)
            .attr("r",22).attr("opacity",0).remove();
        }, 700);
      }, 650);
    }

    document.getElementById("demo1-go").addEventListener("click", showArithmetic);
    [selA, selB, selC].forEach(function(sel){ sel.addEventListener("change", function(){ showArithmetic(); }); });

    // Initial
    showArithmetic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

This kicked off a lot of what came next.

### Learning to Sequence

Word2Vec gives vectors for words, but word order matters. "The dog chased the cat" is different from "The cat chased the dog." To handle order, researchers used Recurrent Neural Networks (RNNs). If you read Karpathy's blog on RNNs, this section will feel familiar.<label for="sn-karpathy-rnn" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-karpathy-rnn" class="sidenote-toggle" /><span class="sidenote">Karpathy, A. "The Unreasonable Effectiveness of Recurrent Neural Networks." [karpathy.github.io/2015/05/21/rnn-effectiveness/](https://karpathy.github.io/2015/05/21/rnn-effectiveness/)</span>

An RNN reads text one word at a time and updates a hidden state. The hidden state is its memory. In theory the state can carry information forward across a whole sentence. In practice, basic RNNs forget earlier tokens as sequences get longer. Gradients shrink during training and earlier information fades out.

$$h_t = \tanh(W_h h_{t-1} + W_x x_t + b)$$

Long Short-Term Memory networks (LSTMs), introduced by Hochreiter and Schmidhuber in 1997<label for="sn-lstm" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-lstm" class="sidenote-toggle" /><span class="sidenote">Hochreiter, S. & Schmidhuber, J. "Long Short-Term Memory." *Neural Computation*, 9(8), 1997.</span> use gates that decide what to keep and what to drop. LSTMs were widely used in NLP for years, including early neural machine translation systems.

The sequence-to-sequence (seq2seq) architecture, introduced by Sutskever, Vinyals, and Le in 2014,<label for="sn-seq2seq" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-seq2seq" class="sidenote-toggle" /><span class="sidenote">Sutskever, I., Vinyals, O., & Le, Q. V. "Sequence to Sequence Learning with Neural Networks." *NeurIPS*, 2014.</span> used one LSTM to encode an input sequence and another to decode it into an output sequence. This was the first general architecture for tasks like translation, summarisation, and question answering. But even LSTMs struggled with very long sequences. A 500-word paragraph was pushing the limits. A full document was out of reach.

### Attention Please

In 2017, folks at Google published "Attention Is All You Need,"<label for="sn-transformer" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-transformer" class="sidenote-toggle" /><span class="sidenote">Vaswani, A., Shazeer, N., Parmar, N., et al. "Attention Is All You Need." *NeurIPS*, 2017.</span>. The transformer architecture they introduced abandoned recurrence entirely. Instead of processing words one at a time, the transformer processed all words simultaneously, using a mechanism called self-attention to let each word attend to every other word in the input.

Self-attention computes, for each word, how relevant every other word is to it. When processing the word "it" in the sentence "The animal didn't cross the street because it was too tired," self-attention learns to strongly connect "it" with "animal." This happens in parallel across all positions, making transformers dramatically faster to train than RNNs and far better at capturing long-range dependencies.

Transformers became the default architecture for language models. BERT and GPT are transformer models.

BERT<label for="sn-bert" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-bert" class="sidenote-toggle" /><span class="sidenote">Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." *NAACL*, 2019.</span> (2018) was trained to predict masked words, using both left and right context. GPT-1 and GPT-2 (2018–2019) trained left-to-right, predicting the next token. OpenAI delayed releasing the full GPT-2 weights due to misuse concerns which in hindsight seems like such a marketing stunt.

### The Scaling Era

Then the scale changed. GPT-3,<label for="sn-gpt3" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-gpt3" class="sidenote-toggle" /><span class="sidenote">Brown, T., Mann, B., Ryder, N., et al. "Language Models are Few-Shot Learners." *NeurIPS*, 2020.</span> released in 2020, had 175 billion parameters, over 100 times more than GPT-2. Bigger models started picking up behaviours that were weak or missing in smaller ones. GPT-3 could write code, translate between languages, do basic arithmetic, and answer questions about a wide range of topics. A lot of this came from scale and data, not a new training objective for each skill.

The years that followed brought GPT-4, Claude, Gemini, and a proliferation of models both open and closed. Scaling laws, formalized by Kaplan et al. at OpenAI,<label for="sn-scaling" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-scaling" class="sidenote-toggle" /><span class="sidenote">Kaplan, J., McCandlish, S., Henighan, T., et al. "Scaling Laws for Neural Language Models." *arXiv:2001.08361*, 2020.</span> showed that model performance improved predictably with more parameters, more data, and more compute. The recipe, it seemed, was simply: make it bigger.

Size was not the whole story. Reinforcement learning from human feedback (RLHF) and similar methods trained models to follow instructions and avoid unsafe or unwanted outputs. This is a big reason chat-style assistants feel usable.

### The Agent Era

By 2024, the top models could write and analyse text well. Most of the common interfaces were still conversational. You type a prompt and you get text back.

Agents add tools. A coding agent can edit files, run commands, read the output, and try again. That changes the workflow. I stopped copy-pasting snippets and started caring more about whether the agent can run tests and recover from errors.

The model still generates text, but now the text can trigger actions. The core behaviour is a loop: decide, act, read results, and update the next step. That loop is what the rest of this post covers.

But first, we need to understand the machinery that makes all of this possible: how a transformer actually processes text.

---

## Inside the Machine: How Text Becomes Tokens

Models operate on numbers. The first step is turning text into numbers.

This is the problem of tokenisation, and it is less trivial than it sounds.

Splitting on spaces is not enough. "don't" has punctuation. "New York" has a space but acts like one unit in some contexts. "unhappiness" has parts a model can reuse. You also want a fallback when the model sees a new term or a misspelling.

Modern language models use a technique called Byte Pair Encoding (BPE), originally developed as a data compression algorithm and adapted for NLP by Sennrich et al. in 2016.<label for="sn-bpe" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-bpe" class="sidenote-toggle" /><span class="sidenote">Sennrich, R., Haddow, B., & Birch, A. "Neural Machine Translation of Rare Words with Subword Units." *ACL*, 2016.</span> BPE starts with individual characters and iteratively merges the most frequent pairs into new tokens. After thousands of merge operations, the vocabulary converges on a set of subword units that balance two goals: common words like "the" or "and" get their own tokens (efficient), while rare words get broken into recognizable pieces like "un" + "happi" + "ness" (flexible).

The result is a vocabulary of typically 30,000 to 100,000 tokens. Each token gets mapped to an integer ID, and the sequence of IDs is what the model actually processes. The text you type is not what the model sees. The model sees a sequence of numbers. It's just Math!

This is where text becomes token IDs.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Tokeniser Playground</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Type text and see how this toy BPE tokeniser splits it into subword pieces.</p>
<textarea id="demo2-input" style="width: 100%; box-sizing: border-box; min-height: 80px; padding: 10px; font-size: 0.95rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; resize: vertical;">The quick brown fox jumps over the lazy dog. Unhappiness is a word tokenizers tend to split up.</textarea>
<div style="margin-top: 0.75rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
  <span id="demo2-count" style="font-size: 0.9rem; color: #555;"></span>
  <label style="font-size: 0.9rem; color: #555; cursor: pointer; user-select: none;">
    <input type="checkbox" id="demo2-toggle-ids" style="margin-right: 4px;"> Show token IDs
  </label>
</div>
<div id="demo2-output" style="margin-top: 0.75rem; padding: 12px; background: #fff; border-radius: 6px; border: 1px solid #e0e0e0; line-height: 2; font-size: 0.95rem; min-height: 40px;"></div>
</div>

<script>
(function() {
  // ── Vocabulary: ~300 common subword pieces ──────────────────────
  // Sorted longest-first for greedy matching.
  var vocab = [
    // common words
    "the","and","that","have","for","not","with","you","this","but",
    "from","they","been","have","will","each","make","like","long",
    "look","many","some","than","them","then","time","very","when",
    "come","could","into","just","know","most","over","such","take",
    "back","also","after","year","your","about","other","which",
    "their","there","first","would","these","more","write","down",
    "only","find","here","thing","give","does","tell","while",
    "before","right","too","where","much","through","well","should",
    "because","good","still","between","never","under","last","same",
    "another","around","every","own","work","three","word","must",
    "part","great","think","help","line","turn","move","live",
    "point","read","hand","high","place","small","large","next",
    "early","begin","start","head","house","world","below","went",
    "program","function","variable","class","array","loop","code",
    "python","javascript","string","number","return","print","import",
    "quick","brown","fox","jumps","jump","lazy","dog","cat",
    "is","it","in","of","to","a","i","on","at","if","or","an","as","no",
    "was","are","be","so","we","he","my","do","up","go","by",
    // common subwords / morphemes
    "tion","sion","ment","ness","able","ible","less","ful","ous","ive",
    "ing","tion","ed","er","est","ly","al","en","ize","ise",
    "un","re","pre","dis","mis","non","over","out","sub","inter",
    "super","semi","anti","auto","bi","co","de","ex","fore","mid",
    "post","self","trans","under","up",
    "th","ch","sh","wh","ph","qu",
    "str","tr","pr","cr","gr","br","fr","dr","bl","cl","fl","gl","pl","sl",
    "ght","ck","nd","nt","ng","nk","mp","lt","pt","ft","ct","st",
    // extra common words
    "all","had","her","what","one","our","out","day","get","can",
    "him","his","how","its","may","new","now","old","see","way","who",
    "boy","did","let","put","say","she","use","her","man","run",
    "any","few","lot","try","ask","big","end","far","got","hat",
    "hot","low","off","own","pay","ran","red","sat","top","war",
    "age","ago","air","arm","art","bad","bag","bed","bit","box","bus",
    "cup","cut","eat","egg","eye","fit","fun","gas","gun","hit","job",
    "key","law","leg","lie","lip","map","mix","net","nor","oil","own",
    "per","pie","pot","raw","row","sea","set","sir","sit","six","sky",
    "son","sun","ten","tie","tip","two","via","win","won","yes","yet",
    "handle","elegant","token","izer","izers",
    "happy","happi",
    "word","words",
    // single letters as fallback will be handled below
  ];

  // Sort by length descending for greedy longest-match
  vocab.sort(function(a, b){ return b.length - a.length; });

  var pastelColors = [
    "#fde2e4","#e2ece9","#dfe7fd","#fff1e6","#f0efeb",
    "#d4f0f0","#fcf5c7","#e8d5e3","#cddafd","#fce1e4",
    "#daeaf6","#fef9ef","#e2f0cb","#ffdac1","#c9cba3",
    "#ffe5ec","#e0f4de","#d5c6e0","#f7d6e0","#b5ead7"
  ];

  function tokenize(text) {
    var tokens = [];
    var i = 0;
    while (i < text.length) {
      // skip/capture whitespace as its own token
      if (/\s/.test(text[i])) {
        var ws = "";
        while (i < text.length && /\s/.test(text[i])) { ws += text[i]; i++; }
        tokens.push(ws);
        continue;
      }
      // greedy longest match (case-insensitive match, preserve original case)
      var matched = false;
      var remaining = text.slice(i).toLowerCase();
      for (var v = 0; v < vocab.length; v++) {
        if (remaining.indexOf(vocab[v]) === 0) {
          tokens.push(text.slice(i, i + vocab[v].length));
          i += vocab[v].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // single character fallback
        tokens.push(text[i]);
        i++;
      }
    }
    return tokens;
  }

  function render() {
    var text = document.getElementById("demo2-input").value;
    var tokens = tokenize(text);
    var showIds = document.getElementById("demo2-toggle-ids").checked;
    var out = document.getElementById("demo2-output");
    var html = "";
    var ci = 0;
    tokens.forEach(function(tok, idx) {
      var isSpace = /^\s+$/.test(tok);
      var bg = isSpace ? "transparent" : pastelColors[ci % pastelColors.length];
      if (!isSpace) ci++;
      var display = tok.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/ /g,"&nbsp;").replace(/\n/g,"&#8629;");
      if (showIds && !isSpace) {
        display = '<span style="font-size:0.7rem;color:#999;vertical-align:super;margin-right:1px;">'+idx+'</span>' + display;
      }
      html += '<span style="background:'+bg+';'+(isSpace?'':'border-radius:3px;padding:1px 3px;margin:1px;border:1px solid rgba(0,0,0,0.08);display:inline-block;')+'" title="Token '+ idx + (isSpace?' (space)':'') +'">'+display+'</span>';
    });
    out.innerHTML = html;
    var nonSpace = tokens.filter(function(t){ return !/^\s+$/.test(t); });
    document.getElementById("demo2-count").textContent = nonSpace.length + " tokens ("+text.length+" characters)";
  }

  function init() {
    if (!document.getElementById("demo2-input")) return;
    document.getElementById("demo2-input").addEventListener("input", render);
    document.getElementById("demo2-toggle-ids").addEventListener("change", render);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

If you play with the tokeniser above, you will see a few patterns. Very common words like "the" tend to be single tokens. Rarer words split into pieces. "unhappiness" might become something like "un" + "happi" + "ness." That gives the model reusable chunks, so it can share information across related words.

Token count matters because it sets cost. A rough rule is one token is about three-quarters of a word in English. When someone says a model has a 100,000 token context window, that is around 75,000 words. More tokens means more memory, more compute, and more money.

After tokenisation, each token ID maps to an embedding vector. These embeddings are the input to the transformer layers that follow.

---

## The Transformer

The previous section ended with token embeddings: one vector per token. By themselves, those vectors do not include much context. "bank" in "river bank" and "bank" in "bank account" need different context. "it" in "The cat sat on the mat because it was tired" refers to the cat.

Transformers add context with self-attention.

### How Self-Attention Works

Self-attention computes a score between each token and every other token. Those scores become weights. The model uses them to combine information from other tokens into an updated vector for the current token.

Example: "The cat sat on the mat because it was tired." When the model updates the token "it," it needs a guess for what "it" refers to. Self-attention computes scores between "it" and every other token. The score for "cat" should be high, since "it" refers to the cat in this sentence. Scores for unrelated tokens should be low. The updated vector for "it" is a weighted mix of other token vectors, based on those scores.

The scores come from three learned projections of each embedding: a **query**, a **key**, and a **value**. The score between two tokens uses the dot product of one token's query and the other token's key. The model normalises scores with softmax, then uses the result as weights to average the value vectors. That weighted average is the attention output.

The mathematical formula is compact:

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

In plain terms, queries match keys, and the resulting weights mix the values.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Self-Attention Visualiser</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Pick a sentence. Click a word to see its attention weights. Darker arcs mean higher weight.</p>
<div id="demo3-sentence-buttons" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;"></div>
<div id="demo3-viz" style="width: 100%; min-height: 180px; position: relative;"></div>
<div id="demo3-info" style="margin-top: 0.5rem; font-size: 0.9rem; color: #555; min-height: 1.5em;"></div>
</div>

<script>
(function() {
  var sentences = [
    {
      text: "The cat sat on the mat because it was tired",
      weights: {
        "The": {"The":0.05,"cat":0.3,"sat":0.1,"on":0.05,"the":0.15,"mat":0.1,"because":0.05,"it":0.1,"was":0.05,"tired":0.05},
        "cat": {"The":0.15,"cat":0.1,"sat":0.2,"on":0.05,"the":0.05,"mat":0.1,"because":0.05,"it":0.15,"was":0.05,"tired":0.1},
        "sat": {"The":0.05,"cat":0.25,"sat":0.05,"on":0.2,"the":0.05,"mat":0.15,"because":0.05,"it":0.1,"was":0.05,"tired":0.05},
        "on": {"The":0.05,"cat":0.05,"sat":0.2,"on":0.05,"the":0.15,"mat":0.35,"because":0.05,"it":0.05,"was":0.03,"tired":0.02},
        "the": {"The":0.15,"cat":0.05,"sat":0.05,"on":0.1,"the":0.05,"mat":0.4,"because":0.05,"it":0.05,"was":0.05,"tired":0.05},
        "mat": {"The":0.05,"cat":0.1,"sat":0.15,"on":0.2,"the":0.2,"mat":0.05,"because":0.05,"it":0.1,"was":0.05,"tired":0.05},
        "because": {"The":0.05,"cat":0.1,"sat":0.1,"on":0.05,"the":0.05,"mat":0.05,"because":0.05,"it":0.2,"was":0.15,"tired":0.2},
        "it": {"The":0.03,"cat":0.35,"sat":0.08,"on":0.02,"the":0.02,"mat":0.05,"because":0.1,"it":0.05,"was":0.15,"tired":0.15},
        "was": {"The":0.03,"cat":0.12,"sat":0.05,"on":0.02,"the":0.02,"mat":0.03,"because":0.08,"it":0.35,"was":0.05,"tired":0.25},
        "tired": {"The":0.03,"cat":0.25,"sat":0.08,"on":0.02,"the":0.02,"mat":0.03,"because":0.1,"it":0.22,"was":0.15,"tired":0.1}
      }
    },
    {
      text: "The bank by the river had eroded over time",
      weights: {
        "The": {"The":0.05,"bank":0.35,"by":0.1,"the":0.15,"river":0.1,"had":0.05,"eroded":0.05,"over":0.05,"time":0.1},
        "bank": {"The":0.1,"bank":0.05,"by":0.1,"the":0.05,"river":0.35,"had":0.05,"eroded":0.2,"over":0.05,"time":0.05},
        "by": {"The":0.05,"bank":0.2,"by":0.05,"the":0.15,"river":0.35,"had":0.05,"eroded":0.05,"over":0.05,"time":0.05},
        "the": {"The":0.1,"bank":0.1,"by":0.1,"the":0.05,"river":0.4,"had":0.05,"eroded":0.05,"over":0.05,"time":0.1},
        "river": {"The":0.05,"bank":0.3,"by":0.15,"the":0.1,"river":0.05,"had":0.05,"eroded":0.15,"over":0.1,"time":0.05},
        "had": {"The":0.05,"bank":0.2,"by":0.05,"the":0.05,"river":0.15,"had":0.05,"eroded":0.3,"over":0.1,"time":0.05},
        "eroded": {"The":0.03,"bank":0.3,"by":0.05,"the":0.03,"river":0.25,"had":0.1,"eroded":0.05,"over":0.1,"time":0.09},
        "over": {"The":0.03,"bank":0.05,"by":0.05,"the":0.03,"river":0.1,"had":0.1,"eroded":0.2,"over":0.05,"time":0.39},
        "time": {"The":0.05,"bank":0.05,"by":0.05,"the":0.05,"river":0.05,"had":0.1,"eroded":0.15,"over":0.35,"time":0.15}
      }
    },
    {
      text: "She gave her dog a bone because she loved him",
      weights: {
        "She": {"She":0.05,"gave":0.15,"her":0.2,"dog":0.1,"a":0.03,"bone":0.05,"because":0.05,"she":0.25,"loved":0.07,"him":0.05},
        "gave": {"She":0.2,"gave":0.05,"her":0.15,"dog":0.15,"a":0.05,"bone":0.2,"because":0.05,"she":0.05,"loved":0.05,"him":0.05},
        "her": {"She":0.35,"gave":0.1,"her":0.05,"dog":0.25,"a":0.03,"bone":0.05,"because":0.05,"she":0.05,"loved":0.05,"him":0.02},
        "dog": {"She":0.05,"gave":0.15,"her":0.25,"dog":0.05,"a":0.05,"bone":0.2,"because":0.05,"she":0.05,"loved":0.05,"him":0.1},
        "a": {"She":0.03,"gave":0.1,"her":0.05,"dog":0.1,"a":0.05,"bone":0.45,"because":0.05,"she":0.03,"loved":0.04,"him":0.1},
        "bone": {"She":0.05,"gave":0.2,"her":0.05,"dog":0.25,"a":0.15,"bone":0.05,"because":0.05,"she":0.05,"loved":0.05,"him":0.1},
        "because": {"She":0.1,"gave":0.1,"her":0.05,"dog":0.05,"a":0.03,"bone":0.05,"because":0.05,"she":0.15,"loved":0.25,"him":0.17},
        "she": {"She":0.35,"gave":0.1,"her":0.15,"dog":0.05,"a":0.02,"bone":0.03,"because":0.1,"she":0.05,"loved":0.1,"him":0.05},
        "loved": {"She":0.15,"gave":0.05,"her":0.1,"dog":0.15,"a":0.02,"bone":0.05,"because":0.1,"she":0.2,"loved":0.05,"him":0.13},
        "him": {"She":0.05,"gave":0.1,"her":0.1,"dog":0.35,"a":0.02,"bone":0.05,"because":0.08,"she":0.05,"loved":0.15,"him":0.05}
      }
    },
    {
      text: "The code crashed because the variable was undefined",
      weights: {
        "The": {"The":0.05,"code":0.4,"crashed":0.1,"because":0.05,"the":0.15,"variable":0.1,"was":0.05,"undefined":0.1},
        "code": {"The":0.15,"code":0.05,"crashed":0.3,"because":0.05,"the":0.05,"variable":0.15,"was":0.05,"undefined":0.2},
        "crashed": {"The":0.05,"code":0.3,"crashed":0.05,"because":0.15,"the":0.03,"variable":0.15,"was":0.07,"undefined":0.2},
        "because": {"The":0.05,"code":0.15,"crashed":0.2,"because":0.05,"the":0.05,"variable":0.15,"was":0.1,"undefined":0.25},
        "the": {"The":0.1,"code":0.05,"crashed":0.05,"because":0.05,"the":0.05,"variable":0.45,"was":0.1,"undefined":0.15},
        "variable": {"The":0.05,"code":0.2,"crashed":0.1,"because":0.05,"the":0.15,"variable":0.05,"was":0.15,"undefined":0.25},
        "was": {"The":0.03,"code":0.1,"crashed":0.1,"because":0.05,"the":0.05,"variable":0.3,"was":0.05,"undefined":0.32},
        "undefined": {"The":0.03,"code":0.2,"crashed":0.2,"because":0.1,"the":0.03,"variable":0.25,"was":0.12,"undefined":0.07}
      }
    }
  ];

  var currentSentence = 0;
  var selectedWord = null;

  function init() {
    var btnContainer = document.getElementById("demo3-sentence-buttons");
    if (!btnContainer) return;

    sentences.forEach(function(s, i) {
      var btn = document.createElement("button");
      btn.textContent = '"' + s.text + '"';
      btn.style.cssText = "padding:6px 12px;border-radius:4px;border:1px solid #ccc;background:" + (i === 0 ? "#3498db" : "#fff") + ";color:" + (i === 0 ? "#fff" : "#333") + ";cursor:pointer;font-size:0.85rem;font-family:inherit;transition:all 0.2s;";
      btn.addEventListener("click", function() {
        currentSentence = i;
        selectedWord = null;
        btnContainer.querySelectorAll("button").forEach(function(b, j) {
          b.style.background = j === i ? "#3498db" : "#fff";
          b.style.color = j === i ? "#fff" : "#333";
        });
        renderWords();
        document.getElementById("demo3-info").textContent = "Click a word to see attention weights.";
      });
      btnContainer.appendChild(btn);
    });

    renderWords();

    var demo3ResizeTimer;
    window.addEventListener("resize", function() {
      clearTimeout(demo3ResizeTimer);
      demo3ResizeTimer = setTimeout(renderWords, 150);
    });
  }

  function renderWords() {
    var viz = document.getElementById("demo3-viz");
    viz.innerHTML = "";
    var s = sentences[currentSentence];
    var words = s.text.split(" ");

    var svgNS = "http://www.w3.org/2000/svg";
    var W = viz.clientWidth || 700;
    var isMobile = W < 500;
    var fontSize = isMobile ? Math.max(9, Math.floor(W / words.length / 4.5)) + "px" : "14px";
    var H = isMobile ? 140 : 180;

    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.style.cssText = "display:block;width:100%;height:auto;";
    viz.appendChild(svg);

    var arcGroup = document.createElementNS(svgNS, "g");
    svg.appendChild(arcGroup);

    var wordSpacing = W / (words.length + 1);
    var baselineY = H - 30;

    var wordEls = [];
    words.forEach(function(word, i) {
      var x = wordSpacing * (i + 1);
      var g = document.createElementNS(svgNS, "g");
      g.style.cursor = "pointer";

      var rect = document.createElementNS(svgNS, "rect");
      var textEl = document.createElementNS(svgNS, "text");
      textEl.textContent = word;
      textEl.setAttribute("x", x);
      textEl.setAttribute("y", baselineY);
      textEl.setAttribute("text-anchor", "middle");
      textEl.setAttribute("font-size", fontSize);
      textEl.setAttribute("font-family", "inherit");
      textEl.setAttribute("fill", "#333");
      textEl.setAttribute("font-weight", "500");

      g.appendChild(textEl);
      svg.appendChild(g);
      wordEls.push({el: g, text: textEl, x: x, word: word});

      g.addEventListener("click", function() {
        selectedWord = word;
        showAttention(words, wordEls, arcGroup, s.weights, word, baselineY);
      });

      g.addEventListener("mouseenter", function() {
        textEl.setAttribute("fill", "#3498db");
        textEl.setAttribute("font-weight", "700");
      });
      g.addEventListener("mouseleave", function() {
        if (selectedWord !== word) {
          textEl.setAttribute("fill", "#333");
          textEl.setAttribute("font-weight", "500");
        }
      });
    });
  }

  function showAttention(words, wordEls, arcGroup, weights, clickedWord, baselineY) {
    while (arcGroup.firstChild) arcGroup.removeChild(arcGroup.firstChild);
    var svgNS = "http://www.w3.org/2000/svg";
    var w = weights[clickedWord];
    if (!w) return;

    var clickedIdx = words.indexOf(clickedWord);
    var info = document.getElementById("demo3-info");

    // Find top attended words
    var sorted = Object.keys(w).filter(function(k){ return k !== clickedWord; }).sort(function(a,b){ return w[b] - w[a]; });
    var topWords = sorted.slice(0, 3).map(function(k) { return k + " (" + (w[k] * 100).toFixed(0) + "%)"; });
    info.innerHTML = "<strong>" + clickedWord + "</strong> puts the most weight on: " + topWords.join(", ");

    // Reset all word styles
    wordEls.forEach(function(we) {
      we.text.setAttribute("fill", "#999");
      we.text.setAttribute("font-weight", "400");
      we.text.setAttribute("font-size", "13px");
    });
    // Highlight clicked word
    wordEls[clickedIdx].text.setAttribute("fill", "#3498db");
    wordEls[clickedIdx].text.setAttribute("font-weight", "700");
    wordEls[clickedIdx].text.setAttribute("font-size", "15px");

    words.forEach(function(targetWord, i) {
      if (targetWord === clickedWord) return;
      var score = w[targetWord] || 0;
      if (score < 0.03) return;

      var x1 = wordEls[clickedIdx].x;
      var x2 = wordEls[i].x;
      var dist = Math.abs(x2 - x1);
      var arcH = Math.min(dist * 0.5, 80) + score * 40;

      var path = document.createElementNS(svgNS, "path");
      var midX = (x1 + x2) / 2;
      var d = "M " + x1 + " " + (baselineY - 18) + " Q " + midX + " " + (baselineY - 18 - arcH) + " " + x2 + " " + (baselineY - 18);
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#3498db");
      path.setAttribute("stroke-width", Math.max(1, score * 12));
      path.setAttribute("opacity", Math.max(0.15, score * 1.5));
      path.setAttribute("stroke-linecap", "round");

      // Animate
      var len = path.getTotalLength ? path.getTotalLength() : 200;
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = "stroke-dash-offset 0.5s ease";
      arcGroup.appendChild(path);

      // Trigger animation
      requestAnimationFrame(function() {
        path.style.strokeDashoffset = "0";
      });

      // Color target word by attention strength
      var intensity = Math.min(255, Math.floor(score * 500));
      wordEls[i].text.setAttribute("fill", "rgb(" + (52) + "," + (152 - Math.floor(score * 100)) + "," + (219) + ")");
      wordEls[i].text.setAttribute("font-weight", score > 0.15 ? "700" : "500");
      wordEls[i].text.setAttribute("font-size", score > 0.2 ? "15px" : "13px");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

Try clicking "it" in the first sentence. You should see arcs connecting it to "cat". In that sentence, "it" refers to the cat. Now click "bank" in the second sentence. It attends to words like "river" and "eroded," because "bank" here means a riverbank. The same token can map to different context depending on nearby words.

### Multi-Head Attention

Self-attention also has to track different relationships at the same time. In "She gave her dog a bone", the token "gave" connects to who did the action and what happened to what. A single attention pattern can miss some of this.

The solution is **multi-head attention**. Instead of computing one attention pattern, the model computes multiple patterns in parallel. Each head has its own learned query, key, and value projections. In practice, some heads focus on syntax and some focus on reference links like pronouns. After heads compute their outputs, the model concatenates them and projects back to the hidden dimension.

Heads learn patterns through training. People who have inspected heads have found some that track syntax, some that track coreference, and some that focus on local neighborhoods. Some heads are hard to interpret.

The demo below shows three attention heads over the same sentence. Each head focuses on different connections.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Multi-Head Attention Visualiser</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Three attention heads on the sentence "She gave her dog a bone". Click a word to compare the heads.</p>
<div id="demo-mha-container"></div>
</div>

<script>
(function() {
  var sentence = ["She","gave","her","dog","a","bone"];
  var heads = [
    {
      name: "Head 1: Subject-Verb",
      color: "#e74c3c",
      desc: "Tracks who is doing what",
      weights: {
        "She":  [0.1, 0.5, 0.15,0.05,0.05,0.15],
        "gave": [0.45,0.05,0.1, 0.15,0.05,0.2],
        "her":  [0.5, 0.1, 0.05,0.25,0.02,0.08],
        "dog":  [0.1, 0.3, 0.3, 0.05,0.05,0.2],
        "a":    [0.05,0.1, 0.05,0.1, 0.05,0.65],
        "bone": [0.1, 0.4, 0.05,0.15,0.2, 0.1]
      }
    },
    {
      name: "Head 2: Possession",
      color: "#3498db",
      desc: "Tracks what belongs to whom",
      weights: {
        "She":  [0.1, 0.1, 0.4, 0.1, 0.05,0.25],
        "gave": [0.15,0.1, 0.15,0.2, 0.1, 0.3],
        "her":  [0.55,0.05,0.05,0.3, 0.02,0.03],
        "dog":  [0.05,0.05,0.6, 0.1, 0.05,0.15],
        "a":    [0.05,0.05,0.05,0.1, 0.1, 0.65],
        "bone": [0.05,0.1, 0.1, 0.35,0.3, 0.1]
      }
    },
    {
      name: "Head 3: Next-Word",
      color: "#2ecc71",
      desc: "Attends to adjacent tokens (local structure)",
      weights: {
        "She":  [0.1, 0.6, 0.1, 0.08,0.05,0.07],
        "gave": [0.3, 0.05,0.45,0.1, 0.05,0.05],
        "her":  [0.1, 0.25,0.05,0.5, 0.05,0.05],
        "dog":  [0.05,0.05,0.3, 0.05,0.45,0.1],
        "a":    [0.03,0.05,0.05,0.35,0.07,0.45],
        "bone": [0.05,0.05,0.05,0.1, 0.4, 0.35]
      }
    }
  ];

  function init() {
    var container = document.getElementById("demo-mha-container");
    if (!container) return;

    var selectedWord = null;

    function render(word) {
      container.innerHTML = "";
      var wrapper = document.createElement("div");
      wrapper.style.cssText = "display:flex;flex-direction:column;gap:1.5rem;";

      // Word buttons
      var wordRow = document.createElement("div");
      wordRow.style.cssText = "display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap;";
      sentence.forEach(function(w) {
        var btn = document.createElement("button");
        btn.textContent = w;
        var isSelected = word === w;
        btn.style.cssText = "padding:8px 16px;border-radius:6px;border:2px solid " + (isSelected ? "#333" : "#ddd") + ";background:" + (isSelected ? "#333" : "#fff") + ";color:" + (isSelected ? "#fff" : "#333") + ";font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s;";
        btn.onclick = function() { render(w); };
        wordRow.appendChild(btn);
      });
      wrapper.appendChild(wordRow);

      if (!word) {
        var hint = document.createElement("div");
        hint.style.cssText = "text-align:center;color:#999;font-size:0.9rem;padding:1rem 0;";
        hint.textContent = "Click a word above to compare the heads.";
        wrapper.appendChild(hint);
        container.appendChild(wrapper);
        return;
      }

      // Three head panels
      var headRow = document.createElement("div");
      headRow.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;";
      heads.forEach(function(head) {
        var panel = document.createElement("div");
        panel.style.cssText = "border:1px solid " + head.color + "33;border-radius:8px;padding:12px;background:" + head.color + "08;";

        var title = document.createElement("div");
        title.style.cssText = "font-size:0.8rem;font-weight:700;color:" + head.color + ";margin-bottom:2px;";
        title.textContent = head.name;
        panel.appendChild(title);

        var desc = document.createElement("div");
        desc.style.cssText = "font-size:0.75rem;color:#999;margin-bottom:10px;";
        desc.textContent = head.desc;
        panel.appendChild(desc);

        var w = head.weights[word];
        sentence.forEach(function(target, i) {
          var row = document.createElement("div");
          row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:4px;";

          var label = document.createElement("span");
          label.style.cssText = "width:40px;text-align:right;font-size:0.8rem;color:" + (target === word ? head.color : "#666") + ";font-weight:" + (target === word ? "700" : "400") + ";";
          label.textContent = target;
          row.appendChild(label);

          var barBg = document.createElement("div");
          barBg.style.cssText = "flex:1;height:14px;background:#e0e0e0;border-radius:3px;overflow:hidden;position:relative;";
          var barFill = document.createElement("div");
          var pct = Math.round(w[i] * 100);
          barFill.style.cssText = "height:100%;width:" + pct + "%;background:" + head.color + ";border-radius:3px;transition:width 0.4s ease;opacity:" + (0.3 + w[i] * 1.4) + ";";
          barBg.appendChild(barFill);
          row.appendChild(barBg);

          var val = document.createElement("span");
          val.style.cssText = "width:32px;text-align:right;font-size:0.7rem;color:#999;font-family:monospace;";
          val.textContent = pct + "%";
          row.appendChild(val);

          panel.appendChild(row);
        });
        headRow.appendChild(panel);
      });
      wrapper.appendChild(headRow);

      // Explanation
      var explain = document.createElement("div");
      explain.style.cssText = "font-size:0.85rem;color:#666;text-align:center;padding-top:0.5rem;border-top:1px solid #eee;margin-top:0.5rem;";
      var strongest = [];
      heads.forEach(function(head) {
        var w = head.weights[word];
        var maxI = 0; w.forEach(function(v,i){ if(i!==sentence.indexOf(word) && v > w[maxI]) maxI = i; });
        strongest.push('<span style="color:' + head.color + ';font-weight:600;">' + head.name.split(":")[0] + '</span> focuses on "' + sentence[maxI] + '"');
      });
      explain.innerHTML = 'For "<strong>' + word + '</strong>": ' + strongest.join(" &middot; ");
      wrapper.appendChild(explain);

      container.appendChild(wrapper);
    }

    render(null);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
</script>

### The Full Transformer Block

Self-attention is the star of the show, but it does not work alone. A transformer block is a carefully designed sequence of operations, each serving a specific purpose.

* Input embeddings map each token ID to a dense vector. If the hidden size is 4,096, each token becomes 4,096 numbers. These embeddings are learned during training.

* Positional encoding adds location in the sequence. Self-attention does not carry position by default, so the model needs a signal for order. Without position information, "the cat sat on the mat" and "mat the on sat cat the" can look too similar.

* Multi-head attention runs self-attention in parallel heads and combines the results.

* Add & normalise usually means a residual connection plus layer normalisation. The residual path helps training stay stable and helps gradients flow.

* The feed-forward network is an MLP applied per token position. It transforms each token vector after attention.

* Then, we repeat the residual + normalisation step and pass the output to the next block.

Modern models stack many of these blocks. GPT-3 had 96 transformer blocks. With depth, representations change layer by layer. You can think of it as repeated mixing (attention) and per-token transformation (MLP).

### Why Transformers Won

Transformers trained well on modern hardware and handled long contexts better than older sequence models. Self-attention is parallel across tokens, so training uses GPUs efficiently. Attention also gives a direct path between far-apart tokens, which helps with long-range references.

Transformers also scaled. Performance improved in a fairly predictable way as people increased parameters, data, and compute. Scaling laws captured some of this behaviour.<label for="sn-scaling2" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-scaling2" class="sidenote-toggle" /><span class="sidenote">The key finding: model loss $L$ scales as a power law with compute $C$, dataset size $D$, and parameters $N$ (for parameters alone, one reported fit is roughly $L \propto N^{-0.076}$).</span>

Now connect this back to a chat or coding agent. Your text is tokenized, embedded, and processed through many transformer blocks. The model outputs a probability distribution for the next token, samples a token, appends it, and repeats. That is text generation. An agent adds a loop around generation.

The playground below lets you watch this process unfold. Pick a prompt, and step through generation one token at a time. At each step, the model produces a probability distribution over candidate next tokens — the bar chart shows the top contenders. Adjust the temperature to see how it reshapes the distribution: at zero, the model always picks the most likely token; turn it up, and less probable tokens get a fighting chance.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Next-Token Prediction</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Pick a prompt. Click Next token to sample. Temperature changes randomness.</p>

<div id="demo-nexttoken-prompts" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;"></div>

<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
  <label style="font-size: 0.9rem; color: #555; display: flex; align-items: center; gap: 0.5rem;">
    Temperature: <input type="range" id="demo-nexttoken-temp" min="0" max="2" step="0.1" value="0.7" style="width: 120px;">
    <span id="demo-nexttoken-temp-val" style="font-family: monospace; min-width: 2.5em;">0.7</span>
  </label>
  <button id="demo-nexttoken-step" style="padding: 6px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Next token</button>
  <label style="font-size: 0.85rem; color: #555; display: flex; align-items: center; gap: 0.3rem;">
    <input type="checkbox" id="demo-nexttoken-auto"> Auto-play
  </label>
  <button id="demo-nexttoken-reset" style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.85rem; color: #888;">Reset</button>
</div>

<div id="demo-nexttoken-text" style="min-height: 2.5em; padding: 10px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 1rem; line-height: 1.6; margin-bottom: 1rem;"></div>

<div id="demo-nexttoken-bars" style="min-height: 140px;"></div>

<div id="demo-nexttoken-info" style="margin-top: 0.5rem; font-size: 0.85rem; color: #888; min-height: 1.2em;"></div>
</div>

<script>
(function() {
  // Each prompt has a sequence of generation steps.
  // Each step has raw logits for candidate tokens.
  // Temperature is applied client-side via softmax.
  var prompts = [
    {
      label: "The cat sat on the",
      tokens: ["The", " cat", " sat", " on", " the"],
      steps: [
        { candidates: [" mat", " floor", " bed", " table", " roof"], logits: [3.8, 3.2, 2.6, 1.8, 1.0] },
        { candidates: [" and", ".", " while", ",", " because"], logits: [3.5, 3.3, 2.0, 1.8, 1.5] },
        { candidates: [" looked", " purred", " watched", " the", " stretched"], logits: [3.0, 2.8, 2.5, 2.2, 2.0] },
        { candidates: [" out", " at", " up", " around", " down"], logits: [3.2, 3.0, 2.4, 1.6, 1.4] },
        { candidates: [" the", " of", " into", " with", " lazily"], logits: [3.6, 2.0, 1.8, 1.5, 1.0] }
      ]
    },
    {
      label: "Once upon a",
      tokens: ["Once", " upon", " a"],
      steps: [
        { candidates: [" time", " hill", " midnight", " dream", " day"], logits: [5.2, 1.8, 1.5, 1.2, 1.0] },
        { candidates: [",", " there", " in", " long", " —"], logits: [4.0, 3.5, 2.0, 1.5, 1.0] },
        { candidates: [" in", " there", " a", " the", " far"], logits: [3.2, 3.0, 2.2, 2.0, 1.8] },
        { candidates: [" a", " the", " an", " one", " this"], logits: [3.8, 3.0, 2.0, 1.5, 1.0] },
        { candidates: [" land", " kingdom", " village", " forest", " small"], logits: [3.5, 3.2, 2.8, 2.5, 2.0] }
      ]
    },
    {
      label: "The capital of France is",
      tokens: ["The", " capital", " of", " France", " is"],
      steps: [
        { candidates: [" Paris", " a", " the", " located", " known"], logits: [5.8, 1.5, 1.2, 1.0, 0.5] },
        { candidates: [".", ",", " —", " and", " which"], logits: [4.2, 3.0, 1.5, 1.2, 0.8] },
        { candidates: [" It", " The", " Paris", " Known", " A"], logits: [3.5, 3.0, 2.5, 1.5, 1.2] },
        { candidates: [" is", " has", " was", " sits", " lies"], logits: [3.8, 2.5, 2.2, 1.8, 1.5] },
        { candidates: [" known", " one", " a", " the", " home"], logits: [3.5, 3.0, 2.8, 2.2, 2.0] }
      ]
    },
    {
      label: "def fibonacci(",
      tokens: ["def", " fib", "onacci", "("],
      steps: [
        { candidates: ["n", "num", "x", "number", "index"], logits: [4.5, 2.5, 2.0, 1.5, 1.0] },
        { candidates: ["):", "):\n", ", ", "=", "):"], logits: [4.0, 3.5, 1.5, 1.0, 0.5] },
        { candidates: ["\n    if", "\n    return", "\n    \"\"\"", "\n    a", "\n    #"], logits: [4.8, 2.0, 1.8, 1.5, 1.0] },
        { candidates: [" n", " not", " n <=", " n ==", " n <"], logits: [3.5, 2.0, 3.2, 2.8, 2.5] },
        { candidates: [" <= 1", " == 0", " < 2", " <= 0", " == 1"], logits: [3.8, 3.0, 2.8, 2.0, 2.5] }
      ]
    }
  ];

  var currentPrompt = 0;
  var currentStep = 0;
  var generatedTokens = [];
  var autoInterval = null;

  var pastelColors = [
    "#dfe7fd","#fde2e4","#e2ece9","#fff1e6","#f0efeb",
    "#d4f0f0","#fcf5c7","#e8d5e3","#cddafd","#fce1e4",
    "#daeaf6","#fef9ef","#e2f0cb","#ffdac1","#c9cba3",
    "#ffe5ec","#e0f4de","#d5c6e0","#f7d6e0","#b5ead7"
  ];

  function softmax(logits, temperature) {
    var t = Math.max(temperature, 0.01);
    var scaled = logits.map(function(l) { return l / t; });
    var maxVal = Math.max.apply(null, scaled);
    var exps = scaled.map(function(s) { return Math.exp(s - maxVal); });
    var sum = exps.reduce(function(a, b) { return a + b; }, 0);
    return exps.map(function(e) { return e / sum; });
  }

  function sampleFromProbs(probs) {
    var r = Math.random();
    var cumulative = 0;
    for (var i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (r < cumulative) return i;
    }
    return probs.length - 1;
  }

  function getTemperature() {
    return parseFloat(document.getElementById("demo-nexttoken-temp").value);
  }

  function renderPromptButtons() {
    var container = document.getElementById("demo-nexttoken-prompts");
    container.innerHTML = "";
    prompts.forEach(function(p, i) {
      var btn = document.createElement("button");
      btn.textContent = p.label;
      btn.style.cssText = "padding: 5px 12px; border: 1px solid " + (i === currentPrompt ? "#666" : "#ccc") + "; border-radius: 4px; background: " + (i === currentPrompt ? "#e8e8e8" : "#fff") + "; cursor: pointer; font-size: 0.85rem; font-weight: " + (i === currentPrompt ? "600" : "400") + ";";
      btn.onclick = function() {
        currentPrompt = i;
        resetGeneration();
      };
      container.appendChild(btn);
    });
  }

  function renderText() {
    var container = document.getElementById("demo-nexttoken-text");
    var p = prompts[currentPrompt];
    var html = "";
    // Render prompt tokens
    p.tokens.forEach(function(tok, i) {
      var display = tok.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/ /g, "&nbsp;").replace(/\n/g, "&#8629;");
      html += '<span style="background:' + pastelColors[i % pastelColors.length] + ';border-radius:3px;padding:1px 4px;margin:1px;border:1px solid rgba(0,0,0,0.08);display:inline-block;">' + display + '</span>';
    });
    // Render generated tokens
    generatedTokens.forEach(function(tok, i) {
      var display = tok.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/ /g, "&nbsp;").replace(/\n/g, "&#8629;");
      var ci = (p.tokens.length + i) % pastelColors.length;
      html += '<span style="background:' + pastelColors[ci] + ';border-radius:3px;padding:1px 4px;margin:1px;border:1px solid rgba(0,0,0,0.12);display:inline-block;font-weight:600;">' + display + '</span>';
    });
    // Blinking cursor if not done
    if (currentStep < p.steps.length) {
      html += '<span style="display:inline-block;width:2px;height:1em;background:#333;margin-left:2px;vertical-align:text-bottom;animation:demo-nexttoken-blink 1s step-end infinite;"></span>';
    }
    container.innerHTML = html;
  }

  function renderBars() {
    var container = document.getElementById("demo-nexttoken-bars");
    var p = prompts[currentPrompt];
    var info = document.getElementById("demo-nexttoken-info");

    if (currentStep >= p.steps.length) {
      container.innerHTML = '<div style="color: #888; font-size: 0.9rem; padding: 1rem; text-align: center;">Done. Click Reset to run again.</div>';
      info.textContent = generatedTokens.length + " tokens generated.";
      return;
    }

    var step = p.steps[currentStep];
    var temp = getTemperature();
    var probs = softmax(step.logits, temp);

    var html = '<div style="font-size: 0.8rem; color: #888; margin-bottom: 0.5rem;">Step ' + (currentStep + 1) + ' of ' + p.steps.length + ' - Top candidates (temperature = ' + temp.toFixed(1) + ')</div>';

    // Sort by probability for display
    var indexed = probs.map(function(prob, i) { return { prob: prob, token: step.candidates[i], idx: i }; });
    indexed.sort(function(a, b) { return b.prob - a.prob; });

    var maxProb = indexed[0].prob;

    indexed.forEach(function(item) {
      var pct = (item.prob * 100).toFixed(1);
      var barWidth = Math.max((item.prob / maxProb) * 100, 2);
      var display = item.token.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/ /g, "&nbsp;").replace(/\n/g, "\\n");
      html += '<div style="display: flex; align-items: center; margin-bottom: 4px; gap: 8px;">';
      html += '<div style="min-width: 90px; text-align: right; font-family: monospace; font-size: 0.85rem; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + display + '</div>';
      html += '<div style="flex: 1; background: #eee; border-radius: 3px; height: 22px; overflow: hidden;">';
      html += '<div style="width: ' + barWidth + '%; height: 100%; background: linear-gradient(90deg, #6ea8d9, #4a90c4); border-radius: 3px; transition: width 0.3s ease;"></div>';
      html += '</div>';
      html += '<div style="min-width: 45px; font-family: monospace; font-size: 0.8rem; color: #666;">' + pct + '%</div>';
      html += '</div>';
    });

    container.innerHTML = html;
    info.textContent = "Click 'Next token' to sample from this distribution.";
  }

  function stepGeneration() {
    var p = prompts[currentPrompt];
    if (currentStep >= p.steps.length) {
      stopAutoPlay();
      return;
    }

    var step = p.steps[currentStep];
    var temp = getTemperature();
    var probs = softmax(step.logits, temp);
    var chosen = sampleFromProbs(probs);
    var token = step.candidates[chosen];

    generatedTokens.push(token);
    currentStep++;

    renderText();
    renderBars();

    if (currentStep >= p.steps.length) {
      stopAutoPlay();
    }
  }

  function resetGeneration() {
    stopAutoPlay();
    currentStep = 0;
    generatedTokens = [];
    renderPromptButtons();
    renderText();
    renderBars();
  }

  function stopAutoPlay() {
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
    var cb = document.getElementById("demo-nexttoken-auto");
    if (cb) cb.checked = false;
  }

  function init() {
    if (!document.getElementById("demo-nexttoken-prompts")) return;

    renderPromptButtons();
    renderText();
    renderBars();

    document.getElementById("demo-nexttoken-step").addEventListener("click", stepGeneration);

    document.getElementById("demo-nexttoken-reset").addEventListener("click", resetGeneration);

    document.getElementById("demo-nexttoken-temp").addEventListener("input", function() {
      document.getElementById("demo-nexttoken-temp-val").textContent = parseFloat(this.value).toFixed(1);
      renderBars();
    });

    document.getElementById("demo-nexttoken-auto").addEventListener("change", function() {
      if (this.checked) {
        stepGeneration();
        autoInterval = setInterval(stepGeneration, 1200);
      } else {
        stopAutoPlay();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>

<style>
@keyframes demo-nexttoken-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>

---

## From Model to Agent — The Loop

A coding agent is mostly boring plumbing. The core is a model call inside a loop, plus some tool execution. As the people at Amp put it: "an LLM, a loop, and sufficient tokens."<label for="sn-ampcode" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-ampcode" class="sidenote-toggle" /><span class="sidenote">See ["How to Build an Agent"](https://ampcode.com/notes/how-to-build-an-agent/).</span>

The pseudocode for a coding agent fits on a napkin:

```
messages = [system_prompt, user_request]

while True:
    response = call_llm(messages)
    messages.append(response)

    if response.has_tool_calls:
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)
            messages.append(result)
    else:
        break  # model is done
```

That is the whole agent. A loop calls the model, executes any requested tool calls, appends tool results, and repeats. When the model stops requesting tools, the loop ends.

The key data structure here is the `messages` array. This is the conversation history, and it is everything. Every user message, every assistant response, every tool call, every tool result — they all get appended to this array. The array grows with every iteration of the loop.

One detail matters a lot: **the model is stateless**. It has no memory between API calls. Every API call includes the full `messages` array, including tool results. The model reads it and decides what to do next. Even though OpenAI's Responses API and Google/Gemini's Interactions API can be stateful, the model itself is stateless.

This is why the loop works. If a tool call fails, the error output is in the conversation history. The model sees it on the next turn and can try a different approach. The conversation history is the state.

The loop gives the model room to do multi-step work. It can read, edit, run, and repeat instead of trying to dump a single answer. It can also adjust when it learns something new from a search result or an error message.

The loop itself is simple. The hard parts are token limits, tool design and descriptions, prompting, and safety.

Watch both the conversation history on the left and the effects on your machine on the right.

<div id="demo5-container" style="margin: 2rem 0; font-family: 'Berkeley Mono', 'SF Mono', 'Fira Code', monospace;">
  <div style="display: flex; gap: 0; border: 1px solid #333; border-radius: 8px; overflow: hidden; background: #0a0a0a; min-height: 520px; position: relative;">

    <!-- Left Panel: Conversation -->
    <div id="demo5-conversation" style="flex: 1; padding: 16px; overflow-y: auto; max-height: 520px; border-right: 1px solid #222;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">Conversation - messages[]</div>
      <div id="demo5-messages" style="display: flex; flex-direction: column; gap: 8px;"></div>
    </div>

    <!-- Center Arrow -->
    <div id="demo5-arrow-zone" style="width: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
      <div id="demo5-arrow" style="font-size: 22px; color: #333; transition: all 0.4s ease;">&#8226;</div>
    </div>

    <!-- Right Panel: Machine -->
    <div id="demo5-machine" style="flex: 1; padding: 16px; overflow-y: auto; max-height: 520px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">Machine</div>
      <div id="demo5-machine-content" style="font-size: 13px; color: #aaa;">
        <div style="color: #555; font-style: italic;">Waiting...</div>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px; flex-wrap: wrap;">
    <button id="demo5-next" onclick="demo5_next()" style="padding: 8px 20px; background: #e8e8e8; color: #0a0a0a; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;">Next Step</button>
    <span id="demo5-step-display" style="color: #888; font-size: 13px;">Step 0 of 12</span>
    <label style="color: #888; font-size: 13px; display: flex; align-items: center; gap: 6px; margin-left: auto; cursor: pointer;">
      <input type="checkbox" id="demo5-autoplay" onchange="demo5_toggleAutoplay()" style="cursor: pointer;"> Auto-play
    </label>
    <button id="demo5-reset" onclick="demo5_reset()" style="padding: 8px 14px; background: transparent; color: #666; border: 1px solid #333; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 12px;">Reset</button>
  </div>
</div>

<script>
(function() {

const DEMO5_STEPS = [
  // Step 1: user message
  {
    msg: { role: 'user', text: 'Fix the TypeError in utils.py', color: '#f97316' },
    machine: null,
    arrow: null
  },
  // Step 2: system prompt
  {
    msg: { role: 'system', text: '[System] You are a coding assistant with tools: read_file, edit_file, bash...', color: '#888', collapsed: true, full: 'You are a coding assistant. You can use:\n- read_file(path, offset?, limit?): Read file contents\n- edit_file(path, old, new): Replace text in a file\n- bash(command): Run a shell command\n\nRead files before edits. Run tests after changes.' },
    machine: null,
    arrow: null
  },
  // Step 3: sending to API
  {
    msg: { role: 'thinking', text: 'Thinking...', color: '#3b82f6' },
    machine: null,
    arrow: 'right'
  },
  // Step 4: assistant response + tool call
  {
    msg: { role: 'assistant+tool', text: "I'll start by reading the file to understand the error.", toolCall: 'read_file("utils.py")', color: '#3b82f6', toolColor: '#a855f7' },
    machine: null,
    arrow: 'left'
  },
  // Step 5: tool execution + result
  {
    msg: { role: 'tool_result', text: 'def process_data(items):\n    total = 0\n    for item in items:\n        total += item.value  # TypeError\n    return total', color: '#22c55e' },
    machine: 'file_read',
    arrow: null
  },
  // Step 6: sending again
  {
    msg: { role: 'thinking', text: 'Thinking...', color: '#3b82f6' },
    machine: null,
    arrow: 'right'
  },
  // Step 7: assistant diagnoses + edit tool call
  {
    msg: { role: 'assistant+tool', text: "I can see the issue. The function expects objects with a .value attribute but is receiving strings. Let me fix this.", toolCall: 'edit_file("utils.py", old="total += item.value", new="total += int(item) if isinstance(item, str) else item.value")', color: '#3b82f6', toolColor: '#a855f7' },
    machine: null,
    arrow: 'left'
  },
  // Step 8: edit applied
  {
    msg: { role: 'tool_result', text: 'Edit applied successfully.', color: '#22c55e' },
    machine: 'file_edit',
    arrow: null
  },
  // Step 9: sending again
  {
    msg: { role: 'thinking', text: 'Thinking...', color: '#3b82f6' },
    machine: null,
    arrow: 'right'
  },
  // Step 10: assistant runs tests
  {
    msg: { role: 'assistant+tool', text: "Now let me verify the fix by running the tests.", toolCall: 'bash("python -m pytest tests/test_utils.py -v")', color: '#3b82f6', toolColor: '#a855f7' },
    machine: null,
    arrow: 'left'
  },
  // Step 11: test results
  {
    msg: { role: 'tool_result', text: 'tests/test_utils.py::test_process_strings PASSED\ntests/test_utils.py::test_process_objects PASSED\ntests/test_utils.py::test_process_mixed PASSED\n\n3 passed in 0.42s', color: '#22c55e' },
    machine: 'terminal',
    arrow: null
  },
  // Step 12: final response
  {
    msg: { role: 'assistant', text: "Fixed! The TypeError was caused by process_data receiving string arguments while the code assumed all items had a .value attribute. The fix checks if each item is a string (converting it with int()) or an object (accessing .value). All 3 tests pass.", color: '#3b82f6' },
    machine: null,
    arrow: null
  }
];

let demo5_current = 0;
let demo5_autoplayTimer = null;

function demo5_renderMessage(step) {
  const m = step.msg;
  const container = document.getElementById('demo5-messages');
  if (!m) return;

  // Remove any "thinking" message
  const thinkingEl = document.getElementById('demo5-thinking');
  if (thinkingEl) thinkingEl.remove();

  if (m.role === 'thinking') {
    const div = document.createElement('div');
    div.id = 'demo5-thinking';
    div.style.cssText = `padding:10px 12px;border-radius:6px;font-size:12px;background:#111;border-left:3px solid ${m.color};color:#888;opacity:0;transition:opacity 0.4s ease;`;
    div.innerHTML = '<span style="display:inline-block;animation:demo5pulse 1.2s infinite;">Thinking...</span>';
    container.appendChild(div);
    requestAnimationFrame(() => div.style.opacity = '1');
    return;
  }

  if (m.role === 'assistant+tool') {
    // Two cards: assistant text + tool call
    const aDiv = document.createElement('div');
    aDiv.style.cssText = `padding:10px 12px;border-radius:6px;font-size:12px;background:#111;border-left:3px solid ${m.color};color:#ccc;opacity:0;transition:opacity 0.4s ease;`;
    aDiv.textContent = m.text;
    container.appendChild(aDiv);
    requestAnimationFrame(() => aDiv.style.opacity = '1');

    setTimeout(() => {
      const tDiv = document.createElement('div');
      tDiv.style.cssText = `padding:10px 12px;border-radius:6px;font-size:11px;background:#1a1030;border-left:3px solid ${m.toolColor};color:#c4a5f0;font-family:'Berkeley Mono','SF Mono','Fira Code',monospace;opacity:0;transition:opacity 0.4s ease;white-space:pre-wrap;word-break:break-all;`;
      tDiv.innerHTML = '<span style="color:#666;font-size:10px;">TOOL CALL</span><br>' + escapeHtml(m.toolCall);
      container.appendChild(tDiv);
      requestAnimationFrame(() => tDiv.style.opacity = '1');
      container.scrollTop = container.scrollHeight;
    }, 250);
    return;
  }

  if (m.role === 'system') {
    const div = document.createElement('div');
    div.style.cssText = `padding:10px 12px;border-radius:6px;font-size:11px;background:#111;border-left:3px solid ${m.color};color:#888;opacity:0;transition:opacity 0.4s ease;cursor:pointer;`;
    div.innerHTML = '<span style="color:#555;font-size:10px;">SYSTEM</span> <span style="color:#666;">(click to expand)</span><br><span style="color:#777;">' + escapeHtml(m.text).replace('[System] ', '') + '</span>';
    let expanded = false;
    div.onclick = function() {
      expanded = !expanded;
      if (expanded && m.full) {
        div.innerHTML = '<span style="color:#555;font-size:10px;">SYSTEM</span> <span style="color:#666;">(click to collapse)</span><br><span style="color:#777;white-space:pre-wrap;font-size:11px;">' + escapeHtml(m.full) + '</span>';
      } else {
        div.innerHTML = '<span style="color:#555;font-size:10px;">SYSTEM</span> <span style="color:#666;">(click to expand)</span><br><span style="color:#777;">' + escapeHtml(m.text).replace('[System] ', '') + '</span>';
      }
    };
    container.appendChild(div);
    requestAnimationFrame(() => div.style.opacity = '1');
    return;
  }

  const roleLabels = { user: 'USER', assistant: 'ASSISTANT', tool_result: 'TOOL RESULT' };
  const div = document.createElement('div');
  const bg = m.role === 'tool_result' ? '#0a1a0a' : '#111';
  div.style.cssText = `padding:10px 12px;border-radius:6px;font-size:12px;background:${bg};border-left:3px solid ${m.color};color:#ccc;opacity:0;transition:opacity 0.4s ease;`;
  div.innerHTML = '<span style="color:#555;font-size:10px;">' + (roleLabels[m.role] || m.role.toUpperCase()) + '</span><br><span style="white-space:pre-wrap;font-size:' + (m.role === 'tool_result' ? '11px' : '12px') + ';color:' + (m.role === 'tool_result' ? '#6ee7b7' : '#ccc') + ';">' + escapeHtml(m.text) + '</span>';
  container.appendChild(div);
  requestAnimationFrame(() => div.style.opacity = '1');
  container.scrollTop = container.scrollHeight;
}

function demo5_renderArrow(dir) {
  const arrow = document.getElementById('demo5-arrow');
  if (!dir) {
    arrow.innerHTML = '&#8226;';
    arrow.style.color = '#333';
    arrow.style.transform = 'scale(1)';
    return;
  }
  arrow.innerHTML = dir === 'right' ? '&#8594;' : '&#8592;';
  arrow.style.color = dir === 'right' ? '#f97316' : '#3b82f6';
  arrow.style.transform = 'scale(1)';
  arrow.style.transition = 'none';
  arrow.style.transform = 'scale(0.5)';
  requestAnimationFrame(() => {
    arrow.style.transition = 'all 0.4s ease';
    arrow.style.transform = 'scale(1.3)';
    setTimeout(() => arrow.style.transform = 'scale(1)', 400);
  });
}

function demo5_renderMachine(type) {
  const mc = document.getElementById('demo5-machine-content');
  if (!type) return;

  if (type === 'file_read') {
    mc.innerHTML = `
      <div style="margin-bottom:8px;color:#888;font-size:11px;">FILE: utils.py</div>
      <div style="background:#111;border-radius:4px;padding:12px;font-size:11px;border:1px solid #333;opacity:0;transition:opacity 0.5s ease;" id="demo5-file-view">
        <div style="color:#888;">1 </div><div><span style="color:#c084fc;">def</span> <span style="color:#60a5fa;">process_data</span>(items):</div>
        <div style="color:#888;">2 </div><div>    total = <span style="color:#f97316;">0</span></div>
        <div style="color:#888;">3 </div><div>    <span style="color:#c084fc;">for</span> item <span style="color:#c084fc;">in</span> items:</div>
        <div style="color:#888;">4 </div><div>        total += item.value  <span style="color:#ef4444;"># TypeError: 'str' object has no attribute 'value'</span></div>
        <div style="color:#888;">5 </div><div>    <span style="color:#c084fc;">return</span> total</div>
      </div>`;
    requestAnimationFrame(() => {
      const fv = document.getElementById('demo5-file-view');
      if (fv) fv.style.opacity = '1';
    });
  }

  if (type === 'file_edit') {
    mc.innerHTML = `
      <div style="margin-bottom:8px;color:#888;font-size:11px;">FILE: utils.py (modified)</div>
      <div style="background:#111;border-radius:4px;padding:12px;font-size:11px;border:1px solid #333;">
        <div style="color:#888;">1 </div><div><span style="color:#c084fc;">def</span> <span style="color:#60a5fa;">process_data</span>(items):</div>
        <div style="color:#888;">2 </div><div>    total = <span style="color:#f97316;">0</span></div>
        <div style="color:#888;">3 </div><div>    <span style="color:#c084fc;">for</span> item <span style="color:#c084fc;">in</span> items:</div>
        <div style="background:#1c0a0a;padding:2px 4px;border-radius:2px;text-decoration:line-through;color:#f87171;">4         total += item.value</div>
        <div style="background:#0a1c0a;padding:2px 4px;border-radius:2px;color:#6ee7b7;">4         total += int(item) if isinstance(item, str) else item.value</div>
        <div style="color:#888;">5 </div><div>    <span style="color:#c084fc;">return</span> total</div>
      </div>`;
  }

  if (type === 'terminal') {
    mc.innerHTML = `
      <div style="margin-bottom:8px;color:#888;font-size:11px;">TERMINAL</div>
      <div style="background:#111;border-radius:4px;padding:12px;font-size:11px;border:1px solid #333;color:#aaa;">
        <div style="color:#888;">$ python -m pytest tests/test_utils.py -v</div>
        <div style="margin-top:6px;">
          <div><span style="color:#22c55e;">PASSED</span> tests/test_utils.py::test_process_strings</div>
          <div><span style="color:#22c55e;">PASSED</span> tests/test_utils.py::test_process_objects</div>
          <div><span style="color:#22c55e;">PASSED</span> tests/test_utils.py::test_process_mixed</div>
        </div>
        <div style="margin-top:8px;color:#22c55e;font-weight:600;">3 passed <span style="color:#888;font-weight:400;">in 0.42s</span></div>
      </div>`;
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

window.demo5_next = function() {
  if (demo5_current >= DEMO5_STEPS.length) return;
  const step = DEMO5_STEPS[demo5_current];
  demo5_renderArrow(step.arrow);
  demo5_renderMessage(step);
  if (step.machine) demo5_renderMachine(step.machine);
  demo5_current++;
  document.getElementById('demo5-step-display').textContent = 'Step ' + demo5_current + ' of ' + DEMO5_STEPS.length;
  if (demo5_current >= DEMO5_STEPS.length) {
    document.getElementById('demo5-next').disabled = true;
    document.getElementById('demo5-next').style.opacity = '0.4';
    demo5_stopAutoplay();
  }
};

window.demo5_reset = function() {
  demo5_current = 0;
  demo5_stopAutoplay();
  document.getElementById('demo5-messages').innerHTML = '';
  document.getElementById('demo5-machine-content').innerHTML = '<div style="color:#555;font-style:italic;">Waiting...</div>';
  document.getElementById('demo5-step-display').textContent = 'Step 0 of ' + DEMO5_STEPS.length;
  document.getElementById('demo5-next').disabled = false;
  document.getElementById('demo5-next').style.opacity = '1';
  document.getElementById('demo5-autoplay').checked = false;
  demo5_renderArrow(null);
};

function demo5_stopAutoplay() {
  if (demo5_autoplayTimer) { clearInterval(demo5_autoplayTimer); demo5_autoplayTimer = null; }
  document.getElementById('demo5-autoplay').checked = false;
}

window.demo5_toggleAutoplay = function() {
  if (document.getElementById('demo5-autoplay').checked) {
    demo5_autoplayTimer = setInterval(() => {
      if (demo5_current >= DEMO5_STEPS.length) { demo5_stopAutoplay(); return; }
      demo5_next();
    }, 1400);
  } else {
    demo5_stopAutoplay();
  }
};

})();
</script>

<style>
@keyframes demo5pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>

Notice what happened there. The model made four round trips through the loop. It read a file, made an edit, ran tests, and then summarised the result. Each tool result went into the conversation history, which the model saw on the next turn. The `messages` array grew from 2 entries to 12.

The loop works because the model can take small steps. It can read, decide, act, and verify. The harness runs the loop. The model decides what to do at each step.

---

## Tool Calling - How Models Reach the Real World

A language model by itself generates text. Tools let it interact with a real environment: read files, run commands, and edit code.

A tool in an agent system has a **name**, a **description**, and an **input schema**. The name is something like `read_file`, `edit_file`, or `bash`. The description explains what the tool does. The schema defines the parameters it accepts.

When the model calls a tool, it outputs a structured JSON request. The harness receives that request and runs the tool. The tool result goes back to the model on the next iteration.

This is also the security boundary. The model can suggest actions, but the harness decides what actually runs and when to ask for approval.

Here are some exampe tools:

<div id="demo6-container" style="margin: 2rem 0; font-family: 'Berkeley Mono', 'SF Mono', 'Fira Code', monospace;">
  <div style="display: grid; grid-template-columns: 180px 1fr 1fr; gap: 0; border: 1px solid #333; border-radius: 8px; overflow: hidden; background: #0a0a0a; min-height: 400px;">

    <!-- Column 1: Tool Palette -->
    <div style="border-right: 1px solid #222; padding: 12px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">Tools</div>
      <div id="demo6-palette" style="display: flex; flex-direction: column; gap: 6px;"></div>
    </div>

    <!-- Column 2: Tool Definition -->
    <div style="border-right: 1px solid #222; padding: 16px; overflow-y: auto;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">Tool Definition</div>
      <pre id="demo6-definition" style="font-size: 11px; color: #aaa; white-space: pre-wrap; margin: 0; line-height: 1.5;"><span style="color:#555;">Pick a tool to view its schema.</span></pre>
    </div>

    <!-- Column 3: In Action -->
    <div style="padding: 16px; overflow-y: auto;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">In Action</div>
      <div id="demo6-action" style="font-size: 12px; color: #555; font-style: italic;">Pick a tool to see an example.</div>
    </div>
  </div>
</div>

<script>
(function() {

const TOOLS = {
  read_file: {
    icon: '\ud83d\udcc4',
    definition: {
      name: "read_file",
      description: "Read the contents of a file at the given path",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          offset: { type: "number", description: "Line to start reading from" },
          limit: { type: "number", description: "Max lines to read" }
        },
        required: ["path"]
      }
    },
    modelOutput: '{\n  "tool": "read_file",\n  "input": {\n    "path": "/src/main.py"\n  }\n}',
    toolResult: '{\n  "content": "import os\\nimport sys\\n\\ndef main():\\n    print(\\"Hello, world!\\")\\n    return 0"\n}'
  },
  edit_file: {
    icon: '\u270f\ufe0f',
    definition: {
      name: "edit_file",
      description: "Replace an exact string in a file with new content",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path to the file" },
          old_string: { type: "string", description: "The exact text to find" },
          new_string: { type: "string", description: "The replacement text" }
        },
        required: ["path", "old_string", "new_string"]
      }
    },
    modelOutput: '{\n  "tool": "edit_file",\n  "input": {\n    "path": "/src/main.py",\n    "old_string": "print(\\"Hello, world!\\")",\n    "new_string": "print(\\"Hello, agent!\\")"\n  }\n}',
    toolResult: '{\n  "status": "success",\n  "message": "Replaced 1 occurrence in /src/main.py"\n}'
  },
  bash: {
    icon: '\ud83d\udcbb',
    definition: {
      name: "bash",
      description: "Execute a shell command and return stdout/stderr",
      input_schema: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute" },
          timeout: { type: "number", description: "Timeout in milliseconds" }
        },
        required: ["command"]
      }
    },
    modelOutput: '{\n  "tool": "bash",\n  "input": {\n    "command": "python -m pytest tests/ -v"\n  }\n}',
    toolResult: '{\n  "stdout": "tests/test_main.py::test_hello PASSED\\n1 passed in 0.12s",\n  "stderr": "",\n  "exit_code": 0\n}'
  },
  grep: {
    icon: '\ud83d\udd0d',
    definition: {
      name: "grep",
      description: "Search file contents using regex patterns",
      input_schema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Regex pattern to search for" },
          path: { type: "string", description: "Directory or file to search" },
          include: { type: "string", description: "Glob for file types, e.g. *.py" }
        },
        required: ["pattern"]
      }
    },
    modelOutput: '{\n  "tool": "grep",\n  "input": {\n    "pattern": "def login",\n    "path": "/src",\n    "include": "*.py"\n  }\n}',
    toolResult: '{\n  "matches": [\n    {"file": "/src/auth.py", "line": 45, "text": "def login(user, password):"},\n    {"file": "/src/test_auth.py", "line": 12, "text": "def test_login():"}\n  ]\n}'
  },
  glob: {
    icon: '\ud83d\udcc1',
    definition: {
      name: "glob",
      description: "Find files matching a glob pattern",
      input_schema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern, e.g. **/*.py" },
          path: { type: "string", description: "Root directory to search from" }
        },
        required: ["pattern"]
      }
    },
    modelOutput: '{\n  "tool": "glob",\n  "input": {\n    "pattern": "**/*.py",\n    "path": "/src"\n  }\n}',
    toolResult: '{\n  "files": [\n    "/src/main.py",\n    "/src/auth.py",\n    "/src/middleware.py",\n    "/src/models.py",\n    "/src/utils.py"\n  ]\n}'
  }
};

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function syntaxHighlightJSON(json) {
  return json
    .replace(/"([^"]+)":/g, '<span style="color:#60a5fa;">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#f97316;">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color:#22c55e;">$1</span>')
    .replace(/: (true|false)/g, ': <span style="color:#c084fc;">$1</span>')
    .replace(/"(string|number|object|boolean)"/g, '<span style="color:#f97316;">"$1"</span>');
}

// Build palette
const palette = document.getElementById('demo6-palette');
let selectedTool = null;
Object.keys(TOOLS).forEach(name => {
  const t = TOOLS[name];
  const btn = document.createElement('button');
  btn.id = 'demo6-btn-' + name;
  btn.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:#111;border:1px solid #333;border-radius:4px;color:#ccc;font-size:12px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.2s ease;';
  btn.innerHTML = '<span style="font-size:16px;">' + t.icon + '</span> ' + name;
  btn.onmouseenter = () => { if (selectedTool !== name) btn.style.borderColor = '#555'; };
  btn.onmouseleave = () => { if (selectedTool !== name) btn.style.borderColor = '#333'; };
  btn.onclick = () => selectTool(name);
  palette.appendChild(btn);
});

function selectTool(name) {
  // Update palette selection
  if (selectedTool) {
    const prev = document.getElementById('demo6-btn-' + selectedTool);
    if (prev) { prev.style.borderColor = '#333'; prev.style.background = '#111'; }
  }
  selectedTool = name;
  const cur = document.getElementById('demo6-btn-' + name);
  cur.style.borderColor = '#60a5fa';
  cur.style.background = '#0a1428';

  const t = TOOLS[name];

  // Definition
  const defEl = document.getElementById('demo6-definition');
  const jsonStr = JSON.stringify(t.definition, null, 2);
  defEl.innerHTML = syntaxHighlightJSON(escHtml(jsonStr));

  // Action
  const actEl = document.getElementById('demo6-action');
  actEl.innerHTML = `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #3b82f6; margin-bottom: 6px;">Model Output</div>
      <pre style="background: #0a1428; border: 1px solid #1e3a5f; border-radius: 4px; padding: 10px; margin: 0; font-size: 11px; white-space: pre-wrap; line-height: 1.4;">${syntaxHighlightJSON(escHtml(t.modelOutput))}</pre>
    </div>
    <div style="text-align: center; color: #555; font-size: 18px; margin: 8px 0;">\u2193 runs on your machine \u2193</div>
    <div>
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #22c55e; margin-bottom: 6px;">Tool Result</div>
      <pre style="background: #0a1a0a; border: 1px solid #1a3a1a; border-radius: 4px; padding: 10px; margin: 0; font-size: 11px; white-space: pre-wrap; line-height: 1.4;">${syntaxHighlightJSON(escHtml(t.toolResult))}</pre>
    </div>`;
}

})();
</script>

Tool descriptions matter. The model reads them as instructions. The wording affects when the model picks a tool and how it formats inputs. If the description is vague, the model will call the tool at the wrong time or with the wrong shape.

Compare a tool described as "run a command" with one described as "execute a shell command in the project's working directory and return stdout/stderr; use it to run tests or check git status." The second description gives the model both the API shape and the intended use.

Tools have a cost. Tool definitions sit in the system prompt and consume context window tokens. A small set is cheap. A large set adds overhead. This is why many agents ship with a small toolkit that composes. For example, you can avoid a special `create_react_component` tool if you already have `edit_file`. You can avoid a `run_tests` tool if you already have a generic `bash` tool.

The best tool sets follow the Unix philosophy: small, sharp tools that compose. Read a file. Edit a file. Search for text. Run a command. List files. That is enough to build almost anything. This is why adding too many MCPs to your setup would wreak havoc to your context window!

---

## RAG is DEAD

Retrieval-Augmented Generation (RAG) is a common pattern. You split documents into chunks, embed each chunk into a vector, store vectors in a database, and at query time retrieve the closest chunks to the user's question. You add those chunks to the model's context.

RAG works well for things like searching a knowledge base and answering questions over large document collections.

For code, RAG has limitations.

Code has dependencies across files. A function in `auth.py` can call helpers in `utils.py`, which imports constants from `config.py`, which reads an environment variable. If you retrieve a single chunk, you can miss the call path.

Embedding similarity does not guarantee logical relevance. You might search for "login returns 403" and retrieve text that mentions those words, while the bug sits in a permission check that does not mention either string. Chunking can also split a function across boundaries and separate a signature from the logic that matters.

Another approach is to give the model tools to search and read the repository. The model can form a hypothesis, search for symbols, open files, follow references, and update the hypothesis as it reads more context.

Below we have a toy debugging scenario with both approaches.

<div id="demo7-container" style="margin: 2rem 0; font-family: 'Berkeley Mono', 'SF Mono', 'Fira Code', monospace;">

  <div style="text-align: center; margin-bottom: 12px;">
    <div style="font-size: 13px; color: #888; margin-bottom: 8px;">Scenario: "Why does the login function return 403 for admin users?"</div>
    <button id="demo7-run" onclick="demo7_run()" style="padding: 10px 28px; background: #e8e8e8; color: #0a0a0a; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600;">Run</button>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">

    <!-- LEFT: RAG -->
    <div style="border: 1px solid #333; border-radius: 8px; background: #0a0a0a; padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <span style="font-size: 13px; font-weight: 600; color: #f97316;">RAG</span>
        <span id="demo7-rag-badge" style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #222; color: #555;">WAITING</span>
      </div>
      <div id="demo7-rag-steps" style="display: flex; flex-direction: column; gap: 8px; min-height: 300px;">
        <div style="color: #555; font-size: 12px; font-style: italic;">Click "Run" to start.</div>
      </div>
    </div>

    <!-- RIGHT: Agentic -->
    <div style="border: 1px solid #333; border-radius: 8px; background: #0a0a0a; padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <span style="font-size: 13px; font-weight: 600; color: #3b82f6;">Repo Search</span>
        <span id="demo7-agent-badge" style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #222; color: #555;">WAITING</span>
      </div>
      <div id="demo7-agent-steps" style="display: flex; flex-direction: column; gap: 8px; min-height: 300px;">
        <div style="color: #555; font-size: 12px; font-style: italic;">Click "Run" to start.</div>
      </div>
    </div>
  </div>
</div>

<script>
(function() {

let demo7_running = false;

function escH(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function addStep(panel, html, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.style.cssText = 'padding:8px 10px;border-radius:4px;font-size:11px;background:#111;color:#ccc;opacity:0;transition:opacity 0.4s ease;line-height:1.5;';
      div.innerHTML = html;
      document.getElementById(panel).appendChild(div);
      requestAnimationFrame(() => div.style.opacity = '1');
      resolve();
    }, delay);
  });
}

function setBadge(id, text, color, bg) {
  const b = document.getElementById(id);
  b.textContent = text;
  b.style.color = color;
  b.style.background = bg;
}

window.demo7_run = async function() {
  if (demo7_running) return;
  demo7_running = true;
  document.getElementById('demo7-run').disabled = true;
  document.getElementById('demo7-run').style.opacity = '0.4';

  // Clear
  document.getElementById('demo7-rag-steps').innerHTML = '';
  document.getElementById('demo7-agent-steps').innerHTML = '';
  setBadge('demo7-rag-badge', 'RUNNING', '#f97316', '#1a1008');
  setBadge('demo7-agent-badge', 'RUNNING', '#3b82f6', '#081828');

  // === RAG Side ===
  const ragP = (async () => {
    await addStep('demo7-rag-steps', '<span style="color:#888;">1.</span> Embed query: <span style="color:#f97316;">"Why does the login function return 403 for admin users?"</span><div style="margin-top:6px;height:4px;background:#222;border-radius:2px;overflow:hidden;"><div style="height:100%;width:0%;background:#f97316;transition:width 0.8s ease;" id="demo7-rag-bar"></div></div>', 0);
    requestAnimationFrame(() => { const bar = document.getElementById('demo7-rag-bar'); if(bar) bar.style.width = '100%'; });

    await addStep('demo7-rag-steps', '<span style="color:#888;">2.</span> Vector search: top 3 chunks...', 1000);

    await addStep('demo7-rag-steps', '<div style="color:#888;margin-bottom:4px;">3. Retrieved chunks:</div><div style="background:#1a1008;border:1px solid #332808;border-radius:4px;padding:8px;margin:2px 0;"><span style="color:#f97316;font-size:10px;">CHUNK 1 — auth.py:45-60 (similarity: 0.89)</span><br><span style="color:#aaa;">def login(user, password):<br>&nbsp;&nbsp;if not verify_password(user, password):<br>&nbsp;&nbsp;&nbsp;&nbsp;return 401<br>&nbsp;&nbsp;token = create_jwt(user)<br>&nbsp;&nbsp;return {"token": token}</span></div><div style="background:#1a1008;border:1px solid #332808;border-radius:4px;padding:8px;margin:2px 0;"><span style="color:#f97316;font-size:10px;">CHUNK 2 — README.md:12-20 (similarity: 0.72)</span><br><span style="color:#aaa;">Authentication uses JWT tokens. Users<br>must provide valid credentials to access<br>protected endpoints...</span></div><div style="background:#1a1008;border:1px solid #332808;border-radius:4px;padding:8px;margin:2px 0;"><span style="color:#f97316;font-size:10px;">CHUNK 3 — models.py:30-45 (similarity: 0.68)</span><br><span style="color:#aaa;">class User:<br>&nbsp;&nbsp;role = Column(String)<br>&nbsp;&nbsp;email = Column(String)</span></div>', 1200);

    await addStep('demo7-rag-steps', '<div style="color:#888;margin-bottom:4px;">4. Answer from 3 chunks:</div><div style="background:#1a1008;border:1px solid #332808;border-radius:4px;padding:8px;color:#ccc;">"The login function in auth.py checks credentials and returns a JWT token on success. The 403 error might be related to the user&#39;s role field, but I don&#39;t have enough context to see where roles get enforced."</div>', 1400);

    setBadge('demo7-rag-badge', 'INCOMPLETE', '#ef4444', '#1c0a0a');

    await addStep('demo7-rag-steps', '<div style="text-align:center;margin-top:8px;color:#ef4444;font-size:12px;font-weight:600;padding:6px;background:#1c0808;border-radius:4px;">Missed the bug in middleware.py<br><span style="color:#888;font-weight:400;font-size:11px;">It never retrieved the relevant code</span></div>', 600);
  })();

  // === Agentic Side ===
  const agentP = (async () => {
    await addStep('demo7-agent-steps', '<span style="color:#888;">1.</span> <span style="color:#8b8bff;">Model:</span> "Search for the login function."', 200);

    await addStep('demo7-agent-steps', '<span style="color:#888;">2.</span> <span style="color:#a855f7;">grep</span>("def login") <span style="color:#22c55e;">\u2192 auth.py:45</span>', 1200);

    await addStep('demo7-agent-steps', '<span style="color:#888;">3.</span> <span style="color:#a855f7;">read_file</span>("auth.py") <span style="color:#22c55e;">\u2192</span><div style="background:#0a1428;border:1px solid #1e3a5f;border-radius:4px;padding:8px;margin-top:4px;"><span style="color:#aaa;">def login(user, password):<br>&nbsp;&nbsp;if not verify_password(user, password):<br>&nbsp;&nbsp;&nbsp;&nbsp;return 401<br>&nbsp;&nbsp;token = create_jwt(user)<br>&nbsp;&nbsp;response = check_permissions(user)<br>&nbsp;&nbsp;if response: return response<br>&nbsp;&nbsp;return {"token": token}</span></div>', 1800);

    await addStep('demo7-agent-steps', '<span style="color:#888;">4.</span> <span style="color:#8b8bff;">Model:</span> "It calls check_permissions(). Follow it."', 2600);

    await addStep('demo7-agent-steps', '<span style="color:#888;">5.</span> <span style="color:#a855f7;">grep</span>("def check_permissions") <span style="color:#22c55e;">\u2192 middleware.py:12</span>', 3200);

    await addStep('demo7-agent-steps', '<span style="color:#888;">6.</span> <span style="color:#a855f7;">read_file</span>("middleware.py") <span style="color:#22c55e;">\u2192</span><div style="background:#0a1428;border:1px solid #1e3a5f;border-radius:4px;padding:8px;margin-top:4px;"><span style="color:#aaa;">def check_permissions(user):<br>&nbsp;&nbsp;if user.role == "admin":<br>&nbsp;&nbsp;&nbsp;&nbsp;return <span style="background:#2a0a0a;padding:1px 4px;border-radius:2px;color:#f87171;">403</span>  <span style="color:#ef4444;"># BUG: should be != "admin"</span><br>&nbsp;&nbsp;return None</span></div>', 4000);

    await addStep('demo7-agent-steps', '<div style="color:#888;margin-bottom:4px;">7. Model answer:</div><div style="background:#0a1428;border:1px solid #1e3a5f;border-radius:4px;padding:8px;color:#ccc;">"Found it. The bug is in <strong>middleware.py:14</strong>. The check_permissions function returns 403 when user.role <em>equals</em> \'admin\', but it should return 403 when the role is <em>not</em> admin. The comparison operator is backwards."</div>', 5000);

    setBadge('demo7-agent-badge', 'CORRECT', '#22c55e', '#0a1c0a');

    await addStep('demo7-agent-steps', '<div style="text-align:center;margin-top:8px;color:#22c55e;font-size:12px;font-weight:600;padding:6px;background:#081c08;border-radius:4px;">Found the root cause in middleware.py<br><span style="color:#888;font-weight:400;font-size:11px;">Followed the call chain across files</span></div>', 5600);
  })();

  await Promise.all([ragP, agentP]);
  demo7_running = false;
  document.getElementById('demo7-run').disabled = false;
  document.getElementById('demo7-run').style.opacity = '1';
  document.getElementById('demo7-run').textContent = 'Run Again';
};

})();
</script>

In the example above, the RAG flow retrieved chunks that mentioned the login function and authentication in general. It missed the middleware bug because that code never mentions "login" or "403." The retrieval step did not surface `check_permissions`.

The agent flow found the bug by following the call chain. It searched for `login`, read the file, saw `check_permissions`, searched for that function, and read `middleware.py`.

When people say "the filesystem is all you need," they mean a model can do real work with basic repo tools like search and file reads. The model forms a hypothesis, checks code, and updates the next step based on what it finds. All the *nix neckbeards have already given enough training data up on the internet on "oh, you can just run this command."

This is similar to how a new developer works. They search, open files, follow symbols, and build context over time. The agent loop enables this because each tool result goes back into the same `messages` history.

RAG still helps in some scenarios.

RAG can help when scale or latency dominates. If you have millions of documents or a repository with tens of thousands of files, grepping everything can cost time and tokens. A vector index can narrow the search quickly.

Tool calling has round trips. The model generates a call, the harness executes it, and the result returns to the model. Multiple calls add latency.

If you already have structured mappings (for example, a dependency graph), you can inject that directly instead of having the model rediscover it.

In practice, an agent can have both styles available. Vector search can be one tool alongside grep and file reads, and the model can pick based on the problem.


---

## The Context Window - Memory and Its Limits

Before talking about capability, it helps to talk about capacity. Every request runs inside a **context window**. The context window includes the system prompt, tool definitions, conversation history, files you paste or read, and the model's own output.

The unit of measurement here is the **token**. A token is roughly four characters of English text, or about three-quarters of a word. The word "function" is two tokens. A typical line of code is 10-20 tokens. A 500-line source file might be 3,000-5,000 tokens. These numbers matter because the context window is measured in tokens, and it fills up faster than you might expect.

Context windows grew quickly over the last few years. GPT-3 (2020) shipped with 4,096 tokens, roughly 3,000 words. GPT-4 started at 8,192 tokens and later expanded. Claude pushed higher, and some current models support up to 1 million tokens. At that size, you can fit a lot of code, but it is still a budget.

A large context window still has overhead. The system prompt for an agent can take a few thousand tokens. Tool definitions can take thousands more. Conversation history grows every turn. Reading a 500-line file adds a few thousand tokens. A big search result adds more. If you enable extended thinking, that also consumes tokens.

Long sessions fill the window. After enough turns, earlier context gets crowded out, even if it was important.

When the window fills up, systems either drop older content, summarise it, or keep a sliding window of recent turns. All of these lose information.

This is one reason long coding sessions degrade. The model can look worse later because key details from earlier turns got dropped or compressed. If you see this happening, you can restart with a clean prompt and re-provide the key context.

<div id="demo8-container" style="max-width:900px;margin:2rem auto;font-family:system-ui,-apple-system,sans-serif;">
  <h3 style="text-align:center;margin-bottom:0.25rem;color:#111;">Context Window Sandbox</h3>
  <p style="text-align:center;font-size:0.85rem;color:#555;margin-top:0;margin-bottom:1rem;">Add blocks to the window. When it overflows, older content gets summarised or dropped.</p>

  <div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;">
    <!-- Context window visualization -->
    <div style="flex:1;min-width:320px;">
      <div id="demo8-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <span id="demo8-token-count" style="font-size:0.95rem;font-weight:600;color:#111;">0 / 32,768 tokens</span>
        <span id="demo8-percent" style="font-size:0.85rem;color:#666;">0%</span>
      </div>
      <div id="demo8-progress-bar" style="width:100%;height:8px;background:#2a2a2a;border-radius:4px;overflow:hidden;margin-bottom:0.75rem;">
        <div id="demo8-progress-fill" style="width:0%;height:100%;background:#4ade80;border-radius:4px;transition:width 0.4s ease,background 0.4s ease;"></div>
      </div>
      <div id="demo8-window" style="width:100%;height:450px;background:#1a1a2e;border:2px solid #333;border-radius:8px;position:relative;overflow-y:auto;display:flex;flex-direction:column-reverse;padding:6px;">
        <div id="demo8-blocks" style="display:flex;flex-direction:column;gap:4px;"></div>
      </div>
    </div>

    <!-- Control panel -->
    <div style="width:240px;flex-shrink:0;">
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.8rem;color:#999;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.5px;">Context Size</div>
        <div id="demo8-sizes" style="display:flex;flex-wrap:wrap;gap:4px;">
          <button class="demo8-size-btn" data-size="4096" style="padding:4px 8px;font-size:0.75rem;border:1px solid #555;background:#2a2a2a;color:#ccc;border-radius:4px;cursor:pointer;">4K</button>
          <button class="demo8-size-btn" data-size="32768" style="padding:4px 8px;font-size:0.75rem;border:1px solid #4ade80;background:#1a3a2a;color:#4ade80;border-radius:4px;cursor:pointer;">32K</button>
          <button class="demo8-size-btn" data-size="131072" style="padding:4px 8px;font-size:0.75rem;border:1px solid #555;background:#2a2a2a;color:#ccc;border-radius:4px;cursor:pointer;">128K</button>
          <button class="demo8-size-btn" data-size="204800" style="padding:4px 8px;font-size:0.75rem;border:1px solid #555;background:#2a2a2a;color:#ccc;border-radius:4px;cursor:pointer;">200K</button>
          <button class="demo8-size-btn" data-size="1048576" style="padding:4px 8px;font-size:0.75rem;border:1px solid #555;background:#2a2a2a;color:#ccc;border-radius:4px;cursor:pointer;">1M</button>
        </div>
      </div>

      <div style="font-size:0.8rem;color:#999;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.5px;">Add Blocks</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button onclick="demo8AddBlock('system','System Prompt',2000,'#6b7280')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #6b7280;background:#1f2937;color:#d1d5db;border-radius:6px;cursor:pointer;text-align:left;">System Prompt <span style="float:right;opacity:0.6;">+2K</span></button>
        <button onclick="demo8AddBlock('tools','Tool Definitions',3000,'#8b5cf6')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #8b5cf6;background:#1e1b3a;color:#c4b5fd;border-radius:6px;cursor:pointer;text-align:left;">Tool Definitions <span style="float:right;opacity:0.6;">+3K</span></button>
        <button onclick="demo8AddBlock('user','Turn',800,'#f97316')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #f97316;background:#3a1f0e;color:#fdba74;border-radius:6px;cursor:pointer;text-align:left;">Turn <span style="float:right;opacity:0.6;">+800</span></button>
        <button onclick="demo8AddBlock('file','File Contents',5000,'#22d3ee')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #22d3ee;background:#0e2a2e;color:#a5f3fc;border-radius:6px;cursor:pointer;text-align:left;">Read file <span style="float:right;opacity:0.6;">+5K</span></button>
        <button onclick="demo8AddBlock('thinking','Reasoning tokens',8000,'#f472b6')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #f472b6;background:#3a1028;color:#f9a8d4;border-radius:6px;cursor:pointer;text-align:left;">Reasoning tokens <span style="float:right;opacity:0.6;">+8K</span></button>
        <button onclick="demo8AddBlock('result','Tool Result',1500,'#4ade80')" style="padding:8px 12px;font-size:0.8rem;border:1px solid #4ade80;background:#0e2a1a;color:#86efac;border-radius:6px;cursor:pointer;text-align:left;">Tool Result <span style="float:right;opacity:0.6;">+1.5K</span></button>
      </div>
      <button onclick="demo8Clear()" style="margin-top:12px;padding:8px 12px;font-size:0.8rem;border:1px solid #ef4444;background:#2a1010;color:#fca5a5;border-radius:6px;cursor:pointer;width:100%;">Clear</button>
    </div>
  </div>
</div>

<script>
(function(){
  let demo8MaxTokens = 32768;
  let demo8UsedTokens = 0;
  let demo8Blocks = [];
  let demo8BlockId = 0;

  const demo8Labels = {system:'System Prompt',tools:'Tool Definitions',user:'Turn',file:'File Contents',thinking:'Reasoning tokens',result:'Tool Result'};

  window.demo8AddBlock = function(type, label, tokens, color) {
    demo8UsedTokens += tokens;
    const id = 'demo8-b-' + (demo8BlockId++);
    demo8Blocks.push({id, type, label, tokens, color});

    const container = document.getElementById('demo8-blocks');
    const pct = Math.min((tokens / demo8MaxTokens) * 100, 100);
    const height = Math.max(24, Math.min(120, (tokens / demo8MaxTokens) * 450));

    const block = document.createElement('div');
    block.id = id;
    block.style.cssText = 'min-height:' + height + 'px;background:' + color + '22;border:1px solid ' + color + ';border-radius:4px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:' + color + ';opacity:0;transform:scaleY(0.3);transition:all 0.35s ease;transform-origin:bottom;';
    block.innerHTML = '<span>' + label + '</span><span>' + tokens.toLocaleString() + ' tokens</span>';
    container.appendChild(block);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        block.style.opacity = '1';
        block.style.transform = 'scaleY(1)';
      });
    });

    demo8UpdateUI();

    if (demo8UsedTokens > demo8MaxTokens) {
      demo8Compress();
    }
  };

  function demo8Compress() {
    const conversationTypes = ['user', 'file', 'result'];
    let removed = 0;
    const toRemove = [];

    for (let i = 0; i < demo8Blocks.length && demo8UsedTokens > demo8MaxTokens * 0.75; i++) {
      const b = demo8Blocks[i];
      if (conversationTypes.includes(b.type) && !b.compressed) {
        const el = document.getElementById(b.id);
        if (el) {
          el.style.border = '1px solid #ef4444';
          el.style.background = '#ef444433';
          el.style.animation = 'demo8flash 0.3s ease 3';
        }
        toRemove.push(i);
        removed++;
      }
    }

    setTimeout(() => {
      let offset = 0;
      for (const idx of toRemove) {
        const realIdx = idx - offset;
        const b = demo8Blocks[realIdx];
        const el = document.getElementById(b.id);
        if (el) {
          el.style.transform = 'scaleY(0)';
          el.style.opacity = '0';
          el.style.minHeight = '0';
          el.style.padding = '0';
          el.style.margin = '0';
          setTimeout(() => el.remove(), 350);
        }
        demo8UsedTokens -= b.tokens;
        demo8Blocks.splice(realIdx, 1);
        offset++;
      }

      if (removed > 0) {
        const compBlock = {id: 'demo8-b-' + (demo8BlockId++), type: 'compressed', label: removed + ' blocks compressed', tokens: Math.round(removed * 200), color: '#ef4444', compressed: true};
        demo8UsedTokens += compBlock.tokens;
        demo8Blocks.splice(0, 0, compBlock);

        setTimeout(() => {
          const container = document.getElementById('demo8-blocks');
          const block = document.createElement('div');
          block.id = compBlock.id;
          block.style.cssText = 'min-height:20px;background:#ef444422;border:1px dashed #ef4444;border-radius:4px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:#fca5a5;font-style:italic;opacity:0;transition:opacity 0.3s ease;';
          block.innerHTML = '<span>' + compBlock.label + '</span><span>~' + compBlock.tokens.toLocaleString() + ' tokens (summarised)</span>';
          container.insertBefore(block, container.firstChild);
          requestAnimationFrame(() => block.style.opacity = '1');
          demo8UpdateUI();
        }, 400);
      }

      demo8UpdateUI();
    }, 900);
  }

  function demo8UpdateUI() {
    const pct = Math.min((demo8UsedTokens / demo8MaxTokens) * 100, 100);
    document.getElementById('demo8-token-count').textContent = demo8UsedTokens.toLocaleString() + ' / ' + demo8MaxTokens.toLocaleString() + ' tokens';
    document.getElementById('demo8-percent').textContent = Math.round(pct) + '%';
    const fill = document.getElementById('demo8-progress-fill');
    fill.style.width = pct + '%';
    if (pct >= 95) { fill.style.background = '#ef4444'; }
    else if (pct >= 80) { fill.style.background = '#f59e0b'; }
    else { fill.style.background = '#4ade80'; }
  }

  window.demo8Clear = function() {
    demo8Blocks = [];
    demo8UsedTokens = 0;
    demo8BlockId = 0;
    document.getElementById('demo8-blocks').innerHTML = '';
    demo8UpdateUI();
  };

  document.querySelectorAll('.demo8-size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      demo8MaxTokens = parseInt(this.dataset.size);
      document.querySelectorAll('.demo8-size-btn').forEach(b => {
        b.style.border = '1px solid #555';
        b.style.background = '#2a2a2a';
        b.style.color = '#ccc';
      });
      this.style.border = '1px solid #4ade80';
      this.style.background = '#1a3a2a';
      this.style.color = '#4ade80';
      demo8UpdateUI();
      if (demo8UsedTokens > demo8MaxTokens) demo8Compress();
    });
  });
})();
</script>

<style>
@keyframes demo8flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>

Try adding a system prompt, tool definitions, and then a series of turns and file reads. Switch to 4K and watch it fill up. Switch to 1M and the same blocks take a smaller fraction of the window. A larger window makes tool overhead and long histories easier to tolerate.

## Caching - Why Your Second Message Is Faster

If you have used a coding agent, you have probably noticed the first message is slower than later ones. The main reason is caching at multiple layers.

### KV Cache: The Engine-Level Optimization

KV caching comes from how attention works. For each token at each layer, the model computes a **query** (Q), a **key** (K), and a **value** (V). Attention uses dot products between queries and keys, then uses the result as weights over values.

Without caching, each new token would require recomputing K and V for all previous tokens. For a sequence of length $N$, total work for K/V recomputation grows like $1 + 2 + \cdots + N = \frac{N(N+1)}{2}$.

The **KV cache** stores K and V for previous tokens. When generating the next token, the model computes K and V for the new token and reuses cached K/V for earlier tokens.

This is why you see two speeds. The **time to first token** is slow because the model processes the full prompt in one pass. After that, **subsequent tokens** can reuse the KV cache and stream faster.

### Prompt Caching: The Provider-Level Optimization

Coding agents have large shared prefixes between requests. The system prompt and tool definitions stay the same. Conversation history up to the new user message stays the same.

**Prompt caching** (prefix caching) takes advantage of this. Some providers cache computed results for prompt prefixes. If two requests share the same prefix, the provider can reuse work from the previous request. OpenAI's Responses API provides this for free, whereas you have to pay Anthropic for this privilege.

This can reduce latency and cost for repeated prefixes.


### Application-Level Caching

The third layer of caching happens in the harness. If the agent reads a file and later needs it again, the harness can reuse the previous content if the file did not change. This avoids repeated tool calls and repeated context window usage.

Harnesses can also cache directory listings, search results, and build outputs. Some keep a summarised project context across sessions.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">KV Cache: Generating Token by Token</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 0.5rem;">Text generation happens one token at a time. Attention needs to look back over earlier tokens. The grid below is a toy attention matrix (row = current token, column = earlier token). Click Next token and compare the work.</p>
<div id="demo9-grid-container" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem;">
  <!-- No cache side -->
  <div>
    <div style="font-weight:600;font-size:0.9rem;color:#d97706;margin-bottom:0.5rem;text-align:center;">Without KV Cache</div>
    <p style="font-size:0.78rem;color:#888;margin:0 0 8px 0;text-align:center;">Recomputes K/V for the full sequence. Highlighted cells show work for this step.</p>
    <div id="demo9-grid-no" style="display:inline-grid;gap:2px;width:100%;"></div>
    <div id="demo9-no-stats" style="font-size:0.8rem;color:#d97706;margin-top:6px;text-align:center;min-height:1.2em;"></div>
  </div>
  <!-- Cache side -->
  <div>
    <div style="font-weight:600;font-size:0.9rem;color:#16a34a;margin-bottom:0.5rem;text-align:center;">With KV Cache</div>
    <p style="font-size:0.78rem;color:#888;margin:0 0 8px 0;text-align:center;">Stores old K/V. Only the new row is computed.</p>
    <div id="demo9-grid-yes" style="display:inline-grid;gap:2px;width:100%;"></div>
    <div id="demo9-yes-stats" style="font-size:0.8rem;color:#16a34a;margin-top:6px;text-align:center;min-height:1.2em;"></div>
  </div>
</div>
<div style="display:flex;gap:10px;justify-content:center;margin-top:1rem;align-items:center;">
  <button id="demo9-step" onclick="demo9Step()" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:5px;cursor:pointer;font-family:inherit;font-size:0.85rem;">Next token</button>
  <button onclick="demo9FullReset()" style="padding:8px 16px;background:#fff;color:#666;border:1px solid #ccc;border-radius:5px;cursor:pointer;font-family:inherit;font-size:0.85rem;">Reset</button>
  <span id="demo9-token-label" style="font-size:0.85rem;color:#999;">Token 0 / 6</span>
</div>
<!-- Prompt Cache demo below -->
<div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #e0e0e0;">
<h4 style="margin-top:0;font-size:1rem;">Prompt Caching: Reusing the Prefix</h4>
<p style="font-size:0.85rem;color:#666;margin-bottom:1rem;">Agent requests share a big prefix (system prompt, tool definitions, and history). Some providers cache work for that prefix, so later requests can skip it.</p>
<div style="display:flex;flex-direction:column;gap:1rem;max-width:600px;margin:0 auto;">
  <div>
    <div style="font-size:0.78rem;color:#999;margin-bottom:3px;">Request 1 — cold start</div>
    <div style="display:flex;height:32px;border-radius:5px;overflow:hidden;border:1px solid #ccc;">
      <div id="demo9-r1-sys" style="flex:3;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#6b7280;border-right:1px solid #ccc;transition:background 0.3s;">System Prompt (3K)</div>
      <div id="demo9-r1-tools" style="flex:5;background:#ede9fe;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#7c3aed;border-right:1px solid #ccc;transition:background 0.3s;">Tool Definitions (5K)</div>
      <div id="demo9-r1-msg" style="flex:0.5;background:#fff7ed;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:#ea580c;transition:background 0.3s;">hi</div>
    </div>
    <div id="demo9-r1-stat" style="font-size:0.75rem;color:#888;margin-top:3px;min-height:1.2em;"></div>
  </div>
  <div>
    <div style="font-size:0.78rem;color:#999;margin-bottom:3px;">Request 2 — cached prefix</div>
    <div style="display:flex;height:32px;border-radius:5px;overflow:hidden;border:1px solid #ccc;">
      <div id="demo9-r2-sys" style="flex:3;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#aaa;border-right:1px solid #ddd;transition:background 0.3s;">System (cached)</div>
      <div id="demo9-r2-tools" style="flex:5;background:#f5f3ff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#a5b4fc;border-right:1px solid #ddd;transition:background 0.3s;">Tools (cached)</div>
      <div id="demo9-r2-msg" style="flex:0.7;background:#fff7ed;display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#ea580c;transition:background 0.3s;">fix bug</div>
    </div>
    <div id="demo9-r2-stat" style="font-size:0.75rem;color:#888;margin-top:3px;min-height:1.2em;"></div>
  </div>
  <div style="text-align:center;">
    <button onclick="demo9PromptAnim()" style="padding:7px 18px;background:#7c3aed;color:#fff;border:none;border-radius:5px;cursor:pointer;font-family:inherit;font-size:0.8rem;">Animate</button>
  </div>
</div>
</div>
</div>

<script>
(function(){
  var tokens = ["The","cat","sat","on","the","mat"];
  var N = tokens.length;
  var step = 0;
  var totalNo = 0, totalYes = 0;

  function updateLayout() {
    var container = document.getElementById("demo9-grid-container");
    if (!container) return;
    container.style.gridTemplateColumns = window.innerWidth < 560 ? "1fr" : "1fr 1fr";
  }

  function buildGrid(id, n) {
    var g = document.getElementById(id);
    var labelW = window.innerWidth < 560 ? "30px" : "40px";
    g.style.gridTemplateColumns = labelW + " " + "1fr ".repeat(n);
    g.innerHTML = "";
    // header row
    var corner = document.createElement("div");
    corner.style.cssText = "font-size:0.65rem;color:#aaa;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;";
    corner.innerHTML = '<span style="transform:rotate(-30deg);display:inline-block;font-size:0.6rem;">Q \\ K</span>';
    g.appendChild(corner);
    for (var j = 0; j < n; j++) {
      var h = document.createElement("div");
      h.style.cssText = "font-size:0.65rem;color:#666;text-align:center;padding:2px 0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
      h.textContent = tokens[j];
      g.appendChild(h);
    }
    // rows
    for (var i = 0; i < n; i++) {
      var lbl = document.createElement("div");
      lbl.style.cssText = "font-size:0.65rem;color:#666;display:flex;align-items:center;justify-content:flex-end;padding-right:4px;font-weight:600;";
      lbl.textContent = tokens[i];
      g.appendChild(lbl);
      for (var j = 0; j < n; j++) {
        var cell = document.createElement("div");
        cell.id = id + "-" + i + "-" + j;
        cell.style.cssText = "aspect-ratio:1;border-radius:3px;background:#f0f0f0;transition:all 0.3s ease;min-height:20px;";
        if (j > i) { cell.style.background = "#fafafa"; cell.style.opacity = "0.3"; } // causal mask
        g.appendChild(cell);
      }
    }
  }

  function resetGrids() {
    buildGrid("demo9-grid-no", N);
    buildGrid("demo9-grid-yes", N);
    step = 0; totalNo = 0; totalYes = 0;
    document.getElementById("demo9-no-stats").textContent = "";
    document.getElementById("demo9-yes-stats").textContent = "";
    document.getElementById("demo9-token-label").textContent = "Token 0 / " + N;
    document.getElementById("demo9-step").disabled = false;
    document.getElementById("demo9-step").style.opacity = "1";
  }

  window.demo9Step = function() {
    if (step >= N) return;
    var i = step;

    // --- No cache: highlight entire triangle up to row i (recompute all) ---
    // First dim everything
    for (var r = 0; r < N; r++) {
      for (var c = 0; c <= r && c < N; c++) {
        var cell = document.getElementById("demo9-grid-no-" + r + "-" + c);
        if (r < i) { cell.style.background = "#e5e7eb"; cell.style.boxShadow = "none"; }
      }
    }
    // Now highlight row i and all columns it recomputes
    var noWork = 0;
    for (var c = 0; c <= i; c++) {
      var cell = document.getElementById("demo9-grid-no-" + i + "-" + c);
      cell.style.background = "#fbbf24";
      cell.style.boxShadow = "0 0 6px #fbbf2466";
      noWork++;
    }
    // Also re-highlight all previous rows as recomputed (the whole point - without cache you redo them)
    for (var r = 0; r < i; r++) {
      for (var c = 0; c <= r; c++) {
        var cell = document.getElementById("demo9-grid-no-" + r + "-" + c);
        cell.style.background = "#fde68a";
        cell.style.boxShadow = "none";
        noWork++;
      }
    }
    totalNo += noWork;
    document.getElementById("demo9-no-stats").innerHTML = "Step " + (i+1) + ": <strong>" + noWork + " cells</strong> (total: " + totalNo + ")";

    // --- With cache: only highlight row i, previous rows are gray (cached) ---
    for (var r = 0; r < i; r++) {
      for (var c = 0; c <= r; c++) {
        var cell = document.getElementById("demo9-grid-yes-" + r + "-" + c);
        cell.style.background = "#d1d5db";
        cell.style.boxShadow = "none";
      }
    }
    var yesWork = 0;
    for (var c = 0; c <= i; c++) {
      var cell = document.getElementById("demo9-grid-yes-" + i + "-" + c);
      if (c < i) {
        cell.style.background = "#86efac";
        cell.style.boxShadow = "none";
      } else {
        cell.style.background = "#22c55e";
        cell.style.boxShadow = "0 0 6px #22c55e66";
      }
      yesWork++;
    }
    totalYes += yesWork;
    document.getElementById("demo9-yes-stats").innerHTML = "Step " + (i+1) + ": <strong>" + yesWork + " cells</strong> (" + 1 + " new row, total: " + totalYes + ")";

    step++;
    document.getElementById("demo9-token-label").textContent = "Token " + step + " / " + N;
    if (step >= N) {
      document.getElementById("demo9-step").disabled = true;
      document.getElementById("demo9-step").style.opacity = "0.4";
      document.getElementById("demo9-no-stats").innerHTML += '<br><span style="color:#b45309;">Total without cache: ' + totalNo + ' computations</span>';
      document.getElementById("demo9-yes-stats").innerHTML += '<br><span style="color:#16a34a;">Total with cache: ' + totalYes + ' (saved ' + (totalNo - totalYes) + ')</span>';
    }
  };

  window.demo9FullReset = function() { resetGrids(); };

  // Prompt cache animation
  window.demo9PromptAnim = function() {
    var ids1 = ["demo9-r1-sys","demo9-r1-tools","demo9-r1-msg"];
    var ids2 = ["demo9-r2-sys","demo9-r2-tools","demo9-r2-msg"];
    document.getElementById("demo9-r1-stat").textContent = "";
    document.getElementById("demo9-r2-stat").textContent = "";
    ids1.concat(ids2).forEach(function(id){ document.getElementById(id).style.boxShadow = "none"; });

    // Request 1: light up each segment
    setTimeout(function(){ document.getElementById(ids1[0]).style.boxShadow = "inset 0 0 20px rgba(234,88,12,0.25)"; }, 0);
    setTimeout(function(){ document.getElementById(ids1[0]).style.boxShadow = "none"; document.getElementById(ids1[1]).style.boxShadow = "inset 0 0 20px rgba(124,58,237,0.25)"; }, 500);
    setTimeout(function(){ document.getElementById(ids1[1]).style.boxShadow = "none"; document.getElementById(ids1[2]).style.boxShadow = "inset 0 0 20px rgba(234,88,12,0.4)"; }, 1100);
    setTimeout(function(){ document.getElementById(ids1[2]).style.boxShadow = "none"; document.getElementById("demo9-r1-stat").innerHTML = '850ms &middot; $0.0030 &middot; <span style="color:#d97706;">8,010 tokens</span>'; }, 1400);

    // Request 2: only message lights up
    setTimeout(function(){ document.getElementById(ids2[2]).style.boxShadow = "inset 0 0 20px rgba(234,88,12,0.4)"; }, 2000);
    setTimeout(function(){
      document.getElementById(ids2[2]).style.boxShadow = "none";
      document.getElementById("demo9-r2-stat").innerHTML = '120ms &middot; $0.0016 &middot; <span style="color:#16a34a;">8,000 cached + 15 new</span>';
    }, 2400);
  };

  function initDemo9() {
    updateLayout();
    resetGrids();
    var demo9ResizeTimer;
    window.addEventListener("resize", function() {
      clearTimeout(demo9ResizeTimer);
      demo9ResizeTimer = setTimeout(function() { updateLayout(); resetGrids(); }, 150);
    });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initDemo9); }
  else { initDemo9(); }
})();
</script>

Caching makes coding agents feel fast even when the underlying model is expensive to run. The KV cache speeds up token generation after the initial prefill. Prompt caching speeds up repeated prefixes. Application-level caching reduces how much content the app sends.

## Reasoning Tokens — Thinking Before Answering

When a problem is hard, people usually pause and think before acting. Models can do a similar thing when you give them space to generate intermediate tokens before writing the final answer. This affects hard tasks more than easy ones.

**Chain-of-thought** prompting was an early version of this idea.<label for="sn-cot" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-cot" class="sidenote-toggle" /><span class="sidenote">Wei, J., Wang, X., Schuurmans, D., et al. "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *NeurIPS*, 2022.</span> If you ask a model to "think step by step," accuracy often improves on tasks like math and multi-step code analysis. The model uses the intermediate text as scratch space, and later steps can attend to earlier steps.

**Extended thinking** or **reasoning tokens** take this further. The model gets a dedicated thinking phase where it generates tokens that may be hidden from the user. These tokens are internal working memory. The model can explore approaches, compare tradeoffs, catch mistakes, and form a plan before writing the visible response.

This matters for coding tasks. "Rename the variable `x` to `userName`" is straightforward. "Refactor this auth system to support OAuth2 alongside the existing JWT flow" requires reading code, mapping dependencies, planning changes, and coordinating edits across files.

There is a tradeoff. Reasoning tokens use context window space. They also cost money and add latency, since the model generates them before the visible output. For small edits, a long reasoning trace is overhead. For a large refactor, it can help.

This ties back to the agent loop. At each step, the model chooses actions like searching, reading files, editing, running tests, or asking a question. Better decisions early reduce wasted work later.

If you go back to the context window demo above and click "Extended Thinking (+8K)" a few times, you can see the tradeoff. On a 32K context window, two rounds of extended thinking use about half the window. On a 128K window, the same thinking uses about 12%.

## Harnesses, Tooling, and the Ecosystem

Many coding agents use the same underlying model. The experience changes because the harness changes.

The harness is the system prompt, the tool set, the agent loop, permissions, UI, and safety checks.

You can see this in current tools. Claude Code is terminal-first and can run commands and read/write files. Cursor is an IDE and use editor context like the current file and selection. GitHub Copilot used o focus on inline completions as you typed.

These differences come from different choices about how humans and tools work together.

The **system prompt** sets how an agent behaves. It can include constraints, tool usage rules, and output format. Different products ship different prompts. That changes how the same base model behaves.

Tools are what let an agent read files, run commands, search code, and edit code. Tool quality matters. Error handling, permissions, and how results are returned all affect outcomes.

Permissions and sandboxing are harness responsibilities. A coding agent with filesystem access can delete files or run destructive commands. Most harnesses limit access, require approval for risky actions, and log what the agent does. The harness is the boundary between model output and your machine. I personally live in the `--yolo` world, so I don't really care about this.

## Stayin' Grounded

Coding agents can look like they understand a codebase. They can read files, make changes, run tests, fix failures, and produce working code. Under the hood, the model is still doing next-token prediction. Being clear about that helps you decide when to trust outputs and when to verify.<label for="sn-emperor" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-emperor" class="sidenote-toggle" /><span class="sidenote">See Mihail Eric's ["The Emperor Has No Clothes"](https://www.mihaileric.com/The-Emperor-Has-No-Clothes/).</span>

### Models Predict, They Do Not Understand

Large language models predict the next token. With enough data and scale, the output often looks like expert writing. The internal process is pattern prediction, not a human-style mental model. Although, this then becomes a philosophical question of what the human-style mental model itself is.

This matters when you hit something new or under-documented. A model can struggle when the right solution is not common in its training data, even if the fix is simple once you understand the system. You can also prevent some of this by giving it a way to research and test different hypotheses and collaborate with other agents.

### Context Window Degradation

Even with large context windows, attention is not uniform. "Lost in the middle" results show that models often use the start and end of the context more than the middle.<label for="sn-lost" class="sidenote-toggle sidenote-number"></label><input type="checkbox" id="sn-lost" class="sidenote-toggle" /><span class="sidenote">Liu, N.F., Lin, K., Hewitt, J., et al. "Lost in the Middle: How Language Models Use Long Contexts." *TACL*, 2024.</span> If an important detail sits in the middle of a long history, the model can miss it.

This can happen even when nothing was truncated. The text is still present, but it is harder for the model to use. If a detail matters, repeat it near the current request.

The practical skill is knowing when to give more context, when to let the agent run, and when to step in.

Understanding the loop, tools, caching, context limits, and reasoning helps you use agents better. You can keep prompts short, re-state key details when needed, and stop the agent when it starts thrashing.

---

## Epilogue: It Is All Matrix Multiplication

Every breakthrough, every billion-dollar model, every coding agent that can navigate a codebase and fix bugs while you get coffee — reduces to the same operation your graphics card has been doing since the 1990s: **matrix multiplication**.

Attention uses matrix multiplications. The feed-forward network uses matrix multiplications. The final projection that produces logits over the vocabulary is another matrix multiplication. You can write the basic shape as:

$$Y = f(XW + b)$$

Multiply inputs by weights, add a bias, apply a non-linearity, and repeat many times. The behaviour comes from the learned weights. Training adjusts those weights with gradient descent.

We did not discover the secret of intelligence. We discovered that if you multiply enough matrices together, with enough data, on enough hardware, the result behaves *as if* it understands. The distinction between "understands" and "behaves as if it understands" is one of the great unresolved questions of our time, and we are not going to settle it here.

What we *can* say is this: fifty years from now, when whatever comes after transformers has long since made our current models look like pocket calculators, someone will look back at this era and marvel. They will marvel that we took the entirety of human written knowledge, compressed it into a few terabytes of matrix weights through an optimization procedure we do not fully understand, wrapped it in a while loop with some JSON parsing, and called it an "agent." They will marvel that it worked at all. And they will marvel, most of all, that the thing powering the most sophisticated code generation systems ever built was, at the end of the day, the same operation a nineteen-year-old learns in week three of linear algebra.

We curve-fit the world. And somehow, it worked.
