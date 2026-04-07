---
date: 2026-04-06 17:55
description: How I got macOS to programmatically create and run Siri Shortcuts with arbitrary third-party App Intents, no Shortcuts.app, no iCloud, no GUI.
tags: Automation, macOS, Python, Reverse-Engineering
---

# Fixing Siri: Programmatically Creating and Running Siri Shortcuts

Siri has been disappointing for years. At this point it mostly feels like a glorified music controller and timer. What bothers me more is that Apple pushed the ecosystem toward App Intents, then stopped right before the useful part: there is still no proper way to call those intents programmatically. The metadata, the runtime, and the apps all ship with macOS, but there is no public path that ties them together. That feels especially wasteful now that Apple is talking so much about **Apple Intelligence**.

So I hacked one together.

The end result is a single TOML file that chains Tailscale (get VPN status) -> ChatGPT (summarize it) -> Apple Notes (save it) in one command, without touching the GUI.

```bash
$ bsiri exec tailscale_chatgpt_notes.toml --no-sign
```

```text
Tailscale Status (via ChatGPT)

ChatGPT Summary: Tailscale is connected under navanchauhan@github with no exit node configured.

Raw Status: Connected: Yes, Account: navanchauhan@github, Exit Node:
```

The mechanism is general. Once you can discover App Intents, compile them into a Shortcut, and execute that Shortcut headlessly, installed apps become scriptable through the Shortcuts runtime.

## Prior art

There are already a few projects that try to make Siri Shortcuts programmable from a desktop:

- Cherri (Go) is a full programming language that compiles to `.shortcut` files. It has a type system, package manager, and a VSCode extension. The catch is that it only supports built-in actions and a small slice of Apple system intents.
- `python-shortcuts` gives you a TOML-like syntax and builds `.shortcut` plists. It has the same built-ins-only limitation.
- Buttermilk (C) is a small text-to-shortcut converter with around forty hardcoded actions.
- Open Jellycuts (Swift/iOS) is a scripting language for Shortcuts on iOS. Third-party support is explicitly listed as not implemented.

They all stop at file generation. You still have to sign the Shortcut, import it into Shortcuts.app, and run it through the GUI. That solves a different problem from the one I cared about.

## Goal

I wanted a pipeline that could:

1. Discover which Siri Shortcuts Actions / App Intents installed apps exposes
2. Describe a workflow in a text file
3. Compile that workflow into a `.shortcut` plist
4. Execute it from the command line with no import, signing, iCloud sync, or Shortcuts.app interaction
5. Capture the output

In other words, I wanted to treat App Intents like a real automation surface. You could even expose them as tools and let an agent call them directly.

## Discovering App Intents

Every app that supports Siri Shortcuts ships metadata in its bundle. In practice, there are two formats to care about:

- **`.intentdefinition`** files, the older SiriKit format, stored as binary plists with `INIntents` arrays
- **`Metadata.appintents/extract.actionsdata`**, the modern App Intents format, stored as JSON with action identifiers, parameter schemas, entity definitions, and property metadata

If you scan `/Applications`, `/System/Applications`, and the relevant system frameworks, you can build a catalog of everything available on the machine. On my system, Tailscale exposes 16 intents, Ghostty exposes 12, Notes exposes 46, and ChatGPT exposes 4.

That catalog becomes the source of truth. I do not need a hardcoded app database or manual registration. If I install a new app, it shows up on the next scan with this tool.

## Building shortcuts from TOML

A `.shortcut` file is just a binary plist with a specific structure. The key field is `WFWorkflowActions`, which is an array of action dictionaries. Each action has a `WFWorkflowActionIdentifier` and `WFWorkflowActionParameters`.

For App Intents, the action identifier is `<bundle_id>.<intent_id>`, and the parameters need an `AppIntentDescriptor`:

```json
{
    "WFWorkflowActionIdentifier": "io.tailscale.ipn.macsys.GetStatusIntent",
    "WFWorkflowActionParameters": {
        "AppIntentDescriptor": {
            "AppIntentIdentifier": "GetStatusIntent",
            "BundleIdentifier": "io.tailscale.ipn.macsys",
            "TeamIdentifier": "W5364U7YZB",
            "Name": "Tailscale"
        },
        "ShowWhenRun": false,
        "UUID": "..."
    }
}
```

I built a TOML-to-plist compiler around that. It handles App Intents, built-in Shortcuts actions, variable references, type coercion, control flow, and the glue needed to make everything talk to everything else.

Generating the plist turned out to be the easy part.

## The execution problem

The hard part was convincing macOS to actually run the damn thing!

### The silent no-op

macOS ships private framework classes for running Shortcuts workflows: `WFShortcutsAppRunnerClient`, `WFWorkflowRunnerClient`, `WFLinkActionWorkflowRunnerClient`, and friends. You can load WorkflowKit, instantiate the runner, feed it your workflow plist, call `start`, wait for the delegate callback, and get back the most misleading possible result:

`error=nil, cancelled=false`

It looks like success, but the workflow never runs.

The runner returns a clean completion after deciding it does not trust the calling process, so no note is created, no third-party intent fires, and no output appears.

![Runs but no cigar](/assets/sad-emoji.gif)

### The injection fix

Apple's own `/usr/bin/shortcuts` CLI has the entitlements that matter. So instead of fighting the entitlement check, I moved the execution into that process.

I wrote an Objective-C dylib, injected it into `shortcuts` with `DYLD_INSERT_LIBRARIES`, and used a constructor to run before `main()`. The constructor reads a workflow plist from an environment variable, instantiates `WFShortcutsAppRunnerClient`, runs the workflow, and exits. If you come from Linux, this is roughly the macOS equivalent of `LD_PRELOAD`.

The plist and runner code stayed the same. The only thing that changed was the host process.

But now the code is executing inside a trusted process, so the App Intents actually fire, Notes get created, ChatGPT responds, and the Shortcut runs.

### `WFWorkflowRunRequest` is mandatory

Even inside the entitled process, the runner still silently no-ops unless you attach a `WFWorkflowRunRequest` with an explicit `outputBehavior`.

Without that request, the Shortcuts daemon appears to treat the run as a metadata lookup rather than an execution request. You get a tidy completion callback and nothing actually happens.

## Entity outputs: three undocumented requirements

Simple intents worked almost immediately. If an intent returned `Bool` or `Void`, the workflow usually just ran.

Entity-returning intents were the real trap.

Tailscale's `GetStatusIntent`, for example, returns an entity. On paper that should be better than raw text because the output is typed and structured. In practice, those intents would hang forever, with no error, no timeout callback, and no useful log message.

After working through every runner class, every execution path, every timeout, and every `runSource` setting I could find, I ended up with three undocumented requirements.

### 1. `TeamIdentifier` in `AppIntentDescriptor`

Without `TeamIdentifier`, the Shortcuts daemon cannot route the intent to the correct code-signed extension, so the workflow hangs indefinitely. In hindsight that makes sense: the daemon needs the signing identity to know which extension it is supposed to wake up.

Once I started extracting the team ID from `codesign -dv` and embedding it into the descriptor, the same intent went from "never returns" to "about 130 ms".

### 2. `ShowWhenRun: false`

Even with the team identifier present, entity intents still hung unless `ShowWhenRun` was explicitly set to `false`.

The best explanation I have is that the runner is waiting on a UI presentation path that never completes in headless execution. Telling it not to show the action short-circuits that path.

### 3. Entity properties via aggrandizements

You cannot reliably coerce an entity to text with `is.workflow.actions.detect.text`. Doing that hung the workflow for me.

What does work is extracting specific entity properties through `WFPropertyVariableAggrandizement`, attached inline inside a text action:

```json
{
    "attachmentsByRange": {
        "{11, 1}": {
            "OutputUUID": "<GetStatusIntent UUID>",
            "Type": "ActionOutput",
            "OutputName": "Status",
            "Aggrandizements": [{
                "Type": "WFPropertyVariableAggrandizement",
                "PropertyName": "connected"
            }]
        }
    },
    "string": "Connected: \ufffc"
}
```

