---
date: 2026-06-29 22:10
description: A rejected BSides Vegas talk, an agent, a proxy, and a practical loop for turning observed application traffic into an auditable OpenAPI spec.
tags: AI, Security, Reverse-Engineering, APIs, Agents
draft: true
---

# Give the Agent a Proxy

My BSides Vegas talk got rejected, which is rude because now I have to explain the idea on the internet instead of in a hotel conference room.

The title was:

> Give the Agent a Proxy: Automagically Reverse Engineering APIs

The thesis is simple: the spec is already in the traffic.

For years, API reverse engineering has looked like a little solo logistics business. Run the app. Click the thing. Capture traffic. Copy requests out of a proxy. Guess which path segment is an ID. Hand-edit OpenAPI YAML. Run a validator. Notice the app made another request you missed. Go back to the browser. Click another thing. Repeat until you either have a useful spec or lose the will to live.

The work is not glamorous, but it is useful. Defenders do it for API inventory. AppSec teams do it when docs are missing or stale. Platform teams do it during client migrations. People buying companies do it when the inherited product has "documentation" in the same way a haunted attic has "storage."

So what changes when the thing doing the clicking is not a bored human, but an agent with three boring powers?

1. Drive the app.
2. Watch the HTTP traffic.
3. Update a spec, then check itself against new evidence.

That is the whole trick. Give the agent a browser. Give it mitmproxy. Make it bring receipts.

## The Primitive

The primitive version already exists: tools like `mitmproxy2swagger` can turn captured HTTP flows into an OpenAPI document.

That workflow is good because it starts from reality. The app actually sent `GET /api/users/123`. The server actually returned JSON. Nobody sat in a meeting and guessed that "surely the response has a `name` field."

But the human still sits in the middle:

- choosing which UI flows to exercise;
- deciding whether `/users/123` and `/users/456` are really `/users/{id}`;
- cleaning examples;
- redacting cookies and tokens;
- deciding whether one response is enough to infer a schema;
- rerunning validation after the next capture.

That middle part is exactly where agents are interesting. Not because "AI writes YAML." That is the least interesting version of the idea. The useful version is a loop.

## The Loop

The harness has five pieces:

1. A browser or app driver, usually Playwright for the easy demo.
2. A mitmproxy capture stream.
3. A normalizer that turns raw HTTP flows into structured request and response events.
4. An OpenAPI writer that proposes paths, methods, parameters, schemas, examples, and auth hints.
5. A verifier that checks fresh traffic against the current spec.

The verifier is the important part. Without it, this is just a YAML confidence machine.

With it, the system can say:

- I saw `GET /profiles/101` and `GET /profiles/207`, so `/profiles/{profile_id}` is plausible.
- I only saw one example of `POST /messages`, so the request schema is low confidence.
- I saw an `Authorization` header, but I am not putting the token into the public example.
- The current spec says `age` is an integer, but this response returned `null`.
- The app made `PATCH /settings/notifications`, and that path is missing from the document.

That mismatch becomes the next task. The agent does not ask "what should I hallucinate next?" It asks "what traffic would reduce uncertainty?"

## The Hacker News Version

The best demo target is Hacker News.

Not because HN is complicated. The opposite. HN is perfect because it is small, familiar, mostly server-rendered, and has an official public API we can compare against afterward.

The agent sees the website:

```text
https://news.ycombinator.com/
```

The ground truth lives here:

```text
https://hacker-news.firebaseio.com/v0/
```

