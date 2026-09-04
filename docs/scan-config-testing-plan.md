# Testing the scan-configuration editor from fixture files

Status: build and simulate workflows implemented. Extract and process still to do.

## What the editor is

The scan-configuration editor is the form behind every
`/app/virtual-lab/{lab}/{project}/workflows/{activity}/configure/{type}/{session}`
route, for the four activities `simulate`, `build`, `extract` and `process`.

It is not a hand-written form. At runtime it fetches `${OBI_ONE_URL}/openapi.json`,
dereferences it in the browser, and renders one of a fixed list of schemas such as
`CircuitSimulationScanConfig`. Every field's label comes from the schema `title`,
and every field's control is chosen by a custom OpenAPI extension, `ui_element`.
There are 23 `ui_element` kinds today and the dispatcher handles 20 of them.

A user submits with a button labelled per activity, for example
`Generate build(s)` or `Generate simulation(s)`. Each activity also names its
results tab differently — `results`, `simulations`, `extractions`,
`skeletonizations` — so none of that wording is hard-coded in a test:
`fixtures/scan-config-activities.ts` mirrors it from the application's own
`messages` and `ScanConfigTabs`. The application then posts the same configuration object
twice: once to `/declared/scan_config/grid-scan-coordinate-count` to size the
grid, and once to the generation endpoint, which returns a campaign id.

A _sweep_ is a field that accepts either one number or a list. Every combination
of swept values is one coordinate in the campaign grid.

## Reaching the editor

`{type}` is the kebab-case campaign type, and `{session}` is a workflow session
id (`wf_…`). The session is not a record on any service: it is a key into
`sessionStorage`, written by the `/new` browse step, holding the entities the
editor initialises from. A test therefore cannot deep-link to a configured
editor; it walks the hub, the type card and the browse table, which is what a
user does anyway.

Deep links to `/workflows` are routed through `/app/virtual-lab/sync` and can
land on the project home instead. `openWorkflowsHub` in `fixtures/workflows.ts`
retries from the nav.

## Addressing the editor

Field labels render as `<label for={propertyKey}>`, but only a handful of
controls render a matching `id`, so `getByLabel` cannot find most inputs. Titles
are worse than absent: they come from a live schema and CSS rewrites their case,
so `Postsynaptic ME-model` reads as `Postsynaptic me model` on screen.

`core-web-app` therefore carries test ids keyed on the schema's own names, all
guarded by `src/__tests__/scan-config/block-field-testids.test.tsx`.

| Test id                                     | Sits on               | Example                                          |
| ------------------------------------------- | --------------------- | ------------------------------------------------ |
| `workflow-type-<kebab campaign type>`       | a type card           | `workflow-type-build-synaptome-campaign`         |
| `workflow-use-model`                        | confirming one entity | —                                                |
| `workflow-browse-use-selection`             | confirming several    | —                                                |
| `scan-config-tab-<id>`                      | a tab                 | `scan-config-tab-results`                        |
| `scan-config-root-element-<key>`            | a left-hand nav item  | `scan-config-root-element-distributions`         |
| `scan-config-add-entry-<rootElement>`       | the add button        | `scan-config-add-entry-distributions`            |
| `scan-config-variant-<obi-one type>`        | a block variant       | `scan-config-variant-FloatConstantDistribution`  |
| `scan-config-entry-<rootElement>-<entry>`   | a dictionary entry    | `scan-config-entry-distributions-Distribution 0` |
| `scan-config-block-<rootElement>[-<entry>]` | the block wrapper     | `scan-config-block-recordings-Soma`              |
| `scan-config-field-<propertyKey>`           | the field wrapper     | `scan-config-field-simulation_length`            |
| `scan-config-submit`                        | the generate button   | —                                                |
| `scan-config-coordinate-<configId>`         | one grid coordinate   | —                                                |
| `scan-config-status`                        | a coordinate's status | —                                                |
| `scan-config-launch`                        | running the builds    | —                                                |
| `scan-config-cost-confirm` / `-cancel`      | the cost dialog       | —                                                |

A property key is unique only inside its block, because a key such as `dt`
repeats across dictionary entries, so a test scopes by block first:

```ts
scanConfigField(editor.block('recordings', 'Soma'), 'dt').getByRole('spinbutton');
```

