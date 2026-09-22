# Reporting a run to a Teams channel

The repo side is built. A channel needs one Power Automate flow to receive runs
and post them

## What a run looks like in the channel

```
┌─ parent message ───────────────────────────────┐
│  Open Brain Institute Platform e2e             │
│  Run       2026-09-18-schedule-1fe9550-staging │
│  Suites    regular, slow                       │
│  Started   05:00 UTC                           │
│  Finished  [Regular ✓] [Slow ✗]                │  ← badges grow
└────────────────────────────────────────────────┘
   └─ reply: the regular suite's summary card
   └─ reply: one card per section
   └─ reply: the slow suite's summary card, hours later
```

The parent appears when the run **starts**. Each suite replies when it
**finishes**, and adds one badge to the parent. Green passed, red failed.

A summary card carries two buttons: **Open the run** and **Download the full
report**. The second is the one to hand someone — every test, its trace, its
screenshots. A local run has no link; the report is already on your machine
(`bun run report`).

Charts are a Teams extension. Clients that cannot draw them drop them, so every
figure is written out beside them too.

## Why a flow, and why a list

The webhook answers `202 Accepted` with an empty body. **It never returns the
message id.** So nothing in this repo can reply to a message it sent. Only the
flow sees the id.

The two suites are separate GitHub runs finishing hours apart. Both must land
under one parent. The second run cannot be handed the id, so instead both
compute the same **thread key** and send it:

```
<UTC date>-<event>-<seed>-<environment>

2026-09-18-schedule-1fe9550-staging
2026-09-18-repository_dispatch-2026.09.18.1-staging
```

The seed is the release tag, or the short commit sha. The flow keeps a
SharePoint list mapping key → message id.

- **First call with a key** → post a new parent, save the id.
- **Every later call** → reply under the saved id.

A later run the same day has a different seed, so it opens its own thread.

## What CI sends

One shape, two calls, `TEAMS_LAYOUT=thread`:

```json
{
  "key": "2026-09-18-schedule-1fe9550-staging",
  "parent": "<the parent card, as one JSON string>",
  "badge": "<one Adaptive Card Badge, as one JSON string>",
  "cards": [/* the summary and section cards */]
}
```

| Call                            | `badge` | `cards` |
| ------------------------------- | ------- | ------- |
| **announce**, when a run starts | `""`    | `[]`    |
| **result**, when a suite ends   | filled  | filled  |

`cards` is empty on the announce, so the flow's loop simply runs zero times. No
branch is needed for it.

Only `e2e.yml` announces. `e2e-slow.yml` posts results only — by the time it
finishes, the thread has existed for hours.

## The two tricks the flow uses

**1. The parent is stored, not resent.** CI sends `parent` every time, but the
flow keeps only the first and re-renders that copy forever. Without this, the
last suite to finish would overwrite the card with its own version of the run.

**2. A placeholder holds the badges.** The parent card ends its **Finished** row
with a literal `,"{{BADGES}}"`. The flow swaps those characters for the badges
collected so far, or for nothing:

```
[ "Finished", ,"{{BADGES}}" ]   →  [ "Finished" ]
                                →  [ "Finished", {Regular}, {Slow} ]
```

The comma travels **with** the token. That is what keeps the row valid when no
suite has finished yet.

`TEAMS_LAYOUT=thread` is what sends this shape. The other two layouts are at the
end of the page; neither works with this flow.

---

# Building the flow

You need permission to create a flow and a SharePoint list. The channel must be
**standard or shared** — a flow bot cannot post in a private channel.

## Three things to know first

**Expressions are code, not text.** Typed straight into a field, an expression is
saved as words. The flow then runs green and posts a blank card. This is the most
common mistake on this page.

Every step below that says _Expression tab_ means: put an **expression** in that
field. How you do that depends on the designer, and the **New designer** toggle
is at the top right:

| Designer      | How to enter an expression                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| New (default) | Click the field, press **/** or the **fx** button → **Expression** → paste → **OK**. A token appears inline. |
| Classic       | Click the field, wait for the panel, click the **Expression** tab, type, **OK**.                             |

The New designer also refuses the `@{…}` form as plain text, so build those
inline too — step 4 shows how.

**The designer, and where things are.** Every step below happens on one page.

```
┌──────────────────────────────────────────────────────────────┐
│  Back   Untitled flow      ↶ ↷   💾 Save  Test  Copilot       │  ← top bar
├───────────────────────────┬──────────────────────────────────┤
│  Get items            ⋮ « │   ┌────────────────────┐         │
│                           │   │ When a Teams …     │         │
│  Parameters  Settings     │   └────────────────────┘         │
│  Code view  Testing       │            ⊕   ← click to insert │
│                           │   ┌────────────────────┐         │
│  Site Address *           │   │ Get items          │         │
│  [                    ]   │   └────────────────────┘         │
│                           │            ⊕                     │
│  the selected step's      │        the canvas                │
│  settings pane, LEFT      │        RIGHT                     │
└───────────────────────────┴──────────────────────────────────┘
```

- **To add a step:** click the small **⊕** on the canvas, on the line _below_ the
  step the new one should follow. A pane opens — type the action's name to search.
- **To open a step:** click its box on the canvas. Its pane opens on the **left**.
- **Fields** are on the pane's **Parameters** tab. Anything this page calls a
  "setting" is on its **Settings** tab.
- **Hidden fields:** some live under **Advanced parameters**, near the bottom of
  the Parameters tab. Click **Show all** beside it.
- **Save** is in the top bar, next to **Test**. Save often.
- **Copilot** takes the right third of the screen. Close it with the **✕** at its
  top right — you will want the room.

There is no **+ New step** button; older write-ups say there is.

**Deprecated lookalikes.** The Teams connector lists many old actions with
near-identical names, each marked **DEPRECATED**. Use exactly these three:

- **Post card in a chat or channel**
- **Reply with an adaptive card in a channel**
- **Update an adaptive card in a chat or channel**

All three ask for **Post as**, **Post in**, and a card. If yours asks for
something else, it is a deprecated one. Delete it and search again.

## 1. Make the SharePoint list

**You do not need to create a SharePoint site.** The team already has one. You
only need a list inside it.

### Find the site

In Teams, the channel → the **Shared** tab (called **Files** in older versions)
→ **⋯** → **Open in SharePoint**. A browser opens at the site. Its address ends
at the site name:

```
https://<tenant>.sharepoint.com/sites/<site>
```

Any other site you can write to works just as well — the list does not have to
live near the channel.

### Open Site contents

Paste this into the browser, with your own site address in front. It goes
straight there:

```
https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/viewlsts.aspx
```

By button instead: the **gear ⚙** in the top bar on the **right**, between the
**?** and your profile picture → the panel slides in from the right → **Site
contents**.

### Create the list

1. **+ New**, at the **top left** of the Site contents page, above the table.
2. In the dropdown, **List**.
3. A dialog titled **Create a list** opens. Click the first tile, **Blank list**.
4. A panel slides in from the right. In **Name**, type `E2E Threads`.
5. **Create**, bottom right of the panel.

No **+ New**, or it is greyed out? The tenant blocks list creation on that site.
Ask whoever owns the team, or use a different site.

### Add three columns

The list opens with one column, **Title**. To the **right** of the column
headers is **+ Add column** — sometimes just **+**. Click it once per column.

| Name        | Pick this type             | Then                                                                    |
| ----------- | -------------------------- | ----------------------------------------------------------------------- |
| `MessageId` | **Single line of text**    | **Save**                                                                |
| `Parent`    | **Multiple lines of text** | **More options** → switch **Use enhanced rich text** **off** → **Save** |
| `Badges`    | **Multiple lines of text** | **More options** → switch **Use enhanced rich text** **off** → **Save** |

Each opens a panel on the right with a **Name** box at the top and **Save** at
the bottom.

Leave `Title` alone — it is required on every SharePoint list, and the flow uses
it as the key. One row per thread:

| Column      | Holds                 |
| ----------- | --------------------- |
| `Title`     | the thread key        |
| `MessageId` | the parent message id |
| `Parent`    | the parent card       |
| `Badges`    | the badges so far     |

**Type the names exactly, with no spaces.** SharePoint keeps a separate internal
name, and a display name of `Message Id` is stored as `Message_x0020_Id`. The
flow reads `?['MessageId']`, finds nothing, and says so nowhere.

**Rich text has to be off** on `Parent` and `Badges`. Left on, SharePoint returns
the value wrapped in `<div>` tags, which then break the card.

### Note the address, step 4 needs it

A SharePoint site address is **not** your product's website. Open the list and
read the browser's address bar:

```
https://<tenant>.sharepoint.com/sites/QA/Lists/E2E%20Threads/AllItems.aspx
└─────────── the Site Address ─────────┘      └─ the List Name ─┘
```

Copy everything up to and including `/sites/<name>`. Stop before `/Lists`.

## 2. Create the flow, with the right trigger

**Do not** use the channel's **⋯** → **Workflows** → **Build from scratch**
dialog. It offers five trigger groups — On a schedule, SharePoint, Outlook,
Teams, Office 365 Groups — and **the webhook trigger is in none of them**. That
dialog also cannot add a Condition, variables or an Apply to each, all of which
this flow needs. Its own **Build with Power Automate to see more triggers** link
is the way out of it.

**Go to** <https://make.powerautomate.com/create> → **Instant cloud flow**.

1. Name it, e.g. `E2E to Teams`.
2. Under **Choose how to trigger this flow**, type `webhook` in the search box.
3. Pick **When a Teams webhook request is received**.
4. **Create**.

_Alternative, same result:_ the Workflows **app** in Teams (left rail → **⋯** →
**Workflows**) → **Create** tab → **Create from blank** → search the same trigger
by name. That is a different screen from the channel dialog above.

From here to step 9 you stay on this one designer page — no more navigating.

## 3. Set up the trigger

The trigger is already on the canvas from step 2. Select it to open its pane.

**Parameters** tab → **Who can trigger the flow?** → **Anyone**. Without this,
CI cannot reach it.

**Settings** tab → **Concurrency Control** on → **Degree of Parallelism** `1`.
One request at a time, so two calls arriving together cannot both decide the
thread is new. Not load-bearing — the announce lands hours before any result —
but free.

The **HTTP POST URL** is blank for now. It appears only after the first save, and
a flow cannot be saved without an action — so it turns up at the end of step 8.

## 4. Look up the thread

Click the **⊕** below the trigger box, type `get items`, and pick **Get items**
(the SharePoint one — its icon is the blue SharePoint logo).

| Field        | Value                                  |
| ------------ | -------------------------------------- |
| Site Address | pick from the dropdown                 |
| List Name    | pick from the dropdown — `E2E Threads` |
| Filter Query | `Title eq '@{triggerBody()?['key']}'`  |
| Top Count    | `1`                                    |

**Site Address and List Name are dropdowns.** Do not type into them. You only
get a text box by choosing **Enter custom value**; clear that and pick from the
list instead.

The Site Address is the **site**, and nothing after it:

```
right:  https://contoso.sharepoint.com/sites/QA
wrong:  https://contoso.sharepoint.com/sites/QA/Shared%20Documents/Forms/AllItems.aspx?…
```

Pasting a library or folder URL fails with
`Failed to retrieve dynamic outputs … operation 'GetTable'`.

**List Name showing "No items"** means that site holds no list the connector can
see. Usually step 1 was not done, or was done on a different site. A folder under
**Shared Documents** is not a list, and neither is a document library. Create the
list, then **reload the Power Automate page** — the dropdown is cached and will
keep saying "No items" until you do.

**Filter Query** is OData. In the **New designer** the `@{…}` form is saved as
plain text, so build it inline instead:

1. Type `Title eq '`
2. Press **/** or the **fx** button → **Expression**
3. Paste `triggerBody()?['key']` → **OK**. A token appears.
4. Type the closing `'`

