# Plan: testing the scan-configuration editor from fixture files

Status: proposed. Owner: E2E. Depends on Phase 1 of the migration.

## What the editor is

The scan-configuration editor is the form behind every
`/app/virtual-lab/{lab}/{project}/workflows/{activity}/configure/{type}` route,
for the four activities `simulate`, `build`, `extract` and `process`.

It is not a hand-written form. At runtime it fetches `${OBI_ONE_URL}/openapi.json`,
dereferences it in the browser, and renders one of a fixed list of schemas such as
`CircuitSimulationScanConfig`. Every field's label comes from the schema `title`,
and every field's control is chosen by a custom OpenAPI extension, `ui_element`.
There are 23 `ui_element` kinds today and the dispatcher handles 20 of them.

A user submits with a button labelled per activity, for example
`Generate simulation(s)`. The application then posts the same configuration
object twice: once to `/declared/scan_config/grid-scan-coordinate-count` to size
the grid, and once to the generation endpoint, which returns a campaign id.

A _sweep_ is a field that accepts either one number or a list. Every combination
of swept values is one coordinate in the campaign grid.

## Addressing fields in the editor

Field labels render as `<label for={propertyKey}>`, but only a handful of controls
render a matching `id`. For most fields the label points at an element that does
not exist, so `getByLabel` cannot find the input. Checkboxes are the exception and
are wired correctly.

The attributes the editor already carried identify a field's _kind_, never _which_
field it is, so two duration inputs in one block were indistinguishable.

**Resolved.** `core-web-app` now adds two test ids on branch
`test/scan-config-field-testids`:

| Test id                                     | Sits on           | Example                               |
| ------------------------------------------- | ----------------- | ------------------------------------- |
| `scan-config-field-<propertyKey>`           | the field wrapper | `scan-config-field-simulation_length` |
| `scan-config-block-<rootElement>[-<entry>]` | the block wrapper | `scan-config-block-recordings-Soma`   |

A property key is unique only inside its block, because a key such as `dt`
repeats across dictionary entries, so a test scopes by block first:

```ts
page
  .getByTestId('scan-config-block-recordings-Soma')
  .getByTestId('scan-config-field-dt')
  .getByRole('spinbutton');
```

A unit test in the application guards both ids, so removing one fails there rather
than silently breaking the E2E suite.

Parts of the editor were already well built and are used as they are. Every sweep
control carries a real accessible name, including `Scan over several values`,
`Add a value` and `Use a single value`. Block and variant pickers are buttons
named by their schema title.

## Fixture format

One file per case under `data/scan-configs/`. The file carries the configuration
itself plus the small amount of context a test needs to open the right editor.

```jsonc
{
  "name": "Circuit simulation with a two-value duration sweep",
  "activity": "simulate",
  "type": "circuit-simulation",
  "schemaName": "CircuitSimulationScanConfig",
  "config": {
    "initialize": {
      "type": "CircuitSimulationScanConfig.Initialize",
      "circuit": { "type": "CircuitFromID", "id_str": "<uuid>" },
      "simulation_length": [1000, 2000],
      "v_init": -80,
    },
    "stimuli": {
      "Clamp": { "type": "ConstantCurrentClampSomaticStimulus", "amplitude": 0.2 },
    },
  },
  "expect": { "coordinateCount": 2 },
}
```

`config` is exactly the object the application posts, so the same file can drive
the browser and, later, an API-level check. `expect` holds only what a user can
see or count.

Two rules keep this maintainable. Entity ids belong in the fixture only when the
QA project actually owns that entity, otherwise they go in a lookup resolved at
run time. Fixtures never contain credentials.

## Loading and validating fixtures

A loader in `fixtures/scan-config.ts` reads a fixture, validates its envelope
with Zod, and exposes it as a typed object. Validation covers the envelope
fields, not the configuration body, which is schema-driven and open-ended.

A single unit-level test walks every file in `data/scan-configs/` and validates
it. A malformed fixture then fails in seconds instead of halfway through a
browser run.

