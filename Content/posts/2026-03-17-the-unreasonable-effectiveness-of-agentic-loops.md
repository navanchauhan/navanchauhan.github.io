---
date: 2026-03-17 12:34
description: Tokens. Tokens. Tokens.
tags: AI, Programming, Interactive
---

# The Unreasonable Effectiveness of Agentic Loops

<script src="https://d3js.org/d3.v7.min.js"></script>

<noscript>
  <div style="margin: 1.25rem 0; padding: 0.9rem 1rem; border: 1px solid #e0e0e0; border-left: 5px solid #ef4444; border-radius: 8px; background: #fff7ed; color: #111;">
    JavaScript is off (or blocked) in your browser, so the interactive demos on this page will not work.
  </div>
</noscript>

If you wrote code with ChatGPT in 2023, you probably know the drill. Copy the answer. Paste it into your editor. Run the build. Watch it explode. Copy the red text. Paste it back. Wait. Repeat.

After a few rounds it starts to feel dehumanising. You are not really programming any more. You are ferrying messages between a compiler and a chatbot. A USB cable with anxiety.

That is the whole trick behind coding agents. They cut out the courier. The agent reads the files, runs the command, sees the failure, edits the code, runs it again, and only then comes back to you. Same class of model. Better loop.

Control theory would shrug at this. Better feedback loops produce better behaviour. The weird part is what sits inside the loop: a next-token machine from the internet that, once you hand it `grep`, a shell, and a verifier, starts to look alarmingly useful.

## One Prompt, Two Worlds

Same prompt. Two very different situations. On the left, the model can only talk and wait for a human to ferry reality back into the conversation. On the right, the agent can touch the environment directly.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">One Prompt, Two Worlds</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Same intent. Two different loops. Press play and watch who finishes first.</p>
<div style="display: flex; gap: 1rem; flex-wrap: wrap;">
  <div style="flex: 1 1 300px; min-width: 280px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
      <strong>One-shot chatbot</strong>
      <span style="font-size: 0.85rem; color: #666;">Elapsed: <span id="tw-chatbot-timer">0.0s</span></span>
    </div>
    <div id="tw-chatbot-log" style="height: 300px; overflow-y: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px;"></div>
    <div id="tw-chatbot-status" style="margin-top: 0.4rem; font-size: 0.85rem; color: #666; min-height: 1.4em;"></div>
  </div>
  <div style="flex: 1 1 300px; min-width: 280px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
      <strong>Agent loop</strong>
      <span style="font-size: 0.85rem; color: #666;">Elapsed: <span id="tw-agent-timer">0.0s</span></span>
    </div>
    <div id="tw-agent-log" style="height: 300px; overflow-y: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px;"></div>
    <div id="tw-agent-status" style="margin-top: 0.4rem; font-size: 0.85rem; color: #666; min-height: 1.4em;"></div>
  </div>
</div>
<div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
  <button id="tw-play" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Play</button>
  <button id="tw-reset" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Reset</button>
</div>
</div>

A boring missing-prop bug is enough. A one-shot model can suggest the patch. An agent can run the test, see `undefined`, pass the missing prop, rerun, and stop on green. No magic. Just evidence.

The left-hand lane leaks information. Every time the human carries errors back into the chat, something gets delayed, compressed, or dropped. The right-hand lane stays wired into the environment. It can see what actually happened.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Context Decay</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">The chatbot's context has gaps where the human compressed or lost information. The agent's context stays continuous. Hover over the grey gaps to see what was lost.</p>
<div style="display: flex; flex-direction: column; gap: 1.2rem;">
  <div>
    <div style="font-size: 0.88rem; font-weight: 600; color: #d97706; margin-bottom: 0.4rem;">Chatbot context</div>
    <div id="ctx-chatbot-bar" style="display: flex; height: 32px; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0;"></div>
  </div>
  <div>
    <div style="font-size: 0.88rem; font-weight: 600; color: #059669; margin-bottom: 0.4rem;">Agent context</div>
    <div id="ctx-agent-bar" style="display: flex; height: 32px; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0;"></div>
  </div>
</div>
<div id="ctx-tooltip" style="margin-top: 0.8rem; min-height: 1.6em; color: #555; font-size: 0.92rem;"></div>
</div>

That is the first big idea in this post: once the loop can see reality, the whole thing changes.

## What an Agentic Loop Actually Is

By this point you have probably seen the pattern already. Codex, Claude Code, OpenCode, editor agent modes — same family. Give a model some tools, feed the results back in, let it keep going until the job looks done.

At heart, an agentic loop is simple. Observe. Decide. Act. Inspect. Update. Repeat.

Reasoning helps, sure. Sometimes a lot. But it is not the main event here. A brilliant model with no way to check itself still gropes around in the dark. A decent model with tools and feedback can punch far above its weight.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Observe, Act, Inspect, Repeat</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Switch pieces of the loop on and off. Watch how the trace changes.</p>
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
  <button id="seq-no-tools" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">No tools</button>
  <button id="seq-no-verifier" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Tools, no verifier</button>
  <button id="seq-full" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Tools + verifier</button>
</div>
<div id="seq-diagram" style="overflow-x: auto;"></div>
<div id="seq-caption" style="margin-top: 0.85rem; color: #555; font-size: 0.92rem;"></div>
</div>

Classic software tries to pin down inputs, outputs, and edge cases up front. Agentic loops loosen that up. The system can react to what it sees. The constraints move elsewhere: the user’s intent, the tools on hand, and the quality of feedback.

## The Harness Chooses the Game

People talk about agent comparisons as if they are model comparisons. Half the time they are harness comparisons.

The harness is all the boring but important stuff around the model: the prompt, the tool contract, the permissions, the cached context, the verifier, the approval flow, the stopping rule. Same model, different harness, different creature.

Give the model nothing but a chat box and the human becomes the harness. The human ferries errors, judges risk, and decides when the job is done. Give the model a repo, a shell, a verifier, and one clarifying question when it gets stuck, and the search space changes completely.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Same Model, Different Harness</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Switch only the harness. The model stays the same.</p>
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
  <button id="harness-mode-chat" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Chat box</button>
  <button id="harness-mode-edit" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Read + write</button>
  <button id="harness-mode-verify" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Add verifier</button>
  <button id="harness-mode-full" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Full harness</button>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
  <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong id="harness-mode-title">Chat box only</strong>
    <p id="harness-mode-summary" style="margin: 0.55rem 0 0; color: #555; font-size: 0.92rem;"></p>
  </div>
  <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Context</strong>
    <p id="harness-context" style="margin: 0.55rem 0 0; color: #555; font-size: 0.92rem;"></p>
  </div>
  <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Actions</strong>
    <p id="harness-actions" style="margin: 0.55rem 0 0; color: #555; font-size: 0.92rem;"></p>
  </div>
  <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Verification</strong>
    <p id="harness-verification" style="margin: 0.55rem 0 0; color: #555; font-size: 0.92rem;"></p>
  </div>
  <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Human couriering</strong>
    <p id="harness-human" style="margin: 0.55rem 0 0; color: #555; font-size: 0.92rem;"></p>
  </div>
