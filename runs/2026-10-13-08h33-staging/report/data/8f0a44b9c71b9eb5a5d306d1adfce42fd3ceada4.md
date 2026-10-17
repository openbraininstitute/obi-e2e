# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/workflows/simulate-small-microcircuit/simulate-small-microcircuit.spec.ts >> Small microcircuit simulation >> Generate a simulation campaign and launch it: a constant current clamp on every biophysical neuron
- Location: scenarios/workflows/simulate-small-microcircuit/simulate-small-microcircuit.spec.ts:40:4

# Error details

```
Test timeout of 480000ms exceeded.
```

```
Error: Test timeout of 480000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - menubar "t1/e2e-38364804875-1" [ref=e12]:
          - button "CI Test User" [ref=e13] [cursor=pointer]:
            - img "UserFilled" [ref=e14]
          - button [ref=e18] [cursor=pointer]:
            - heading "t1" [level=3] [ref=e19]
          - button "e2e-38364804875-1" [ref=e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=e23] [cursor=pointer]
        - link "Coins 240.65" [ref=e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/credits
          - img "Coins"
          - generic [ref=e27]: "240.65"
      - generic [ref=e28]:
        - link "Home" [ref=e31] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad
          - img "Home"
        - link "Data Explore" [ref=e34] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/data
          - generic [ref=e35]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=e38] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/workflows
          - generic [ref=e39]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=e42] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/notebooks
          - generic [ref=e43]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=e46] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/reports
        - generic [ref=e49]:
          - link [ref=e50] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a778e710-9440-45b1-ab31-1c232eb1d3ad/help
          - generic [ref=e51]: Help
        - generic [ref=e53]:
          - generic [ref=e54] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=e55]: Feedback
    - generic [ref=e58]:
      - banner [ref=e59]:
        - generic [ref=e61]:
          - button "configuration" [ref=e62] [cursor=pointer]
          - button "simulations" [ref=e63] [cursor=pointer]
        - button "Copy campaign ID" [ref=e66] [cursor=pointer]:
          - generic [ref=e67]: Copy simulation campaign ID
      - generic [ref=e71]:
        - generic [ref=e73]:
          - generic [ref=e74]:
            - generic:
              - checkbox "Select all" [disabled]
            - generic [ref=e75]: Select all
          - button "Simulation 0" [ref=e77] [cursor=pointer]:
            - generic [ref=e79]:
              - generic [ref=e80]: Simulation 0
              - generic [ref=e82]:
                - generic [ref=e84]:
                  - img "loading" [ref=e85]
                  - generic [ref=e88]: running
                - button "Copy ID" [ref=e89]
          - button "Launch simulations" [disabled] [ref=e94]
        - generic [ref=e101]:
          - button "Inputs More information about input files" [disabled] [expanded] [ref=e102]:
            - generic [ref=e104]:
              - generic [ref=e105]: Inputs
              - button "More information about input files" [disabled] [ref=e106]:
                - img "info-circle" [ref=e107]
          - generic [ref=e113]:
            - button "Circuit directory folder" [ref=e114] [cursor=pointer]:
              - generic [ref=e115]: Circuit directory
              - generic [ref=e117]: folder
            - button "node_sets.json json" [ref=e118] [cursor=pointer]:
              - generic [ref=e119]: node_sets.json
              - generic [ref=e121]: json
            - button "obi_one_coordinate.json json" [ref=e122] [cursor=pointer]:
              - generic [ref=e123]: obi_one_coordinate.json
              - generic [ref=e125]: json
            - button "simulation_config.json json" [ref=e126] [cursor=pointer]:
              - generic [ref=e127]: simulation_config.json
              - generic [ref=e129]: json
        - generic [ref=e134]:
          - button "CA3_projections 1 file" [ref=e135] [cursor=pointer]:
            - generic [ref=e139]:
              - generic [ref=e140]: CA3_projections
              - generic [ref=e142]: 1 file
          - button "CA3_projections__hippocampus_neurons__chemical_synapse 1 file" [ref=e143] [cursor=pointer]:
            - generic [ref=e147]:
              - generic [ref=e148]: CA3_projections__hippocampus_neurons__chemical_synapse
              - generic [ref=e150]: 1 file
          - button "components 9 files" [ref=e151] [cursor=pointer]:
            - generic [ref=e155]:
              - generic [ref=e156]: components
              - generic [ref=e158]: 9 files
          - button "external_hippocampus_neurons 1 file" [ref=e159] [cursor=pointer]:
            - generic [ref=e163]:
              - generic [ref=e164]: external_hippocampus_neurons
              - generic [ref=e166]: 1 file
          - button "hippocampus_neurons 1 file" [ref=e167] [cursor=pointer]:
            - generic [ref=e171]:
              - generic [ref=e172]: hippocampus_neurons
              - generic [ref=e174]: 1 file
          - button "hippocampus_neurons__hippocampus_neurons__chemical_synapse 1 file" [ref=e175] [cursor=pointer]:
            - generic [ref=e179]:
              - generic [ref=e180]: hippocampus_neurons__hippocampus_neurons__chemical_synapse
              - generic [ref=e182]: 1 file
          - button "mod 22 files" [ref=e183] [cursor=pointer]:
            - generic [ref=e187]:
              - generic [ref=e188]: mod
              - generic [ref=e190]: 22 files
          - button "circuit_config.json json 2.33 KB" [ref=e191] [cursor=pointer]:
            - generic [ref=e199]:
              - generic [ref=e200]:
                - generic [ref=e201]: circuit_config.json
                - generic [ref=e202]: json
              - generic [ref=e203]: 2.33 KB
          - button "external_hippocampus_neurons__hippocampus_neurons__chemical_synapse.h5 h5 8.17 MB" [ref=e204] [cursor=pointer]:
            - generic [ref=e212]:
              - generic [ref=e213]:
                - generic [ref=e214]: external_hippocampus_neurons__hippocampus_neurons__chemical_synapse.h5
                - generic [ref=e215]: h5
              - generic [ref=e216]: 8.17 MB
          - button "id_mapping.json json 4.77 MB" [ref=e217] [cursor=pointer]:
            - generic [ref=e225]:
              - generic [ref=e226]:
                - generic [ref=e227]: id_mapping.json
                - generic [ref=e228]: json
              - generic [ref=e229]: 4.77 MB
          - button "node_sets.json json 11.2 KB" [ref=e230] [cursor=pointer]:
            - generic [ref=e238]:
              - generic [ref=e239]:
                - generic [ref=e240]: node_sets.json
                - generic [ref=e241]: json
              - generic [ref=e242]: 11.2 KB
    - button "expand AI assistant" [ref=e244] [cursor=pointer]:
      - generic [ref=e247]: OBI Assistant
  - alert [ref=e248]
```

