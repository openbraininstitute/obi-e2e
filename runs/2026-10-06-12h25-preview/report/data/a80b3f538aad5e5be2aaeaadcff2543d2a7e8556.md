# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/data/whole-brain-circuit-simulation/view/view.spec.ts >> Whole brain circuit details >> Open the full Whole brain circuit page
- Location: scenarios/data/whole-brain-circuit-simulation/view/view.spec.ts:52:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('data-grid-result-count').or(getByText(/[\d,]+ results/))
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "to.be.visible" with timeout 30000ms
  - waiting for getByTestId('data-grid-result-count').or(getByText(/[\d,]+ results/))

```

```yaml
- menubar "t1/e2e-37458199254-1":
  - button "CI Test User":
    - img "UserFilled"
  - button "t1":
    - heading "t1" [level=3]
  - img
  - button "e2e-37458199254-1"
  - button "toggle-workspace-panel":
    - img
- link "Coins 2000.00":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/credits
  - img "Coins"
  - text: "2000.00"
- link "Home":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc
  - img "Home"
- link "Data Explore":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/data
  - text: Data
  - img "Explore"
- link "Workflows Workflow":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/workflows
  - text: Workflows
  - img "Workflow"
- link "Notebooks Notebook":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/notebooks
  - text: Notebooks
  - img "Notebook"
- link "Reports":
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/reports
- link:
  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/help
- text: Help
- img "Feedback star"
- text: Feedback
- tablist:
  - tab "Public" [selected]
  - tab "Project"
- tablist:
  - tab "Experimental" [selected]
  - tab "Model"
  - tab "Simulations"
- button "Morphology warning":
  - text: Morphology
  - img "warning"
- button "Single cell electrophysiology warning":
  - text: Single cell electrophysiology
  - img "warning"
- button "Ion channel electrophysiology warning":
  - text: Ion channel electrophysiology
  - img "warning"
- button "Neuron density warning":
  - text: Neuron density
  - img "warning"
- button "Bouton density warning":
  - text: Bouton density
  - img "warning"
- button "Synapse per connection warning":
  - text: Synapse per connection
  - img "warning"
- button "EM mesh warning":
  - text: EM mesh
  - img "warning"
- button "Intracellular e-feature extraction warning":
  - text: Intracellular e-feature extraction
  - img "warning"
- img "warning"
- paragraph: An error occurred while fetching "Whole brain circuit" data for this region. We are sorry about the inconvenience. Please contact support.
- button "Contact Support"
- button "expand AI assistant":
  - img
  - text: OBI Assistant
- alert
```

# Test source

```ts
  1  | import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
  2  | import { routes } from '@fixtures/routes';
  3  | import { AUTHENTICATED } from '@fixtures/tags';
  4  | import { expect, test } from '@fixtures/test';
  5  | import { WIDE_VIEWPORT } from '@fixtures/viewport';
  6  | import { dataView } from '@locators/data-view';
  7  | import { entityListing } from '@locators/listing';
  8  | 
  9  | const SLUG = entitySlug(Type.WholeBrainCircuitSimulation);
  10 | 
  11 | const PROPERTIES = ['circuit_name', 'legacy_activity_status', 'creation_date', 'lifecycle_status'];
  12 | 
  13 | /** Only the parts every simulation page carries: the rest follows its own configuration. */
  14 | const TABS = ['scan-config-tab-configuration', 'scan-config-tab-simulations'];
  15 | 
  16 | const SECTIONS = ['scan-config-root-element-info'];
  17 | 
  18 | test.use(WIDE_VIEWPORT);
  19 | 
  20 | test.describe('Whole brain circuit details', () => {
  21 |   test.beforeEach(async ({ page, workspace }) => {
  22 |     const listing = entityListing(page);
  23 | 
  24 |     await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
  25 |     await expect(listing.table).toBeVisible();
> 26 |     await expect(listing.resultCount).toBeVisible();
     |                                      ^ Error: expect(locator).toBeVisible() failed
  27 | 
  28 |     const empty = await listing.resultCount.innerText();
  29 |     test.skip(
  30 |       empty.startsWith('0 results'),
  31 |       'This deployment holds no Whole brain circuit to open.'
  32 |     );
  33 | 
  34 |     await listing.cells.filter({ hasText: /\S/ }).first().click();
  35 |     await expect(dataView(page).viewDetails).toBeVisible();
  36 |   });
  37 | 
  38 |   test(
  39 |     'Open one Whole brain circuit beside the listing',
  40 |     { tag: AUTHENTICATED },
  41 |     async ({ page }) => {
  42 |       const view = dataView(page);
  43 | 
  44 |       await expect(view.miniName).toBeVisible();
  45 |       for (const property of PROPERTIES) {
  46 |         await expect(view.miniProperty(property)).toBeVisible();
  47 |       }
  48 |       await expect(view.miniDownload).toBeVisible();
  49 |     }
  50 |   );
  51 | 
  52 |   test('Open the full Whole brain circuit page', { tag: AUTHENTICATED }, async ({ page }) => {
  53 |     test.slow();
  54 |     const view = dataView(page);
  55 | 
  56 |     await view.viewDetails.click();
  57 |     await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));
  58 | 
  59 |     for (const name of TABS) {
  60 |       await expect(view.section(name).first()).toBeVisible();
  61 |     }
  62 | 
  63 |     await view.section('scan-config-tab-configuration').first().click();
  64 | 
  65 |     for (const name of SECTIONS) {
  66 |       await expect(view.section(name).first()).toBeVisible();
  67 |     }
  68 |   });
  69 | });
  70 | 
```