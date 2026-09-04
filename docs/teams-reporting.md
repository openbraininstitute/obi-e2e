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

The first card carries two buttons: **Open the run**, and **Download the full
report** — the Playwright HTML report, which CI uploads as an artefact and links
directly. That is the one to hand someone: every test, its trace and its
screenshots, openable on their own machine. A local run has no link, because the
report is already on the machine that produced it (`bun run report`).

The first card also draws two charts:

- a **donut** of the outcome — passed, failed, flaky and skipped, in the same
  colours the status pills use. All four are always drawn, including the ones at
  zero, so the legend reads the same from run to run and a run with no failures
  says so rather than leaving it to be inferred;
- a **stacked bar** of the budget. The three parts add up to exactly what the
  project was given, and each is a different fate for a credit: **spent** by the
  run, **returned to the lab** by the teardown, or **stranded** — neither, and
  gone with the deleted project. All three are drawn even at zero, so a run that
  stranded nothing says so.

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

Follow these in order. Each step says exactly what to click.

You need permission to create a workflow, and the channel must be **standard or
shared**. Posting as a flow bot in a **private** channel is not supported yet.

**One thing to know before you start.** Some fields take an _expression_ — a
small piece of code, not text you type into the box. When a step below says
"use the Expression tab", it means: click the field, wait for the little panel
to open, click the tab named **Expression**, type the code there, then click
**OK**. Typing the code straight into the field stores it as plain words and the
flow does nothing.

### 1. Create the workflow

In Teams, go to the channel → **⋯** → **Workflows** → **Build from scratch**.

If the builder inside Teams will not let you add an **Apply to each** or type an
expression, build the same flow at [make.powerautomate.com](https://make.powerautomate.com)
→ **Create** → **Instant cloud flow**. It is the same flow, and the Teams
Workflows app lists it either way.

### 2. Add the trigger

Search for and pick **When a Teams webhook request is received**.

Set **Who can trigger the flow?** to **Anyone**. Without this, CI cannot send
anything.

The **HTTP POST URL** is empty for now. It appears after the first save, and a
flow cannot be saved until it has at least one action — so it shows up at the
end of step 3, not here.

This trigger has no box for a JSON schema. That is why every field below uses an
expression instead of picking `cards` from a list.

### 3. Post the summary card

Click **+ New step**. Search `post card`. Pick **Post card in a chat or
channel**.

| Field         | Value             |
| ------------- | ----------------- |
| Post as       | Flow bot          |
| Post in       | Channel           |
| Team          | your team         |
| Channel       | your channel      |
| Adaptive Card | expression, below |

For **Adaptive Card**, use the Expression tab:

```
string(triggerBody()?['cards'][0])
```

Click **Save**. The trigger's **HTTP POST URL** now exists — copy it.

### 4. Check that much works before going on

Write a tiny test payload:

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

Send it:

```bash
curl -s -X POST -H 'content-type: application/json' --data @/tmp/probe.json '<HTTP POST URL>'
```

A message saying **probe 1 — parent** should appear in the channel.

If nothing appears, stop here and fix it before adding more steps. See
[when something goes wrong](#when-something-goes-wrong). Note that `202` only
means the request arrived — it does not mean anything was posted.

### 5. Loop over the remaining cards

Click **+ New step**. Search `apply to each`. Pick **Apply to each**.

For its input, use the Expression tab. This is every card except the first,
which step 3 already posted:

```
skip(triggerBody()?['cards'], 1)
```

Do not leave whatever the designer filled in by itself. It often prefills
something else, and the run then fails with _property 'attachments' doesn't
exist_.

Then click **⋯** on the Apply to each box → **Settings** → make sure
**Concurrency Control** is **off**. With it on, the sections arrive shuffled.

### 6. Reply with each section

Inside the Apply to each box, click **Add an action**. Search `reply`. Pick
**Reply with an adaptive card in a channel**.

| Field         | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Team          | the same team as step 3                                |
| Channel       | the same channel as step 3                             |
| Message ID    | **Dynamic content** tab → **Message ID** (from step 3) |
| Adaptive Card | expression, below                                      |

For **Adaptive Card**, use the Expression tab:

```
string(items('Apply_to_each'))
```

If you renamed the loop, the name inside `items()` changes with it: it is the
action's name with spaces replaced by underscores.

Click **Save**.

### 7. Check the whole thing

Send the probe from step 4 again. You should now see:

- one message: **probe 1 — parent**
- one reply underneath it: **probe 2 — reply**

### 8. Point the suite at it

Store the webhook URL as the repository secret `MS_TEAMS_NEW_WEBHOOK_URI`, then
set the layout on the notify step in `.github/workflows/e2e.yml`:

```yaml
- name: Post Teams card
  if: always() && github.event_name != 'pull_request'
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.MS_TEAMS_NEW_WEBHOOK_URI }}
    TEAMS_LAYOUT: thread
  run: bun scripts/ci/teams-card.ts test-results/summary.json
```

Locally, put both in `.env`:

```
TEAMS_WEBHOOK_URL=<HTTP POST URL>
TEAMS_LAYOUT=thread
```

`TEAMS_LAYOUT=thread` matters. Without it the suite sends a different shape,
one this flow cannot read, and nothing is posted.

### 9. Post a real run

```bash
bun run test          # or any subset, such as --project=public
bun run notify
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

Read the flow's **run history** first: Power Automate → **My flows** → your flow
→ the newest run at the bottom. A red step names its own problem, and the table
below covers the ones that are easy to misread.

| What you see                                                             | What it means                                                                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Save is greyed out in the designer                                       | A flow needs at least one action. Add step 3 first.                                                                                           |
| `property 'attachments' doesn't exist, available properties are 'cards'` | The **Apply to each** input is whatever the designer prefilled. Replace it with `skip(triggerBody()?['cards'], 1)`.                           |
| The command says it sent, but the channel is empty                       | Sending is not posting: the endpoint accepts the request before the flow runs, so `202` proves nothing. Read the run history.                 |
| Nothing arrives, and the run history is empty                            | The requests are not reaching this flow. Wrong URL, or the URL belongs to a different flow. Check the flow is switched on, too.               |
| The flow runs green but the card is blank                                | The expression was typed into the field instead of the **Expression** tab, so it was saved as words. Clear it and enter it again on that tab. |
| Only the summary posts, no replies                                       | The loop input is wrong. It must be `skip(triggerBody()?['cards'], 1)`.                                                                       |
| Sections arrive out of order                                             | Concurrency Control is on for the **Apply to each**. Turn it off.                                                                             |
| Every card posts as its own message, none threaded                       | `TEAMS_LAYOUT` is unset, or the reply action is posting rather than replying.                                                                 |
| A `413`, or a rejected request                                           | The combined payload exceeded the endpoint's limit. See the limits above.                                                                     |
| Nothing posts and the command says nothing                               | `TEAMS_WEBHOOK_URL` is unset. The script logs that and exits cleanly.                                                                         |
| Names show as `<at>Ada</at>`                                             | Posted through a legacy webhook rather than a flow.                                                                                           |

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
