# Reporting a run to a Teams channel

Everything on this side is built. What a new channel needs is a Power Automate
workflow to receive the run and post it. That is what this page sets up.

## What gets posted

One run produces a series of Adaptive Cards:

| Card      | Holds                                                             |
| --------- | ----------------------------------------------------------------- |
| the first | outcome, counts, pass rate, duration, services, credits, 2 charts |
| the rest  | one per section — Data, Workflows, Site — a row per scenario      |

The first card carries two buttons: **Open the run**, and **Download the full
report**. The second is the one to hand someone: every test, its trace and its
screenshots. A local run has no link, because the report is already on your
machine (`bun run report`).

Charts are a Teams extension, so they are dropped on clients that cannot draw
them. Every figure they show is also written out beside them, so nothing is
lost.

## Choosing a layout

`TEAMS_LAYOUT` decides how the cards reach the channel.

| Value    | What happens                                          | Threaded |
| -------- | ----------------------------------------------------- | -------- |
| unset    | one message with everything                           | n/a      |
| `split`  | one request per card, each its own message            | no       |
| `thread` | every card in one request; the flow posts and replies | yes      |

Only `thread` gives a summary with the sections as replies underneath.

**Why the flow has to do the threading:** the webhook answers `202 Accepted`
with an empty body and no message id. Nothing in this repo ever learns the id of
the message it just created, so nothing here can reply to it. The flow is the
only thing that sees the id.

## Setting up a channel

You need permission to create a workflow, and the channel must be **standard or
shared** — a flow bot cannot post in a private channel.

**One thing to know first.** Some fields take an _expression_, which is code,
not text. When a step says "use the Expression tab", it means: click the field,
wait for the panel, click the **Expression** tab, type the code there, click
**OK**. Typing it straight into the field saves it as plain words and the flow
does nothing.

### 1. Create the workflow

Teams → the channel → **⋯** → **Workflows** → **Build from scratch**.