The field wrapper also carries `data-scan-config-block-element-container-of`,
the `ui_element` it was rendered from. The driver reads it back rather than
guessing from the shape of the control.

Two places still fall back to a role, because nothing better exists: the shared
data grid's rows and cells, which carry the standard `row` and `gridcell` roles
and nothing else, and the `combobox` inside an antd select, read only for the
`aria-controls` that names the list it owns.

## Fixture format

One file per workflow under `data/scan-configs/`. The file carries the context a
test needs to open the right editor, and then one entry in `cases` per
configuration worth building. Every case becomes a test of its own, so they run
in parallel and a failure names the configuration that broke.

```jsonc
{
  "name": "Synaptome build with one excitatory synapse group",
  "activity": "build",
  "env": ["staging", "production"],
  "workflow": { "label": "Synaptome", "type": "build-synaptome-campaign" },
  "schemaName": "MEModelSynapticModelPlacementScanConfig",
  "selection": { "mode": "single", "entities": ["MEM__jy180314_B_idA__dNAD_ltb_VPM_TC"] },
  "cases": [
    {
      "name": "one excitatory synapse group",
      "config": {
        "info": { "type": "Info", "campaign_name": "…", "campaign_description": "…" },
        "distributions": {
          "exc_conductance": { "type": "FloatConstantDistribution", "value": 0.4 },
        },
      },
      "expect": { "coordinateCount": 1, "submitLabel": "Generate build(s)" },
    },
  ],
}
```

`config` is the object the application posts, keyed by root element, so the same
file can later drive an API-level check. `expect` holds only what a user can see
or count.

Two rules keep this maintainable. The `initialize` model field is set by the
browse step, so the fixture names the entity under `selection` rather than
pinning an id it does not own. Fixtures never contain credentials.

`env` lists the deployments that offer the workflow. A run is pointed at one
deployment — `E2E_BASE_URL`, or `E2E_ENV` where the host does not say — and a
fixture that does not name it skips the whole spec. Which deployments have a
workflow is a fact about the release, and looking for its card cannot establish
it: a card that is absent and one that has not rendered yet look the same. So it
is declared here, and everything past the skip is an assertion — a workflow the
fixture says a deployment has must be there.

`selection.scope` picks the tab above the table, `public` by default. Entities a
project derives for itself, such as the morphologies behind an electron
microscopy circuit, live under `project`.

`workflow.confirmsCost` says whether launching asks what it will cost first. It
does for most workflows; an ME-model campaign has no cost estimator behind it and
launches straight away, which the application says in so many words.

`requires.featureFlag` names an experimental feature the workflow needs. The test
writes the application's own `feature-flags` cookie, so the page renders with the
flag set from its first request.

Order matters inside `config`: a block that references another must come after
it, because the driver resolves references through the entries it has created.

## Loading and validating fixtures

`fixtures/scan-config.ts` reads a fixture, validates its envelope, and exposes it
as a typed object. Validation covers the envelope fields, not the configuration
body, which is schema-driven and open-ended. `fixtures/scan-config.test.ts` walks
every file in `data/scan-configs/` under `bun test`, so a malformed fixture fails
in milliseconds instead of halfway through a browser run.

## Driving the editor

`fixtures/scan-config-driver.ts` walks the fixture root element by root element.
Fields only mount once their nav item is clicked and the middle column remounts
on every change, so each root element is opened before its fields are touched.

| `ui_element`                                                                                  | How the driver acts                                                                                           |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `string_input`                                                                                | fill the text input                                                                                           |
| `float_parameter_sweep`, `int_parameter_sweep`, `float_optional`                              | a number fills the spinbutton; an array clicks `Scan over several values`, then `Add a value` per extra entry |
| `boolean_input`                                                                               | check or uncheck                                                                                              |
| `string_selection_enhanced`, `reference`, `entity_property_dropdown`, `model_selector_single` | open the dropdown, pick by the option's title                                                                 |
| `block_dictionary`, `block_union`                                                             | click the variant by its obi-one type, then recurse                                                           |
| `model_identifier`, `model_identifier_multiple`                                               | nothing: the browse step already set it                                                                       |

The driver throws on an unrecognised `ui_element` rather than skipping it. Three
of the 23 kinds are unhandled in the application dispatcher today, and a silent
skip would turn a real gap into a passing test.

