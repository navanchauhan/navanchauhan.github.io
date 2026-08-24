---
date: 2026-08-19 11:03
description: How computer use, browser use, and a chief-of-staff agent let me delegate work across remote machines without worrying about how it gets done.
tags: AI, Automation, Computer Use, Browser Use
---

# On Computer Use

Over the past few months, I have minimized the time I spend inside a coding agent interface unless it is for very specific reasons. Instead, I have been talking to my chief-of-staff agent, "Jeff," to work. This ranges from requests related to $DAYJOB (working on projects, brainstorming ideas, running benchmarks) to benign requests while I am driving, like checking whether there are any spots available for a tour on recreation.gov, without even needing to take my eyes off the road.

If one of the initial tenets was to stop looking at code, the next step in this process is to build systems for yourself that let you not look at computer screens unless you need help visualizing things (or it is faster for you to see and read something than to listen).

Before we dig deeper into why I love it now and how it works, we need to define our terminology. What I am going to be calling computer use encompasses both browser use (by way of an extension that lets you interact with the DOM, network traffic, etc.) and computer use by way of looking at accessibility trees and taking screenshots. So, basically, interacting with a computer in any way or form a human would, and then some, by relying on agents. For this post, computer use means giving an agent access to a computing environment and all of my credentials (more on this later).

This post is itself kind of meta, since the first draft I made was done entirely while using ChatGPT's new real-time voice mode. Jeff has superseded the app now, but back then I was packing my apartment: I had my AirPods on and the app connected to my remote Windows box, and it was going through old conversations, recovering context, and helping me queue up work. Heck, I even use voice mode while driving sometimes to check on my work and queue up more things. I don't have to wait until I get to my laptop; I can simply remote into my boxes, give them a task, and wait until I get to them.

Computer use for me is getting work done without having to worry about how the work gets done. Is it calling an API? Is it taking screenshots and clicking around? Does it matter? It got the job done. I haven't reached the optimization stage yet, where I want everything to be done faster and faster.

I already had a Windows box that I usually use through RDP. It is stored in a server rack somewhere in the suburban Bay Area (which means it has a residential IP!). I could never get the bundled computer use and browser use with the Codex app working on my setup, so I instead installed open-browser-use and open-computer-use. Now I have a remote Linux box too, with a full desktop.

The only thing that I am really missing out on is iMessage. That might be the only reason why you would want a Mac mini over a Windows or Linux box. There is nothing really special about macOS's accessibility approach that computer use exploits.

Computer use has made machines delegable. I was watching something on my media centre and I realised that the transcoding was terrible. But I also had my Windows box, with a GPU I could move the transcoding to. Instead of having to figure out how to set up remote transcoding, all I had to do was ask to offload transcoding from my poor old Xeon CPU to my Winbox. Ask and ye shall receive.

You are probably sold on the idea that these agents can do DevOps-y/infrastructure-y things pretty well; that is nothing new at all. What is new is the mode where you aren't even directly firing up Claude Code / Codex in these boxes, but instead using one central control plane / CoS agent that can figure out which box to connect to and delegate these tasks.

Computer use by itself can work with browsers, but having a browser-specific extension unlocks superpowers. It gives you a much more fine-grained surface area to do more. Since my browser is already logged in with my credentials, I don't have to do the boring work. I was setting up a Google Workspace CLI, and I was like, I don't want to go through the Google Cloud project, activate APIs, and do all the boring setup work. So I instead just told the agent to go ahead and set it up, and to control the browser to do whatever it needed to do. Or, when I was working on a Slack app, why would I click through and reinstall the app? Just go ahead and do it, man. "Why am I doing this?" is a question you have to ask yourself, and if there is no satisfactory answer, you gotta delegate it to agents. I have talked in my previous posts about building the software factory and building better validators, but this is exactly the same thing. You are giving agents tools so they can look and do even more.

I also understand the risk I am taking here by giving these models access to everything. I am okay with the tradeoff for now, but with open-weight models getting super good, this won't be a tradeoff I have to make for super long. Then the only tradeoff that remains is whether I am fine with the agents accidentally deleting everything.

The important shift with this is that I am getting lazier: I don't care how something gets done, as long as it gets done. The interface is the outcome. Whatever works best, works best.