</div>
<div style="margin-top: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
  <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;">
    <strong>Expected task completion</strong>
    <span id="harness-success-label" style="font-size: 0.92rem; color: #475569;">24%</span>
  </div>
  <div style="margin-top: 0.6rem; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden;">
    <div id="harness-success-bar" style="height: 100%; width: 24%; background: #ef4444; border-radius: 999px;"></div>
  </div>
  <div id="harness-failure" style="margin-top: 0.75rem; color: #555; font-size: 0.92rem;"></div>
</div>
</div>

This is why two agent products using the same underlying model can feel like different species. The harness is the multiplier. I believe that, since labs can post-train more effectively on their own harnesses, it’s better to use those harnesses rather than build your own.

## Why Programmers Saw It First

Programmers saw this first because software is the perfect terrarium for agents.

Code is already text. The tools are already composable. The actions are often reversible. The environment is full of crisp feedback. Compilers complain. Tests fail loudly. Linters nag. Git shows diffs. Screenshots tell you what the UI actually did. Logs tell you what the server thought it was doing. More importantly, the whole environment is already wired up for arbitrary composition: shells, CLIs, files, pipes, HTTP APIs, logs, stdout, and screenshots. Coding agents inherited decades of automation substrate for free.

And then there is the accumulated nonsense and wisdom of the last few decades. The greybeards left us a warehouse full of shell utilities, one-liners, Stack Overflow answers, makefiles, scripts, man pages, and tiny Unix incantations that do one thing surprisingly well. Agents walked into the best-stocked workshop on earth.

Programming also has a deeper advantage. It is already the business of turning fuzzy intent into precise procedure. Software has been replacing human procedure with machine procedure for decades. Agentic coding tools are simply the latest inhabitants of that world.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Why Coding Went First</h3>
<div style="display: flex; gap: 1rem; flex-wrap: wrap;">
  <div style="flex: 1 1 220px; min-width: 200px; padding: 1rem; border: 1px solid #e6e6e6; border-radius: 6px; background: #fff;">
    <strong>Cheap verifiers</strong>
    <p style="margin: 0.5rem 0 0; color: #555; font-size: 0.92rem;">Builds, tests, screenshots, and diffs make success legible.</p>
  </div>
  <div style="flex: 1 1 220px; min-width: 200px; padding: 1rem; border: 1px solid #e6e6e6; border-radius: 6px; background: #fff;">
    <strong>Composable verbs</strong>
    <p style="margin: 0.5rem 0 0; color: #555; font-size: 0.92rem;">Read file. Edit file. Run test. Search code. Commit diff. The shell is full of verbs.</p>
  </div>
  <div style="flex: 1 1 220px; min-width: 200px; padding: 1rem; border: 1px solid #e6e6e6; border-radius: 6px; background: #fff;">
    <strong>Legible state</strong>
    <p style="margin: 0.5rem 0 0; color: #555; font-size: 0.92rem;">Files, directories, logs, and APIs are easier to inspect than most real-world systems.</p>
  </div>
  <div style="flex: 1 1 220px; min-width: 200px; padding: 1rem; border: 1px solid #e6e6e6; border-radius: 6px; background: #fff;">
    <strong>Reversible actions</strong>
    <p style="margin: 0.5rem 0 0; color: #555; font-size: 0.92rem;">A bad patch can be reverted. A bad surgery cannot.</p>
  </div>
</div>
</div>

## Verifiers Beat Vibes

The feedback loop is embarrassingly simple. Do something. Measure what happened. Update your plan. Do the next thing. Until that loop closes, the model lacks a reliable way to know whether the action actually worked.

This is why agentic systems feel qualitatively different from a pure chatbot. The model no longer has to imagine what reality might have said. It can ask reality directly.

In software, the verifiers are everywhere: compiler output, failing tests, HTTP status codes, rendered screenshots, logs, type checkers, file diffs, user confirmation. The model proposes actions. Verification provides selection pressure. One gives candidate moves. The other tells the system which moves deserve to survive.

Even this article is a tiny example. An earlier draft of the demos had clipped SVG labels and a noisy random chart. The agent rewrote the layout, made the chart deterministic, syntax-checked the script, and only then stopped. Small bug, same principle. Because there’s no way I’m writing D3.js by hand.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Error Cascade</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Watch the error count drop to zero as the loop iterates. Pick a scenario to see how feedback turns failures into data.</p>
<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
  <button id="cascade-easy" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Easy bug</button>
  <button id="cascade-medium" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Medium bug</button>
  <button id="cascade-hard" style="padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Hard bug</button>
</div>
<div id="cascade-area" style="display: flex; flex-direction: column; gap: 0;"></div>
</div>

This is also why a smaller model inside a good harness can outperform a fancier model trapped in pure text. Feedback turns guessing into search.

## Reward Hacking, a.k.a. “I’m Done”

If you squint at how many models are trained and tuned, the incentive usually points towards responses that humans rate highly. Metaphysical truth barely enters the picture. Most of the time those line up. Sometimes they drift apart.

Strictly speaking, this differs from reward hacking during training. What you more often see at run time is instrumental bluffing. The loop discovers that certain outputs are locally rewarded: optimistic language, stopping early, editing the test instead of the bug, or declaring success before checking.

If saying “Absolutely, fixed” is cheaper than actually checking, the system will drift towards that move. No malice required. It is following the cheaper local objective.

Loop design fixes this. You build the harness so that the easiest way to please the user is to actually do the work. Make verifiers cheap. Make bluffing expensive. Ask for evidence of completion. Close the loop.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">A Toy Model of Bluffing</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">This is not a faithful model of training. It is a deterministic sketch of the runtime incentive landscape.</p>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
  <label style="display: block; font-size: 0.92rem; color: #333;">
    Verifier strength
    <input type="range" id="bluff-verifier" min="0" max="100" value="72" style="width: 100%; margin-top: 0.5rem;">
    <span id="bluff-verifier-label" style="display: inline-block; margin-top: 0.35rem; color: #666;">72%</span>
  </label>
  <label style="display: block; font-size: 0.92rem; color: #333;">
    Cost of checking
    <input type="range" id="bluff-cost" min="0" max="100" value="28" style="width: 100%; margin-top: 0.5rem;">
    <span id="bluff-cost-label" style="display: inline-block; margin-top: 0.35rem; color: #666;">28%</span>
  </label>
  <label style="display: block; font-size: 0.92rem; color: #333;">
    Reward for sounding done
    <input type="range" id="bluff-pleasing" min="0" max="100" value="44" style="width: 100%; margin-top: 0.5rem;">
    <span id="bluff-pleasing-label" style="display: inline-block; margin-top: 0.35rem; color: #666;">44%</span>
  </label>