The official docs live at [github.com/HackerNews/API](https://github.com/HackerNews/API), and they give us clean read endpoints:

```text
GET /v0/topstories.json
GET /v0/newstories.json
GET /v0/beststories.json
GET /v0/askstories.json
GET /v0/showstories.json
GET /v0/jobstories.json
GET /v0/item/{id}.json
GET /v0/user/{username}.json
GET /v0/maxitem.json
GET /v0/updates.json
```

That makes HN a nice test of humility. The agent can explore the website through the browser, infer what it thinks exists, and then we can grade it against the documented Firebase surface.

I ran the corrected version in a throwaway `uv` environment, using `agent-browser` as the actual browser driver:

```text
uv venv --python 3.13
uv pip install mitmproxy mitmproxy2swagger pyyaml
```

Then I started `mitmdump` with a tiny redaction addon and drove the browser through it:

```text
uv run mitmdump \
  --listen-port 8091 \
  --set block_global=false \
  -s redact_hn.py \
  -w hn-agent-browser.flows
```

Each navigation was an explicit browser action, paced with a real pause between pages:

```text
AGENT_BROWSER_SESSION=hn-proxy-v3 \
agent-browser --proxy http://127.0.0.1:8091 \
  open https://news.ycombinator.com/news
```

The browser did the non-destructive crawl first: front page, newest, past, ask, show, jobs, a real item page, a user page, submitted, threads, and then the login page. Credentials came from `/tmp/hn.env`, not the prompt:

```text
HN_USERNAME=<present>
HN_PASSWORD=<present>
```

The redactor ran after each response, so the real request could reach the server, but the saved flow had sensitive headers, cookies, password fields, and `auth` query values replaced before landing on disk. I also checked the resulting flow/spec artifacts afterward and the password was not present.

There were two very normal automation bugs hiding in this part.

First, HN returns a generic:

```text
Sorry.
```

for login/profile-ish pages when `agent-browser` is running headless. Headed mode renders the real login form. That is a useful reminder that the browser is part of the experiment. If the agent changes the client shape, the server may change the contract it shows you.

Second, do not `source` a credentials file unless you really mean "interpret this as shell." The password in `/tmp/hn.env` had separator-ish characters, and my first pass treated the file like a shell env file. The fix was to parse it as plain text and preserve the raw value after the first `=`:

```python
def raw_env_value(key):
    prefix = key + "="
    for raw in Path("/tmp/hn.env").read_text().splitlines():
        if raw.startswith(prefix):
            return raw[len(prefix):]
    raise KeyError(key)
```

With headed mode and raw credential parsing, login succeeded. The rendered HN header changed from:

```text
... | submit | login
```

to:

```text
... | submit | navanchauhan | logout
```

The browser found a concrete story ID from the rendered page:

```text
item_id = 48721903
```

The public pages loaded normally:

```text
GET /news
GET /newest
GET /front
GET /ask
GET /show
GET /jobs
GET /item?id=48721903
```

The account-ish pages were more interesting in headless mode. `GET /user?id=stared`, `GET /user?id=pg`, `GET /submitted?id=pg`, `GET /threads?id=pg`, and `GET /login?goto=news` loaded, but the visible body was just:

```text
Sorry.
```

So the harness should mark those observations as client-mode-dependent, not universal facts about HN. "Headless saw `Sorry.`; headed saw the login form" belongs in the uncertainty report.

After the web crawl, I loaded the official API endpoints as normal browser navigations through the same proxy. No Python `requests`, no curl, no side channel:

```text
open https://hacker-news.firebaseio.com/v0/topstories.json
open https://hacker-news.firebaseio.com/v0/newstories.json
open https://hacker-news.firebaseio.com/v0/beststories.json
open https://hacker-news.firebaseio.com/v0/askstories.json
open https://hacker-news.firebaseio.com/v0/showstories.json
open https://hacker-news.firebaseio.com/v0/jobstories.json
open https://hacker-news.firebaseio.com/v0/maxitem.json
open https://hacker-news.firebaseio.com/v0/updates.json
open https://hacker-news.firebaseio.com/v0/item/48721903.json
open https://hacker-news.firebaseio.com/v0/user/pg.json
```

Then `mitmproxy2swagger` did exactly the kind of halfway-helpful thing that makes this workflow interesting. The first pass did not emit active operations. It wrote discovered paths under `x-path-templates` with `ignore:` prefixes:

```yaml
x-path-templates:
  - ignore:/ask
  - ignore:/front
  - ignore:/item
  - ignore:/jobs
  - ignore:/login
  - ignore:/newest
  - ignore:/news
  - ignore:/show
  - ignore:/submitted
  - ignore:/threads
  - ignore:/user
```

For the Firebase API it found:

```yaml
x-path-templates:
  - ignore:/v0/askstories.json
  - ignore:/v0/beststories.json
  - ignore:/v0/item/48721903.json
  - ignore:/v0/jobstories.json
  - ignore:/v0/maxitem.json
  - ignore:/v0/newstories.json
  - ignore:/v0/showstories.json
  - ignore:/v0/topstories.json
  - ignore:/v0/updates.json
  - ignore:/v0/user/pg.json
```

This is the point where the agent should patch the spec draft, not the traffic. Static assets like `/news.css`, `/hn.js`, `y18.svg`, and `s.gif` stay ignored. Meaningful HTML routes get promoted. Concrete API examples get templated:

```yaml
- /v0/item/{item_id}.json
- /v0/user/{username}.json
```

After that patch, rerunning `mitmproxy2swagger` produced an HN web contract with 11 observed operations:

```text
GET /ask
GET /front
GET /item
GET /jobs
GET /login
GET /newest
GET /news
GET /show
GET /submitted
GET /threads
GET /user
```

And a Firebase API contract with 10 observed operations:

```text
GET /v0/askstories.json
GET /v0/beststories.json
GET /v0/item/{item_id}.json
GET /v0/jobstories.json
GET /v0/maxitem.json
GET /v0/newstories.json
GET /v0/showstories.json
GET /v0/topstories.json
GET /v0/updates.json
GET /v0/user/{username}.json
```

Those two lists should not be merged. The browser app exposes a different contract from the public JSON API. A good harness should not smash them together just because both involve HN stories.

Then the verifier can ask better questions:

```text
Observed web route:
  GET /item?id=48721903

Comparable API route:
  GET /v0/item/{id}.json

Check:
  Does the HTML page's story id correspond to an API item id?
  Do title, url, by, score, descendants, and kids agree where visible?
  Which fields exist in the API but not in the page?
  Which page actions have no public API equivalent?
```

This gives the demo a satisfying scoreboard. The agent inferred routes from traffic, but the official docs let us separate "correctly discovered" from "plausible nonsense."

Login is worth keeping in the demo plan, but only with guardrails. With headed browser mode, raw credential parsing, and a throwaway account, the authenticated read/write-adjacent surface to observe is:

```text
POST /login
GET  /news
GET  /item?id=44001234
GET  /vote?id=44001234&how=up&goto=news
GET  /favorite?id=44001234&auth=<redacted>&goto=item%3Fid%3D44001234
POST /comment
POST /submit
GET  /threads?id=<username>
GET  /submitted?id=<username>
GET  /favorites?id=<username>
```

The exact methods and parameters should be discovered from real captured forms, not assumed. HN is an especially good place to demonstrate that because many actions are old-school HTML form or link workflows, not neat JSON calls. The agent has to inspect forms, hidden fields, redirects, cookies, and `goto` parameters. It cannot just pretend every product is a React app with `/api/v1`.

For the first run, the uncertainty list is concrete:

```text
- Headless browser mode showed "Sorry." for login/profile-ish pages.
- Headed browser mode showed the login form.
- Raw parsing of `/tmp/hn.env` was required; shell-sourcing credentials is not safe for separator-heavy passwords.
- Login succeeded after raw parsing, confirmed by the `navanchauhan | logout` header.
- Authenticated mutating actions were intentionally not exercised.
- /user, /submitted, and /threads still need a headed authenticated capture pass before claiming coverage.
- /v0/item/{item_id}.json was templated from one concrete item id.
- /v0/user/{username}.json was templated from one concrete API username.
- Static assets were intentionally ignored.
```

The final comparison can have three buckets:

```text
Documented public API:
  Firebase read endpoints the official docs describe.

Observed web contract:
  HTML routes, form posts, query params, redirects, and cookies seen in browser traffic.

No public equivalent:
  Login, voting, favoriting, commenting, submitting, account settings.
```

That is a stronger demo than a fake dating app because the audience can check the work. The agent does not merely generate an OpenAPI spec. It generates a spec, an evidence bundle, and a diff against reality.

## A Toy Dating App That Nobody Should Sue Me Over

People suggested Tinder or Hinge as examples because they are easy to understand. Swipe left, swipe right, match, message, edit profile. Great API shape. Terrible demo target unless you have permission.

So the talk demo should use a fake dating app called `Definitely Not Hinge`.

The app has just enough behavior to be interesting:

- view a profile feed;
- like a profile;
- pass on a profile;
- match with a seeded account;
- send a message;
- update preferences;
- upload a profile prompt.

The agent starts with a blank spec and a browser. It logs in with a demo account, clicks through the normal flow, and the proxy sees:

```text
GET  /api/session
GET  /api/profiles?cursor=eyJwYWdlIjoxfQ
POST /api/profiles/42/like
POST /api/profiles/84/pass
GET  /api/matches
POST /api/matches/7/messages
PATCH /api/preferences
```

The first pass is concrete and ugly. That is good.

Then the path-templating pass proposes:

```text
/api/profiles/{profile_id}/like
/api/profiles/{profile_id}/pass
/api/matches/{match_id}/messages
```

But it should not overdo it. A bad agent sees `/api/v1` and decides `v1` is `{version}`. A worse agent sees `/api/profiles/top` and `/api/profiles/42` and merges them into `/api/profiles/{id}`. That is how you get documentation that looks tidy and lies constantly.

The verifier's job is to be annoying in exactly the right way:

```text
Observed:
  GET /api/profiles/top

Current match:
  GET /api/profiles/{profile_id}

Problem:
  "top" matched a numeric profile_id template.

Action:
  Split static route /api/profiles/top from /api/profiles/{profile_id}.
```

This is the good kind of boring. It catches the lie before the lie becomes documentation.

## A Mac Catalyst Demo Is Better Than It Sounds

A browser demo is convenient, but a Mac Catalyst app is a fun version of this because it makes the point that "the website" is not the only client. Lots of modern desktop apps are just native shells around HTTP-shaped product surfaces.

Imagine a little Catalyst app called `Receipt Wrangler`. It scans receipts, shows an inbox, lets you categorize expenses, and syncs with a staging backend.

The agent can drive it through accessibility or a thin UI automation harness. The proxy sees the traffic:

```text
POST /v2/device/register
GET  /v2/inbox?limit=25
GET  /v2/receipts/7001
PATCH /v2/receipts/7001/category
POST /v2/receipts/7001/attachments
GET  /v2/sync/checkpoint
```

This example is nice because it forces the harness to deal with auth and state.

`POST /v2/device/register` is not a normal public endpoint just because the app called it. It might be bootstrap ceremony. It might return a device token. That token should not get dumped into the OpenAPI example like some cursed party favor.

The generated spec should say something closer to:

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer

x-evidence:
  captures:
    - flow-00017
    - flow-00031

x-uncertainty:
  - Device registration observed once during first launch.
  - Token response redacted.
  - Replay behavior not verified.
```

The output is not just "here is a spec." It is "here is the spec, here are the captures that support it, here are the parts I do not trust yet."

## The Staging Storefront

The cleanest demo is still a staging app you own.

Call it `TinyKart`. It has login, products, cart, checkout, and orders. Nothing spicy, but enough structure to show the loop.

The first crawl finds:

```text
GET  /api/products
GET  /api/products/sku_123
POST /api/cart/items
PATCH /api/cart/items/line_9
DELETE /api/cart/items/line_9
POST /api/checkout/quote
POST /api/orders
```

The schema inference pass can do useful work:

```yaml
Product:
  type: object
  required: [id, name, price_cents, currency]
  properties:
    id:
      type: string
      examples: [sku_123]
    name:
      type: string
    price_cents:
      type: integer
    currency:
      type: string
      examples: [USD]
```

But this is also where schema inference lies.

If the only observed currency is `USD`, that does not mean the enum is `["USD"]`. If every test product has `inventory_count: 10`, that does not mean the only valid inventory count is 10. If one checkout response has no `discounts` field, that does not mean discounts do not exist.

So the harness should preserve the difference between observation and truth:

```yaml
x-observed-values:
  currency: [USD]

x-confidence:
  currency_enum: low
  price_cents_type: high
  discounts_absent: low
```

That is not as pretty as a confident schema. It is more useful.

## How the Agent Decides What to Do Next

The agent should not wander randomly through the UI like a Roomba with a badge.

The next action should come from verifier failures and coverage gaps:

- Missing path: find a UI action likely to call it.
- Schema mismatch: repeat the flow with a different fixture.
- Low-confidence template: collect another example.
- Unseen error shape: submit an invalid but safe form value in staging.
- Auth uncertainty: observe login, refresh, logout, and expired-session behavior.
- Redaction risk: inspect examples before they enter the saved spec.

This is where the loop becomes better than the old workflow. The human does not have to remember every branch. The system keeps a ledger of uncertainty.

The agent can say:

```text
Current gap:
  POST /api/checkout/quote has only been observed with one-item carts.

Next task:
  Add two products to cart, request quote again, compare response schema.

Expected evidence:
  New capture supporting array behavior in line_items.
```

That is the behavior I want. Not omniscience. A clerk with a proxy and a notebook.

## Redaction Is Not Optional

Generated API docs love to leak secrets because examples are seductive. A real token looks so useful sitting there in the YAML. A real cookie makes the replay button work. A real email address makes the fixture look grounded.

No.

The redaction layer needs to run before examples enter the spec. It should catch:

- `Authorization` headers;
- cookies;
- session IDs;
- CSRF tokens;
- email addresses;
- phone numbers;
- names;
- addresses;
- internal IDs when they are sensitive;
- free-text fields that might contain user content.

The spec can keep the shape without keeping the secret:

```yaml
headers:
  Authorization:
    example: "Bearer <redacted>"
```

The evidence bundle can preserve raw captures in a controlled local store if your workflow allows it, but the generated spec should be safe to hand to another engineer without accidentally handing them a session.

## Stopping Rules

The harness needs a way to stop without pretending it is done.

Good stopping conditions:

- no verifier failures after N fresh flows;
- no new endpoints after N exploration steps;
- all required demo flows have supporting captures;
- remaining gaps require credentials, state, or permissions the agent does not have;
- a human review is needed before continuing.

Bad stopping condition:

- the model says "the API appears complete."

Completion is an evidence claim. If the evidence is not there, the output should say so.

## Failure Modes

This whole thing can fail in very ordinary ways.

One sample does not make a schema.

Not every number in a path is an ID.

Not every long string is a token.

Not every token belongs in the docs.

UI coverage is not API coverage.

Auth is not just another header.

Hidden state can make two identical requests behave differently.

Feature flags can make the agent document a world only one test account can see.

A flaky UI path can make the harness think an endpoint disappeared.

A verifier with the wrong metric just automates lying.

That last one is the scary one. If your verifier checks "does this look valid?" instead of "does this explain the traffic?", you have built a more expensive version of vibes.

## What the Final Artifact Should Look Like

The useful output is not just `openapi.yaml`.

The useful output is a small bundle:

```text
openapi.yaml
captures/
  flow-00001.json
  flow-00002.json
  ...
evidence.json
coverage.md
uncertainty.md
redactions.log
```

For each path, I want to know:

- which captures support it;
- how many examples were observed;
- which fields were inferred;
- which values were redacted;
- which templates were split or merged;
- which verifier checks passed;
- which parts still need human review.

That is what makes the output auditable. Not the fact that a model wrote a pretty description.

## The Point

This is not about bypassing authorization, stealing data, or pretending undocumented APIs are fair game. Use your own apps, staging systems, demo targets, client-approved scopes, or intentionally vulnerable labs.

The defensive value is straightforward:

- API inventory;
- shadow API discovery;
- brownfield documentation;
- client migration;
- security review;
- CI checks for API drift;
- evidence-backed docs for systems nobody wants to touch.

The offensive-adjacent lesson is also straightforward: an API is not hidden just because nobody wrote the docs.

But the real point is smaller and more useful:

API reverse engineering should be less like manually ferrying requests between a browser, a proxy, an editor, and a documentation tool.

It should be a feedback loop.

Run the app. Sniff the traffic. Let the agent explore. Let the verifier complain. Update the spec. Keep the evidence. Stop when the receipts run out.

Give the agent a proxy.

Make it bring receipts.