If that builder will not let you add an **Apply to each** or type an expression,
build the same flow at [make.powerautomate.com](https://make.powerautomate.com)
→ **Create** → **Instant cloud flow**. The Teams Workflows app lists it either
way.

### 2. Add the trigger

Pick **When a Teams webhook request is received**, and set **Who can trigger
the flow?** to **Anyone**. Without that, CI cannot send anything.

The **HTTP POST URL** appears only after the first save, and a flow cannot be
saved without an action — so it shows up at the end of step 3.

### 3. Post the summary card

**+ New step** → search `post card` → **Post card in a chat or channel**.

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Post as       | Flow bot                                             |
| Post in       | Channel                                              |
| Team          | your team                                            |
| Channel       | your channel                                         |
| Adaptive Card | Expression tab: `string(triggerBody()?['cards'][0])` |

**Save.** The trigger's **HTTP POST URL** now exists — copy it.

### 4. Check that much works

```bash
cat > /tmp/probe.json <<'JSON'
{ "cards": [
  { "type": "AdaptiveCard", "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "probe 1 — parent", "weight": "Bolder" }] },
  { "type": "AdaptiveCard", "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "probe 2 — reply" }] }
] }
JSON
```

```bash
curl -s -X POST -H 'content-type: application/json' --data @/tmp/probe.json '<HTTP POST URL>'
```

**probe 1 — parent** should appear in the channel. If it does not, fix that
before adding more steps. A `202` only means the request arrived.

### 5. Loop over the remaining cards

**+ New step** → **Apply to each**. For its input, use the Expression tab:

```
skip(triggerBody()?['cards'], 1)
```

Do not leave whatever the designer prefilled — the run then fails with
_property 'attachments' doesn't exist_.

Then **⋯** on the Apply to each box → **Settings** → turn **Concurrency
Control** off, or the sections arrive shuffled.

### 6. Reply with each section

Inside the loop: **Add an action** → **Reply with an adaptive card in a
channel**.

| Field         | Value                                              |
| ------------- | -------------------------------------------------- |
| Team, Channel | the same as step 3                                 |
| Message ID    | **Dynamic content** → **Message ID** (from step 3) |
| Adaptive Card | Expression tab: `string(items('Apply_to_each'))`   |

If you rename the loop, the name inside `items()` changes with it: the action's
name, spaces replaced by underscores. **Save.**

### 7. Check the whole thing

Send the probe again. You should now see **probe 1 — parent** with **probe 2 —
reply** underneath it.

### 8. Point the suite at it

Store the URL as the repository secret `MS_TEAMS_NEW_WEBHOOK_URI`, then set the
layout in `.github/workflows/e2e.yml`:

```yaml
- name: Post Teams card
  if: always() && github.event_name != 'pull_request'
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.MS_TEAMS_NEW_WEBHOOK_URI }}
    TEAMS_LAYOUT: thread
  run: bun scripts/ci/teams-card.ts test-results/summary.json
```

Locally, put both in `.env`. **`TEAMS_LAYOUT=thread` matters** — without it the
suite sends a shape this flow cannot read, and nothing is posted.

```bash
bun run test
bun run notify
```

## Tagging people when a run cannot be paid for

A run that stops because the lab has no credits has not found a bug, and a card
saying only "failed" sends people looking for one. Set `TEAMS_ALERT_MENTIONS` to
`Name <sign-in address>`, comma separated:

```
TEAMS_ALERT_MENTIONS=Ada Lovelace <ada@example.org>, Alan Turing <alan@example.org>
```

Those people are mentioned **only** when the lab itself cannot pay — never for
ordinary failures. Mentions render only when a flow posts the card.

## Limits worth knowing

- **28 KB per message.** Every card this repo builds stays under 25 KB.
- **The combined request is bigger.** `thread` sends every card at once — about
  32 KB for a suite this size. A legacy Microsoft 365 connector webhook enforces
  28 KB on the request and would reject that; the Workflows-app trigger is a
  Power Automate endpoint whose limit is far higher. [Connectors are being
  retired][retirement] anyway, so Workflows is the path to be on.
- **Four requests per second.** `split` sleeps between posts. `thread` sends one
  request and lets the flow pace the replies.
- **Charts need a desktop client.** They drop on mobile; the numbers stay.

## When something goes wrong

Read the flow's run history first: Power Automate → **My flows** → your flow →
the newest run.

| What you see                              | What it means                                                        |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Save is greyed out                        | A flow needs an action. Add step 3 first.                            |
| `property 'attachments' doesn't exist`    | The loop input is the designer's default. Use `skip(…, 1)`.          |
| It says it sent, but the channel is empty | `202` proves nothing. Read the run history.                          |
| Nothing arrives, run history empty        | Wrong URL, or the flow is switched off.                              |
| The flow runs green but the card is blank | The expression was typed into the field, not the **Expression** tab. |
| Only the summary posts, no replies        | The loop input is wrong.                                             |
| Sections arrive out of order              | Concurrency Control is on. Turn it off.                              |
| Nothing threaded                          | `TEAMS_LAYOUT` is unset.                                             |
| A `413`                                   | The payload exceeded the endpoint's limit. See the limits above.     |
| Nothing posts, and no output              | `TEAMS_WEBHOOK_URL` is unset. The script says so and exits cleanly.  |
| Names show as `<at>Ada</at>`              | Posted through a legacy webhook rather than a flow.                  |

## The other layouts

`split` needs no flow: point `TEAMS_WEBHOOK_URL` at anything that accepts an
Adaptive Card message. Cards arrive as separate messages, in order, unthreaded.
Leaving `TEAMS_LAYOUT` unset posts one message with everything.

Microsoft Graph threads properly and needs no Power Automate, but it costs an
app registration and the `ChannelMessage.Send` permission. That is why the flow
is the default here.

[retirement]: https://devblogs.microsoft.com/microsoft365dev/retirement-of-office-365-connectors-within-microsoft-teams/