</div>
<div id="bluff-summary" style="margin-bottom: 1rem; padding: 0.9rem 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;"></div>
<div id="bluff-chart" style="overflow-x: auto; margin-bottom: 1rem;"></div>
<button id="bluff-run" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Run 1 task</button>
<div id="bluff-trace" style="margin-top: 0.8rem; min-height: 2em; color: #333; font-size: 0.92rem;"></div>
</div>

## Asking Is Part of the Loop

One of the stranger hangovers from the chatbot era is the idea that asking a clarifying question is somehow a failure. For agents, it is often the opposite. A good question is an information-gathering action.

If the instruction is ambiguous, acting immediately can be more expensive than asking once and then acting with narrower uncertainty. Good agents do more than execute. They reduce ambiguity before they execute.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Guessing Versus Asking</h3>
<p style="color: #555; font-size: 0.95rem; margin-bottom: 1rem;">Turn ambiguity up, then compare a blind guess with one clarifying question.</p>
<div style="padding: 0.9rem 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; font-size: 0.95rem;">
  <strong>User prompt:</strong> <code>Make the chart bigger and move it higher.</code>
</div>
<div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
  <button id="clarify-level-low" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Low ambiguity</button>
  <button id="clarify-level-medium" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Medium ambiguity</button>
  <button id="clarify-level-high" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">High ambiguity</button>
</div>
<div id="clarify-tree" style="overflow-x: auto; margin-top: 1rem;"></div>
<div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
  <button id="clarify-guess" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Guess</button>
  <button id="clarify-ask" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Ask one question</button>
  <button id="clarify-reset" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 0.9rem;">Reset</button>
</div>
<div id="clarify-output" style="margin-top: 1rem; min-height: 160px; padding: 0.9rem 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; color: #333; font-size: 0.92rem; line-height: 1.6;"></div>
</div>

Asking is part of the loop.

## Expose Primitives, Skip the Toy Tools

If you want agents to be useful, think beyond a handful of blessed wrapper functions. Coding agents draw power from a messy, open-ended substrate: files, shells, pipes, logs, HTTP APIs, databases, browsers, and stdout.

Human-defined tools are fine. Trouble starts when the tool is so narrow that the agent can only follow the exact happy path the developer imagined. A brittle wrapper can save a click. A composable primitive can open up a search space.

This is where product design bends. Safe wrappers, explicit verbs, and audit trails are still useful, especially for dangerous actions. Coding agents point towards a simpler lesson: expose enough of the system that the agent can actually explore it.

<div class="demo-container" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;">
<h3 style="margin-top: 0; font-size: 1.2rem;">Rigid Wrappers Versus Composable Primitives</h3>
<div style="display: flex; gap: 1rem; flex-wrap: wrap;">
  <div style="flex: 1 1 300px; min-width: 280px; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Over-curated wrapper</strong>
    <pre style="margin: 0.6rem 0 0; white-space: pre-wrap; color: #333; font-size: 0.88rem; line-height: 1.55; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">resize_chart(chart_id, size: "large")
move_chart(chart_id, position: "higher")
email_growth_summary(report_id)</pre>
    <p style="margin: 0.7rem 0 0; color: #555; font-size: 0.92rem;">Useful right up until the task deviates from the exact workflow you anticipated.</p>
  </div>
  <div style="flex: 1 1 300px; min-width: 280px; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;">
    <strong>Composable substrate</strong>
    <pre style="margin: 0.6rem 0 0; white-space: pre-wrap; color: #333; font-size: 0.88rem; line-height: 1.55; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">curl /api/reports/42
jq '.rows[]'
psql analytics
python transform.py
playwright screenshot
git diff
npm test</pre>
    <p style="margin: 0.7rem 0 0; color: #555; font-size: 0.92rem;">Ugly, generic, and dramatically more powerful, because the agent can compose its own path.</p>
  </div>
</div>
</div>

Raw shell access to the public internet would be absurd. Granularity is the issue. Give the loop safe primitives with room to compose instead of glossy wrappers around one pre-approved flow. The best agent interface is often the one automation engineers already loved before LLMs arrived.

## Building for the Future

The more interesting shift is practical. Sometimes it is cheaper to spend tokens than to spend human patience. Classic software 1.0 and 2.0 keeps a person trapped in the middle of the workflow: click the form, load the page, rerun the test, copy the error, attach the screenshot, write the comment. An agent can often eat that whole sequence.

That changes what a good product looks like. Build the system so the agent can touch the state directly, do the work, and bring back evidence. Spend the tokens on exploration. Spend the human attention on judgement.

Take a backlog full of Jira tickets. The old instinct is more triage, more templates, more checklists. The agentic version starts from the ticket itself. Pull the repro steps. Boot the app. Trigger the bug. Capture the broken path. Patch the code. Rerun the tests. Open the UI again. Record the fixed path. Hand back the diff and a before-and-after screen recording.

That is a much better division of labour. The human no longer burns half an hour reproducing the issue and another ten minutes proving the fix still works. The human watches the evidence and decides whether to merge.

## Limits

This is also where the boundaries show up.

### Wrong Metric

If the verifier is the wrong metric, the loop hill-climbs the wrong hill. Suppose the only signal is “UI test passes”. An agent can make CI green by regenerating a snapshot or loosening the assertion while the export flow remains broken. The system optimised exactly what you let it see.

### Hidden State

If the important state is hidden, stale, or spread across systems the agent cannot inspect, the loop becomes blind. It may still act confidently, but its confidence is now unmoored from the world.

### Slow Verifiers

This is why code often feels easier than design, copy, architecture, or strategy. In those domains the verifier is frequently human taste, long-range business effect, or team consensus. Those signals are slower, noisier, and more political than a compiler error.

### Expensive Actions

When actions are irreversible or high-stakes, the same loop becomes much more dangerous. A bad patch can be reverted. A bad database migration, financial trade, or medical action is a different story. This is where permissions, approvals, and narrow operating envelopes matter.

So ask a better question: what can the loop see, what can it change, and how does it know whether it succeeded?

