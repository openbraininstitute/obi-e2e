# How the workflow tests work

Every workflow on the Workflows page is filled in through the same form. This
page explains how a test drives it.

## The form is generated, not written

The form behind `/workflows/{activity}/configure/{type}/` is not hand-written.
The app fetches obi-one's `openapi.json` at runtime and renders a schema from
it. Every label comes from the schema, and every control is picked by a custom
field in it called `ui_element`.

Two things follow from that:

- **The labels can change without warning**, because they come from a live
  service. A test that matched on words would break on someone else's release.
- **The words differ per activity.** A build says "Generate build(s)" and shows
  a "results" tab; a simulation says "Generate simulation(s)" and shows a
  "simulations" tab. `fixtures/scan-config/activities.ts` holds that wording in
  one place, so no test spells it out.

A **sweep** is a field that takes either one number or a list. Every combination
of swept values becomes one coordinate in the campaign.

## Why the tests use test ids

`getByLabel` cannot find most of these fields: the labels render as
`<label for=…>` but few controls carry a matching `id`. The visible text is no
better, because CSS rewrites its case — `Postsynaptic ME-model` reads as
`Postsynaptic me model` on screen.

So `core-web-app` carries test ids keyed on the schema's own names, guarded
there by `src/__tests__/scan-config/block-field-testids.test.tsx`.

| Test id                                   | Sits on               |
| ----------------------------------------- | --------------------- |
| `workflow-type-<campaign type>`           | a workflow card       |
| `workflow-use-model`                      | confirming one entity |
| `workflow-browse-use-selection`           | confirming several    |
| `scan-config-tab-<id>`                    | a tab                 |
| `scan-config-root-element-<key>`          | a left-hand nav item  |
| `scan-config-add-entry-<rootElement>`     | the add button        |
| `scan-config-variant-<obi-one type>`      | a block variant       |
| `scan-config-entry-<rootElement>-<entry>` | a dictionary entry    |
| `scan-config-block-<rootElement>`         | the block wrapper     |
| `scan-config-field-<propertyKey>`         | the field wrapper     |
| `scan-config-submit`                      | the generate button   |
| `scan-config-coordinate-<configId>`       | one coordinate        |
| `scan-config-status`                      | a coordinate's status |
| `scan-config-launch`                      | running the campaign  |
| `scan-config-cost-confirm` / `-cancel`    | the cost dialog       |

A property key repeats across blocks — `dt` appears in several — so a test
always scopes by block first. The field wrapper also carries the `ui_element` it
came from, and `ScanConfigDriver` reads that back rather than guessing from the
shape of the control.

## The seed fills the form

Each workflow scenario keeps a `seed.json` beside its spec. It says which
workflow to open, what to select, and one entry in `cases` per configuration
worth running. Each case becomes a test of its own.

`fixtures/scan-config/index.ts` reads and checks it, and `fixtures/scan-config/index.test.ts`
walks every seed under `bun test`, so a malformed one fails in milliseconds
rather than halfway through a browser run.

`ScanConfigDriver` then types it in, field by field. Entry names are made up by
the editor rather than chosen by the seed, so the driver remembers the name each
entry was given and resolves references through it.

For the file format, see [tools/casebook/README.md](../tools/casebook/README.md).

## What a test does

1. **Open the form.** Walk the hub, the workflow card and the browse table — a
   test cannot deep-link, because the selection lives in `sessionStorage`.
2. **Check it will not launch half-filled.** The generate button stays disabled.
3. **Fill it from the seed, and generate.** The results tab opens with one
   coordinate per grid point, each `created`.
4. **Launch it.** Confirm the cost, then follow the coordinate to `done`.
5. **Read what it produced.** `expect.generated` is what the coordinate holds
   the moment the campaign exists; `expect.completed` is what it holds once the
   run finished. Both lists are complete, so a file the app starts or stops
   producing fails here instead of passing unnoticed.

`expect.completed.views` says what opening one of those files shows. A list is
the text its pane holds; a mapping is the card of the entity the run
registered, read property by property:

```json
"completed": {
  "within": 20,
  "inputs": ["obi_one_coordinate.json"],
  "outputs": ["Task logs", "E2E synaptome build"],
  "views": {
    "spikes.h5": ["PopulationAll", "spikes"],
    "E2E synaptome build": { "Number of synapses": "1" }
  }
}
```

Only names seen on a real run belong in a seed. A workflow nobody has run
through leaves `completed` out, and the test then only asks that the campaign
starts.

## Runs that take longer than a test

A campaign is not a page load. A single-neuron simulation is done inside a
minute; a microcircuit takes tens of minutes; a whole brain takes hours. The
suite handles that in three steps, and `fixtures/steps/campaign.ts` holds all
of it.

**A case that takes too long says so.** One word in the seed:

```json
{ "name": "one mesh at the default resolution", "slow": true, "config": { … } }
```

Nothing else. There is no number to guess: an ordinary case gets five minutes,
a `slow` one gets four hours.

**A case somebody has timed names its own budget.** `expect.completed.within`
is that number, in minutes, and it replaces the blanket one above. Use it once a
run has been watched from end to end: four hours is the right ceiling for a
length nobody knows, but it is the wrong one for a thirteen-minute campaign that
stalls — the test then holds the job for the rest of the morning and the
failure, which was legible at minute twelve, is read after lunch. Give the
measured length room for a queue rather than trimming it to the best run seen.

**A slow case runs in its own job.** It is tagged `@slow`; `e2e.yml` leaves it
out and [`e2e-slow.yml`](../.github/workflows/e2e-slow.yml) runs
`--project=slow` with six hours on the clock instead of forty-five minutes.
Same spec, same seed — only the job around it changes.

**The wait stays on the page that launched the run.** This is the awkward part.
A campaign lives in the editor's own state, not in the URL, so reloading loses
it — the page comes back on the configuration tab with no coordinates to read.
The usual trick of polling a fresh page is therefore not available, and the
test holds one page for as long as the run takes.

That sets the ceiling. Six hours is what a GitHub job may run, and holding one
page for even that long is the fragile part rather than the run itself. A
campaign that cannot finish inside it should not be followed from the editor at
all: launch it, and read it afterwards from the Workflows activity table, which
lists every campaign with its status and _is_ addressable by URL. No test does
that yet — no workflow has needed it — and it wants a project that outlives the
run, since the one a run creates for itself is given back at the end.

A case that names no `completed` is the third option, and the cheapest: the
campaign is launched and only has to leave `created`. Use it while nobody has
watched the run finish, because only names seen on a real run belong in a
seed.

## Credits

A campaign costs credits — about ten for one synaptome build. Those tests are
tagged `@credits`, run behind the credit check, and write only inside the lab
named by `LAB_ID`, in the project the run creates for itself.

A project at zero cannot generate a campaign at all. That is what the
no-credits test asserts, and it is what a whole suite would hit silently if the
QA project ran dry — the form accepts the configuration and the button stays
live while nothing happens. The empty balance is faked by answering the one
request the app makes for it (`fixtures/steps/credits.ts`), never by draining the
project.

A workflow a deployment does not offer is skipped with the reason, not failed.