## Driving the editor

Add `pages/scan-config.page.ts` with two parts.

**Navigation.** Open the configure route for an activity and type, then select a
root element in the left nav. Fields for a root element only mount after its
nav item is clicked, and the middle column fully remounts on each change, so
every field interaction must follow a navigation step.

**A config driver.** A walker takes the fixture `config` and applies it, keyed on
the `ui_element` of each field:

| `ui_element`                                                                         | How the driver acts                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `string_input`                                                                       | fill the text input                                                                                           |
| `float_parameter_sweep`, `int_parameter_sweep`                                       | a number fills the spinbutton; an array clicks `Scan over several values`, then `Add a value` per extra entry |
| `boolean_input`                                                                      | check or uncheck by accessible label                                                                          |
| `string_selection_enhanced`                                                          | open the popover, pick the option by name                                                                     |
| `reference`, `entity_property_dropdown`, `model_identifier`, `model_selector_single` | open the dropdown, pick by visible text                                                                       |
| `block_dictionary`, `block_union`                                                    | click the variant button named by its schema title, then recurse                                              |

The driver must throw on an unrecognised `ui_element` rather than skipping it.
Three of the 23 kinds are unhandled in the application dispatcher today, and a
silent skip would turn a real gap into a passing test.

## What the tests prove

Four levels, each building on the one before.

1. **The editor renders the configuration.** Open the editor, confirm the fields,
   labels, units and defaults appear. Creates nothing, so it is safe anywhere and
   should be tagged `@readonly`.
2. **Fill and validate.** Apply the fixture, then push a value out of bounds and
   confirm the message, for example `Value should be greater than or equal to 0`.
   Confirm the submit button is disabled while an error stands.
3. **Launch and check the campaign.** Submit, confirm a campaign is created, and
   confirm it appears in the activity table on the workflows page. This writes
   data, so it is staging only and must clean up after itself.
4. **Round trip a saved configuration.** Reopen a saved campaign's configuration
   and confirm every value from the fixture survived, sweeps included.

The list is open. A fifth level worth adding early is the grid size check: assert
that a fixture with a two-value and a three-value sweep reports six coordinates,
which catches sweep-handling bugs without launching anything.

## Keeping runs deterministic

The schema arrives from a live service, so a schema change can turn every editor
test red at once. Two measures, in this order.

Run against the live schema by default. These are end-to-end tests and a schema
change genuinely is a change the user sees.

Add one guard test that fulfils the `openapi.json` request with a committed copy
and asserts the editor renders it. When the live tests go red together and the
guard stays green, the cause is the schema, not the editor. The schema request
is cached for the page's lifetime, so one interception per page load is enough.

## Safety

Levels 1 and 2 create nothing and may run anywhere. Levels 3 and 4 create
campaigns and are staging only, never tagged `@smoke`. They must write only
inside the lab and project named by `LAB_ID` and `PROJECT_ID`, and delete what
they create.

## CI

No new inputs are needed. Fixtures are versioned, so a run tests whatever is on
the branch. If a one-off configuration ever needs testing without a commit, add
a single optional `scan_config_fixture` input to the manual trigger that names a
file already in `data/scan-configs/`. Accepting inline JSON from a workflow input
is not worth the review gap it opens.

## Phases

| Phase | Work                                                                   | Ends with                                               |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| 1     | Agree the `data-scan-config-field` attribute with the application team | A decision, and a locator strategy that follows from it |
| 2     | Fixture format, loader, envelope validation                            | A validated fixture in the repo, checked in CI          |
| 3     | Page object, navigation, and the config driver                         | One fixture rendering in the editor, level 1 green      |
| 4     | Levels 2 and 5                                                         | Validation and grid-size coverage                       |
| 5     | Levels 3 and 4, with cleanup                                           | Full coverage on staging                                |

The walker is the only place that resolves a field to an element, so the locator
strategy stays reversible if the application changes shape again.
