---
date: 2026-05-06 22:47
description: A practical guide to turning coding agents into trustworthy software factories w
tags: AI, Programming, Automation
---

# How to Build Your Own Software Factory

In February, when we put out the [StrongDM Software Factory](https://factory.strongdm.ai) work, I expected people to argue with it. I did not expect the response to be as positive as it was, although I loved the discussion on HN. The funny part is that after all of that, we still get asked the same question: “How do I build my own software factory?” That is not a bad question. It is just usually the wrong first question.

People hear “software factory” and picture a product. A thing you buy. A dashboard. A queue. A fleet of background agents. Jira tickets go in. Pull requests come out. Henry Ford, but with Claude Code instead of steel. That is not the thing. There is no one-size-fits-all software factory. I do not think there should be one. Maybe I will bite my tongue on that in a year. Would not be the first time reality deleted one of my confident sentences.

When you build an actual factory line, you do not say “factory” and start manufacturing whatever object happens to be nearby. You retool the line. You build the molds. You decide what tolerances matter. You decide what gets inspected. You decide what gets rejected. You decide when the line stops. Same thing here.

A software factory is not the agent. The agent is one machine on the line. The factory is the line. It is the work intake, the environment, the tools, the validation, the stopping rules, the evidence, the routing, the triggers, the retry logic, the escalation path, and the feedback loop. The factory is the system around the agent that lets you trust a terminal state.

Sometimes that terminal state is a pull request. Sometimes it is a no-op. Sometimes it is “please ask a human because this ticket is fake.” That distinction matters more than almost anything else.

## The Dragon Scroll Is Blank

> You are the software factory

If you have heard me describe this before, you have probably heard the Kung Fu Panda version. You are the software factory. Not because you personally should do all the work, that is the opposite of the point. You are the software factory because your current engineering process already contains the machinery. It is just mostly implicit.

You know when a ticket is bad. You know which logs matter. You know when a screenshot is suspicious. You know which test failure is real and which one is CI being CI. You know when the customer said “Slack” but meant “Slack Enterprise Grid with SCIM weirdness.” You know which internal API lies on Tuesdays. You know what evidence would convince you.

The work is taking that judgment out of your head and making it executable. That is why this is hard. You are not just prompting. You are extracting taste, context, verification, risk tolerance, and operational scar tissue, then turning that into a system an agent can run through without you ferrying reality back and forth.

## Brownfield Is Not the Problem

If by now you think this cannot work on brownfield projects, you are either living under a rock or you are holding it wrong. Brownfield is where this gets interesting.

Greenfield demos are easy. You ask the model to build a todo app. It builds a todo app. Everyone claps. Nobody has to care about the ancient auth middleware, the flaky integration test, the customer who depends on undocumented behavior, or the one migration that only runs correctly if the moon is in retrograde.

Brownfield has all the annoying stuff. That is also why brownfield has all the factory material. It has tickets. Logs. Runbooks. CI. Tests. Release rituals. Migration patterns. Known bad smells. Existing examples. Customer paths. Production incidents. The weird things senior engineers know but never wrote down because nobody wanted to spend a sprint making the codebase more legible. That is the stuff you turn into machinery.

A factory is not “the agent can write code in an old repo.” That is table stakes. A factory is “the agent can enter the same messy world a human enters, decide whether the task is real, make the smallest correct change, validate it against something outside its own claims, and hand back evidence a skeptical human would accept.” That is the game.

## Do Not Build a Worse Claude Code

There is a version of this conversation where people immediately go off and build their own coding agent. They wire up a model. Give it shell access. Add file-editing tools. Invent a patch format. Add a loop. Add some logging. Then they proudly produce a worse version of something OpenAI, Anthropic, Google, and others are already spending absurd amounts of money optimizing.

That is not where I would spend my time. I do not care about harness engineering in the “let me cosplay as an agent platform company” sense. I do not want to build a worse Claude Code. The upstream providers are already doing the hard work there. More importantly, the models are increasingly trained and evaluated against particular tool surfaces, prompts, repo instruction formats, and workflows.

The harness is not neutral. The model learns the shape of the harness. So my advice is simple: steal the upstream loop. Use the best coding agent available for the job. Use its native tools. Use its native conventions. Use the prompts and repo-instruction formats the model has already been optimized to follow. Do not make the factory worse because you wanted to own a worse machine.

Now, there is a caveat. At work we did build a loop we called `codergen`. The story behind it is funny in the way only backend integration failures are funny. I was working on our generative SDLC pipeline, which we called Gen, and I was trying to modify something in the Codex system prompt. Specifically, I wanted to remove the part that said not to explicitly `git commit` unless asked. The ChatGPT Codex backend rejected the modification. No useful drama. Just: no.

So we recreated the useful parts of the Codex-style prompt, tools, and harness in Go, because StrongDM was a Go shop. That unlocked a class of projects we did not know existed. At the model level, the model never knows the difference between our Codex-in-Go implementation and the Codex CLI. But the lesson was not “everyone should build their own coding agent.” The lesson was that sometimes the factory needs control over the execution boundary. We wanted custom execution providers. We wanted provider-aware prompts and tools. We wanted to switch between Codex, Claude Code, and Gemini CLI without pretending they are all the same machine. Providing the right prompts and tools for the right model is very important. There is a reason we released the natural language specs for building this coding agent loop and an opinionated orcehstrator on [GitHub.](https://github.com/strongdm/attractor)

That is a factory station. That is different from a weekend agent demo with a shell tool and a dream. The coding agent is a station on the line. The factory decides which station should handle which job. Maybe Claude Code is better for frontend tasks this week. Maybe Gemini has the big-boy brain you need for a migration. Maybe Codex is better aligned with the repo workflow. The factory routes work. It does not pretend every station is identical.

The most basic loop for generating software is still boring:

```
Plan -> Implement -> Review
```

If review fails, go back to plan. If review passes, exit. That is the inner loop. A lot of people stop there and think they have a factory. They do not. They have a machine.

The factory wraps that loop in a larger one: ingest -> classify -> reproduce -> plan -> implement -> validate -> collect evidence -> decide: PR / no-op / retry / escalate -> feed failures back into the factory. The coding agent can run the inner loop. The factory owns the outer loop. That is where most of the leverage lives.

## What Are You Manufacturing?

Do not start with agents. Do not start with tools. Do not start with “we should automate engineering.” Start with the thing you want to manufacture. Pick one product line: dependency updates, CVE remediation, Jira bug tickets, frontend polish, test generation, flaky test triage, API migrations across repos, PR review before human review, release-note generation.

The more boring the first product line is, the better. Boring is good because boring has shape. Boring has repetition. Boring has known inputs. Boring has bounded blast radius. Boring lets you tell whether the factory is working without needing to solve philosophy first.

“Build any feature from any ticket across any repo” is not a product line. It is a demo that lies to you. A better first product line is: given a dependency update ticket in these ten repos, open a PR only if the update is applicable, builds, passes tests, and does not change public behavior.

That is manufacturable. You know what enters the line. You know what comes out. You know what rejection looks like. You know what evidence matters. Now you can build.

## Define the Seed

The seed is what enters the factory. For a Jira-ticket factory, the seed might be a ticket. For a CVE factory, it might be an advisory plus a repo list. For a flaky-test factory, it might be a test name, failure history, recent commits, and CI logs. For a migration factory, it might be a spec, a reference implementation, and the set of repos in scope.

Most failed agent runs start with a bad seed. A vague Jira ticket produces a vague PR. Garbage in, plausible diff out. This is one of the first things people miss. They obsess over the model, but the job was malformed before the model ever saw it.

A human can sometimes repair a bad seed because humans are full of hidden context. We read the ticket and remember the Slack thread. We know the customer. We know which PM wrote it. We know what “login is broken” probably means because we saw the dashboard yesterday. Agents do not get that for free. The factory has to attach the missing context or stop.

## The No-Op Case Is Mandatory

This is the part I keep coming back to. The agent must be allowed to do nothing. Not fail. Not hallucinate. Not open a decorative PR. Do nothing.

Examples: 

* NO_OP: I could not reproduce the issue.
* NO_OP: The issue is already fixed on main.
* NO_OP: The requested behavior contradicts existing product behavior.
* NO_OP: The ticket is missing required context.
* NO_OP: This needs human product clarification.

If the agent is not allowed to no-op, it will manufacture work. That is one of the most important differences between a coding demo and a software factory. A coding demo rewards “look, it changed code.” A factory should reward “it reached the correct terminal state.” Sometimes the correct terminal state is no PR.

This feels obvious until you watch an agent try to solve a problem that does not exist. The current family of models is still very willing to help. Too willing. If you give a model a Jira ticket that says “fix the bug,” it will go looking for a bug. If it cannot find one, it may invent the shape of one and then patch that. That is not malice. That is the machine optimizing for the wrong thing. You need early stopping. You need no-op rules. You need escalation. You need the factory to say: “The right answer here is to not touch the code.”

## Create the Task Packet

A coding agent needs a prompt. A software factory needs a task packet. This is the mold. This is how you retool the line.

A task packet should look something like this:

```
Factory Job

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
Logs, screenshots, traces, test output, before/after behavior, failed reproduction, PR link.

Output Format:
PR, patch, investigation note, no-op report, escalation.
```

Most people skip this and then blame the model. Do not skip this. The task packet is the thing that turns a prompt into a job. It tells the station what it is manufacturing, what counts as valid output, and when the line should stop.

## Validate Outside the Agent’s Claims

Never trust “I fixed it.” Trust evidence. For a bug: before, the scenario fails; after, the same scenario passes; evidence, logs, trace, screenshot, test output, or scenario transcript. For a dependency update: before, the dependency is outdated or vulnerable; after, the dependency is updated; evidence, lockfile diff, advisory resolution, build output, tests. For a migration: before, the repo has the old pattern; after, the repo has the new pattern; evidence, search output, tests, generated PR, migration checklist.

The verifier should be outside the implementation surface when possible. If the same agent writes the code and invents the acceptance criteria, it will overfit. Not because it is evil. Because that is what optimization does.

This is also why scenarios are more interesting than normal tests in a factory setting. A test sitting in the repo can be edited. A narrowly written test can be cheated. `return true` is always sitting there, waiting to be rediscovered by a machine with no shame. A scenario is closer to a holdout. It asks whether the externally observable behavior satisfies the intent.

This is also where digital twins become useful. If the product depends on Slack, Jira, Okta, Google Drive, or some other external service, you do not always want to validate against the real thing. Rate limits, costs, nondeterminism, abuse detection, and production risk all make that annoying. So you build duplicates. Not perfect replicas of reality. Useful replicas of the behavior that matters.

You recreate conditions close enough to the customer’s perspective that the factory can tell whether the thing works, then you run the same scenario before and after the change. If the issue cannot be reproduced, maybe there is nothing to fix. Instead of being a failure, this represents information.

## The Output Is Not Code

This is the part I think people still underweight. The factory should not optimize for code. Code is cheap now. Not free. Not irrelevant. Not magically correct. But cheap enough that it is no longer the scarce artifact.

The scarce artifact is validated change. A change that satisfies the scenario. A change that survives contact with the environment. A change that comes with evidence. A change that can be reviewed at the level of behavior instead of syntax. That is a much more interesting unit than “I wrote code.” It is also harder to fake.

A factory output should not just be a PR. It should be a PR plus an evidence bundle. Minimum useful evidence bundle: Summary: What changed? Original task: What was the input? Reproduction: Did the issue exist? Plan: What approach was taken? Diff: What files changed? Validation: What commands or scenarios passed? No-op / escalation: Why did the agent stop, if it stopped? Residual risk: What is still uncertain?

This is how humans move up the stack. The human should not manually reconstruct what happened. The factory should hand them the evidence.

## A Reasonable Build Order

Start boring. Do not start with “the factory builds any feature from any ticket across any repo.” Start with one product line. Then build the smallest line that can produce one trustworthy output.

First, define the seed. What information enters the factory? Then define the acceptable output. What evidence has to come back? Then define the environment. Can the agent run the same commands a human would run? Then define validation. What does success mean outside the agent’s own claims? Then define stopping rules. When should it stop? When should it retry? When should it escalate? When should it say there is nothing to do?

Then run it manually. Watch where it fails. Do not fix the single run. Fix the station. If it lacked context, improve the context primitive. If it made an unsafe change, improve the constraint. If it passed tests but broke behavior, improve the scenario. If it could not run the app, fix the environment. If it produced a PR nobody trusts, improve the evidence bundle. The failure is not just a failed task. It is a factory calibration signal.

## A Concrete Factory

```
You are running as one station in a software factory. Your job is not to produce a diff at all costs. Your job is to determine the correct terminal state for this task.

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
7. Implement the smallest behaviorally correct change.
8. Run the required validation.
9. If validation fails, revise once or twice.
10. Stop when you reach a terminal state.

Rules:

- Do not change unrelated behavior.
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

That is not the whole factory. But it is the shape of a station that knows it belongs to one.

## Add Triggers Only After the Loop Works

Do not start with background agents. Start with one reliable manual run. Then add triggers. Good triggers look like this: a Jira ticket enters “Ready for Agent,” a GitHub issue is assigned to an agent, a PR is opened, CI fails, a CVE appears, a dependency becomes stale, a flaky test crosses a threshold, or a migration spec is approved.

If every agent run starts with a human typing a prompt, you automated the work but not the workflow. But the reverse mistake is worse. If you add triggers before the line works, you have built a machine that manufactures bad output faster.

Polling also sucks. Push beats pull when the world already gives you events. PRs open. Builds fail. Advisories land. Tickets move. Alerts fire. Specs get approved. The factory should react to those signals when the underlying loop is good enough to deserve automation.

Unlike me, the agents are not going to wake up and want a burrito. They need to be triggered. Proactiveness is not magic. It is better state, better diffing, better event routing, and better judgment about which changes deserve to become jobs.

## Scale to Fleets

Once one line works, replicate it. One dependency update across one repo is a coding-agent task. One dependency update across 500 repos is a factory task. That requires boring infrastructure: repo selection, one workspace per repo, one agent per workspace, central progress tracking, retries, escalation, aggregated results, cost limits, rate limits, review queues, and audit logs.

This is where the factory becomes real. The point is not that an agent can update a dependency. The point is that the organization can declare: this dependency should be current everywhere. And the factory makes that true.

## Build for Tomorrow’s Models

When you are building for models of tomorrow, build scaffolds that can be removed. Do not overfit the factory to today’s failure modes. Today you might need a very explicit reproduction packet. Tomorrow the model may infer more. Today you might need narrow tool permissions. Tomorrow the model may be better at asking for the right access. Today you might need multiple external verifiers. Tomorrow one stronger model may run part of that loop.

Fine. Build the scaffolding anyway. Just do not make it load-bearing forever. The factory should get simpler as the models get better. That means the primitives matter more than the hacks. Task packets. Environments. Validation. Evidence. No-op rules. Routing. Feedback. Those will survive model churn. Your brittle prompt incantation from last Tuesday probably will not.

## Humans Move Upstream

The usual argument is: do agents replace developers? That question is boring. The better question is: where does human judgment create the most leverage?

It is not always in typing every line. It is not even always in reading every line. It is in deciding what should exist. What constraints matter. What risks are acceptable. What evidence is sufficient. What validation would actually convince you. Which customer path matters. Which failure is noise. Which failure is a signal.

Humans define intent. Humans design the harness. Humans decide what the factory should optimize. Humans inspect failures and turn them into better machinery. Humans choose what deserves to be built. The work moves from production to production design. From writing every part to designing the line. From being inside the loop to being on the loop.

That sounds like management language, which is unfortunate because the idea is real. You are still responsible. You are just responsible for a different layer.

This is also why improving the factory helps humans too. Good docs help agents. They also help humans. Fast tests help agents. They also help humans. A clean, isolated, reproducible environment helps agents. It also helps humans. Small contained tasks help agents. They also help humans.

Evan made this point cleanly in [“Treat Your Humans Better Than Your Agents”:](https://etodd.io/2025/06/13/treat-your-humans-better-than-your-agents/) the same environment work people are suddenly willing to do for agents, such as clean repo instructions, isolated reproducible environments, fast tests, documentation, and small contained tasks, also improves the lives of humans doing the work.

We are suddenly willing to do all of this because agents need it. Developers needed it the whole time. Fine. I will take the win.

## The Failure Modes

There are obvious ways this goes wrong. The verifier checks the wrong thing. The agent learns to satisfy the harness instead of the user. The digital twin drifts from reality. The environment lacks hidden production state. The factory opens too many PRs and moves the bottleneck to review. The agent has too much access. The agent has too little access. The loop is too slow to be economical. The scenarios are too narrow. The humans stop reading the evidence. The humans keep reading everything and get no leverage.

All of these are real. None of them makes the idea invalid. They just mean the factory has to be engineered.

Software ate the world by turning human procedures into machine procedures. Now software development itself is going through the same thing. The annoying part is that software engineering was never just typing code. It was always judgment, context, verification, taste, debugging, risk management, and knowing when not to touch the thing. Now we have to make that bundle legible.

## The Question to Ask

So when someone asks, “How do I build a software factory?”, I think the better answer is a sequence of questions: What do you want to manufacture? What counts as a valid output? What does the agent need to see? What is it allowed to change? How does it know the issue exists? How does it know the change worked? How does it know to stop? What evidence would convince a skeptical human? What failure should improve the factory instead of merely retrying the task?

Answer those and the shape of the factory starts to appear. Not because there is a universal recipe. Because the factory is the recipe for your work.

You are not buying a software factory. You are retooling your engineering process until agents can run the boring, repeatable, expensive middle of it without you ferrying reality back and forth. The dragon scroll is blank. You are the software factory. The work is turning yourself into machinery without turning your judgment off.

This was a guide to building your own software factory. But the honest version is: this is the work behind us. The factory described here is the foundation layer. Agents that can act. Evals that can catch regressions. Logs that make the invisible visible. Review loops that keep the whole thing from turning into expensive confetti. We needed all of that.

But the thing I am most excited about is what that foundation makes possible. That is the work happening now. I cannot share much of it yet. It is better than this post. Stranger than this post. And much harder to explain without showing the receipts. Six months from now, I hope I can write the post this one is secretly pointing at.
