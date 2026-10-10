# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/data/ion-channel-recording/browse/browse.spec.ts >> Ion channel electrophysiology listing >> See the Ion channel electrophysiology results
- Location: scenarios/data/ion-channel-recording/browse/browse.spec.ts:124:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('data-table-container').getByRole('gridcell').first()
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "to.be.visible" with timeout 30000ms
  - waiting for getByTestId('data-table-container').getByRole('gridcell').first()

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
- paragraph: An error occurred while fetching "Ion channel electrophysiology" data for this region. We are sorry about the inconvenience. Please contact support.
- button "Contact Support"
- button "expand AI assistant":
  - img
  - text: OBI Assistant
- alert
```

# Test source

```ts
  31  |   'Cell line',
  32  |   'Name',
  33  |   'Contributors',
  34  |   'Registration date',
  35  |   'Lifecycle status',
  36  | ];
  37  | 
  38  | const HIDDEN_COLUMNS: string[] = [
  39  |   'Ion channel label',
  40  |   'Gene',
  41  |   'Validation passed',
  42  |   'Validation name',
  43  |   'Recording type',
  44  |   'Strain',
  45  |   'Subject name',
  46  | ];
  47  | 
  48  | const FILTERS = [
  49  |   'Brain region',
  50  |   'Species',
  51  |   'Ion channel',
  52  |   'Temperature',
  53  |   'Cell line',
  54  |   'Name',
  55  |   'Contributors',
  56  |   'Registration date',
  57  |   'Lifecycle status',
  58  | ];
  59  | 
  60  | test.use(WIDE_VIEWPORT);
  61  | 
  62  | test.describe('Ion channel electrophysiology listing', () => {
  63  |   test.beforeEach(async ({ page, workspace }) => {
  64  |     await page.goto(
  65  |       routes.dataEntity(workspace.labId, workspace.projectId, entitySlug(Type.IonChannelRecording))
  66  |     );
  67  |     await expectListing(page);
  68  |   });
  69  | 
  70  |   test('See the Ion channel electrophysiology table', { tag: AUTHENTICATED }, async ({ page }) => {
  71  |     const listing = entityListing(page);
  72  | 
  73  |     for (const column of COLUMNS) {
  74  |       await expect(listing.columnHeader(column)).toBeVisible();
  75  |     }
  76  |   });
  77  | 
  78  |   test(
  79  |     'The Ion channel electrophysiology table offers no columns beyond these',
  80  |     { tag: AUTHENTICATED },
  81  |     async ({ page }) => {
  82  |       const listing = entityListing(page);
  83  | 
  84  |       await listing.columns.click();
  85  |       await expect(listing.columnsMenu).toBeVisible();
  86  | 
  87  |       for (const column of SHOWN_COLUMNS) {
  88  |         await expect(listing.columnToggle(column)).toBeChecked();
  89  |       }
  90  |       for (const column of HIDDEN_COLUMNS) {
  91  |         await expect(listing.columnToggle(column)).not.toBeChecked();
  92  |       }
  93  | 
  94  |       await expect(listing.columnToggles).toHaveCount(toggleCount(SHOWN_COLUMNS, HIDDEN_COLUMNS));
  95  |     }
  96  |   );
  97  | 
  98  |   test(
  99  |     'Add a hidden column to the Ion channel electrophysiology table',
  100 |     { tag: AUTHENTICATED },
  101 |     async ({ page }) => {
  102 |       const listing = entityListing(page);
  103 | 
  104 |       await listing.columns.click();
  105 |       await expect(listing.columnsMenu).toBeVisible();
  106 | 
  107 |       for (const column of SHOWN_COLUMNS.slice(2)) {
  108 |         await listing.columnToggle(column).click();
  109 |       }
  110 | 
  111 |       for (const column of HIDDEN_COLUMNS) {
  112 |         const toggle = listing.columnToggle(column);
  113 | 
  114 |         await toggle.click();
  115 |         await expect(toggle).toBeChecked();
  116 |         await expect(listing.columnHeader(column)).toBeVisible();
  117 | 
  118 |         await toggle.click();
  119 |         await expect(toggle).not.toBeChecked();
  120 |       }
  121 |     }
  122 |   );
  123 | 
  124 |   test(
  125 |     'See the Ion channel electrophysiology results',
  126 |     { tag: AUTHENTICATED },
  127 |     async ({ page }) => {
  128 |       const listing = entityListing(page);
  129 | 
  130 |       await expect(listing.resultCount).toBeVisible();
> 131 |       await expect(listing.cells.first()).toBeVisible();
      |                                          ^ Error: expect(locator).toBeVisible() failed
  132 |     }
  133 |   );
  134 | 
  135 |   test(
  136 |     'Search the Ion channel electrophysiology listing',
  137 |     { tag: AUTHENTICATED },
  138 |     async ({ page }) => {
  139 |       const listing = entityListing(page);
  140 |       await expect(listing.cells.first()).toBeVisible();
  141 |       const before = await listing.resultCount.innerText();
  142 | 
  143 |       await listing.search.fill('zzzz-no-such-entity');
  144 |       await expect(listing.resultCount).toHaveText(/^0 results/);
  145 | 
  146 |       await listing.search.clear();
  147 |       await expect(listing.resultCount).toHaveText(before);
  148 |     }
  149 |   );
  150 | 
  151 |   test(
  152 |     'Every Ion channel electrophysiology filter narrows the listing',
  153 |     { tag: AUTHENTICATED },
  154 |     async ({ page }) => {
  155 |       test.slow();
  156 |       await expectListing(page);
  157 | 
  158 |       for (const column of FILTERS) {
  159 |         await test.step(column, () => checkFilter(page, column));
  160 |       }
  161 |     }
  162 |   );
  163 | 
  164 |   test(
  165 |     'Page through the Ion channel electrophysiology listing',
  166 |     { tag: AUTHENTICATED },
  167 |     async ({ page }) => {
  168 |       await checkPagination(page);
  169 |     }
  170 |   );
  171 | });
  172 | 
```