The conversation/chief-of-staff agent is your control plane. Your "cloud" agent is the execution plane. I don't want agents to come back to ask how to do their job. They should come back when the job is done, or when I am the only person who can make the next decision. All these Mac minis that people bought for OpenClaw and that are now gathering dust were just a bit too soon. Computer use has gotten so much better since then that you can actually make these agents do whatever they need to. That said, a fresh VM with no accounts, applications, or persistent state is not much of a personal assistant. The useful environment needs to be provisioned first.

Give computer use a try again. The limitation for me personally is becoming that I am not creative enough; I am banging my head against a wall where I don't know what I cannot do now. The best interface might just be a conversation, and the most convincing demo might just be as ordinary as a movie that stops buffering without you needing to pull up your laptop.

We are all going to standardize onto something at some point. But if you want a taste of something similar to Jeff: get yourself a $20 ChatGPT subscription, set up Codex with Computer Use and Browser Use, and add your phone as a remote control. I am personally against vendor lock-in, but this is the easiest way for someone to try things without needing to go through the hoopla of setting everything up.

Since you also probably expect me to have some fun visualisations:

[open-browser-use](https://github.com/iFurySt/open-browser-use) is a Chrome MV3 extension, a Go native host, and a local client route.

<noscript>
  <style>.computer-use-js-visual { display: none !important; }</style>
  <figure style="margin: 2rem 0;">
    <img src="/assets/posts/on-computer-use/browser-use-route.svg" alt="Static diagram of the open-browser-use route from SDK, CLI, or MCP through a local socket, Go native host, Chrome Native Messaging, the MV3 service worker, and Chrome APIs." style="display: block; width: 100%; height: auto;">
    <figcaption>Static view of the browser-use transport route.</figcaption>
  </figure>
</noscript>
<div id="browser-use-route" class="computer-use-js-visual" style="margin: 2rem 0; padding: 1.25rem; border: 1px solid #d8d0c4; border-radius: 8px; background: #fbf8f2;">
  <div id="browser-use-route-nodes" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.65rem; align-items: stretch;">
    <button type="button" data-route-node="0" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #1a5b74; border-radius: 6px; background: #e5f0f3; color: #263238; cursor: pointer; font: inherit;">
      <strong>SDK / CLI / MCP</strong><br><small>JSON-RPC request</small>
    </button>
    <div aria-hidden="true" style="align-self: center; text-align: center; color: #1a5b74; font-size: 1.3rem;">→</div>
    <button type="button" data-route-node="1" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>Local socket</strong><br><small>Unix socket + active.json</small>
    </button>
    <div aria-hidden="true" style="align-self: center; text-align: center; color: #1a5b74; font-size: 1.3rem;">→</div>
    <button type="button" data-route-node="2" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>Go native host</strong><br><small>4-byte length + JSON</small>
    </button>
    <div aria-hidden="true" style="align-self: center; text-align: center; color: #1a5b74; font-size: 1.3rem;">→</div>
    <button type="button" data-route-node="3" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>Native Messaging</strong><br><small>stdin/stdout frames</small>
    </button>
    <div aria-hidden="true" style="align-self: center; text-align: center; color: #1a5b74; font-size: 1.3rem;">→</div>
    <button type="button" data-route-node="4" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>MV3 service worker</strong><br><small>dispatch + session state</small>
    </button>
    <div aria-hidden="true" style="align-self: center; text-align: center; color: #1a5b74; font-size: 1.3rem;">→</div>
    <button type="button" data-route-node="5" style="min-height: 6.5rem; padding: 0.65rem 0.4rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>Chrome APIs</strong><br><small>tabs · debugger · history</small>
    </button>
  </div>
  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-top: 1rem;">
    <button type="button" id="browser-use-route-back" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: transparent; color: #1a5b74; cursor: pointer; font: inherit;">Back</button>
    <button type="button" id="browser-use-route-next" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: #1a5b74; color: #fff; cursor: pointer; font: inherit;">Next</button>
    <span id="browser-use-route-step" style="font-size: 0.86rem; color: #52636a;">Step 1 of 6</span>
  </div>
  <div id="browser-use-route-readout" aria-live="polite" style="margin-top: 0.8rem; color: #3f4648; font-size: 0.92rem; line-height: 1.5;">The SDK, CLI, or MCP server sends a Browser Use JSON-RPC request.</div>
</div>

[open-codex-computer-use](https://github.com/ifuryst/open-codex-computer-use) uses the same tool shape on all three systems. `get_app_state` returns a screenshot and an accessibility tree. The platform runtime then uses the tree for semantic actions and the screenshot for visual coordinates.

<noscript>
  <figure style="margin: 2rem 0;">
    <img src="/assets/posts/on-computer-use/computer-use-platforms.svg" alt="Static comparison of Windows UI Automation and System.Drawing, Linux AT-SPI2 and GDK, and macOS AXUIElement and ScreenCaptureKit." style="display: block; width: 100%; height: auto;">
    <figcaption>Static comparison of the Windows, Linux, and macOS runtimes.</figcaption>
  </figure>
</noscript>
<div id="computer-use-platforms" class="computer-use-js-visual" style="margin: 2rem 0; padding: 1.25rem; border: 1px solid #d8d0c4; border-radius: 8px; background: #fbf8f2;">
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;">
    <button type="button" data-platform-card="windows" style="text-align: left; padding: 0.9rem; border: 2px solid #1a5b74; border-radius: 6px; background: #e5f0f3; color: #263238; cursor: pointer; font: inherit;">
      <strong>Windows</strong><br>
      <small>Tree: UIAutomationClient</small><br>
      <small>Image: CopyFromScreen → PNG</small><br>
      <small>Input: InvokePattern / WM_*</small>
    </button>
    <button type="button" data-platform-card="linux" style="text-align: left; padding: 0.9rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>Linux</strong><br>
      <small>Tree: AT-SPI2 / Atspi</small><br>
      <small>Image: GDK → PNG</small><br>
      <small>Input: generate_*_event</small>
    </button>
    <button type="button" data-platform-card="macos" style="text-align: left; padding: 0.9rem; border: 2px solid #d8d0c4; border-radius: 6px; background: #f2eadf; color: #263238; cursor: pointer; font: inherit;">
      <strong>macOS</strong><br>
      <small>Tree: AXUIElement</small><br>
      <small>Image: CGWindow + ScreenCaptureKit</small><br>
      <small>Input: AX action / CGEvent</small>
    </button>
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; align-items: center; margin-top: 1rem; text-align: center; font-size: 0.86rem;">
    <div style="padding: 0.65rem; border: 1px solid #d8d0c4; background: #fff; border-radius: 5px;">get_app_state</div>
    <div aria-hidden="true" style="color: #1a5b74; font-size: 1.3rem;">→</div>
    <div style="padding: 0.65rem; border: 1px solid #d8d0c4; background: #fff; border-radius: 5px;">screenshot + accessibility tree</div>
  </div>
  <div id="computer-use-platform-readout" aria-live="polite" style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid #d8d0c4; color: #3f4648; font-size: 0.92rem; line-height: 1.5;">Windows uses UI Automation to find the process window, enumerate supported patterns, and serialise names, roles, actions, and bounds. It captures those bounds with System.Drawing.CopyFromScreen, then prefers InvokePattern, ValuePattern, and ScrollPattern before using Win32 messages.</div>
</div>

The screenshot and the tree solve different problems. The screenshot gives visual coordinates, while the tree gives semantic metadata such as `role`, `name`, `frame`, `value`, and supported actions. The runtime can therefore click `element_index=7` without guessing from pixels. It falls back to coordinates when the application does not expose a useful accessibility node.

The runtime prefers an element index when the tree has one, but it can also act at screenshot coordinates.

<noscript>
  <figure style="margin: 2rem 0;">
    <img src="/assets/posts/on-computer-use/computer-use-actions.svg" alt="Static diagram showing a computer-use click mapped from accessibility-tree element index 7 to an application target and an Invoke, AXPress, or doAction event." style="display: block; width: 100%; height: auto;">
    <figcaption>Static example of a semantic computer-use click.</figcaption>
  </figure>
</noscript>
<div id="computer-use-actions" class="computer-use-js-visual" style="margin: 2rem 0; padding: 1.25rem; border: 1px solid #d8d0c4; border-radius: 8px; background: #fbf8f2;">
  <div role="tablist" aria-label="Select a computer use action" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
    <button type="button" data-action="click" aria-selected="true" aria-pressed="true" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: #1a5b74; color: #fff; cursor: pointer; font: inherit;">click</button>
    <button type="button" data-action="drag" aria-selected="false" aria-pressed="false" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: transparent; color: #1a5b74; cursor: pointer; font: inherit;">drag</button>
    <button type="button" data-action="scroll" aria-selected="false" aria-pressed="false" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: transparent; color: #1a5b74; cursor: pointer; font: inherit;">scroll</button>
    <button type="button" data-action="type_text" aria-selected="false" aria-pressed="false" style="padding: 0.4rem 0.7rem; border: 1px solid #1a5b74; border-radius: 4px; background: transparent; color: #1a5b74; cursor: pointer; font: inherit;">type_text</button>
  </div>
  <svg id="computer-use-action-diagram" role="img" aria-labelledby="computer-use-action-title computer-use-action-desc" viewBox="0 0 720 300" width="100%" style="display: block; max-width: 720px; margin: 0 auto; font-family: 'PT Sans', Helvetica, Arial, sans-serif;">
    <title id="computer-use-action-title">Computer use screenshot and accessibility tree action</title>
    <desc id="computer-use-action-desc">A mock app window contains a visual target and a matching accessibility tree record. The selected action shows how a tool call becomes input.</desc>
    <g id="computer-use-action-app">
      <rect x="25" y="25" width="420" height="250" rx="7" fill="#fff" stroke="#d8d0c4"></rect>
      <rect x="25" y="25" width="420" height="30" rx="7" fill="#e5f0f3"></rect>
      <circle cx="47" cy="40" r="5" fill="#c27b32"></circle><circle cx="65" cy="40" r="5" fill="#d8d0c4"></circle><circle cx="83" cy="40" r="5" fill="#d8d0c4"></circle>
      <text x="105" y="45" fill="#52636a" font-size="13">target app screenshot</text>
      <rect x="65" y="90" width="330" height="55" rx="5" fill="#f2eadf" stroke="#d8d0c4"></rect>
      <text x="85" y="122" fill="#263238" font-size="15">Settings</text>
      <rect id="computer-use-action-target" x="250" y="105" width="110" height="28" rx="4" fill="#1a5b74"></rect>
      <text id="computer-use-action-target-text" x="305" y="124" text-anchor="middle" fill="#fff" font-size="13">Save</text>
      <path id="computer-use-action-path" d="M 120 210 L 310 119" fill="none" stroke="#c27b32" stroke-width="3" stroke-dasharray="6 5" opacity="0"></path>
      <circle id="computer-use-action-cursor" cx="310" cy="119" r="9" fill="#c27b32" stroke="#fff" stroke-width="2"></circle>
    </g>

    <g id="computer-use-action-tree">
      <rect x="480" y="25" width="215" height="250" rx="7" fill="#f2eadf" stroke="#d8d0c4"></rect>
      <text x="500" y="52" fill="#263238" font-size="15" font-weight="bold">accessibility tree</text>
      <text x="500" y="83" fill="#52636a" font-size="13">index 7</text>
      <text id="computer-use-action-role" x="500" y="108" fill="#263238" font-size="14">role: button</text>
      <text id="computer-use-action-name" x="500" y="132" fill="#263238" font-size="14">name: Save</text>
      <text id="computer-use-action-frame" x="500" y="156" fill="#52636a" font-size="12">frame: x=225 y=80 w=110 h=28</text>
      <text id="computer-use-action-event" x="500" y="210" fill="#1a5b74" font-size="13">AX / UIA / AT-SPI action</text>
      <text id="computer-use-action-result" x="500" y="235" fill="#52636a" font-size="12">fresh snapshot after action</text>
    </g>
  </svg>
  <div id="computer-use-action-readout" aria-live="polite" style="margin-top: 0.8rem; color: #3f4648; font-size: 0.92rem; line-height: 1.5;">click: prefer element_index=7. If the tree cannot identify the target, use x/y screenshot coordinates.</div>
</div>

The final step is an event translation. A semantic click becomes an accessibility action when the target supports one, or a coordinate click becomes OS input. A drag is not a single event: the runtime sends button-down, interpolated motion points, and button-up. After this event, a new application state is collected because the old screenshot and tree can now be stale.

<style>
#computer-use-action-diagram { height: auto; }
#browser-use-route-nodes > button {
  position: relative;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 0.78rem !important;
  line-height: 1.25 !important;
  text-align: center;
}
#browser-use-route-nodes > button:not(:last-of-type)::after {
  content: "→";
  position: absolute;
  right: -0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #1a5b74;
  font-size: 1.1rem;
  line-height: 1;
  pointer-events: none;
}
#browser-use-route-nodes > button small {
  font-size: 0.78em;
}
#browser-use-route-nodes > div {
  display: none;
}