That resolves to `Connected: Yes`. The Shortcuts runtime reads a specific property from the entity output and inserts that value into the text.

## Variable chaining

Shortcuts has two distinct variable systems, and they are not equally useful here.

**Named variables** use `set_variable` plus `{{name}}` syntax. Under the hood, that becomes `WFTextTokenString` with `attachmentsByRange` entries of type `Variable`. In the private plist runner path, this did not work reliably because the variable store was not preserved the way the GUI path expects.

**Magic variables** use action output references directly. Those become `WFTextTokenAttachment` entries with `Type: ActionOutput`, pointing at the producing action's UUID. These do work because the Shortcuts daemon resolves them during execution.

So the compiler rewrites one into the other.

When the TOML uses `set_variable` and later references `{{name}}`, the builder tracks which action produced that value, replaces the named reference with a magic-variable attachment pointing at the producing UUID, and drops the `set_variable` action entirely.

The author writes natural TOML. The compiler lowers it into the form the headless runner actually understands.

## The Spotlight approach

There is another path here.

macOS Spotlight appears to expose a private API, `LSApplicationWorkspace.openUserActivity()`, that can trigger App Intents by creating an `NSUserActivity` with the intent identifier in `userInfo`. I confirmed that this works for fire-and-forget actions like Ghostty's `QuickTerminalIntent`.

But there is no useful return channel. You can tell an app to do something, but you cannot easily get structured output back, which makes this path poor for multi-step data pipelines.

This seems to be tied to the newer plumbing in macOS 26, and it probably deserves its own post. For this project, the injected runner path was still the only one that handled both input and output.

## What works

The full pipeline now looks like this:

`discover` -> `generate` TOML -> `build` `.shortcut` -> `exec` via injector

Tested and working:

- **Tailscale** — `GetStatusIntent` (entity with property extraction), `ToggleAppIntent`, `ConnectIntent`
- **ChatGPT** — `AskIntent` (send prompt, get response)
- **Apple Notes** — `CreateNoteLinkAction` (with content from other intents)
- **Ghostty** — `NewTerminalIntent` (entity output)
- **Apple Intelligence** — `FindSportsEvents` (sports schedules), `CalculateAppUsageIntent` (screen time)
- **Calendar** — `create_event` with natural language dates ("next Friday at 3pm"), `get_upcoming_events`
- **Weather** — `get_current_weather` and `get_weather_forecast` with location support (latitude/longitude)
- **155 built-in action types** — URL fetch, battery level, date, math (`calculate`, `random_number`, `round_number`), text composition, `if`/`else` control flow, `detect_text` coercion, contacts, reminders, media playback, documents, sharing, location, and more
- **Decompiler** — `.shortcut` → TOML round-trip
- **REPL mode** — `sosumi --repl` for interactive iterative shortcut building with full conversation context

All from one TOML file, with one command.

Here is an example of what a combined query looks like. This generates a random number, checks the battery, fetches weather, and composes everything into a note:

```text
$ sosumi --cache "generate a random number between 1 and 100, get my battery
level, get the current weather, and create a note with all this titled System Lottery"

System Lottery

Random Number: 75
Battery Level: 26%
Weather: 77°F and Cloudy
```

And here is location-specific weather working end to end:

```text
$ sosumi --cache "what is the weather forecast for Muir Woods?"

77°F and Partly Cloudy, 74°F and Partly Cloudy, 66°F and Mostly Clear ...
```

Calendar events with natural language dates:

```text
$ sosumi --cache "create an event for next friday at 3pm called Team Standup"

# Creates: Team Standup — Friday, April 10, 2026 at 3:00 PM
```

## `sosumi`: natural language to Siri Shortcuts

Once the TOML pipeline worked, the next obvious question was: why am I still writing TOML?

So I built `sosumi`, a CLI that takes a plain-English prompt, sends it to Cerebras' `qwen-3-235b-a22b-instruct-2507` along with the discovered App Intent metadata from the local machine, generates a TOML shortcut spec, builds it, and executes it.