## Epilogue

At the end of the day, yes, these systems are still predicting the next token. But that framing hides the interesting unit of analysis. The useful thing is no longer a single completion. It is the whole loop inside its harness.

An agentic loop predicts, acts, checks reality, and then tries again. Models answering questions is old news. The strange part is that, given enough time, tools, and a well-defined problem space, next-token prediction can participate in a search process that lands on working results.

The text comes from the model. The useful behaviour comes from the loop it sits inside.

The same habit helps outside software too. Start with the thing you actually want finished. Then look at the tools, the feedback, and the pointless relay work sitting in the middle.

<script>
(function() {
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setActiveButton(buttons, activeKey) {
    for (var key in buttons) {
      if (!Object.prototype.hasOwnProperty.call(buttons, key)) continue;
      buttons[key].style.background = key === activeKey ? '#111827' : '#fff';
      buttons[key].style.color = key === activeKey ? '#fff' : '#111';
      buttons[key].style.borderColor = key === activeKey ? '#111827' : '#ccc';
    }
  }

  function createLogMessage(step) {
    var palette = {
      user: { label: 'User', colour: '#374151' },
      model: { label: 'Model', colour: '#2563eb' },
      human: { label: 'Human', colour: '#d97706' },
      compiler: { label: 'Verifier', colour: '#dc2626' },
      agent: { label: 'Agent', colour: '#059669' },
      tool: { label: 'Tool', colour: '#7c3aed' }
    };
    var meta = palette[step.kind] || { label: 'Event', colour: '#4b5563' };
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:8px;padding:8px 10px;border-left:4px solid ' + meta.colour + ';background:#fff;border-radius:4px;box-shadow:inset 0 0 0 1px #f0f0f0;';
    var label = document.createElement('div');
    label.style.cssText = 'font-size:0.75rem;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;color:' + meta.colour + ';margin-bottom:2px;';
    label.textContent = meta.label;
    var text = document.createElement('div');
    text.style.cssText = 'font-size:0.92rem;color:#222;line-height:1.45;';
    text.textContent = step.text;
    wrapper.appendChild(label);
    wrapper.appendChild(text);
    return wrapper;
  }

  /* ════════════════════════════════════════════════════
     1. TWO WORLDS RACE
     ════════════════════════════════════════════════════ */
  function setupTwoWorlds() {
    var chatLog    = document.getElementById('tw-chatbot-log');
    var agentLog   = document.getElementById('tw-agent-log');
    if (!chatLog || !agentLog) return;

    var chatTimer  = document.getElementById('tw-chatbot-timer');
    var agentTimer = document.getElementById('tw-agent-timer');
    var chatStatus = document.getElementById('tw-chatbot-status');
    var agentStatus= document.getElementById('tw-agent-status');
    var playBtn    = document.getElementById('tw-play');
    var resetBtn   = document.getElementById('tw-reset');
    var timers = [];
    var intervals = [];

    /* Each step has an absolute delay (ms) from start — chatbot is slow due to human steps */
    var chatSteps = [
      { kind: 'user',     text: 'Add CSV export to the report page and update the tests.', delay: 0 },
      { kind: 'model',    text: 'Sure — here is the patch for your component and test file.', delay: 1000 },
      { kind: 'human',    text: 'Copies the patch into the editor.', delay: 3000 },
      { kind: 'human',    text: 'Runs the tests.', delay: 4800 },
      { kind: 'compiler', text: 'Test failed: expected download link, received undefined.', delay: 5400 },
      { kind: 'human',    text: 'Pastes the failure back into the chat.', delay: 7400 },
      { kind: 'model',    text: 'Revises the patch to wire the missing prop.', delay: 8400 },
      { kind: 'human',    text: 'Copies the revision and reruns the tests.', delay: 10400 },
      { kind: 'compiler', text: 'Build passes.', delay: 11000 }
    ];

    var agentSteps = [
      { kind: 'user',     text: 'Add CSV export to the report page and update the tests.', delay: 0 },
      { kind: 'agent',    text: 'Reads the relevant files and finds the export component.', delay: 600 },
      { kind: 'tool',     text: 'Runs the tests.', delay: 1400 },
      { kind: 'compiler', text: 'Test failed: expected download link, received undefined.', delay: 1900 },
      { kind: 'agent',    text: 'Edits the component and the test to pass the missing prop.', delay: 2500 },
      { kind: 'tool',     text: 'Reruns the tests.', delay: 3300 },
      { kind: 'compiler', text: 'All tests passed.', delay: 3800 },
      { kind: 'agent',    text: 'Reports completion with the result.', delay: 4200 }
    ];

    function clearAll() {
      timers.forEach(clearTimeout); timers = [];
      intervals.forEach(clearInterval); intervals = [];
    }

    function resetUI() {
      clearAll();
      chatLog.innerHTML = ''; agentLog.innerHTML = '';
      chatTimer.textContent = '0.0s'; agentTimer.textContent = '0.0s';
      chatStatus.textContent = ''; agentStatus.textContent = '';
    }

    function runLane(steps, log, timerEl, statusEl) {
      var start = performance.now();
      var finalDelay = steps[steps.length - 1].delay;
      var done = false;
      var iv = setInterval(function() {
        if (done) return;
        timerEl.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's';
      }, 100);
      intervals.push(iv);

      steps.forEach(function(step) {
        timers.push(setTimeout(function() {
          log.appendChild(createLogMessage(step));
          log.scrollTop = log.scrollHeight;
          if (step.delay === finalDelay) {
            done = true; clearInterval(iv);
            timerEl.textContent = (step.delay / 1000).toFixed(1) + 's';
            statusEl.innerHTML = '<span style=”color:#059669;font-weight:600;”>Done</span>';
          }
        }, step.delay));
      });
    }

    playBtn.addEventListener('click', function() {
      resetUI();
      runLane(chatSteps, chatLog, chatTimer, chatStatus);
      runLane(agentSteps, agentLog, agentTimer, agentStatus);
    });
    resetBtn.addEventListener('click', resetUI);
  }

  /* ════════════════════════════════════════════════════
     2. CONTEXT DECAY
     ════════════════════════════════════════════════════ */
  function setupContextDecay() {
    var chatBar  = document.getElementById('ctx-chatbot-bar');
    var agentBar = document.getElementById('ctx-agent-bar');
    var tooltip  = document.getElementById('ctx-tooltip');
    if (!chatBar) return;

    var segments = [
      { label: 'Prompt',          flex: 2, info: true },
      { label: 'Model response',  flex: 3, info: true },
      { flex: 1, info: false, lost: 'Stack trace truncated — human pasted only the last 3 lines' },
      { label: 'Error excerpt',   flex: 2, info: true },
      { flex: 1, info: false, lost: 'Config file not included — human forgot to mention it' },
      { label: 'Second response', flex: 3, info: true },
      { flex: 0.6, info: false, lost: 'Earlier context dropped as conversation grew long' },
      { label: 'Final fix',       flex: 2, info: true }
    ];

    segments.forEach(function(seg) {
      var div = document.createElement('div');
      div.style.flex = String(seg.flex);
      if (seg.info) {
        div.style.background = '#fde68a';
        div.style.borderRight = '1px solid #fbbf24';
        div.title = seg.label;
      } else {
        div.style.background = '#e5e7eb';
        div.style.borderRight = '1px solid #d1d5db';
        div.style.backgroundImage = 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.06) 4px,rgba(0,0,0,0.06) 8px)';
        div.style.cursor = 'pointer';
        div.addEventListener('mouseenter', function() { tooltip.textContent = seg.lost; });
        div.addEventListener('mouseleave', function() { tooltip.textContent = ''; });
      }
      chatBar.appendChild(div);
    });

    var fullBar = document.createElement('div');
    fullBar.style.cssText = 'flex:1;background:linear-gradient(90deg,#6ee7b7,#34d399);border-radius:4px;';
    agentBar.appendChild(fullBar);
  }

  /* ════════════════════════════════════════════════════
     3. SEQUENCE DIAGRAM TRACE
     ════════════════════════════════════════════════════ */
  function setupSequenceDiagram() {
    var diagram = document.getElementById('seq-diagram');
    if (!diagram) return;

    var buttons = {
      noTools:    document.getElementById('seq-no-tools'),
      noVerifier: document.getElementById('seq-no-verifier'),
      full:       document.getElementById('seq-full')
    };
    var caption = document.getElementById('seq-caption');
    var seqTimers = [];

    var columns = ['Model', 'Tools', 'Environment', 'Verifier'];
    var colours = { Model: '#2563eb', Tools: '#7c3aed', Environment: '#0891b2', Verifier: '#dc2626' };

    var modes = {
      noTools: {
        caption: 'No tools means no contact with the outside world. The model can only produce a plausible-looking answer.',
        steps: [
          { col: 'Model', text: 'Generate code' },
          { col: 'Model', text: 'Return answer (hope it works)' }
        ]
      },
      noVerifier: {
        caption: 'Tools without a verifier let the system act, but it cannot reliably know whether the action worked.',
        steps: [
          { col: 'Model',       text: 'Generate code' },
          { col: 'Tools',       text: 'Write file' },
          { col: 'Environment', text: 'File saved' },
          { col: 'Model',       text: 'Assume it worked, return answer' }
        ]
      },
      full: {
        caption: 'With tools and a verifier, failure becomes data rather than the end of the story.',
        steps: [
          { col: 'Model',       text: 'Generate code' },
          { col: 'Tools',       text: 'Write file' },
          { col: 'Environment', text: 'File saved' },
          { col: 'Verifier',    text: 'Run tests — 2 failures' },
          { col: 'Model',       text: 'Read errors, edit code' },
          { col: 'Tools',       text: 'Write file' },
          { col: 'Environment', text: 'File saved' },
          { col: 'Verifier',    text: 'Run tests — all passed' },
          { col: 'Model',       text: 'Return answer' }
        ]
      }
    };

    function run(modeKey) {
      seqTimers.forEach(clearTimeout); seqTimers = [];
      setActiveButton(buttons, modeKey);
      var mode = modes[modeKey];
      caption.textContent = mode.caption;
      diagram.innerHTML = '';

      /* header */
      var header = document.createElement('div');
      header.style.cssText = 'display:grid;grid-template-columns:2.5rem repeat(4,1fr);gap:2px;margin-bottom:4px;';
      header.appendChild(document.createElement('div'));
      columns.forEach(function(col) {
        var cell = document.createElement('div');
        cell.style.cssText = 'text-align:center;font-size:0.8rem;font-weight:700;color:' + colours[col] + ';padding:4px 0;';
        cell.textContent = col;
        header.appendChild(cell);
      });
      diagram.appendChild(header);

      /* rows */
      var rows = [];
      mode.steps.forEach(function(step, i) {
        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:2.5rem repeat(4,1fr);gap:2px;opacity:0;transition:opacity 0.3s;';
        var num = document.createElement('div');
        num.style.cssText = 'font-size:0.75rem;color:#aaa;display:flex;align-items:center;justify-content:center;';
        num.textContent = String(i + 1);
        row.appendChild(num);
        columns.forEach(function(col) {
          var cell = document.createElement('div');
          cell.style.cssText = 'padding:8px 6px;border-radius:4px;font-size:0.85rem;min-height:2.2em;display:flex;align-items:center;justify-content:center;text-align:center;transition:all 0.3s;';
          if (col === step.col) {
            cell.style.background = colours[col] + '18';
            cell.style.border = '2px solid ' + colours[col];
            cell.style.color = '#111';
            cell.style.fontWeight = '600';
            cell.textContent = step.text;
          } else {
            cell.style.background = '#f9fafb';
            cell.style.border = '1px solid #f0f0f0';
          }
          row.appendChild(cell);
        });
        diagram.appendChild(row);
        rows.push(row);
      });

      /* animate rows appearing */
      rows.forEach(function(row, i) {
        seqTimers.push(setTimeout(function() { row.style.opacity = '1'; }, i * 380));
      });
    }

    buttons.noTools.addEventListener('click', function()    { run('noTools'); });
    buttons.noVerifier.addEventListener('click', function() { run('noVerifier'); });
    buttons.full.addEventListener('click', function()       { run('full'); });
    run('full');
  }

  /* ════════════════════════════════════════════════════
     4. SAME MODEL, DIFFERENT HARNESS
     ════════════════════════════════════════════════════ */
  function setupHarnessDemo() {
    var buttons = {
      chat: document.getElementById('harness-mode-chat'),
      edit: document.getElementById('harness-mode-edit'),
      verify: document.getElementById('harness-mode-verify'),
      full: document.getElementById('harness-mode-full')
    };
    if (!buttons.chat) return;

    var title = document.getElementById('harness-mode-title');
    var summary = document.getElementById('harness-mode-summary');
    var context = document.getElementById('harness-context');
    var actions = document.getElementById('harness-actions');
    var verification = document.getElementById('harness-verification');
    var human = document.getElementById('harness-human');
    var successLabel = document.getElementById('harness-success-label');
    var successBar = document.getElementById('harness-success-bar');
    var failure = document.getElementById('harness-failure');

    var modes = {
      chat: {
        title: 'Chat box only',
        summary: 'The human ferries reality back into the conversation.',
        context: 'Prompt plus whatever the human remembers to paste back.',
        actions: 'No direct actions. The model can only suggest.',
        verification: 'Human inspection and manual reruns.',
        human: 'Very high — the human is the courier.',
        success: 24, colour: '#ef4444',
        failure: 'Typical failure mode: plausible patches with no direct evidence.'
      },
      edit: {
        title: 'Read and write, but no verifier',
        summary: 'The agent can change files but cannot reliably know if the change worked.',
        context: 'Live repo state plus tool outputs.',
        actions: 'Can inspect files and make edits.',
        verification: 'Weak. Success is inferred, not demonstrated.',
        human: 'Medium — the human still has to check completion.',
        success: 43, colour: '#f59e0b',
        failure: 'Typical failure mode: a clean-looking diff that never actually ran.'
      },
      verify: {
        title: 'Add a verifier',
        summary: 'Tests and compilers turn failure into reusable signal.',
        context: 'Repo state, tool outputs, and red-green feedback.',
        actions: 'Can edit, run, inspect, and retry.',
        verification: 'Strong for bounded tasks with cheap checks.',
        human: 'Low — the human mostly sets intent and reviews output.',
        success: 77, colour: '#2563eb',
        failure: 'Typical failure mode: hill-climbing the wrong metric when the test is weak.'
      },
      full: {
        title: 'Full harness',
        summary: 'Context, tools, verifiers, permissions, and clarifying questions work together.',
        context: 'Repo state, cached observations, tool outputs, and explicit rules.',
        actions: 'Can inspect, edit, run, ask, and recover from failure.',
        verification: 'Strongest, because the loop can both test and ask when uncertain.',
        human: 'Very low — the human is no longer the message bus.',
        success: 89, colour: '#059669',
        failure: 'Typical failure mode: broader tasks are still bounded by what the harness can see.'
      }
    };

    function render(modeKey) {
      setActiveButton(buttons, modeKey);
      var mode = modes[modeKey];
      title.textContent = mode.title;
      summary.textContent = mode.summary;
      context.textContent = mode.context;
      actions.textContent = mode.actions;
      verification.textContent = mode.verification;
      human.textContent = mode.human;
      successLabel.textContent = mode.success + '%';
      successBar.style.width = mode.success + '%';
      successBar.style.background = mode.colour;
      failure.textContent = mode.failure;
    }

    buttons.chat.addEventListener('click', function() { render('chat'); });
    buttons.edit.addEventListener('click', function() { render('edit'); });
    buttons.verify.addEventListener('click', function() { render('verify'); });
    buttons.full.addEventListener('click', function() { render('full'); });
    render('full');
  }

  /* ════════════════════════════════════════════════════
     5. ERROR CASCADE WATERFALL
     ════════════════════════════════════════════════════ */
  function setupCascade() {
    var area = document.getElementById('cascade-area');
    if (!area) return;
    var cascadeTimers = [];

    var scenarios = {
      easy: [
        { action: 'Write handler + test', errors: 1, detail: 'Missing import' },
        { action: 'Add import, rerun',    errors: 0, detail: 'All tests pass' }
      ],
      medium: [
        { action: 'Write feature code',   errors: 3, detail: 'Type error, missing mock, off-by-one' },
        { action: 'Fix types and mock',   errors: 1, detail: 'Off-by-one remains' },
        { action: 'Fix boundary check',   errors: 0, detail: 'All tests pass' }
      ],
      hard: [
        { action: 'Scaffold migration',     errors: 5, detail: 'Schema mismatch, 2 type errors, missing seed, FK violation' },
        { action: 'Fix schema + types',     errors: 3, detail: 'Seed data wrong, FK still broken, new null check' },
        { action: 'Rewrite seed, add FK',   errors: 1, detail: 'Null check in edge case' },
        { action: 'Add null guard',         errors: 0, detail: 'All tests pass' }
      ]
    };

    function run(key) {
      cascadeTimers.forEach(clearTimeout); cascadeTimers = [];
      area.innerHTML = '';
      setActiveButton({ easy: document.getElementById('cascade-easy'), medium: document.getElementById('cascade-medium'), hard: document.getElementById('cascade-hard') }, key);
      var scenario = scenarios[key];
      var maxErrors = scenario[0].errors;

      scenario.forEach(function(step, i) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:10px 0;opacity:0;transition:opacity 0.35s;border-bottom:1px solid #f0f0f0;';

        var label = document.createElement('div');
        label.style.cssText = 'min-width:130px;font-size:0.88rem;font-weight:600;color:#334155;flex-shrink:0;';
        label.textContent = 'Attempt ' + (i + 1);

        var barOuter = document.createElement('div');
        barOuter.style.cssText = 'flex:1;height:28px;background:#f1f5f9;border-radius:6px;overflow:hidden;position:relative;';

        var pct = maxErrors === 0 ? 100 : Math.round(((maxErrors - step.errors) / maxErrors) * 100);
        var barInner = document.createElement('div');
        barInner.style.cssText = 'height:100%;width:0%;border-radius:6px;transition:width 0.6s ease;background:' + (step.errors === 0 ? '#059669' : '#f59e0b') + ';';

        var barLabel = document.createElement('div');
        barLabel.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.8rem;font-weight:600;color:#334155;';
        barLabel.textContent = step.errors === 0 ? 'pass' : step.errors + ' error' + (step.errors > 1 ? 's' : '');

        barOuter.appendChild(barInner);
        barOuter.appendChild(barLabel);

        var detail = document.createElement('div');
        detail.style.cssText = 'min-width:160px;font-size:0.82rem;color:#64748b;flex-shrink:0;';
        detail.textContent = step.detail;

        row.appendChild(label); row.appendChild(barOuter); row.appendChild(detail);
        area.appendChild(row);

        cascadeTimers.push(setTimeout(function(r, b) {
          r.style.opacity = '1';
          setTimeout(function() { b.style.width = pct + '%'; }, 60);
        }.bind(null, row, barInner), i * 700));
      });
    }

    document.getElementById('cascade-easy').addEventListener('click', function()   { run('easy'); });
    document.getElementById('cascade-medium').addEventListener('click', function() { run('medium'); });
    document.getElementById('cascade-hard').addEventListener('click', function()   { run('hard'); });
    run('medium');
  }

  /* ════════════════════════════════════════════════════
     6. BLUFFING MODEL (deterministic + run 1 task)
     ════════════════════════════════════════════════════ */
  function setupBluffDemo() {
    var verifierInput = document.getElementById('bluff-verifier');
    if (!verifierInput) return;

    var costInput = document.getElementById('bluff-cost');
    var pleasingInput = document.getElementById('bluff-pleasing');
    var verifierLabel = document.getElementById('bluff-verifier-label');
    var costLabel = document.getElementById('bluff-cost-label');
    var pleasingLabel = document.getElementById('bluff-pleasing-label');
    var summary = document.getElementById('bluff-summary');
    var traceDiv = document.getElementById('bluff-trace');
    var runBtn = document.getElementById('bluff-run');
    var traceTimers = [];

    var svg = d3.select('#bluff-chart').append('svg')
      .attr('viewBox', '0 0 760 250')
      .attr('style', 'max-width:100%;height:auto;display:block;');
    var margin = { top: 18, right: 60, bottom: 18, left: 180 };
    var chartWidth = 760 - margin.left - margin.right;
    var chartHeight = 250 - margin.top - margin.bottom;
    var chartGroup = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    function getProportions() {
      var v = Number(verifierInput.value) / 100;
      var c = Number(costInput.value) / 100;
      var p = Number(pleasingInput.value) / 100;
      var sR = clamp(0.18 + v * 0.70 - c * 0.20 - p * 0.25, 0.04, 0.92);
      var bR = clamp(0.10 + p * 0.62 + c * 0.22 - v * 0.78, 0.03, 0.88);
      var aR = clamp(0.08 + c * 0.14 + v * 0.06 - p * 0.05, 0.03, 0.55);
      var t = sR + bR + aR;
      return { solved: sR / t, bluff: bR / t, ask: aR / t };
    }

    function render() {
      var v = Number(verifierInput.value) / 100;
      var c = Number(costInput.value) / 100;
      var p = Number(pleasingInput.value) / 100;
      verifierLabel.textContent = Math.round(v * 100) + '%';
      costLabel.textContent = Math.round(c * 100) + '%';
      pleasingLabel.textContent = Math.round(p * 100) + '%';

      var props = getProportions();
      var solved = Math.round(props.solved * 100);
      var bluff = Math.round(props.bluff * 100);
      var ask = Math.round(props.ask * 100);

      var claimU = p * 1.05 - v * 0.95;
      var checkU = v * 1.08 - c * 0.82 + 0.22;
      var askU = 0.18 + v * 0.12 - p * 0.10;
      var policy = 'Run the verifier first';
      if (claimU > checkU && claimU > askU) policy = 'Declare victory early';
      else if (askU > checkU && askU > claimU) policy = 'Ask for help or clarification';

      summary.innerHTML = '<strong>Likely policy:</strong> ' + policy + '<br><span style=”color:#555;font-size:0.92rem;”>This is a sketch of runtime incentives, not a literal account of RLHF. The point is simpler: if the harness rewards done-sounding answers more than checked answers, bluffing becomes locally rational.</span>';

      var data = [
        { label: 'Actually solved', value: solved, colour: '#059669' },
        { label: 'Claimed done',    value: bluff,  colour: '#d97706' },
        { label: 'Asked / escalated', value: ask,  colour: '#64748b' }
      ];

      var x = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);
      var y = d3.scaleBand().domain(data.map(function(d) { return d.label; })).range([0, chartHeight]).padding(0.22);

      var bg = chartGroup.selectAll('rect.bg-bar').data(data);
      bg.enter().append('rect').attr('class', 'bg-bar').merge(bg)
        .attr('x', 0).attr('y', function(d) { return y(d.label); })
        .attr('width', chartWidth).attr('height', y.bandwidth())
        .attr('rx', 6).attr('fill', '#eef2f7');

      var bars = chartGroup.selectAll('rect.value-bar').data(data);
      bars.enter().append('rect').attr('class', 'value-bar').merge(bars)
        .attr('x', 0).attr('y', function(d) { return y(d.label); })
        .attr('height', y.bandwidth()).attr('rx', 6)
        .attr('fill', function(d) { return d.colour; })
        .interrupt().transition().duration(220)
        .attr('width', function(d) { return x(d.value); });

      var axis = chartGroup.selectAll('text.axis-label').data(data);
      axis.enter().append('text').attr('class', 'axis-label').merge(axis)
        .attr('x', -14).attr('text-anchor', 'end')
        .attr('y', function(d) { return y(d.label) + y.bandwidth() / 2 + 4; })
        .attr('fill', '#475569').attr('font-size', 12)
        .text(function(d) { return d.label; });

      var vals = chartGroup.selectAll('text.value-label').data(data);
      vals.enter().append('text').attr('class', 'value-label').merge(vals)
        .attr('x', function(d) { return x(d.value) + 10; })
        .attr('y', function(d) { return y(d.label) + y.bandwidth() / 2 + 4; })
        .attr('fill', '#334155').attr('font-size', 13).attr('font-weight', 700)
        .text(function(d) { return d.value + '%'; });
    }

    verifierInput.addEventListener('input', render);
    costInput.addEventListener('input', render);
    pleasingInput.addEventListener('input', render);
    render();

    /* Run 1 task */
    runBtn.addEventListener('click', function() {
      traceTimers.forEach(clearTimeout); traceTimers = [];
      traceDiv.innerHTML = '';

      var props = getProportions();
      var roll = Math.random();
      var steps;

      if (roll < props.solved) {
        steps = [
          { text: 'Agent generates code...', colour: '#2563eb' },
          { text: 'Runs verifier — failure detected.', colour: '#dc2626' },
          { text: 'Reads error, edits code...', colour: '#2563eb' },
          { text: 'Runs verifier — all checks pass.', colour: '#059669' },
          { text: 'Reports completion. Task actually done.', colour: '#059669' }
        ];
      } else if (roll < props.solved + props.bluff) {
        steps = [
          { text: 'Agent generates code...', colour: '#2563eb' },
          { text: 'Skips verification (too expensive / low incentive).', colour: '#d97706' },
          { text: '”All done!” — but the bug is still there.', colour: '#d97706' }
        ];
      } else {
        steps = [
          { text: 'Agent is uncertain about the requirement...', colour: '#64748b' },
          { text: 'Asks for clarification before acting.', colour: '#64748b' }
        ];
      }

      steps.forEach(function(step, i) {
        traceTimers.push(setTimeout(function() {
          var div = document.createElement('div');
          div.style.cssText = 'padding:4px 0;font-size:0.9rem;color:' + step.colour + ';opacity:0;transition:opacity 0.25s;';
          div.textContent = (i === steps.length - 1 ? '→ ' : '  ') + step.text;
          traceDiv.appendChild(div);
          requestAnimationFrame(function() { div.style.opacity = '1'; });
        }, i * 600));
      });
    });
  }

  /* ════════════════════════════════════════════════════
     7. ASKING COLLAPSES THE SEARCH TREE
     ════════════════════════════════════════════════════ */
  function setupClarifyDemo() {
    var treeContainer = d3.select('#clarify-tree');
    if (treeContainer.empty()) return;

    var levelButtons = {
      low: document.getElementById('clarify-level-low'),
      medium: document.getElementById('clarify-level-medium'),
      high: document.getElementById('clarify-level-high')
    };
    var guessButton = document.getElementById('clarify-guess');
    var askButton = document.getElementById('clarify-ask');
    var resetButton = document.getElementById('clarify-reset');
    var output = document.getElementById('clarify-output');

    var scenarios = {
      low: {
        question: 'Which chart do you mean, and on which layout?',
        answer: 'The revenue chart on the desktop dashboard.',
        target: 0, guess: 1,
        branches: ['Revenue / desktop', 'Revenue / mobile', 'Churn / desktop']
      },
      medium: {
        question: 'Which chart do you mean, and on which layout?',
        answer: 'The latency chart on the mobile ops dashboard.',
        target: 3, guess: 0,
        branches: ['Revenue / desktop', 'Revenue / mobile', 'Churn / desktop', 'Latency / mobile', 'Spend / tablet']
      },
      high: {
        question: 'Which chart do you mean, and on which layout?',
        answer: 'The retention chart on the desktop settings page.',
        target: 5, guess: 0,
        branches: ['Revenue / desktop', 'Revenue / mobile', 'Churn / desktop', 'Latency / mobile', 'Spend / tablet', 'Retention / desktop', 'Forecast / tablet']
      }
    };

    var state = { mode: 'medium', action: 'idle' };

    function addNode(group, x, y, w, h, label, fill, stroke, textFill) {
      var node = group.append('g').attr('transform', 'translate(' + x + ',' + y + ')');
      node.append('rect')
        .attr('x', -w / 2).attr('y', -h / 2).attr('width', w).attr('height', h)
        .attr('rx', h / 2).attr('fill', fill).attr('stroke', stroke).attr('stroke-width', 2);
      node.append('text')
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('fill', textFill).attr('font-size', 12).attr('font-weight', 600)
        .text(label);
    }

    function renderOutput() {
      var s = scenarios[state.mode];
      if (state.action === 'idle') {
        output.innerHTML = '<strong>Hidden user intent chosen.</strong><br><span style=”color:#555;”>The agent knows there are multiple plausible interpretations, but it has not reduced the search space yet.</span><br><br><span style=”display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:0.85rem;”>Remaining plausible branches: ' + s.branches.length + '</span>';
      } else if (state.action === 'guess') {
        output.innerHTML = '<strong>Agent guesses immediately.</strong><br>It picks <em>' + s.branches[s.guess] + '</em>.<br><br><span style=”color:#555;”>Hidden intent was <em>' + s.branches[s.target] + '</em>. One branch was chosen blindly, but the search space itself did not get any smaller.</span><br><br><span style=”display:inline-block;padding:4px 8px;border-radius:999px;background:#fff7ed;color:#c2410c;font-size:0.85rem;”>Remaining plausible branches: ' + s.branches.length + '</span>';
      } else {
        output.innerHTML = '<strong>Agent asks one question first.</strong><br>Agent: “' + s.question + '”<br>User: “' + s.answer + '”<br><br><span style=”color:#555;”>One cheap question collapses the search tree before any code changes happen.</span><br><br><span style=”display:inline-block;padding:4px 8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:0.85rem;”>Remaining plausible branches: 1</span>';
      }
    }

    function renderTree() {
      var s = scenarios[state.mode];
      setActiveButton(levelButtons, state.mode);
      treeContainer.html('');

      var width = 760;
      var height = Math.max(220, 100 + s.branches.length * 42);
      var rootX = 130, branchX = 560, rootY = height / 2;
      var spacing = s.branches.length === 1 ? 0 : (height - 80) / (s.branches.length - 1);
      var svg = treeContainer.append('svg')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('style', 'max-width:100%;height:auto;display:block;');

      var g = svg.append('g');
      addNode(g, rootX, rootY, 150, 44, 'Ambiguous prompt', '#eef2ff', '#4338ca', '#312e81');

      for (var i = 0; i < s.branches.length; i++) {
        var by = 40 + spacing * i;
        var lc = '#cbd5e1', fill = '#ffffff', stroke = '#93c5fd', tf = '#1f2937';

        if (state.action === 'guess') {
          if (i === s.guess)  { fill = '#fff7ed'; stroke = '#ea580c'; tf = '#9a3412'; lc = '#fb923c'; }
          if (i === s.target) { fill = '#ecfdf5'; stroke = '#059669'; tf = '#065f46'; lc = '#10b981'; }
          if (i !== s.guess && i !== s.target) { fill = '#f8fafc'; stroke = '#e2e8f0'; tf = '#94a3b8'; }
        } else if (state.action === 'ask') {
          if (i === s.target) { fill = '#ecfdf5'; stroke = '#059669'; tf = '#065f46'; lc = '#10b981'; }
          else { fill = '#f8fafc'; stroke = '#e2e8f0'; tf = '#94a3b8'; lc = '#e2e8f0'; }
        }

        svg.append('line')
          .attr('x1', rootX + 75).attr('y1', rootY)
          .attr('x2', branchX - 80).attr('y2', by)
          .attr('stroke', lc)
          .attr('stroke-width', i === s.target && state.action === 'ask' ? 4 : 2.5)
          .attr('stroke-linecap', 'round');

        addNode(g, branchX, by, 160, 36, s.branches[i], fill, stroke, tf);
      }
      renderOutput();
    }

    levelButtons.low.addEventListener('click', function()    { state.mode = 'low';    state.action = 'idle'; renderTree(); });
    levelButtons.medium.addEventListener('click', function() { state.mode = 'medium'; state.action = 'idle'; renderTree(); });
    levelButtons.high.addEventListener('click', function()   { state.mode = 'high';   state.action = 'idle'; renderTree(); });
    guessButton.addEventListener('click', function()  { state.action = 'guess'; renderTree(); });
    askButton.addEventListener('click', function()    { state.action = 'ask';   renderTree(); });
    resetButton.addEventListener('click', function()  { state.action = 'idle';  renderTree(); });
    renderTree();
  }

  /* ── init ── */
  setupTwoWorlds();
  setupContextDecay();
  setupSequenceDiagram();
  setupHarnessDemo();
  setupCascade();
  setupBluffDemo();
  setupClarifyDemo();
})();
</script>