@media (max-width: 42rem) {
  #browser-use-route-nodes { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  #browser-use-route-nodes > button::after { display: none; }
  #computer-use-platforms > div:first-child { grid-template-columns: 1fr !important; }
  #computer-use-platforms > div:nth-child(2) { grid-template-columns: 1fr !important; }
  #computer-use-actions svg { min-height: 16rem; }
}
</style>

<script>
(function () {
  function setButtonState(button, selected) {
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-pressed", String(selected));
    button.style.background = selected ? "#1a5b74" : "transparent";
    button.style.color = selected ? "#fff" : "#1a5b74";
  }

  var route = document.getElementById("browser-use-route");
  if (route) {
    var routeNodes = route.querySelectorAll("[data-route-node]");
    var routeStep = document.getElementById("browser-use-route-step");
    var routeReadout = document.getElementById("browser-use-route-readout");
    var routeMessages = [
        "Example payload: {jsonrpc: 2.0, id: 7, method: getTabs, params: {}}. The SDK writes the request to the client socket.",
        "The client opens a Unix-domain socket. active.json records socketPath, PID, and start time so the CLI can discover the active host.",
        "The Go host reads a 4-byte native-endian uint32 length, then reads exactly that many JSON bytes. It forwards the request and response.",
        "Chrome starts the host from the Native Messaging manifest. stdin and stdout carry the same length-prefixed UTF-8 JSON frame format.",
        "The MV3 service worker dispatches the RPC, calls connectNative(), and keeps browser session state while requests are in flight.",
        "The extension acts on the real Chrome profile through tabs, debugger, history, downloads, storage, and tabGroups. Permissions define the boundary."
    ];
    var routeIndex = 0;

    function renderRoute() {
      routeNodes.forEach(function (node) {
        var selected = Number(node.getAttribute("data-route-node")) === routeIndex;
        node.style.borderColor = selected ? "#c27b32" : "#d8d0c4";
        node.style.background = selected ? "#fff0dc" : "#f2eadf";
        node.style.transform = selected ? "translateY(-2px)" : "none";
      });
      routeStep.textContent = "Step " + (routeIndex + 1) + " of " + routeMessages.length;
      routeReadout.textContent = routeMessages[routeIndex];
    }

    routeNodes.forEach(function (node) {
      node.addEventListener("click", function () {
        routeIndex = Number(node.getAttribute("data-route-node"));
        renderRoute();
      });
    });
    document.getElementById("browser-use-route-back").addEventListener("click", function () {
      routeIndex = (routeIndex + routeMessages.length - 1) % routeMessages.length;
      renderRoute();
    });
    document.getElementById("browser-use-route-next").addEventListener("click", function () {
      routeIndex = (routeIndex + 1) % routeMessages.length;
      renderRoute();
    });
    renderRoute();
  }

  var platforms = document.getElementById("computer-use-platforms");
  if (platforms) {
    var platformReadout = document.getElementById("computer-use-platform-readout");
    var platformMessages = {
      windows: "Windows uses UI Automation to walk the window tree. It captures the window with System.Drawing and uses UI Automation patterns first, with Win32 PostMessage calls as a fallback.",
      linux: "Linux uses AT-SPI2 through PyGObject to walk the tree. It captures the window with GDK and uses Atspi.generate_mouse_event and Atspi.generate_keyboard_event for coordinate input.",
      macos: "macOS uses AXUIElement from ApplicationServices for the tree. It captures the selected window with ScreenCaptureKit after finding it through CGWindow data, then uses AX actions or CGEvent input."
    };
    platforms.querySelectorAll("[data-platform-card]").forEach(function (card) {
      card.addEventListener("click", function () {
        var key = card.getAttribute("data-platform-card");
        platformReadout.textContent = platformMessages[key];
        platforms.querySelectorAll("[data-platform-card]").forEach(function (other) {
          var selected = other === card;
          other.style.borderColor = selected ? "#c27b32" : "#d8d0c4";
          other.style.background = selected ? "#fff0dc" : "#f2eadf";
        });
      });
    });
  }

  var actions = document.getElementById("computer-use-actions");
  if (actions) {
    var actionReadout = document.getElementById("computer-use-action-readout");
    var actionTarget = document.getElementById("computer-use-action-target");
    var actionTargetText = document.getElementById("computer-use-action-target-text");
    var actionPath = document.getElementById("computer-use-action-path");
    var actionCursor = document.getElementById("computer-use-action-cursor");
    var actionRole = document.getElementById("computer-use-action-role");
    var actionName = document.getElementById("computer-use-action-name");
    var actionFrame = document.getElementById("computer-use-action-frame");
    var actionEvent = document.getElementById("computer-use-action-event");
    var actionResult = document.getElementById("computer-use-action-result");
    var actionDiagram = document.getElementById("computer-use-action-diagram");
    var actionApp = document.getElementById("computer-use-action-app");
    var actionTree = document.getElementById("computer-use-action-tree");

    function renderActionLayout() {
      var width = actionDiagram.clientWidth;
      if (!width && typeof actionDiagram.getBoundingClientRect === "function") {
        width = actionDiagram.getBoundingClientRect().width;
      }
      var narrow = width > 0
        ? width < 560
        : (typeof window !== "undefined" && window.innerWidth < 672);
      actionDiagram.setAttribute("viewBox", narrow ? "0 0 500 760" : "0 0 720 300");
      actionApp.setAttribute("transform", narrow ? "translate(10 10) scale(1.05)" : "none");
      actionTree.setAttribute("transform", narrow ? "translate(45 330) scale(1.4) translate(-480 0)" : "none");
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", renderActionLayout);
    }

    var actionData = {
      click: {
        readout: "click: send element_index=7 when the tree has a matching node. Otherwise send x/y in the screenshot coordinate space.",
        text: "Save",
        role: "role: button",
        name: "name: Save",
        frame: "frame: x=225 y=80 w=110 h=28",
        event: "Invoke / AXPress / doAction",
        result: "fresh snapshot after click",
        path: "M 120 210 L 310 119",
        cursor: [310, 119]
      },
      drag: {
        readout: "drag: send from_x/from_y and to_x/to_y. The runtime interpolates motion points, then emits press, motion, and release.",
        text: "slider",
        role: "role: slider",
        name: "name: Volume",
        frame: "frame: x=110 y=105 w=220 h=28",
        event: "button down → 12 motion steps → up",
        result: "fresh snapshot after drag",
        path: "M 125 119 L 340 119",
        cursor: [340, 119]
      },
      scroll: {
        readout: "scroll: use the tree's scroll action when available. Otherwise send x/y, direction, and pages as a coordinate event.",
        text: "list",
        role: "role: list",
        name: "name: Results",
        frame: "frame: x=75 y=80 w=320 h=150",
        event: "ScrollPattern / AX scroll / wheel",
        result: "fresh snapshot after scroll",
        path: "M 220 225 L 220 90",
        cursor: [220, 90]
      },
      type_text: {
        readout: "type_text: target the focused editable element. The runtime uses a value API when possible, then synthesizes keyboard text input.",
        text: "Search",
        role: "role: text field",
        name: "name: Search",
        frame: "frame: x=75 y=80 w=250 h=28",
        event: "ValuePattern / AXValue / key events",
        result: "fresh snapshot after typing",
        path: "M 125 119 L 190 119",
        cursor: [190, 119]
      }
    };

    function renderAction(key) {
      var data = actionData[key];
      if (!data) return;
      actionReadout.textContent = data.readout;
      actionTargetText.textContent = data.text;
      actionRole.textContent = data.role;
      actionName.textContent = data.name;
      actionFrame.textContent = data.frame;
      actionEvent.textContent = data.event;
      actionResult.textContent = data.result;
      actionPath.setAttribute("d", data.path);
      actionPath.setAttribute("opacity", key === "click" ? "0" : "1");
      actionCursor.setAttribute("cx", data.cursor[0]);
      actionCursor.setAttribute("cy", data.cursor[1]);
      actionTarget.setAttribute("fill", key === "type_text" ? "#c27b32" : "#1a5b74");
      actions.querySelectorAll("[data-action]").forEach(function (button) {
        setButtonState(button, button.getAttribute("data-action") === key);
      });
    }

    actions.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderAction(button.getAttribute("data-action"));
      });
    });
    renderActionLayout();
    renderAction("click");
  }
})();
</script>