A single sentence goes in, and a working Shortcut comes out.

IYKYK on the name.

```bash
$ sosumi "check my tailscale status and ask chatgpt to roast my vpn setup, save it to a note called VPN Roast"
```

About 18 seconds later:

```text
VPN Roast

Oh this setup? This isn't a VPN config, this is a situationship.

"Connected: Yes"
Yeah emotionally too, I bet. Technically connected, but doing absolutely nothing useful.

"Using Exit Node: No"
So you've got a VPN... that doesn't go anywhere. That's not a tunnel, that's a cul-de-sac.

And "Account: navanchauhan@github"
Of course it's GitHub. This whole setup feels like a README that says
"coming soon" and hasn't been updated in 2 years.

You basically installed privacy and then said, "Actually, let's keep
things open and vulnerable. For performance."

Right now your VPN is just... moral support.
```

### How `sosumi` works

Nothing in `sosumi` is hardcoded to a specific app. It walks `/Applications`, `/System/Applications`, `/System/Library/PrivateFrameworks`, and `/System/Library/ExtensionKit/Extensions` (for Apple Intelligence actions), reads `Info.plist` plus `Metadata.appintents/extract.actionsdata`, and extracts every intent, parameter, entity definition, and entity property it can find.

During build, the compiler calls `codesign -dv` on each relevant app bundle and extracts the signing team identifier needed to route the intent to the correct extension.

The `actionsdata` files also describe the entity schema. If Tailscale returns `Entity<StatusAppEntity>`, I know it has properties like `connected`, `profileName`, `useExitNode`, and `exitNodeName` because the app bundle says so.

All of that metadata, about 32K tokens in my test setup, gets stuffed into the system prompt along with TOML syntax rules and examples. The model emits TOML, the compiler lowers it into a Shortcut plist, the injector runs it, and the output comes back.

Apple already has the App Intents framework, apps already expose structured actions, the Shortcuts runtime already knows how to compose them, and the metadata is already sitting on disk. Siri almost certainly has access to more context than this tool does.

The difference is that `sosumi` actually reads what the installed apps can do and composes around that reality.

The version that really worked came together over a weekend. The full project, if I am being honest, was a few months of on-and-off poking at private frameworks, weird plist fields, and entitlement walls.

## Benchmarks

The full pipeline breaks down into four stages:

| Phase | Time | What happens |
|-------|------|-------------|
| Intent Discovery | ~2s | Scan app bundles for `actionsdata` files and extract entity metadata |
| LLM Generation | ~1.2s | Cerebras processes ~32K input tokens and emits ~127 output tokens at about **107 tokens/sec** |
| Build | ~2.2s | Compile TOML to plist, resolve team IDs, rewrite variables, assign UUIDs |
| Execute | ~430ms | Inject into `/usr/bin/shortcuts`, run the workflow, capture the result |

Simple shortcut (battery -> Notes): about 10s end to end

Three-app chain (Tailscale -> ChatGPT -> Notes): about 18s end to end, with ChatGPT response time dominating

The LLM itself is not really the bottleneck here. Filesystem scanning and `codesign` lookups cost more than inference. Actual workflow execution is comfortably sub-second.

Which raised the obvious question: if the scan is the bottleneck, why scan every time?

### Caching: from 11s to under 1.5s

`sosumi --cache` caches the discovered intent metadata to disk. On repeat runs it skips the filesystem scan entirely and reads from `~/.cache/sosumi/intents_cache.json`.

But the real win comes from the combination of two caches: ours and Cerebras'.

Cerebras' inference API [automatically caches prompt prefixes](https://inference-docs.cerebras.ai/capabilities/prompt-caching). Since the system prompt is ~32K tokens of intent metadata that stays identical across runs, the server caches the prefill. On a warm cache, 32,512 out of 32,562 input tokens are served from cache, and only the ~50 token user message needs fresh processing.

The numbers across three consecutive runs with the same system prompt:

| Run | Wall time | Cached tokens | Notes |
|-----|-----------|---------------|-------|
| 1 | 1.20s | 32,512 / 32,562 | Cerebras cache warming |
| 2 | 0.50s | 32,512 / 32,562 | Warm |
| 3 | 0.32s | 32,512 / 32,562 | Fully warm |

With both caches active:

| | Cold (no cache) | Warm (`--cache`) |
|---|---|---|
| Intent discovery | ~2s | ~0ms |
| Cerebras prefill (32K tokens) | ~1.1s | ~0.05s |
| Cerebras decode | ~0.17s | ~0.17s |
| **Total LLM round-trip** | **~1.3s** | **~0.3s** |
| **End-to-end (dry-run)** | **~11s** | **~1s** |
| **End-to-end (with execution)** | **~11.5s** | **~1.4s** |

From English sentence to executed Siri Shortcut in 1.4 seconds.

```bash
# First run: scans apps, caches intents, warms Cerebras cache
sosumi --cache "get my battery and save to a note"

# Subsequent runs: ~1.4s end-to-end
sosumi --cache "ask chatgpt something and save to notes"

# Installed a new app? Refresh
sosumi --cache --refresh-cache "use the new app"
```

## Why Cerebras + Qwen

Cerebras runs `qwen-3-235b-a22b-instruct-2507`, a 235B mixture-of-experts model with 22B active parameters. The decode speed is around 1,400 tokens/sec and the prefill runs at roughly 30,000 tokens/sec. That means the ~32K token system prompt (all the intent metadata, syntax rules, and examples) takes about a second to process on a cold start, and near-zero on a cache hit.

In practice, inference never dominates the runtime. The model reliably generates valid TOML with correct bundle IDs, team identifiers, entity property aggrandizements, and action wiring without hallucinating, as long as the intent metadata in the system prompt is accurate, which it is, because we scan it from the actual app bundles on disk.

## Apple Intelligence intents

While scanning for App Intents, we initially missed a whole category: Apple Intelligence actions. They live in `/System/Library/ExtensionKit/Extensions/`, not in the usual app bundle paths. Once we added that scan path, two new intents appeared:

- **FindSportsEvents** — "Get Upcoming Sports Events" with a `SportsTeamAppEntity` parameter
- **CalculateAppUsageIntent** — "Get App & Website Activity" with device and date range filters

The sports intent works; we pulled Arsenal's full Premier League fixture list through it. The catch is that it requires an opaque entity identifier, such as `umc.cst.5gx97l2c8jun1ibioji2x3i0y` for Arsenal F.C., and the only reliable way I have found to get that ID is through the Shortcuts.app picker. I tried programmatic resolution through `LNConnection.performQuery:`, but it crashes consistently, even inside the entitled `shortcuts` process. There is probably some extra `LNConnection` initialization step that I am still missing.

At this point, this is the main limitation that remains. App Intents that require entity parameters, such as a specific sports team, contact, or calendar, still need an entity ID copied from a pre-existing shortcut. Intents with string, boolean, number, or no parameters at all work from scratch. I suspect this is fixable, but I have not found the missing piece yet.

## What is still awkward

The framework is general and has zero hardcoded app knowledge, but a few things are still rough:

- **Entity resolution** — intents that need entity parameters (like a specific sports team or calendar) require opaque IDs from the Shortcuts GUI. No programmatic search yet.
- **`ShowWhenRun`** — headless behavior is inconsistent. Some actions hang when this flag is present, while others hang when it is missing. The current builder handles the common cases, but there are still edge cases left to pin down.
- **`show_result` and `show_alert`** — these actions require a GUI to present to and hang forever in headless mode. `sosumi` avoids them, but the user has to know.
- **No public API** — everything here is reverse-engineered from private frameworks. A supported `shortcuts exec --plist workflow.shortcut` command would remove most of the hacks.

## Code

Parts of the project are on GitHub at [navanchauhan/sosumi-siri-shortcuts](https://github.com/navanchauhan/sosumi-siri-shortcuts).