It ends up as `Title eq '<token>'`. The quotes around the token are OData's and
must stay. In the classic designer, typing `Title eq '@{triggerBody()?['key']}'`
straight into the field does the same thing.

**Top Count** is under **Advanced parameters** → **Show all**.

## 5. Three variables

Click the **⊕** below **Get items**, type `initialize`, pick **Initialize
variable**. Do that three times, one after another. For each, the pane on the
left has **Name**, **Type** and **Value**:

| Name              | Type       | Value       |
| ----------------- | ---------- | ----------- |
| `ParentMessageId` | **String** | leave empty |
| `Parent`          | **String** | leave empty |
| `Badges`          | **String** | leave empty |

They must sit here, above the condition. A variable initialised inside a branch
does not exist outside it.

## 6. The condition

Click the **⊕** below the last variable, type `condition`, pick **Condition** (it
is under **Control**). The canvas now shows two branches, **True** on the left
and **False** on the right.

| Box    | Value                                            |
| ------ | ------------------------------------------------ |
| left   | expression: `empty(body('Get_items')?['value'])` |
| middle | **is equal to**                                  |
| right  | type `true` — plain text, not an expression      |

True means the lookup found nothing — this key is new.

## 7. If yes — start the thread

Five actions, all inside the **True** branch. Use the **⊕** that sits _inside_
that branch, not the one below the whole condition. Add them in this order.

