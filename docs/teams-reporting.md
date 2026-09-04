# Reporting a run to a Teams channel

How to point this suite at a Teams channel, and what arrives when it does.

Everything on this side is already built. What a new channel needs is a Power
Automate workflow to receive the run and post it, which is what most of this
page is about.

## What gets posted

One run produces a series of Adaptive Cards:

| Card      | Holds                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| the first | outcome, counts, pass rate, duration, the service table, and the credit block |
| the rest  | one per product section — Data, Workflows, Site — with a row per scenario     |

A section whose table would not fit one message is split across numbered parts,
measured by real byte count rather than a guessed row count.

The first card also draws two charts:

- a **donut** of the outcome — passed, failed, flaky and skipped, in the same
  colours the status pills use, with any status the run never produced left out;
- a **stacked bar** of the budget, where spent and left stack to exactly what
  the project was given, so the width of the green says how much headroom the
  run finished with.

`Chart.Donut` and `Chart.HorizontalBar.Stacked` are Teams extensions rather than
part of the Adaptive Cards schema, so both carry `fallback: "drop"`. A host that
cannot draw them — Teams mobile, Outlook, an older client — leaves them out
instead of rendering a hole, and the same numbers sit in the fact lists beside
them either way.

## Choosing a layout

`TEAMS_LAYOUT` decides how those cards reach the channel.

| Value    | What happens                                                 | Threaded |
| -------- | ------------------------------------------------------------ | -------- |
| unset    | one message with everything                                  | n/a      |
| `split`  | one request per card, each its own channel message           | no       |
| `thread` | every card in one request, for a flow that posts and replies | yes      |

Only `thread` gives you a summary with the sections as replies underneath it.
The reason is worth knowing, because it explains the whole shape of the flow
below: **the webhook answers `202 Accepted` with an empty body and no message
id**. Nothing in this repo ever learns the id of the message it just created, so
nothing here can reply to it. The flow is the only thing that sees the id, so
the flow has to do the threading.

That is why `thread` sends `{ "cards": [ … ] }` in a single request rather than
one request per card. The flow posts `cards[0]`, keeps its message id, and
replies with the rest.

## Setting up a channel

You need permission to create a workflow, and the channel must be **standard or
shared**. Posting as a flow bot in a **private** channel is not supported yet.

### 1. Create the workflow

In Teams: go to the channel → **⋯** → **Workflows** → **Build from scratch**.

