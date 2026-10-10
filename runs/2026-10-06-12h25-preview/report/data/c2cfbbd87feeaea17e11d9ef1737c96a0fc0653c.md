# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/data/ion-channel-model-simulation/browse/browse.spec.ts >> Ion channel listing >> Every Ion channel filter narrows the listing
- Location: scenarios/data/ion-channel-model-simulation/browse/browse.spec.ts:82:2

# Error details

```
Error: The listing did not load: An error occurred while fetching "Ion channel" data for this region. We are sorry about the inconvenience. Please contact support.

Contact Support
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - menubar "t1/e2e-37458199254-1" [ref=e12]:
          - button "CI Test User" [ref=e13] [cursor=pointer]:
            - img "UserFilled" [ref=e14]
          - button [ref=e18] [cursor=pointer]:
            - heading "t1" [level=3] [ref=e19]
          - button "e2e-37458199254-1" [ref=e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=e23] [cursor=pointer]
        - link [disabled] [ref=e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/credits
          - img "Coins"
      - generic [ref=e29]:
        - link "Home" [ref=e32] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc
          - img "Home"
        - link "Data Explore" [ref=e35] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/data
          - generic [ref=e36]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=e39] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/workflows
          - generic [ref=e40]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=e43] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/notebooks
          - generic [ref=e44]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=e47] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/reports
        - generic [ref=e50]:
          - link [ref=e51] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/38e764a1-2fa0-4158-a858-13035ce68dfc/help
          - generic [ref=e52]: Help
        - generic [ref=e54]:
          - generic [ref=e55] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=e56]: Feedback
    - generic [ref=e58]:
      - tablist [ref=e62]:
        - tab "Public" [selected] [ref=e63] [cursor=pointer]
        - tab "Project" [ref=e65] [cursor=pointer]
      - generic [ref=e67]:
        - generic [ref=e70]:
          - generic [ref=e71]: Species
          - generic [ref=e80]:
            - tablist [ref=e83]:
              - tab "Experimental" [selected] [ref=e84] [cursor=pointer]
              - tab "Model" [ref=e85] [cursor=pointer]
              - tab "Simulations" [ref=e86] [cursor=pointer]
            - generic [ref=e87]:
              - button "Morphology of" [ref=e90] [cursor=pointer]:
                - generic [ref=e91]: Morphology
                - generic [ref=e92]: of
              - button "Single cell electrophysiology of" [ref=e99] [cursor=pointer]:
                - generic [ref=e100]: Single cell electrophysiology
                - generic [ref=e101]: of
              - button "Ion channel electrophysiology of" [ref=e108] [cursor=pointer]:
                - generic [ref=e109]: Ion channel electrophysiology
                - generic [ref=e110]: of
              - button "Neuron density of" [ref=e117] [cursor=pointer]:
                - generic [ref=e118]: Neuron density
                - generic [ref=e119]: of
              - button "Bouton density of" [ref=e126] [cursor=pointer]:
                - generic [ref=e127]: Bouton density
                - generic [ref=e128]: of
              - button "Synapse per connection of" [ref=e135] [cursor=pointer]:
                - generic [ref=e136]: Synapse per connection
                - generic [ref=e137]: of
              - button "EM mesh of" [ref=e144] [cursor=pointer]:
                - generic [ref=e145]: EM mesh
                - generic [ref=e146]: of
              - button "Intracellular e-feature extraction of" [ref=e153] [cursor=pointer]:
                - generic [ref=e154]: Intracellular e-feature extraction
                - generic [ref=e155]: of
        - generic [ref=e163]:
          - img "warning" [ref=e165]
          - paragraph [ref=e168]: An error occurred while fetching "Ion channel" data for this region. We are sorry about the inconvenience. Please contact support.
          - button "Contact Support" [ref=e169] [cursor=pointer]
    - button "expand AI assistant" [ref=e171] [cursor=pointer]:
      - generic [ref=e174]: OBI Assistant
  - alert [ref=e175]
```

# Test source

```ts
  1  | import { entityListing, listingError } from '@locators/listing';
  2  | import { expect, type Page } from '@playwright/test';
  3  | 
  4  | export async function expectListing(page: Page): Promise<void> {
  5  |   const listing = entityListing(page);
  6  |   const failed = listingError(page);
  7  | 
  8  |   await expect(listing.table).toBeVisible();
  9  | 
  10 |   await Promise.race([
  11 |     expect(listing.resultCount).toBeVisible(),
  12 |     failed.waitFor({ state: 'visible' }).then(async () => {
> 13 |       throw new Error(`The listing did not load: ${(await failed.innerText()).trim()}`);
     |                ^ Error: The listing did not load: An error occurred while fetching "Ion channel" data for this region. We are sorry about the inconvenience. Please contact support.
  14 |     }),
  15 |   ]);
  16 | }
  17 | 
  18 | /**
  19 |  * Waits for rows, and reports the listing's error banner instead when it shows.
  20 |  *
  21 |  * Waiting on the rows alone reports a backend failure as a gridcell that was
  22 |  * never found, which reads as a drifted locator.
  23 |  */
  24 | export async function expectRows(page: Page): Promise<void> {
  25 |   const listing = entityListing(page);
  26 |   const failed = listingError(page);
  27 | 
  28 |   await Promise.race([
  29 |     expect(listing.cells.first()).toBeVisible(),
  30 |     failed.waitFor({ state: 'visible' }).then(async () => {
  31 |       throw new Error(`The listing holds no rows: ${(await failed.innerText()).trim()}`);
  32 |     }),
  33 |   ]);
  34 | }
  35 | 
```