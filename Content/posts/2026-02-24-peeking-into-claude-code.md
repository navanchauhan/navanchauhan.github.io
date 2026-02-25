---
date: 2026-02-24 19:37
description: A practical reverse-engineering walkthrough of Claude Code's Bun binary, prompt assembly, tool schemas, and transport behavior.
tags: Reverse-Engineering, Bun, AI, JavaScript
---

# Peeking Into Claude Code

Clud (Claude Code) is awesome. So, why not figure out the harness and prompts it has?

## Install chain (old npm era vs Bun binary)

There are two eras:

Old way:

```bash
npm install @anthropic-ai/claude-code
npm pack @anthropic-ai/claude-code
tar -xvf anthropic-ai-claude-code-*.tgz
```

You could just unpack the minified JS and read it.

New way:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

That redirects to a GCS bootstrap script which does the following:

1. Reads `latest`.
2. Downloads `manifest.json`.
3. Selects the platform artifact (`darwin-arm64` for my machine).
4. Downloads the `claude` binary.
5. Verifies SHA-256.
6. Runs `claude install`.

As of writing about this run, `latest` resolved to `2.1.50`, and the checksum matched.

## Decompiling the Bun binary

Quick fingerprint:

```bash
strings claude-2.1.50-darwin-arm64 | tail -n1
# ---- Bun! ----
```

This tells you that it was "compiled" by Bun.


## From binary to `claude.js` (and what the Bun markers are)

The Bun binary isn’t a single JS file; it’s a bundle with a module table embedded near the end of the file. Bun drops markers and a trailer so its runtime can locate the module graph.

The `---- Bun! ----` string is the obvious marker, but the real work is the **module table** that sits near it. The table contains entries like:

- module path pointer
- payload offset
- payload length
- flags

The main trick is the entry size. The upstream tool expected 36‑byte entries, but this binary uses 52‑byte entries, so the parser “walked off” the buffer and failed. I wrote a custom extractor that:

1. Scans for Bun markers.
2. Reads the trailer and module table offsets.
3. Tries multiple entry sizes (`52, 40, 36, 32, 28`) and scores them based on pointer sanity.
4. Extracts the bundled payloads into a folder.

Output highlights:

- `.../bundled/claude` (main JS wrapper, ~10.7 MB)
- `.../bytecode/claude.bytecode` (~97 MB)
- extra `.node` and `.wasm` modules (ripgrep, tree‑sitter, resvg, etc.)