Each **Set variable** is the same action: **⊕** → type `set variable` → pick
**Set variable**. Its pane has a **Name** dropdown (pick the variable) and a
**Value** box (put the expression in).

**a. Set variable**

| Field | Value                                 |
| ----- | ------------------------------------- |
| Name  | `Badges`                              |
| Value | expression: `triggerBody()?['badge']` |

**b. Set variable**

| Field | Value                                  |
| ----- | -------------------------------------- |
| Name  | `Parent`                               |
| Value | expression: `triggerBody()?['parent']` |

This copy is the one that is kept. Later calls send their own and it is ignored.

**c. Post card in a chat or channel**

**⊕** → type `post card` → pick **Post card in a chat or channel**. Check it is
not a **DEPRECATED** one.

| Field         | Value                |
| ------------- | -------------------- |
| Post as       | **Flow bot**         |
| Post in       | **Channel**          |
| Team          | your team            |
| Channel       | your channel         |
| Adaptive Card | the expression below |

**Team** and **Channel** appear only after **Post in** is set to Channel.

Put this in **Adaptive Card** as an expression, on one line:

```
replace(variables('Parent'), ',"{{BADGES}}"', if(empty(variables('Badges')), '', concat(',', variables('Badges'))))
```

The card arrives as finished JSON. It goes in as-is — never wrapped in `json()`
or `string()`.

**d. Set variable**

| Field | Value                                           |
| ----- | ----------------------------------------------- |
| Name  | `ParentMessageId`                               |
| Value | **Message ID**, from the step above — see below |

