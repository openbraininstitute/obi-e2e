# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/data/memodel/browse/browse.spec.ts >> ME-model listing >> See the ME-model results
- Location: scenarios/data/memodel/browse/browse.spec.ts:119:2

# Error details

```
Error: The listing did not load: An error occurred while fetching "ME-model" data for this region. We are sorry about the inconvenience. Please contact support.

Contact Support
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - menubar "undefined/e2e-37773130572-1" [ref=e12]:
          - button "e2e-37773130572-1" [ref=e16] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=e17] [cursor=pointer]
        - link [disabled] [ref=e20] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/credits
          - img "Coins"
      - generic [ref=e23]:
        - link "Home" [ref=e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b
          - img "Home"
        - link "Data Explore" [ref=e29] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/data
          - generic [ref=e30]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=e33] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/workflows
          - generic [ref=e34]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=e37] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/notebooks
          - generic [ref=e38]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=e41] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/reports
        - generic [ref=e44]:
          - link [ref=e45] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/297a557c-7269-467e-bb9e-e7f1516e999b/help
          - generic [ref=e46]: Help
        - generic [ref=e48]:
          - generic [ref=e49] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=e50]: Feedback
    - generic [ref=e52]:
      - tablist [ref=e56]:
        - tab "Public" [selected] [ref=e57] [cursor=pointer]
        - tab "Project" [ref=e59] [cursor=pointer]
      - generic [ref=e61]:
        - generic [ref=e69]:
          - tablist [ref=e72]:
            - tab "Experimental" [selected] [ref=e73] [cursor=pointer]
            - tab "Model" [ref=e74] [cursor=pointer]
            - tab "Simulations" [ref=e75] [cursor=pointer]
          - generic [ref=e76]:
            - button "Morphology warning" [ref=e79] [cursor=pointer]:
              - generic [ref=e80]: Morphology
              - img "warning" [ref=e82]
            - button "Single cell electrophysiology warning" [ref=e85] [cursor=pointer]:
              - generic [ref=e86]: Single cell electrophysiology
              - img "warning" [ref=e88]
            - button "Ion channel electrophysiology warning" [ref=e91] [cursor=pointer]:
              - generic [ref=e92]: Ion channel electrophysiology
              - img "warning" [ref=e94]
            - button "Neuron density warning" [ref=e97] [cursor=pointer]:
              - generic [ref=e98]: Neuron density
              - img "warning" [ref=e100]
            - button "Bouton density warning" [ref=e103] [cursor=pointer]:
              - generic [ref=e104]: Bouton density
              - img "warning" [ref=e106]
            - button "Synapse per connection warning" [ref=e109] [cursor=pointer]:
              - generic [ref=e110]: Synapse per connection
              - img "warning" [ref=e112]
            - button "EM mesh warning" [ref=e115] [cursor=pointer]:
              - generic [ref=e116]: EM mesh
              - img "warning" [ref=e118]
            - button "Intracellular e-feature extraction warning" [ref=e121] [cursor=pointer]:
              - generic [ref=e122]: Intracellular e-feature extraction
              - img "warning" [ref=e124]
        - generic [ref=e128]:
          - img "warning" [ref=e130]
          - paragraph [ref=e133]: An error occurred while fetching "ME-model" data for this region. We are sorry about the inconvenience. Please contact support.
          - button "Contact Support" [ref=e134] [cursor=pointer]
    - button "expand AI assistant" [ref=e136] [cursor=pointer]:
      - generic [ref=e139]: OBI Assistant
  - alert [ref=e140]
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
     |                ^ Error: The listing did not load: An error occurred while fetching "ME-model" data for this region. We are sorry about the inconvenience. Please contact support.
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