Explicit morphology locations are picked, not typed: the section id is a SONATA
index the viewer supplies, so a fixture declares only how many locations to place
and the offset along each. Which pixel of the scene holds a neurite is not
knowable in advance, so the driver works through a spread of points and keeps the
ones that land.

`morphology_section_type_selection` is deliberately unsupported: its options are
labelled by obi-one at run time, so a fixture holding SWC codes cannot name the
text a user picks. Leave the field out and the schema default applies.

One antd quirk the driver works around, commented where it occurs: a select
paints its chosen value over its own input, so the click is forced rather than
aimed elsewhere. Its options had nothing stable to click either — the elements a
user clicks carry no role, and the `option` roles sit in a zero-height mirror
kept for screen readers — so `reference.tsx` now renders each option with a
`scan-config-option-<value>` id.

Entry names are generated by the editor, not chosen by the fixture, so the
driver maps each fixture key to the entry that was created and resolves
`{ block_dict_name, block_name }` references through that map.

## What the tests prove

1. **The editor renders the configuration.** Fields, labels and defaults appear.
   Creates nothing.
2. **Fill and validate.** Apply the fixture; confirm the submit button is
   disabled while the configuration is incomplete.
3. **Launch and check the campaign.** Submit, confirm the results tab opens with
   one coordinate per expected grid point, each `created`, and the generated
   `obi_one_coordinate.json` listed under its inputs.
4. **Run it.** Press `Launch builds`, confirm the cost dialog, and follow the
   coordinate from `created` through `pending` and `running` to `done`. A
   synaptome build takes about two minutes, so these tests set their own
   timeout. Then confirm the files, exactly: `expect.generated` is what the
   coordinate carries the moment the campaign exists, `expect.completed` what it
   carries once the run has finished. Both lists are complete, so a file the
   application starts or stops producing fails here rather than passing
   unnoticed. Only names seen on a real run belong there; a workflow that has
   never been run through leaves them out. `expect.built` goes further, naming
   the entity the run registered and the properties its preview shows — a
   synaptome built from one explicit location reports one synapse.
   The two outputs are different kinds of thing and the pane beside them shows
   each differently, so both are opened: the logs are a stream that ends with the
   task completing, the synaptome is a registered entity with a name, its
   make-up, and a way to download it or open it in full.
5. **Refuse to run it.** A project with no credits is stopped before anything is
   created. The empty balance is arranged by answering the one request the
   application makes for it, rather than by draining the project, which would
   take the rest of the suite down and could not be undone. See
   `fixtures/credits.ts`. The balance is read once when the editor opens, so the
   answer goes in place and the page is reloaded; the workflow session lives in
   the URL and survives that.

Still to add: a round trip that reopens a saved campaign and confirms every value
survived, and a grid-size check that a two-value and a three-value sweep reports
six coordinates.

## Keeping runs deterministic

The schema arrives from a live service, so a schema change can turn every editor
test red at once. Run against the live schema by default: these are end-to-end
tests and a schema change genuinely is a change the user sees. Worth adding: one
guard test that fulfils the `openapi.json` request with a committed copy and
asserts the editor renders it. When the live tests go red together and the guard
stays green, the cause is the schema, not the editor.

## Safety

Levels 1 and 2 create nothing. Levels 3 and 4 create a campaign and spend project
credits, so they are staging only, never tagged `@smoke`, and write only inside
the lab and project named by `LAB_ID` and `PROJECT_ID`.

Credits are the real constraint on how often these run. One synaptome build costs
about ten credits. A project at zero cannot generate a campaign at all, which is
what the no-credits test asserts — and what a whole suite would hit silently if
the QA project ran dry, since the editor accepts the configuration and the button
stays live while nothing happens. Before scheduling these, decide who tops the QA
project up.

A workflow a deployment does not offer is skipped with the reason, not failed.
As of this writing only the Synaptome build runs end to end, and only against a
build that carries the test ids above:

| Workflow                      | State                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| Synaptome                     | runs                                                                |
| Electron microscopy circuit   | reachable, but no morphology derives from any EM dataset on staging |
| Extracellular recording array | behind a feature flag that is only visible in `local` and `preview` |

## CI

No new inputs are needed. Fixtures are versioned, so a run tests whatever is on
the branch.