Then de‑minify the JS wrapper into a readable `claude.js`. This step uses [bun-decompile](https://github.com/lafkpages/bun-decompile).

Result:

- `.../deminified/claude-openai/deminified/claude.js`

That file is what the prompt/tool/schema extractor consumes.

## Prompt assembly and system reminders

The system prompt is not a single static string. It is assembled from section builders like `# System`, `# Doing tasks`, and `# Using your tools`. That’s why “same prompt, different behavior” happens when mode/tool state/env context changes.

Here’s a real prompt snippet from a trace (interactive mode):

```
You are an interactive agent that helps users with software engineering tasks.
```

System reminders are a real control channel. Example reminder text:

```
Tool results and user messages may include <system-reminder> or other tags.
```

There’s even a non-interactive reminder that changes behavior in `--print` mode:

```
You are running in non-interactive mode and cannot return a response to the user until your team is shut down.
```

## Tools and schemas

I extracted the tool schemas from the de-minified bundle. Example schema snippet:

```ts
WI8 = NR(() => y.strictObject({
  file_path: y.string().describe("The absolute path to the file to read"),
```

The extracted tool universe for this version is 30 tools:

```
AskUserQuestion, Bash, Edit, EnterPlanMode, EnterWorktree, ExitPlanMode, Glob, Grep,
ListMcpResourcesTool, LSP, mcp, NotebookEdit, Read, ReadMcpResourceTool, SendMessage,
Skill, StructuredOutput, Task, TaskCreate, TaskGet, TaskList, TaskOutput, TaskStop,
TaskUpdate, TeamCreate, TeamDelete, TodoWrite, ToolSearch, WebFetch, Write
```

## Non-interactive mode

The prompt actually changes with `-p / --print`. In my `--print` capture, the system prompt includes the non-interactive reminder above, and the tools array is smaller.

Tools in the `--print` capture (18 total):

```
AskUserQuestion, Bash, Edit, EnterPlanMode, EnterWorktree, ExitPlanMode, Glob, Grep,
NotebookEdit, Read, Skill, Task, TaskOutput, TaskStop, TodoWrite, WebFetch, WebSearch, Write
```

Tools that did not appear in the `--print` tools list:

```
ListMcpResourcesTool, LSP, mcp, ReadMcpResourceTool, SendMessage, StructuredOutput,
TaskCreate, TaskGet, TaskList, TaskUpdate, TeamCreate, TeamDelete, ToolSearch
```


## MITM vs Bun hook (and why HTTP_PROXY didn’t help)

MITM showed telemetry/config/update endpoints, but it did not show the real model prompt/response. The Bun-compiled binary does not respect `HTTP_PROXY`/`HTTPS_PROXY` in the way you’d expect, so I stopped fighting it and hooked Bun directly.

The Bun preload hook patches `fetch` and dumps `/v1/messages` requests + SSE responses. This gets you the full `system[]`, `tools[]`, and tool-use event stream.

Here is the exact run pattern (print mode):

```bash
BUN_OPTIONS='--preload <path_to_dir>/trace-claude-messages.cjs' \
CLAUDE_TRACE_DIR=artifacts/trace/messages \
claude -p "Reply exactly: TRACE_FETCH_OK2" --output-format json \
  > artifacts/trace/trace-fetch-out.json \
  2> artifacts/trace/trace-fetch-err.log
```

The interesting part is the request URL: it hits loopback first:

```
http://127.0.0.1:<port>/v1/messages?beta=true
```

That explains why MITM mostly showed telemetry unless you hook Bun at runtime.

Full hook source:

```cjs
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");

const outDir =
  process.env.CLAUDE_TRACE_DIR ||
  path.join(process.cwd(), "artifacts", "trace", "messages");
fs.mkdirSync(outDir, { recursive: true });

const maxBytes = Number(process.env.CLAUDE_TRACE_MAX_BYTES || 8 * 1024 * 1024);
const onlyMessages = process.env.CLAUDE_TRACE_ONLY_MESSAGES !== "0";
const redactAuth = process.env.CLAUDE_TRACE_REDACT_AUTH !== "0";

const originalFetch = globalThis.fetch?.bind(globalThis);
if (!originalFetch) {
  throw new Error("globalThis.fetch is not available");
}

function lowerHeaders(input) {
  const out = {};
  const h = new Headers(input || {});
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (
      redactAuth &&
      (key === "authorization" ||
        key === "x-api-key" ||
        key === "cookie" ||
        key === "set-cookie")
    ) {
      out[key] = "***";
    } else {
      out[key] = v;
    }
  }
  return out;
}

async function readBodySafe(body) {
  if (!body) return { text: "", truncated: false };
  try {
    const txt = await body.text();
    if (Buffer.byteLength(txt, "utf8") > maxBytes) {
      return { text: txt.slice(0, maxBytes), truncated: true };
    }
    return { text: txt, truncated: false };
  } catch (err) {
    return { text: `[unreadable body: ${String(err)}]`, truncated: false };
  }
}

function shouldCapture(url) {
  if (!onlyMessages) return true;
  return /\/v1\/messages(\?|$)/.test(url);
}

globalThis.fetch = async function tracedFetch(input, init = {}) {
  const request = new Request(input, init);
  const url = request.url;

  if (!shouldCapture(url)) {
    return originalFetch(input, init);
  }

  const id = randomUUID();
  const ts = new Date().toISOString();
  const reqClone = request.clone();
  const reqBody = await readBodySafe(reqClone);

  let response;
  let fetchErr;
  try {
    response = await originalFetch(request);
  } catch (err) {
    fetchErr = err;
  }

  const baseRecord = {
    id,
    ts,
    pid: process.pid,
    hostname: os.hostname(),
    request: {
      method: request.method,
      url,
      headers: lowerHeaders(request.headers),
      body: reqBody.text,
      body_truncated: reqBody.truncated,
    },
  };

  if (fetchErr) {
    const rec = {
      ...baseRecord,
      error: String(fetchErr),
      stack: fetchErr && fetchErr.stack ? String(fetchErr.stack) : null,
    };
    fs.writeFileSync(
      path.join(outDir, `${Date.now()}-${id}.json`),
      JSON.stringify(rec, null, 2)
    );
    throw fetchErr;
  }

  // Return the response immediately so the caller can start reading the
  // SSE stream without waiting. Capture the response body in the background.
  const respClone = response.clone();
  readBodySafe(respClone)
    .then((respBody) => {
      const record = {
        ...baseRecord,
        response: {
          status: response.status,
          status_text: response.statusText,
          headers: lowerHeaders(response.headers),
          body: respBody.text,
          body_truncated: respBody.truncated,
        },
      };
      fs.writeFileSync(
        path.join(outDir, `${Date.now()}-${id}.json`),
        JSON.stringify(record, null, 2)
      );
    })
    .catch((err) => {
      const record = {
        ...baseRecord,
        response: {
          status: response.status,
          status_text: response.statusText,
          headers: lowerHeaders(response.headers),
          body: `[trace capture error: ${String(err)}]`,
          body_truncated: false,
        },
      };
      fs.writeFileSync(
        path.join(outDir, `${Date.now()}-${id}.json`),
        JSON.stringify(record, null, 2)
      );
    });

  return response;
};

console.error(
  `[trace-claude-messages] enabled, dir=${outDir}, onlyMessages=${onlyMessages}, maxBytes=${maxBytes}`
);
```

## Context management and git state

Prompt assembly includes dynamic environment state: cwd, platform, shell, permission mode, tool availability. There are also prompt sections that explicitly reference task management and environment context.

Git state is first-class too. The `EnterWorktree` tool and related hooks show repo state is meant to be part of the agent loop, and you can see that in the tool schemas and traces.

## Skills and plugins

Skills are exposed as tools (`Skill`, `AskUserQuestion`) and appear in the tool schemas. MCP adapters (`mcp`, `ListMcpResourcesTool`, `ReadMcpResourceTool`) are also part of the tool surface.

## Automating the whole pipeline

I ended up with two automation layers:

1. Binary + decompile pipeline
   - versioned artifacts under `claude-code/versions/<version>/...`
   - diffs under `claude-code/diffs/<old>_to_<new>.md`

2. Prompt/tool/schema extraction
   - `scripts/extract-claude-intel.ts`
   - `scripts/render-claude-intel-report.ts`
   - `scripts/extract-tool-descriptions.py`

For model I/O inspection I use the Bun preload hook so I always get the real `/v1/messages` payloads, not just the telemetry.

### Extraction scripts (self‑contained)

I’m not linking the repo, so here are the actual snippets and what they do.

#### 1) `extract-claude-intel.ts` — parse the de‑minified bundle

This reads `claude.js`, finds prompt anchors, tool implementation blocks, schema snippets, and system reminders, then writes a raw JSON blob.

```ts
function extractByPatterns(text: string, lines: string[], patterns: RegExp[], before = 8, after = 16): LineContext[] {
  const out: LineContext[] = [];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    while ((m = re.exec(text)) !== null) {
      const line = lineNumberAt(text, m.index);
      out.push({
        line,
        match: m[0].slice(0, 120),
        snippet: getLineWindow(lines, line, before, after),
      });
      if (out.length >= 50) return out.sort((a, b) => a.line - b.line);
    }
  }
  return out.sort((a, b) => a.line - b.line);
}

function parseToolBlocks(text: string): ToolRecord[] {
  const tools: ToolRecord[] = [];
  const assignRe = /([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = assignRe.exec(text)) !== null) {
    const symbol = m[1];
    const openBraceIndex = text.indexOf("{", m.index);
    const closeBraceIndex = findMatchingBrace(text, openBraceIndex);
    const block = text.slice(openBraceIndex, closeBraceIndex + 1);
    if (!block.includes("name:")) continue;
    if (!block.includes("inputSchema")) continue;
    if (!block.includes("call(") && !block.includes("async call(")) continue;
    // extract name + input/output schema expressions
    // store the block + snippets for later rendering
  }
  return tools;
}
```

What it gives me:

- prompt anchors + snippets
- system reminder blocks
- tool implementation blocks
- schema snippets (Zod/NR)

Raw output:

- `claude-intel.json`

#### 2) `render-claude-intel-report.ts` — normalize + render markdown

This takes the raw JSON and turns it into human‑readable artifacts.

```ts
const tools = intel.tools
  .map((t) => {
    const resolvedName = resolveExpr(t.nameExpr, constMap) ?? t.nameExpr;
    const resolvedInput = resolveExpr(t.inputSchemaExpr, constMap) ?? t.inputSchemaExpr;
    const resolvedOutput = resolveExpr(t.outputSchemaExpr, constMap) ?? t.outputSchemaExpr;
    return { ...t, resolvedName, resolvedInput, resolvedOutput };
  })
  .sort((a, b) => a.resolvedName.localeCompare(b.resolvedName));

await Bun.write(`${outDir}/system-prompts.md`, systemMd.join("\n"));
await Bun.write(`${outDir}/tool-implementations.md`, implMd.join("\n"));
await Bun.write(`${outDir}/tool-schemas.json`, JSON.stringify(schemaRecords, null, 2));
await Bun.write(`${outDir}/tool-schemas.md`, schemaMd.join("\n"));
await Bun.write(`${outDir}/sandbox-capabilities.md`, sandboxMd.join("\n"));
```

Outputs:

- `system-prompts.md`
- `tool-implementations.md`
- `tool-schemas.json` + `tool-schemas.md`
- `sandbox-capabilities.md`

#### 3) `extract-tool-descriptions.py` — description strings

This scrapes the long tool descriptions from the bundle and writes:

- `tool-descriptions.json`
- `tool-descriptions.md`

### How I run it

```bash
# 1) Extract raw intel from the de‑minified bundle
bun scripts/extract-claude-intel.ts \
  claude-code/versions/2.1.50/analysis/claude-intel/claude-intel.json \
  claude-code/versions/2.1.50/deminified/claude-openai/deminified/claude.js \
  claude-code/versions/2.1.50/analysis/claude-intel

# 2) Render reports
bun scripts/render-claude-intel-report.ts \
  claude-code/versions/2.1.50/analysis/claude-intel/claude-intel.json \
  claude-code/versions/2.1.50/deminified/claude-openai/deminified/claude.js \
  claude-code/versions/2.1.50/analysis/claude-intel

# 3) Extract tool descriptions
python3 scripts/extract-tool-descriptions.py \
  claude-code/versions/2.1.50/deminified/claude-openai/deminified/claude.js \
  claude-code/versions/2.1.50/analysis/claude-intel/tool-descriptions.json \
  claude-code/versions/2.1.50/analysis/claude-intel/tool-descriptions.md
```

## Appendix: tool schema reference

These are the tool parameters as observed in captured `/v1/messages` payloads.

### Observed in trace payloads

### AskUserQuestion
- `questions`: Questions to ask the user (1-4 questions) Type: array
- `questions[].question`: The complete question to ask the user. Should be clear, specific, and end with a question mark. Example: "Which library should we use for date formatting?" If multiSelect is true, phrase it accordingly, e.g. "Which features do you want to enable?" Type: string
- `questions[].header`: Very short label displayed as a chip/tag (max 12 chars). Examples: "Auth method", "Library", "Approach". Type: string
- `questions[].options`: The available choices for this question. Must have 2-4 options. Each option should be a distinct, mutually exclusive choice (unless multiSelect is enabled). There should be no 'Other' option, that will be provided automatically. Type: array
- `questions[].options[].label`: The display text for this option that the user will see and select. Should be concise (1-5 words) and clearly describe the choice. Type: string
- `questions[].options[].description`: Explanation of what this option means or what will happen if chosen. Useful for providing context about trade-offs or implications. Type: string
- `questions[].options[].markdown`: Optional preview content shown in a monospace box when this option is focused. Use for ASCII mockups, code snippets, or diagrams that help users visually compare options. Supports multi-line text with newlines. Type: string
- `questions[].multiSelect`: Set to true to allow the user to select multiple options instead of just one. Use when choices are not mutually exclusive. Type: boolean Default: false
- `answers`: User answers collected by the permission component Type: object
- `annotations`: Optional per-question annotations from the user (e.g., notes on preview selections). Keyed by question text. Type: object
- `metadata`: Optional metadata for tracking and analytics purposes. Not displayed to user. Type: object
- `metadata.source`: Optional identifier for the source of this question (e.g., "remember" for /remember command). Used for analytics tracking. Type: string

### Bash
- `command`: The command to execute Type: string
- `timeout`: Optional timeout in milliseconds (max 600000) Type: number
- `description`: Clear, concise description of what this command does in active voice. Never use words like "complex" or "risk" in the description - just describe what it does.

For simple commands (git, npm, standard CLI tools), keep it brief (5-10 words):
- ls → "List files in current directory"
- git status → "Show working tree status"
- npm install → "Install package dependencies"

For commands that are harder to parse at a glance (piped commands, obscure flags, etc.), add enough context to clarify what it does:
- find . -name "*.tmp" -exec rm {} \; → "Find and delete all .tmp files recursively"
- git reset --hard origin/main → "Discard all local changes and match remote main"
- curl -s url | jq '.data[]' → "Fetch JSON from URL and extract data array elements" Type: string
- `run_in_background`: Set to true to run this command in the background. Use TaskOutput to read the output later. Type: boolean
- `dangerouslyDisableSandbox`: Set this to true to dangerously override sandbox mode and run commands without sandboxing. Type: boolean

### Edit
- `file_path`: The absolute path to the file to modify Type: string
- `old_string`: The text to replace Type: string
- `new_string`: The text to replace it with (must be different from old_string) Type: string
- `replace_all`: Replace all occurrences of old_string (default false) Type: boolean Default: false

### EnterPlanMode
- (no parameters)

### EnterWorktree
- `name`: Optional name for the worktree. A random name is generated if not provided. Type: string

### ExitPlanMode
- `allowedPrompts`: Prompt-based permissions needed to implement the plan. These describe categories of actions rather than specific commands. Type: array
- `allowedPrompts[].tool`: The tool this prompt applies to Allowed: Bash Type: string
- `allowedPrompts[].prompt`: Semantic description of the action, e.g. "run tests", "install dependencies" Type: string

### Glob
- `pattern`: The glob pattern to match files against Type: string
- `path`: The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided. Type: string

### Grep
- `pattern`: The regular expression pattern to search for in file contents Type: string
- `path`: File or directory to search in (rg PATH). Defaults to current working directory. Type: string
- `glob`: Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob Type: string
- `output_mode`: Output mode: "content" shows matching lines (supports -A/-B/-C context, -n line numbers, head_limit), "files_with_matches" shows file paths (supports head_limit), "count" shows match counts (supports head_limit). Defaults to "files_with_matches". Allowed: content, files_with_matches, count Type: string
- `-B`: Number of lines to show before each match (rg -B). Requires output_mode: "content", ignored otherwise. Type: number
- `-A`: Number of lines to show after each match (rg -A). Requires output_mode: "content", ignored otherwise. Type: number
- `-C`: Alias for context. Type: number
- `context`: Number of lines to show before and after each match (rg -C). Requires output_mode: "content", ignored otherwise. Type: number
- `-n`: Show line numbers in output (rg -n). Requires output_mode: "content", ignored otherwise. Defaults to true. Type: boolean
- `-i`: Case insensitive search (rg -i) Type: boolean
- `type`: File type to search (rg --type). Common types: js, py, rust, go, java, etc. More efficient than include for standard file types. Type: string
- `head_limit`: Limit output to first N lines/entries, equivalent to "| head -N". Works across all output modes: content (limits output lines), files_with_matches (limits file paths), count (limits count entries). Defaults to 0 (unlimited). Type: number
- `offset`: Skip first N lines/entries before applying head_limit, equivalent to "| tail -n +N | head -N". Works across all output modes. Defaults to 0. Type: number
- `multiline`: Enable multiline mode where . matches newlines and patterns can span lines (rg -U --multiline-dotall). Default: false. Type: boolean

### NotebookEdit
- `notebook_path`: The absolute path to the Jupyter notebook file to edit (must be absolute, not relative) Type: string
- `cell_id`: The ID of the cell to edit. When inserting a new cell, the new cell will be inserted after the cell with this ID, or at the beginning if not specified. Type: string
- `new_source`: The new source for the cell Type: string
- `cell_type`: The type of the cell (code or markdown). If not specified, it defaults to the current cell type. If using edit_mode=insert, this is required. Allowed: code, markdown Type: string
- `edit_mode`: The type of edit to make (replace, insert, delete). Defaults to replace. Allowed: replace, insert, delete Type: string

### Read
- `file_path`: The absolute path to the file to read Type: string
- `offset`: The line number to start reading from. Only provide if the file is too large to read at once Type: number
- `limit`: The number of lines to read. Only provide if the file is too large to read at once. Type: number
- `pages`: Page range for PDF files (e.g., "1-5", "3", "10-20"). Only applicable to PDF files. Maximum 20 pages per request. Type: string

### SendMessage
- `type`: Message type: "message" for DMs, "broadcast" to all teammates, "shutdown_request" to request shutdown, "shutdown_response" to respond to shutdown, "plan_approval_response" to approve/reject plans Allowed: message, broadcast, shutdown_request, shutdown_response, plan_approval_response Type: string
- `recipient`: Agent name of the recipient (required for message, shutdown_request, plan_approval_response) Type: string
- `content`: Message text, reason, or feedback Type: string
- `summary`: A 5-10 word summary of the message, shown as a preview in the UI (required for message, broadcast) Type: string
- `request_id`: Request ID to respond to (required for shutdown_response, plan_approval_response) Type: string
- `approve`: Whether to approve the request (required for shutdown_response, plan_approval_response) Type: boolean

### Skill
- `skill`: The skill name. E.g., "commit", "review-pr", or "pdf" Type: string
- `args`: Optional arguments for the skill Type: string

### Task
- `description`: A short (3-5 word) description of the task Type: string
- `prompt`: The task for the agent to perform Type: string
- `subagent_type`: The type of specialized agent to use for this task Type: string
- `model`: Optional model to use for this agent. If not specified, inherits from parent. Prefer haiku for quick, straightforward tasks to minimize cost and latency. Allowed: sonnet, opus, haiku Type: string
- `resume`: Optional agent ID to resume from. If provided, the agent will continue from the previous execution transcript. Type: string
- `run_in_background`: Set to true to run this agent in the background. The tool result will include an output_file path - use Read tool or Bash tail to check on output. Type: boolean
- `max_turns`: Maximum number of agentic turns (API round-trips) before stopping. Used internally for warmup. Type: integer Range: ..9007199254740991
- `isolation`: Isolation mode. "worktree" creates a temporary git worktree so the agent works on an isolated copy of the repo. Allowed: worktree Type: string

### TaskOutput
- `task_id`: The task ID to get output from Type: string
- `block`: Whether to wait for completion Type: boolean Default: true
- `timeout`: Max wait time in ms Type: number Default: 30000 Range: 0..600000

### TaskStop
- `task_id`: The ID of the background task to stop Type: string
- `shell_id`: Deprecated: use task_id instead Type: string

### TeamCreate
- `team_name`: Name for the new team to create. Type: string
- `description`: Team description/purpose. Type: string
- `agent_type`: Type/role of the team lead (e.g., "researcher", "test-runner"). Used for team file and inter-agent coordination. Type: string

### TeamDelete
- (no parameters)

### TodoWrite
- `todos`: The updated todo list Type: array
- `todos[].content`: Type: string
- `todos[].status`: Allowed: pending, in_progress, completed Type: string
- `todos[].activeForm`: Type: string

### WebFetch
- `url`: The URL to fetch content from Type: string Format: uri
- `prompt`: The prompt to run on the fetched content Type: string

### WebSearch
- `query`: The search query to use Type: string
- `allowed_domains`: Only include search results from these domains Type: array
- `blocked_domains`: Never include search results from these domains Type: array

### Write
- `file_path`: The absolute path to the file to write (must be absolute, not relative) Type: string
- `content`: The content to write to the file Type: string

### Schemas not observed in trace payloads yet (gated)

These tools are in the de-minified bundle but did not appear in the live `/v1/messages` tool arrays I captured.

- MCP tools only show up when MCP servers are connected and active. I have strong opinions on why MCPs are less efficient, so I don't really care about it.
- `ToolSearch` shows up when deferred/tool-discovery mode is enabled.
- `LSP` shows up when a language server is initialized.
- `StructuredOutput` likely requires structured-output mode flags.

So the parameters below are best-effort snippets and may be incomplete:

- `ListMcpResourcesTool`: `server` (optional, server name filter)
- `LSP`: `operation` (enum: goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol, goToImplementation, prepareCallHierarchy, incomingCalls, outgoingCalls)
- `mcp`: passthrough object (no fixed fields in snippet)
- `ReadMcpResourceTool`: `server` (MCP server name)
- `StructuredOutput`: passthrough object (no fixed fields in snippet)
- `ToolSearch`: `query` (search tools; supports `select:<tool_name>`)
