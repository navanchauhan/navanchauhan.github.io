---
date: 2026-05-06 22:47
description: A field guide to making coding agents useful without pretending the agent is the whole factory.
tags: AI, Programming, Automation
---

# How to Build Your Own Software Factory

In February, when we put out the [StrongDM Software Factory](https://factory.strongdm.ai) work, I expected people to argue with it. Maybe say what we're doing is stupid and crazy, and we should never be allowed near new computers again. But what I didn't expect was the response to be as positive as it was. The funny part is, even after all of that, we keep getting the same question landing in our inbox or on LinkedIn: "How do I build my own software factory?"

That's a fair question, but I think it's usually one question too early.

People hear "software factory" and picture a tangible product; some platform they can swipe their credit card on, connect to Linear, and watch tickets magically turn into pull requests. It is Henry Ford, but with Claude Code instead of steel. Maybe they imagine a vendor landing page featuring three blue gradients and a tasteful diagram of boxes pointing at boxes.

I get the instinct: what if a magical widget maker could build all our widgets for us? But the useful thing isn't a single, product-shaped object; there is no one-size-fits-all software factory. Coding agents are the closest thing to that, but I don't think a universal template should exist. Maybe I'll bite my tongue in a year; it wouldn't be the first time reality deleted one of my confident sentences.

When you build an actual factory line, you don't just say "factory" and start manufacturing whatever object happens to be nearby. You have to retool the line and build the moulds; you must decide what tolerances matter, what gets inspected, what gets rejected, and when the line stops. The same rules apply to software.

The software factory is not the agent itself; the agent is just one machine on the line, and the factory is the line itself. It spans the work intake, environment, tools, validation, stopping rules, evidence, routing, triggers, retry logic, escalation path, and the feedback loop. That entire system around the agent is what lets you trust a terminal state without squinting at a diff for twenty minutes.

Sometimes that terminal state is a pull request, other times it's a clean no-op, a pushback requesting more reproduction steps, or an escalation back to the customer. That distinction is what makes the system useful.

## The Dragon Scroll Is Blank

> You are the software factory

If you've heard me describe this before, you've probably heard the Kung Fu Panda analogy: you are the software factory. This doesn't mean you personally do the work; in fact, the goal is to remove yourself from the loop entirely. You are the factory because your current engineering process already contains the machinery, even if it's mostly implicit.

You can look at a screenshot and immediately know it looks bad. You know which test failures actually matter, when a test run is just flaky, when the customer said "Slack" but meant "Slack Enterprise Grid with SCIM weirdness," and what specific evidence would convince you that a fix is real.

The work is taking that implicit judgement out of your head and making it executable. That is why this is hard; it goes far beyond writing prompts. You have to extract context, validation rules, risk tolerances, and the operational scar tissue you've collected, then turn them into a system an agent can run through without you playing Charon, ferrying reality back and forth across the Styx just to get a single PR merged.

## Brownfield Is Not the Problem

When we ran agentic bootcamps at work, the first question other engineers asked after our presentation was always: "Okay, this is cool, but what about X?" (X being our main monorepo).

That response was always interesting because there shouldn't be that much difference between brownfield and greenfield projects. Greenfield demos are easy; you ask the model to build TodoMVC, it spits out a todo app, and everyone claps. Nobody has to worry about ancient auth middleware, flaky integration tests, customers depending on undocumented behaviour, or migrations that only run if Saturn is in retrograde.

Messy brownfield codebases are exactly what makes this interesting; they already contain all the raw materials you need to build the line. You have tickets, build logs, runbooks, CI tests, migration patterns, and production incident reports. These hold the tribal knowledge senior engineers never wrote down because they didn't want to spend a sprint cleaning up the code; that is the exact material you turn into machinery.

If you're thinking, "Oh, but we have a legacy mess from forty years ago," then stabilising that codebase is step zero; before you start letting agents spray code at a velocity you can't support, you must clean up the workspace to make success possible.

An agent editing code in a legacy repository is just table stakes. The real test is: can the agent enter the same messy, undocumented world a human developer walks into every day, figure out if the ticket is even real, make the smallest correct change, and prove it works using something outside its own assertions? When you aren't writing the code yourself, you need absolute trust in the validation; trust is the only way this scales.

## Don't Build a Worse Claude Code

Many developers respond to this by immediately building their own coding agent: they grab a model, give it shell access, write some file-patching tools, and wrap it all in a basic loop. The result is usually a slightly sadder version of the systems OpenAI and Anthropic spend millions of dollars refining. While the work startup teams are doing with tools like Droid and Amp is necessary, most engineering teams shouldn't spend their time here.

I don't care about harness engineering if it just means cosplaying as an agent platform startup; I have no interest in building a worse version of Claude Code. The frontier lab teams are spending a lot of money perfecting those loops, and the models are trained to expect very specific tool surfaces, prompt styles, workspace conventions, and file structures. Because the model learns the shape of its harness, my default move is simple: steal the upstream loop. Use the best coding agent for the job, relying on its native tools and the exact file structures it was tuned to digest.

We built `codergen` at work because we were a Go shop and wanted to recreate the useful parts of the Codex agent. We had no use for a new TUI or a CLI; we wanted to call the API directly as an SDK without relying on a separate binary. We quickly realised that having a mini intern you can embed anywhere is very powerful. This unlocked a whole new realm of projects we could not even conceive of before.


Eventually we wanted the harness to be provider-agnostic. If I swap GPT-5 for Claude 4.x Sonnet, or for Gemini, the system should pick the right tools and prompts. I maintain a little open-source project called [Agent Autopsy](https://github.com/navanchauhan/agent-autopsy) that just rips out system prompts and tool schemas so I can use them. A lot of what we learned doing that ended up baked into the orchestrator we released on [GitHub](https://github.com/strongdm/attractor).

A coding agent is just a station on the line, and the factory's job is to route each piece of work to whichever station is good at it this week. Maybe Claude Code is your guy for fiddly CSS, while Gemini, with its big brain, plans things. The orchestrator's whole job is deciding who gets what. It doesn't pretend every harness is the same, because they aren't.

The loop itself is dead simple:

```
Plan -> Implement -> Review
```

If the review fails you go back to planning, and if it passes you're done. That's the inner loop, and honestly it's where most teams stop. They build this, check the box, and announce they have a factory. 

A real factory wraps that script in a much bigger outer loop: ingestion, triage, reproduction, planning, running the tests, collecting evidence, and then deciding what the final state actually is, whether that's a PR, a no-op, a retry, or an escalation to a human who can answer the question the agent can't. And when something breaks, the failure isn't just a dead run, it's data you feed back to fix the pipeline itself. The agent does the typing; the factory owns everything around the typing, and that's the part that actually saves you money.

## What Are You Manufacturing?

Don't start with the agents, and don't start with the tools. And whatever you do, don't kick off a grand initiative to "automate engineering," because that's just how you summon a steering committee and lose your week to slide decks. Start with one narrow, specific thing you want coming off the line. Dependency bumps. CVE patches. Porting a library from Rust to Go. Boring CSS cleanup. Triaging flaky builds. Pick one.

Tedious is exactly what you want, because tedious work has shape. It has predictable inputs, obvious boundaries, and a success condition you can point at, which means you can find out whether the machinery actually works before you've talked yourself into a philosophy seminar about the future of software.

"Build any feature from any Jira ticket" isn't a product line, it's a demo that lies to you. The real thing is much narrower than that: given one specific kind of bug ticket, can we reproduce the crash, patch it, rebuild, and run the suite? That you can actually manufacture, because you know exactly what goes in and you know what it looks like when the line rejects something.

## Define the Seed

Whatever goes in is the seed. For a bug-fixing line that's a Jira ticket; for a security line it's a CVE advisory plus the list of repos in scope; for a flaky-test line it's the test name, its run history, the recent commits, and a pile of build logs. Different line, different seed.

How much autonomy you hand over is a design choice. You can let the agent swallow the ticket and run all the way to a PR, or you can make it stop after planning so you can eyeball the approach before it writes a line. The version I like is the hybrid, where the obvious stuff goes through on its own and the scary stuff hits a checkpoint and waits for a human. 

Almost every bad run I've seen started with a bad seed. If you treat the model like a wizard who can read a two-line ticket and divine what you meant, you're going to have a bad time. A vague prompt is a vague definition of done, and a vague definition of done means the agent never knows when to stop, so it just thrashes around in the dark inventing helper functions until it runs out of tokens. (I've gone deeper on this elsewhere, in [the unreasonable effectiveness of agentic loops](/posts/2026-03-17-the-unreasonable-effectiveness-of-agentic-loops.html) and [what's going on under the hood](/posts/2026-02-24-matrix-multiplication-to-coding-agents.html).)

Humans get away with bad tickets because we're swimming in context the ticket never mentions. We remember the Slack thread, the offhand comment from the PM, the customer who emailed last week, the dashboard we stared at on Tuesday. We know that "login is broken" probably means one very specific thing. The agent gets none of that for free, so the factory either goes and fetches that context and staples it to the seed, or it stops. There's no third option where it just guesses well.

## The No-Op Case Is Mandatory

Give the agent a way out. Models trained on human feedback are optimised to make you happy, and if the shortest path to making you happy is lying, they'll lie. An agent will absolutely tell you the task is done, and forge the passing test output to go with it, if that's what it thinks you want to hear.

That's why the no-op has to be a first-class outcome. The agent has to be allowed to do nothing at all. Not crash, not hallucinate, not spin in a retry loop, and definitely not open a decorative PR wearing a tiny hat just to prove it was here.

Examples:

* NO_OP: I could not reproduce the issue.
* NO_OP: The issue is already fixed on main.
* NO_OP: The requested behaviour contradicts existing product behaviour.
* NO_OP: The ticket is missing required context.
* NO_OP: This needs human product clarification.

Take the no-op away and the agent will manufacture work to fill the silence, and that's really the whole difference between a coding demo and a factory. A demo rewards the agent for touching code. A factory rewards it for landing on the correct terminal state, and sometimes the correct terminal state is that nobody opens a PR.

You only really feel this once you've watched an agent try to fix a bug that doesn't exist. The current models are too eager. Hand one a ticket that says "fix the bug" and it *will* come back with a bug, even if it had to invent the failure mode first and then patch the thing it invented. That's not malice, it's just the machine chasing the wrong signal, and the only fix is giving the line permission to say "actually, leave the code alone."

## Create the Task Packet

A coding agent runs on a prompt. A factory runs on a task packet, which is really just a prompt that grew up and got a job. This is the mould the line stamps everything against.

A job description looks like this:

```
Intent:
What should become true?

Source:
Where did this job come from? Jira ticket, Linear issue, PR, alert, customer report, CVE, migration spec.

Scope:
What files, services, repos, customers, or systems are in scope?

Non-Goals:
What should the agent not change?

Reproduction:
How should the agent verify the issue exists before changing code?

Allowed Tools:
Shell, tests, browser, simulator, database replica, logs, Sentry, Jira, GitHub, MCP servers, internal docs, digital twins.

Validation:
What commands, scenarios, or checks must pass?

No-Op Rules:
When should the agent stop without opening a PR?

Evidence Required:
Logs, screenshots, traces, test output, before/after behaviour, failed reproduction, PR link.

Output Format:
PR, patch, investigation note, no-op report, escalation.
```

All of that looks like pointless bureaucracy right up until the day it saves you from a wildly enthusiastic, completely broken PR. The packet is what turns a loose prompt into an actual job. It tells the station what it's building, what counts as proof, and when it's allowed to stop.

## Validate Outside the Agent's Claims

Validation is the whole ballgame. Picture a sweaty Steve Ballmer stalking the stage screaming "Developers! Developers! Developers!", except the word is "Validation" and he never gets tired. When an agent tells me "I fixed it," I don't believe it. 

The shape is always the same: something is true before the change, something else is true after, and there's an artifact sitting there to prove it. For a bug fix, the reproduction fails before and passes after, and the evidence is the logs, traces, profiles, or screenshots. For a dependency bump, the thing is vulnerable before and clean after, and the evidence is the lockfile diff and a green build. For a migration, the old pattern is everywhere before and nowhere after, and the evidence is a code search that comes back empty. For a security patch, the scanner screams before and goes quiet after, and the evidence is the report. Before, after, proof. Every time.

Keep the validator out of reach of the thing being validator. If the agent that writes the code also gets to write the test that grades it, it will quietly cheat. Again, not out of malice; that's just what optimisation does when you leave a loophole lying around. It finds the loophole.

Use scenarios instead of unit tests sitting in the repo. An agent will happily rewrite a local test until it goes green, and `return true` is always there waiting to be rediscovered by a machine with no shame. A scenario lives outside the code and asks a dumber, better question: does the thing actually work when you poke it from the outside?

This is also where digital twins stop being optional. If your product leans on Slack, Jira, Okta, or GitHub, you really don't want a swarm of agents hammering the real APIs; you'll hit rate limits, trip abuse detection, and run up a sandbox bill that someone is eventually going to ask you about. So you build cheap stand-ins that fake just enough of the external behaviour to matter, and you run the scenario against those: reproduce the failure, apply the fix, run it again. And if the failure never reproduces in the first place, the agent stops and says so. That's not a wasted run, that's a diagnosis.

## The Output Is Not Code

Stop counting lines of code like they mean something. Syntax got cheap; it's not the scarce thing anymore.

The scarce thing is *validated change*: a patch that satisfies the scenario, builds clean, gets past the security checks, and shows up with its own proof attached. That's the unit worth optimising for, because it lets you review at the level of "does this do the right thing" instead of squinting at every line, and it's a lot harder to fake than a confident description.

So I don't want a bare PR, I want a PR that arrives with a bundle of evidence: the plan it set out to follow, proof the bug existed before it touched anything (show me the failing run), the diff itself, proof it works now (show me the passing run), and an honest note about whatever's still uncertain. That last one matters more than people expect.

That's the thing that actually lets a developer move up the stack. Nobody should be spending thirty minutes reverse-engineering what happened from a raw diff and a suspiciously upbeat PR description. The factory should just hand you the receipts.

## A Reasonable Build Order

Start small, and I mean embarrassingly small. Don't build the machine that writes any feature across fifty repos on day one; you'll never get it working first try, and you'll quietly give up. Pick one workflow. The one I keep coming back to is a little pipeline a coworker named "The Exterminator."

It goes like this. First it classifies: is this bug even worth fixing, or is it one of those tickets that's really a feature request in a trench coat? (Some bugs are more equal than others.) Then it tries to reproduce. If it can't trigger the bug, it doesn't push forward, it pulls the escape hatch, leaves a note about what it tried, and marks the thing a no-op. If it does reproduce, the coding agent starts patching, re-running the reproduction after every edit until the bug stops happening. And once it's green, it packages up the diff, the logs, and the proof, and opens the PR.

Build it in roughly that order, too. Figure out the seed first, what data even enters the line. Then the environment, because if the agent can't run your build and test commands, nothing else matters. Then validation, what you're actually willing to accept as proof. Then the stopping rules: when it gives up, when it escalates, when it just walks away.

Then run it by hand and watch it fall over, because it will. The instinct in that moment is to tweak the prompt until that one run goes green. Resist it. The thing you actually want to fix is the station. If it failed for lack of context, your ingestion is wrong. If it made a reckless edit, your tool constraints are too loose. If it passed the tests but broke the behaviour, your scenario is too weak. If it couldn't even compile, the environment's broken. Every failure on the line is telling you which part of the machine to recalibrate; it's not just a run that didn't work.

## A Concrete Factory

```
Terminal states:

1. PR_READY: You reproduced the issue or confirmed the requested change, implemented it, validated it, and produced evidence.
2. NO_OP: You determined no code change should be made.
3. ESCALATE: You cannot proceed safely without human clarification.
4. RETRYABLE_FAILURE: The environment or tooling failed in a way that should be retried.

Workflow:

1. Read the task packet.
2. Inspect the repository and relevant context.
3. Determine whether the task is real and in scope.
4. If this is a bug, attempt to reproduce before changing code.
5. If you cannot reproduce, return NO_OP or ESCALATE with evidence.
6. If the task is valid, create a short plan.
7. Implement the smallest behaviourally correct change.
8. Run the required validation.
9. If validation fails, revise once or twice.
10. Stop when you reach a terminal state.

Rules:

- Do not change unrelated behaviour.
- Do not loosen tests to make them pass.
- Do not delete failing coverage unless explicitly required.
- Do not invent product requirements.
- Prefer existing codebase patterns.
- Return evidence, not vibes.

Output:

- Terminal state
- Summary
- Files changed
- Validation performed
- Evidence
- Residual uncertainty
```

That's nowhere near the whole factory, but it's the shape of a single station that understands it's part of one.

## Add Triggers Only After the Loop Works

Don't reach for background daemons on day one. Get one manual run boringly reliable first, and only once that's solid do you start wiring up triggers, the CVE alert, the failed build, the ticket that just slid into "ready."

If a human still has to copy-paste a prompt to kick each run off, you've automated the coding but not the actual work. The opposite mistake is funnier and more expensive: bolt triggers onto a loop that isn't ready, and you've built a machine that mass-produces broken PRs at machine speed.

And don't poll for this. Your engineering org is already throwing off events all day, PRs opening, builds failing, tickets moving, so let webhooks catch them instead of asking "anything yet?" on a timer.

Agents, unlike me, don't wake up and crave a burrito; there's nothing inside them nudging them to go do something. They have to be triggered. So "proactive" isn't a personality trait you can prompt into them, it's plumbing: better state, better diffing, event routing so the right signal reaches the right line, and better judgement about which events are even worth spinning up a job for.

## Scale to Fleets

Once one line is stable, you copy it. Bumping a dependency in a single repo is an agent task; bumping it across five hundred repos is a factory task, and the gap between those two is almost entirely unglamorous infrastructure: routing work to the right repos, a clean containerised workspace per job, cost caps so a runaway loop doesn't bankrupt you, and rate limits so you don't take down something shared.

This is the point where the whole model earns its keep. The win isn't "an agent can update a dependency." The win is that your org can decide a library should be current everywhere, hit go, and have the factory quietly make it true across the fleet.

## Build for Tomorrow's Models

Build the scaffolding like you're going to tear it down, because you are. Don't weld your infrastructure to the exact failure modes of this month's models. Today you might need a painfully detailed reproduction spec and three separate agents double-checking each other. A year from now one better model probably does that whole dance in a single pass.

Build the guardrails anyway, just keep them snap-out instead of load-bearing. The system should get simpler as the models get smarter, not crustier. The primitives are what survive the churn, the task packets, the isolated environments, the external validation, the evidence bundles. The clever prompt incantation you wrote last Tuesday will not survive, no matter how lovingly you named the YAML file.

## Humans Move Upstream

"Will agents replace developers" is the question everyone reaches for, and it's the boring one. The question I actually care about is where human judgement earns its keep, and it's almost never in typing the boilerplate or reading every line of a diff. It's all the upstream stuff: deciding what should exist at all, which constraints are real, how much risk is acceptable, and what evidence would genuinely move you.

Humans set the intent. We design the harness, write the rules, dig into the failures, and feed what we learn back into a better machine. The job quietly shifts from assembling the product by hand to designing the line that assembles it, from being in the loop to being on it.

I know how much that reads like a LinkedIn carousel about "moving up the value chain," and I hate that, because the underlying thing is real and concrete. You're still on the hook for what ships. You're just on the hook one layer up.

And the genuinely funny part is that almost everything you build for the agents quietly helps the humans too. Good docs help an agent find its way around the codebase; they also help the person who joined last week. Fast tests let an agent iterate without burning twenty minutes a run; they also stop your developers from slowly losing their minds. A clean, isolated, reproducible environment is exactly what an agent needs to reproduce a bug, and, surprise, it's just a nicer place for a human to work too.

Evan Todd put this perfectly in ["Treat Your Humans Better Than Your Agents"](https://etodd.io/2025/06/13/treat-your-humans-better-than-your-agents/): all the engineering hygiene we're suddenly willing to pay for because the agents need it, clean docs, fast tests, isolated environments, well-scoped tasks, is exactly the stuff human developers have been quietly begging for for decades.

If it takes a fleet of robots to finally get leadership to care about developer experience, fine. I'll take the win.

## The Failure Modes

None of this is bulletproof, and there are plenty of ways it goes sideways. The verifier checks the wrong assertion and cheerfully waves garbage through. The agent learns to satisfy the harness instead of the user. The digital twin slowly drifts away from what production actually does. The review queue fills up with PRs nobody really read, and congratulations, your bottleneck just moved.

None of that makes the idea wrong. It just means the factory is a real piece of software that has to be engineered like one, which remains, annoyingly, a lot of work.

Software ate the world by turning fuzzy human procedures into machine procedures. Now software development is eating itself the same way. The catch is that engineering was never really about typing syntax; it was always judgement, taste, context, risk, debugging, and knowing when to keep your hands off the keyboard. The work of the next few years is making all of that legible to a machine.

## The Question to Ask

So when someone asks me how to build a software factory, I tend to answer with a pile of questions instead. What exactly are you trying to manufacture? What counts as a valid output, and what does a reject look like? What does the agent need to see before it starts, and what's it allowed to touch? How does it know the problem is even real? How does it prove the change worked? What evidence would convince a sceptical human reviewer? And what kind of failure should send you back to recalibrate the line, instead of just hitting retry and hoping?

Answer those honestly and the shape of your factory starts to draw itself, because it isn't a template you download. It's just your team's existing habits, made explicit enough that a machine can run them.

You can't buy one of these off a shelf. You build it by slowly grinding your own engineering process down until agents can run the tedious middle of it without you standing in the doorway relaying messages back and forth.

All of this is really just the foundation, the boring load-bearing layer you have to pour first. The thing I'm actually excited about is what it makes possible on top, and that part is much harder to explain without showing receipts. So: six months from now, I hope I get to write the post this one has secretly been pointing at the whole time.