Do not type this one. Click the **Value** box, press **/**, and pick **Message
ID** under **Post card in a chat or channel**. That id is the whole reason this
flow exists; nothing in the repo can ever see it.

**e. Create item**

**⊕** → type `create item` → pick **Create item** (SharePoint).

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Site Address | the same site as step 4                    |
| List Name    | `E2E Threads`                              |
| Title        | expression: `triggerBody()?['key']`        |
| MessageId    | expression: `variables('ParentMessageId')` |
| Parent       | expression: `variables('Parent')`          |
| Badges       | expression: `variables('Badges')`          |

`MessageId`, `Parent` and `Badges` appear as fields only once **List Name** is
set. If they are missing, the columns were never added — go back to step 1.

## 8. If no — join the thread

Five actions, all inside the **False** branch, in this order. Same actions as
step 7, different values.

**a. Set variable**

| Field | Value                                                          |
| ----- | -------------------------------------------------------------- |
| Name  | `ParentMessageId`                                              |
| Value | expression: `first(body('Get_items')?['value'])?['MessageId']` |

**b. Set variable**

| Field | Value                                                       |
| ----- | ----------------------------------------------------------- |
| Name  | `Parent`                                                    |
| Value | expression: `first(body('Get_items')?['value'])?['Parent']` |

The **stored** card. Reading `triggerBody()?['parent']` here is the one mistake
that quietly breaks the design: the two suites do not always agree about the run,
and whichever finished last would win.

**c. Set variable**

| Field | Value                |
| ----- | -------------------- |
| Name  | `Badges`             |
| Value | the expression below |

```
if(empty(triggerBody()?['badge']), first(body('Get_items')?['value'])?['Badges'], if(empty(first(body('Get_items')?['value'])?['Badges']), triggerBody()?['badge'], concat(first(body('Get_items')?['value'])?['Badges'], ',', triggerBody()?['badge'])))
```

Read it as: no badge in this call, keep what is stored; nothing stored yet, use
this one; otherwise join with a comma. A comma only ever lands **between** two
badges, which is what keeps the row valid.

Paste it on one line. The editor accepts newlines, but it is easy to lose a
bracket tidying it up.

**d. Update an adaptive card in a chat or channel**

**⊕** → type `update an adaptive card` → pick **Update an adaptive card in a chat
or channel**.

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Post as       | **Flow bot**                               |
| Post in       | **Channel**                                |
| Team, Channel | the same as step 7c                        |
| Message ID    | expression: `variables('ParentMessageId')` |
| Adaptive Card | the same `replace(…)` line as step 7c      |

Same card, one more badge. The parent is rewritten in place, so the channel
preview always shows which suites have finished and how they went.

**e. Update item**

**⊕** → type `update item` → pick **Update item** (SharePoint).

| Field        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Site Address | the same site as step 4                                 |
| List Name    | `E2E Threads`                                           |
| Id           | expression: `first(body('Get_items')?['value'])?['ID']` |
| Title        | expression: `triggerBody()?['key']`                     |
| Parent       | expression: `variables('Parent')`                       |
| Badges       | expression: `variables('Badges')`                       |

**Update item** rewrites the whole row, so `Title` and `Parent` must be supplied
again even though neither changed.

Now click **Save** in the top bar. Then click the trigger box, **When a Teams
webhook request is received**: its **HTTP POST URL** is filled in. Copy it — step
10 needs it.

## 9. Reply with each card

Use the **⊕** below the whole condition box — the one where the two branches have
joined back together — **not** one inside a branch. Type `apply to each` and pick
**Apply to each** (under **Control**).

In its **Select an output from previous steps** box, put an expression:

```
triggerBody()?['cards']
```

Then click the Apply to each box → **Settings** tab → leave **Concurrency
Control** **off**. A loop runs one item at a time by default, which keeps the
cards in order. Switching it on above degree 1 is what shuffles them. This is a
different setting from the trigger's in step 3.

Inside the loop there is another **⊕**. Click it, type `reply with an adaptive`,
and pick **Reply with an adaptive card in a channel**.

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Post as       | **Flow bot**                                 |
| Post in       | **Channel**                                  |
| Team, Channel | the same as step 7c                          |
| Message ID    | expression: `variables('ParentMessageId')`   |
| Adaptive Card | expression: `string(items('Apply_to_each'))` |

`items('Apply_to_each')` names the loop. Rename the loop and that name changes
with it — the action's name, spaces replaced by underscores.

**Save.**

## 10. Test it with two probes

Two calls, one key. Together they prove the whole thing: a parent appears, then
gains a badge and a reply. If the second creates a _second_ parent, the lookup is
not matching — see the table at the end.

**Go to** a terminal. You need the **HTTP POST URL** from the end of step 8: open
the trigger's pane and copy it.

Use a key of your own so you do not join a real thread:

```bash
KEY="probe-$(date -u +%Y%m%d-%H%M%S)"
URL='<HTTP POST URL>'
```

**Probe 1 — the announce.** Empty `badge`, empty `cards`:

```bash
cat > /tmp/probe-announce.json <<JSON
{
  "key": "$KEY",
  "parent": "{\"type\":\"AdaptiveCard\",\"version\":\"1.5\",\"body\":[{\"type\":\"TextBlock\",\"text\":\"probe — parent\",\"weight\":\"Bolder\"},{\"type\":\"FactSet\",\"facts\":[{\"title\":\"Run\",\"value\":\"$KEY\"}]},{\"type\":\"Container\",\"items\":[{\"type\":\"TextBlock\",\"text\":\"Finished\",\"isSubtle\":true},\"{{BADGES}}\"]}]}",
  "badge": "",
  "cards": []
}
JSON

curl -s -X POST -H 'content-type: application/json' --data @/tmp/probe-announce.json "$URL"
```

Expect **probe — parent** in the channel, with a **Run** fact and a **Finished**
label with nothing after it. Fix that before going on. A `202` proves only that
the request arrived.

**Probe 2 — the result.** Same key. Its parent is deliberately **different** —
the flow must ignore it and re-render the stored one.

```bash
cat > /tmp/probe-result.json <<JSON
{
  "key": "$KEY",
  "parent": "{\"type\":\"AdaptiveCard\",\"version\":\"1.5\",\"body\":[{\"type\":\"TextBlock\",\"text\":\"probe — THIS TITLE MUST NOT APPEAR\",\"weight\":\"Bolder\"},{\"type\":\"FactSet\",\"facts\":[{\"title\":\"Run\",\"value\":\"$KEY\"}]},{\"type\":\"Container\",\"items\":[{\"type\":\"TextBlock\",\"text\":\"Finished\",\"isSubtle\":true},\"{{BADGES}}\"]}]}",
  "badge": "{\"type\":\"Badge\",\"text\":\"Regular\",\"style\":\"Good\",\"appearance\":\"Filled\",\"shape\":\"Rounded\",\"tooltip\":\"248 passed · 0 failed · 41m 0s\"}",
  "cards": [
    { "type": "AdaptiveCard", "version": "1.5",
      "body": [{ "type": "TextBlock", "text": "probe — reply" }] }
  ]
}
JSON

curl -s -X POST -H 'content-type: application/json' --data @/tmp/probe-result.json "$URL"
```

Expect three things:

1. A green **Regular** badge after **Finished**.
2. **probe — reply** underneath it, as a reply.
3. The title still reads **probe — parent**. If it changed, step 8b is reading
   the sent card instead of the stored one.

Send probe 2 again with `Slow` instead of `Regular` to watch the badges
accumulate. That is exactly what the slow suite does hours later.

## 11. Point the suite at it

**Update the flow before this repo's change ships.** The announce sends
`cards: []`; a flow built the old way reads `cards[0]` and fails every time.

**Go to**
<https://github.com/openbraininstitute/obi-e2e/settings/secrets/actions> →
**New repository secret**. Name it `MS_TEAMS_WEBHOOK_URI`, paste the **HTTP POST
URL**. Both workflows already read it — [`e2e.yml`](../.github/workflows/e2e.yml) announces at the
start of the run and posts at the end;
[`e2e-slow.yml`](../.github/workflows/e2e-slow.yml) only posts:

```yaml
- name: Announce the run in Teams
  continue-on-error: true
  env:
    MS_TEAMS_WEBHOOK_URI: ${{ secrets.MS_TEAMS_WEBHOOK_URI }}
    TEAMS_LAYOUT: thread
  run: bun scripts/ci/teams-card.ts --start

- name: Post Teams card
  if: always()
  env:
    MS_TEAMS_WEBHOOK_URI: ${{ secrets.MS_TEAMS_WEBHOOK_URI }}
    TEAMS_LAYOUT: thread
    E2E_SUITE: Regular
  run: bun scripts/ci/teams-card.ts test-results/summary.json
```

`TEAMS_LAYOUT=thread` matters. Without it the suite sends a shape this flow
cannot read and nothing is posted.

A missing secret is **silent**: the script prints
`MS_TEAMS_WEBHOOK_URI is not set` and exits 0, so CI stays green and no card
appears. Confirm one real run posts before deleting any old secret.

Locally, put the URL in `.env`:

```bash
bun run test
bun run notify
```

`bun run notify --perf` posts the performance card from `bun run perf`, as one
card on its own.

## Tagging people when a run cannot be paid for

A run that stops because the lab has no credits has not found a bug. A card
saying only "failed" sends people hunting for one.

`TEAMS_ALERT_MENTIONS` is a list of `Name <sign-in address>`, comma separated.
The address is the one they sign in to Teams with, not a nickname.

```
Ada Lovelace <ada@example.org>, Alan Turing <alan@example.org>
```

**Set it as a repository _variable_, not a secret.**

**Go to**
<https://github.com/openbraininstitute/obi-e2e/settings/variables/actions> →
**Variables** tab → **New repository variable**. Name it `TEAMS_ALERT_MENTIONS`,
paste the list as the value.

A secret would work too, but this is work addresses, not a credential, and a
secret cannot be read back — you would have to retype the whole list to add one
person. Both workflows already pass the variable to their Teams step.

Locally, put the same line in `.env`.

They are mentioned **only** when the lab cannot pay — never for ordinary
failures. Mentions render only when a flow posts the card; a legacy webhook shows
them as raw `<at>Ada</at>`.

Leave the variable unset and nobody is tagged. Nothing else changes.

## Limits worth knowing

- **28 KB per message.** Every card this repo builds stays under 25 KB.
- **The request is bigger than one card.** `thread` sends them all at once, about
  32 KB. A legacy connector webhook caps requests at 28 KB and would reject that;
  the Workflows trigger is a Power Automate endpoint and allows far more.
  [Connectors are being retired][retirement] anyway.
- **Four requests per second.** `thread` sends one request and lets the flow pace
  the replies.
- **Charts need a desktop client.** They drop on mobile; the numbers stay.

## When something goes wrong

**Go to** <https://make.powerautomate.com/manage/flows> → your flow → the newest
run under **28-day run history**. Open it and every step shows its real inputs and
outputs. Read that before changing anything.

| What you see                                       | What it means                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| No webhook trigger in the trigger list             | You are in the channel's **Build from scratch** dialog, which has none. Use the link in step 2.                            |
| `SharePoint Site Address '…' is not valid`         | You typed a URL into a dropdown. It must be a `*.sharepoint.com/sites/…` site, picked from the list. See step 4.           |
| `Failed to retrieve dynamic outputs … 'GetTable'`  | The Site Address is a library or folder URL. It must stop after `/sites/<name>`. See step 4.                               |
| List Name says "No items"                          | The list does not exist on that site, or the dropdown is cached. Create it, then reload the page.                          |
| Save is greyed out                                 | A flow needs an action. Add step 4 first.                                                                                  |
| The action asks for unfamiliar fields              | You picked a DEPRECATED lookalike. Use the three names above step 1.                                                       |
| It says it sent, but the channel is empty          | `202` proves nothing. Read the run history.                                                                                |
| Nothing arrives, run history empty                 | Wrong URL, or the flow is off.                                                                                             |
| Runs green, card is blank                          | The expression went into the field, not the **Expression** tab.                                                            |
| A literal `{{BADGES}}` on the card                 | The `replace` did not match. The token must be exactly `,"{{BADGES}}"`, no spaces. A pretty-printed parent will not match. |
| A second parent instead of a reply                 | `Get items` found nothing. Check both calls sent the same `key`, and that `Create item` really ran.                        |
| Every call creates a new thread                    | The Filter Query is plain text. It must be `Title eq '@{triggerBody()?['key']}'` — the `@{…}` and the OData quotes stay.   |
| The parent's facts change when the slow suite ends | Step 8b reads `triggerBody()?['parent']`. It must read the stored `Parent`.                                                |
| One badge, replaced each time                      | Step 8e is not writing `Badges` back, so every call starts empty.                                                          |
| Badges run together, or start with a comma         | The step 8c expression was shortened. It must skip the comma when either side is empty.                                    |
| The card breaks after an update, or shows `<div>`  | `Parent` or `Badges` has rich text on. Set both to **Plain text**. Existing rows keep their HTML and must be cleared.      |
| Only the parent posts, no replies                  | The loop input is wrong. It is `triggerBody()?['cards']`, whole.                                                           |
| Cards arrive out of order                          | **Apply to each** has Concurrency Control on. Turn it off.                                                                 |
| Nothing threaded                                   | `TEAMS_LAYOUT` is unset.                                                                                                   |
| A `413`                                            | The payload passed the endpoint's limit. See the limits above.                                                             |
| Nothing posts, no output                           | `MS_TEAMS_WEBHOOK_URI` is unset. The script says so and exits cleanly.                                                     |
| Names show as `<at>Ada</at>`                       | Posted through a legacy webhook, not a flow.                                                                               |

## The other layouts

Neither threads, and neither announces. Both accept any endpoint that takes an
Adaptive Card message — no flow needed.

| `TEAMS_LAYOUT` | What happens                               |
| -------------- | ------------------------------------------ |
| `split`        | one request per card, each its own message |
| unset          | one message with everything                |

Microsoft Graph threads properly and needs no Power Automate, but costs an app
registration and the `ChannelMessage.Send` permission. That is why the flow is
the default here.

## Where everything lives

| What                              | URL                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Your flows, and their run history | <https://make.powerautomate.com/manage/flows>                                                         |
| Create a flow (start here)        | <https://make.powerautomate.com/create>                                                               |
| Teams                             | <https://teams.microsoft.com>                                                                         |
| Find your SharePoint site         | <https://www.microsoft365.com>                                                                        |
| The repository's secrets          | <https://github.com/openbraininstitute/obi-e2e/settings/secrets/actions>                              |
| The repository's variables        | <https://github.com/openbraininstitute/obi-e2e/settings/variables/actions>                            |
| Teams actions reference           | <https://learn.microsoft.com/en-us/connectors/teams/>                                                 |
| SharePoint actions reference      | <https://learn.microsoft.com/en-us/connectors/sharepointonline/>                                      |
| Expression functions              | <https://learn.microsoft.com/en-us/azure/logic-apps/workflow-definition-language-functions-reference> |
| Preview a card's JSON             | <https://adaptivecards.microsoft.com/designer>                                                        |

[retirement]: https://devblogs.microsoft.com/microsoft365dev/retirement-of-office-365-connectors-within-microsoft-teams/