The builder embedded in Teams is a trimmed-down designer, and depending on your
tenant it may not let you add an **Apply to each** or write raw expressions. If
you hit that, build the same flow at [make.powerautomate.com](https://make.powerautomate.com)
→ **Create** → **Instant cloud flow**. The result is identical and the Teams
Workflows app lists it either way.

### 2. Trigger — _When a Teams webhook request is received_

Set **Who can trigger the flow?** to **Anyone**. Without it, CI cannot POST to
the URL.

The **HTTP POST URL** stays empty until the flow is saved, and the flow cannot
be saved until it has at least one action — so it appears after step 3, not now.

This trigger has no **Request Body JSON Schema** box, unlike the generic HTTP
trigger. That means `cards` never appears as a dynamic-content chip, which is
why every reference to it below is written as an expression instead.

### 3. Action — _Post card in a chat or channel_

This posts the summary, and is the message everything else hangs off.

- **Post as**: Flow bot
- **Post in**: Channel
- **Team** / **Channel**: the ones you want
- **Adaptive Card**: switch the field to the **Expression** tab and enter

  ```
  string(triggerBody()?['cards'][0])
  ```

  The field takes JSON as text. `string()` says so outright rather than relying
  on the designer to serialise an object for you.

Save now. The trigger's HTTP POST URL appears once it succeeds — copy it.

### 4. Action — _Apply to each_

Add it after the post. Set its input, as an expression, to every card except the
one already posted:

```
skip(triggerBody()?['cards'], 1)
```

Open **Settings** on this action and leave **Concurrency Control off**. The loop
is then sequential and the sections arrive in order; turn it on and they arrive
shuffled.

### 5. Inside the loop — _Reply with an adaptive card in a channel_

- **Message ID**: pick **Message ID** from the dynamic content of step 3.

  Choose it from the picker rather than typing an expression. The underlying
  field name differs between connector versions, and the picker gets it right.

- **Team** / **Channel**: the same ones as step 3.
- **Adaptive Card**:

  ```
  string(items('Apply_to_each'))
  ```

  If you renamed the loop, the name inside `items()` changes with it — it is the
  action's name with spaces replaced by underscores.

Save.

### 6. Point the suite at it

Set the webhook URL as the repository secret `MS_TEAMS_NEW_WEBHOOK_URI`, then
add the layout to the notify step in `.github/workflows/e2e.yml`:

```yaml
- name: Post Teams card
  if: always() && github.event_name != 'pull_request'
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.MS_TEAMS_NEW_WEBHOOK_URI }}
    TEAMS_LAYOUT: thread
  run: bun scripts/ci/teams-card.ts test-results/summary.json
```

Locally, put `TEAMS_WEBHOOK_URL` and `TEAMS_LAYOUT=thread` in `.env`.

### 7. Prove it works

Build a payload from a real run's summary:

```bash
bun -e "import{buildThreadPayload}from'./scripts/ci/teams-card';console.log(JSON.stringify(buildThreadPayload(await Bun.file('test-results/summary.json').json()),null,2))" > /tmp/thread-payload.json
```

Post it once:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'content-type: application/json' \
  --data @/tmp/thread-payload.json '<HTTP POST URL>'
```

Then open the flow's **run history**. On the first run, expand the trigger and
read its **Outputs**: confirm the body arrived as `{"cards":[…]}` and that the
array holds one entry per card. This is the step that catches a trigger which
wrapped or renamed the body, and it is worth doing once per tenant rather than
assuming.

The whole path, end to end:

```bash
bun run summarize && TEAMS_LAYOUT=thread bun scripts/ci/teams-card.ts test-results/summary.json
```

## Tagging people when a run cannot be paid for

A run that stops because the virtual lab has no credits has not found a bug, and
a card that says only "failed" sends people looking for one. So the card says so
in its own words, and can pull the right people into the channel.

Set `TEAMS_ALERT_MENTIONS` to `Name <sign-in address>`, comma separated:

```
TEAMS_ALERT_MENTIONS=Ada Lovelace <ada@example.org>, Alan Turing <alan@example.org>
```

Those people are mentioned **only** when the lab itself cannot pay — not when a
run merely spent its budget, and not for ordinary test failures. The mention
rides on the first card, so in a thread it fires once, on the parent.

Mentions render only when a flow posts the card. A legacy incoming webhook drops
the mention entities and shows the bare name as written.

## Limits worth knowing

- **28 KB per message.** Teams rejects anything larger. Every card this repo
  builds is kept under 25 KB, so each individual post is safely inside it.
- **The combined request is not.** `thread` sends every card at once. Measured
  against a synthetic run the size of this suite — 34 features over three
  sections — that request was about 32 KB:

  | Card               | Bytes  |
  | ------------------ | ------ |
  | summary + services | 824    |
  | Data               | 22,434 |
  | Workflows          | 5,608  |
  | Site               | 3,975  |
  | one request        | 32,444 |

  Whether that matters depends on the endpoint. A legacy Microsoft 365 connector
  webhook enforces 28 KB on the request and would reject it. The Workflows-app
  trigger is a Power Automate HTTP endpoint whose limits are far higher, so it
  passes. Since [connectors are being retired][retirement], the Workflows path is
  the one to be on anyway.

  Nothing guards the combined size today. If a run ever grows enough to be
  refused, the fix is to drop passing scenarios from the section tables and keep
  only failures and flaky ones, which would remove most of that 22 KB.

- **Four requests per second.** `split` sleeps between posts for this reason.
  `thread` sends one request and lets the flow pace the replies.
- **Charts need a desktop client.** Teams mobile reliably renders Adaptive Cards
  up to v1.2, so the two charts drop there. Nothing else about the card changes,
  because every figure they draw is also written out beside them.

## When something goes wrong

| What you see                             | Why                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Save is greyed out in the designer       | a flow needs at least one action; add step 3 first                           |
| The flow runs but the card is blank      | the Adaptive Card field got an object, not JSON text — wrap it in `string()` |
| Only the summary posts, no replies       | the loop input is wrong; it must be `skip(triggerBody()?['cards'], 1)`       |
| Sections arrive out of order             | Concurrency Control is on for the **Apply to each** — turn it off            |
| `413` or a rejected request              | the combined payload exceeded the endpoint's limit; see the limits above     |
| Nothing posts and CI says nothing        | `TEAMS_WEBHOOK_URL` is unset — the script logs that and exits cleanly        |
| Names show as `<at>Ada</at>` in the card | posted through a legacy webhook rather than a flow                           |

## The other two layouts

`split` needs no flow at all: point `TEAMS_WEBHOOK_URL` at any endpoint that
accepts an Adaptive Card message and set `TEAMS_LAYOUT=split`. Cards arrive as
separate channel messages, in order but unthreaded.

Leaving `TEAMS_LAYOUT` unset posts one message with everything, dropping detail
a level at a time if it would otherwise exceed the limit.

## The alternative to a flow

Microsoft Graph (`POST /teams/{id}/channels/{id}/messages/{id}/replies`) threads
properly and needs no Power Automate. It costs an app registration and the
`ChannelMessage.Send` permission, which is why the flow is the default here.

[retirement]: https://devblogs.microsoft.com/microsoft365dev/retirement-of-office-365-connectors-within-microsoft-teams/