# Test source

```ts
  235 | 
  236 |   if (outcome === null || !('dropped' in outcome) || !COUNTS_THE_GRID.test(outcome.request.url())) {
  237 |     await expectAccepted(page, Promise.resolve(outcome), 'Generating the campaign');
  238 |     return;
  239 |   }
  240 | 
  241 |   const replayed = await send(outcome.request.url(), {
  242 |     method: outcome.request.method(),
  243 |     headers: replayHeaders(outcome.request.headers()),
  244 |     body: outcome.request.postData(),
  245 |     timeoutMs: CALL_TIMEOUT,
  246 |   });
  247 | 
  248 |   if (Result.isError(replayed)) {
  249 |     throw new Error(
  250 |       `Generating the campaign never reached the service: ${outcome.dropped}. The grid count sent ` +
  251 |         `again from the runner got ${describe(replayed.error)}.${alsoSeen(page)}`
  252 |     );
  253 |   }
  254 | 
  255 |   const again = callSent(page, GENERATES_THE_CAMPAIGN, COUNTS_THE_GRID);
  256 |   await submit.click(NO_NAVIGATION);
  257 |   await expectAccepted(
  258 |     page,
  259 |     again,
  260 |     `Generating the campaign a second time, after the browser dropped the grid count (${outcome.dropped}),`
  261 |   );
  262 | }
  263 | 
  264 | /** Only what the app itself set, so a call can be sent again from outside the browser. */
  265 | export function replayHeaders(headers: Record<string, string>): Record<string, string> {
  266 |   return Object.fromEntries(
  267 |     Object.entries(headers).filter(([name]) => APP_HEADERS.has(name.toLowerCase()))
  268 |   );
  269 | }
  270 | 
  271 | /**
  272 |  * The call a button sends, watched from before the click.
  273 |  *
  274 |  * The app swallows what these answer — a 403 refusing a launch reaches the
  275 |  * console and nothing else, a 500 refusing to generate leaves the results tab
  276 |  * disabled and nothing on the page — so a run that watches only the editor
  277 |  * reports every backend refusal as an element that never moved. The call is
  278 |  * where the reason is. `page.waitForResponse()` resolves when response headers
  279 |  * arrive; `expectAccepted()` waits for the response body before allowing a UI
  280 |  * assertion that depends on it.
  281 |  */
  282 | function callSent(page: Page, url: RegExp, first?: RegExp): Promise<CallOutcome> {
  283 |   const matches = (request: Request) =>
  284 |     request.method() === 'POST' &&
  285 |     (url.test(request.url()) || (first?.test(request.url()) ?? false));
  286 | 
  287 |   // The call itself answering, or either call refused. A call that has to be
  288 |   // answered before it is not the answer.
  289 |   const answered = page
  290 |     .waitForResponse(
  291 |       (response) => matches(response.request()) && (!response.ok() || url.test(response.url())),
  292 |       { timeout: CALL_TIMEOUT }
  293 |     )
  294 |     .then((response): CallOutcome => ({ response }))
  295 |     .catch(() => null);
  296 | 
  297 |   // A request the browser drops answers nothing, so the response wait alone
  298 |   // reports it as a button that sent nothing at all.
  299 |   const dropped = page
  300 |     .waitForEvent('requestfailed', {
  301 |       predicate: matches,
  302 |       timeout: CALL_TIMEOUT,
  303 |     })
  304 |     .then((request): CallOutcome => ({
  305 |       dropped: request.failure()?.errorText ?? 'failed',
  306 |       request,
  307 |     }))
  308 |     .catch(() => null);
  309 | 
  310 |   return Promise.race([answered, dropped]);
  311 | }
  312 | 
  313 | /** What a call did: answered, dropped by the browser, or never sent. */
  314 | type CallOutcome = { response: Response } | { dropped: string; request: Request } | null;
  315 | 
  316 | /** Fails naming what the service said, rather than what the editor did not do. */
  317 | async function expectAccepted(page: Page, call: Promise<CallOutcome>, what: string): Promise<void> {
  318 |   const outcome = await call;
  319 | 
  320 |   if (outcome === null) {
  321 |     // The app refused before sending: no credits shows a notice and stops here.
  322 |     throw new Error(`${what} sent no request${await whatTheAppSaid(page)}.${alsoSeen(page)}`);
  323 |   }
  324 | 
  325 |   if ('dropped' in outcome) {
  326 |     // The app catches this one and puts it in a notification.
  327 |     throw new Error(
  328 |       `${what} never reached the service: ${outcome.dropped}` +
  329 |         `${await whatTheAppSaid(page)}.${alsoSeen(page)}`
  330 |     );
  331 |   }
  332 | 
  333 |   // waitForResponse observes headers. The core API client decodes the body before
  334 |   // resolving api.post<string>(), so wait for that body before checking UI state.
> 335 |   const completionError = await outcome.response.finished();
      |                                                 ^ Error: Test timeout of 480000ms exceeded.
  336 | 
  337 |   if (completionError) {
  338 |     throw new Error(`${what} response did not finish: ${completionError}`);
  339 |   }
  340 | 
  341 |   if (!outcome.response.ok()) {
  342 |     const said = await outcome.response
  343 |       .text()
  344 |       .then((body) => body.replaceAll(/\s+/g, ' ').trim())
  345 |       .catch(() => '');
  346 |     throw new Error(
  347 |       `${what} was refused: ${outcome.response.status()} ${outcome.response.url()} ${said}`
  348 |     );
  349 |   }
  350 | }
  351 | 
  352 | async function whatTheAppSaid(page: Page): Promise<string> {
  353 |   // Next.js's route announcer is also role="alert" and holds the page title; the
  354 |   // app's error notification is the alert carrying antd's close-circle icon.
  355 |   const notice = lowCredits(page)
  356 |     .notice.or(
  357 |       page.getByRole('alert').filter({ has: page.getByRole('img', { name: 'close-circle' }) })
  358 |     )
  359 |     .first();
  360 | 
  361 |   const said = await notice
  362 |     .innerText()
  363 |     .then((text) => text.trim().replaceAll(/\s+/g, ' '))
  364 |     .catch(() => '');
  365 | 
  366 |   return said === '' ? '' : `, and said "${said}"`;
  367 | }
  368 | 
  369 | function alsoSeen(page: Page): string {
  370 |   const problems = pageProblems(page);
  371 |   return problems.length === 0 ? '' : `\nThe page also saw:\n${problems.join('\n')}`;
  372 | }
  373 | 
  374 | /**
  375 |  * Moves to one of the editor's tabs.
  376 |  *
  377 |  * The pointer is left wherever the last click landed, and a tooltip that opens
  378 |  * under it is drawn into a popper that can cover the tab bar and swallow every
  379 |  * click until the action gives up — thirty seconds spent being told that
  380 |  * "virtual" intercepts pointer events. Escape closes whatever is showing, and
  381 |  * what it dismissed stays shut until the pointer leaves and comes back, which
  382 |  * the click itself does.
  383 |  */
  384 | async function openTab(
  385 |   page: Page,
  386 |   editor: ReturnType<typeof scanConfigEditor>,
  387 |   id: string
  388 | ): Promise<void> {
  389 |   await page.keyboard.press('Escape');
  390 |   await editor.tab(id).click(NO_NAVIGATION);
  391 | }
  392 | 
  393 | /**
  394 |  * Waits for a coordinate to stop moving.
  395 |  *
  396 |  * The wait stays on the page it launched from. A campaign is held in the
  397 |  * editor's own state rather than in the URL, so reloading loses it: the page
  398 |  * comes back on the configuration tab with no coordinates to read. That rules
  399 |  * out the usual trick of polling a fresh page, and it is why a run longer than
  400 |  * the `@slow` job can hold has to be picked up from the Workflows activity
  401 |  * table instead of followed from here.
  402 |  *
  403 |  * `toPass` rather than a single long `toHaveText`, so a run that ends in
  404 |  * "error" is reported as that instead of as a timeout with nothing to say.
  405 |  */
  406 | export async function waitForCampaign(status: Locator, minutes: number): Promise<void> {
  407 |   await expect(async () => {
  408 |     const text = (await status.innerText()).trim();
  409 |     expect(text, `The campaign is still "${text}".`).toMatch(SETTLED);
  410 |   }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
  411 | }
  412 | 
```