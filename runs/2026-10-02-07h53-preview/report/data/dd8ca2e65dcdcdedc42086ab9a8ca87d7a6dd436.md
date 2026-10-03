# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/workflows/build-circuit-synaptic-physiology/build-circuit-synaptic-physiology.spec.ts >> Circuit synaptic physiology build >> Simulate the circuit the build registered
- Location: scenarios/workflows/build-circuit-synaptic-physiology/build-circuit-synaptic-physiology.spec.ts:78:2

# Error details

```
Error: Launching the campaign never reached the service: net::ERR_FAILED, and said "We are having trouble running the simulation, please wait a few moments, and try again".
The page also saw:
uncaught: Minified React error #419; visit https://react.dev/errors/419 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/credits?_rsc=oOKtp2uGbSIbWe0J → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/data?_rsc=WtDQp-XdUyCSs53s → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/credits?_rsc=skhuyRheGnTVXU1h → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/credits?_rsc=3Hq6Ad5-8LnfdAob → net::ERR_ABORTED
console: Access to fetch at 'https://staging.cell-a.openbraininstitute.org/api/small-scale-simulator/circuit/simulation/run-batch' from origin 'https://main.preview.openbraininstitute.org' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
POST https://staging.cell-a.openbraininstitute.org/api/small-scale-simulator/circuit/simulation/run-batch → net::ERR_FAILED
console: Failed to load resource: net::ERR_FAILED
```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e6]:
    - generic [ref=f3e8]:
      - generic [ref=f3e9]:
        - menubar "t1/e2e-36977784006-1" [ref=f3e12]:
          - button "CI Test User" [ref=f3e13] [cursor=pointer]:
            - img "UserFilled" [ref=f3e14]
          - button [ref=f3e18] [cursor=pointer]:
            - heading "t1" [level=3] [ref=f3e19]
          - button "e2e-36977784006-1" [ref=f3e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=f3e23] [cursor=pointer]
        - link "Coins 1997.50" [ref=f3e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/credits
          - img "Coins"
          - generic [ref=f3e27]: "1997.50"
      - generic [ref=f3e28]:
        - link "Home" [ref=f3e31] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674
          - img "Home"
        - link "Data Explore" [ref=f3e34] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/data
          - generic [ref=f3e35]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=f3e38] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/workflows
          - generic [ref=f3e39]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=f3e42] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/notebooks
          - generic [ref=f3e43]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=f3e46] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/reports
        - generic [ref=f3e49]:
          - link [ref=f3e50] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/4d89e1c1-3587-4cb0-bc37-a18e120bc674/help
          - generic [ref=f3e51]: Help
        - generic [ref=f3e53]:
          - generic [ref=f3e54] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=f3e55]: Feedback
    - generic [ref=f3e58]:
      - banner [ref=f3e59]:
        - generic [ref=f3e61]:
          - button "configuration" [ref=f3e62] [cursor=pointer]
          - button "simulations" [ref=f3e63] [cursor=pointer]
        - button "Copy campaign ID" [ref=f3e66] [cursor=pointer]:
          - generic [ref=f3e67]: Copy simulation campaign ID
      - generic [ref=f3e71]:
        - generic [ref=f3e73]:
          - generic [ref=f3e74] [cursor=pointer]:
            - checkbox "Select all" [checked] [ref=f3e76]
            - generic [ref=f3e78]: Select all
          - button "Simulation 0" [ref=f3e80] [cursor=pointer]:
            - generic [ref=f3e82]:
              - generic [ref=f3e85]:
                - checkbox "Simulation 0" [checked] [ref=f3e87]
                - generic [ref=f3e89]: Simulation 0
              - generic [ref=f3e90]:
                - generic [ref=f3e91]: created
                - button "Copy ID" [ref=f3e94]
          - button "Launch simulations (1)" [ref=f3e99] [cursor=pointer]
        - generic [ref=f3e106]:
          - button "Inputs More information about input files" [disabled] [expanded] [ref=f3e107]:
            - generic [ref=f3e109]:
              - generic [ref=f3e110]: Inputs
              - button "More information about input files" [disabled] [ref=f3e111]:
                - img "info-circle" [ref=f3e112]
          - generic [ref=f3e118]:
            - button "Circuit directory folder" [ref=f3e119] [cursor=pointer]:
              - generic [ref=f3e120]: Circuit directory
              - generic [ref=f3e122]: folder
            - button "node_sets.json json" [ref=f3e123] [cursor=pointer]:
              - generic [ref=f3e124]: node_sets.json
              - generic [ref=f3e126]: json
            - button "obi_one_coordinate.json json" [ref=f3e127] [cursor=pointer]:
              - generic [ref=f3e128]: obi_one_coordinate.json
              - generic [ref=f3e130]: json
            - button "simulation_config.json json" [ref=f3e131] [cursor=pointer]:
              - generic [ref=f3e132]: simulation_config.json
              - generic [ref=f3e134]: json
        - generic [ref=f3e139]:
          - button "emodels_hoc 2 files" [ref=f3e140] [cursor=pointer]:
            - generic [ref=f3e144]:
              - generic [ref=f3e145]: emodels_hoc
              - generic [ref=f3e147]: 2 files
          - button "external_S1nonbarrel_neurons 1 file" [ref=f3e148] [cursor=pointer]:
            - generic [ref=f3e152]:
              - generic [ref=f3e153]: external_S1nonbarrel_neurons
              - generic [ref=f3e155]: 1 file
          - button "mod 28 files" [ref=f3e156] [cursor=pointer]:
            - generic [ref=f3e160]:
              - generic [ref=f3e161]: mod
              - generic [ref=f3e163]: 28 files
          - button "morphologies 2 files" [ref=f3e164] [cursor=pointer]:
            - generic [ref=f3e168]:
              - generic [ref=f3e169]: morphologies
              - generic [ref=f3e171]: 2 files
          - button "POm 1 file" [ref=f3e172] [cursor=pointer]:
            - generic [ref=f3e176]:
              - generic [ref=f3e177]: POm
              - generic [ref=f3e179]: 1 file
          - button "POm__S1nonbarrel_neurons__chemical 1 file" [ref=f3e180] [cursor=pointer]:
            - generic [ref=f3e184]:
              - generic [ref=f3e185]: POm__S1nonbarrel_neurons__chemical
              - generic [ref=f3e187]: 1 file
          - button "S1nonbarrel_neurons 1 file" [ref=f3e188] [cursor=pointer]:
            - generic [ref=f3e192]:
              - generic [ref=f3e193]: S1nonbarrel_neurons
              - generic [ref=f3e195]: 1 file
          - button "S1nonbarrel_neurons__S1nonbarrel_neurons__chemical 1 file" [ref=f3e196] [cursor=pointer]:
            - generic [ref=f3e200]:
              - generic [ref=f3e201]: S1nonbarrel_neurons__S1nonbarrel_neurons__chemical
              - generic [ref=f3e203]: 1 file
          - button "VPM 1 file" [ref=f3e204] [cursor=pointer]:
            - generic [ref=f3e208]:
              - generic [ref=f3e209]: VPM
              - generic [ref=f3e211]: 1 file
          - button "VPM__S1nonbarrel_neurons__chemical 1 file" [ref=f3e212] [cursor=pointer]:
            - generic [ref=f3e216]:
              - generic [ref=f3e217]: VPM__S1nonbarrel_neurons__chemical
              - generic [ref=f3e219]: 1 file
          - button "circuit_config.json json 2.28 KB" [ref=f3e220] [cursor=pointer]:
            - generic [ref=f3e228]:
              - generic [ref=f3e229]:
                - generic [ref=f3e230]: circuit_config.json
                - generic [ref=f3e231]: json
              - generic [ref=f3e232]: 2.28 KB
          - button "external_S1nonbarrel_neurons__S1nonbarrel_neurons__chemical.h5 h5 704.02 KB" [ref=f3e233] [cursor=pointer]:
            - generic [ref=f3e241]:
              - generic [ref=f3e242]:
                - generic [ref=f3e243]: external_S1nonbarrel_neurons__S1nonbarrel_neurons__chemical.h5
                - generic [ref=f3e244]: h5
              - generic [ref=f3e245]: 704.02 KB
          - button "id_mapping.json json 25.33 KB" [ref=f3e246] [cursor=pointer]:
            - generic [ref=f3e254]:
              - generic [ref=f3e255]:
                - generic [ref=f3e256]: id_mapping.json
                - generic [ref=f3e257]: json
              - generic [ref=f3e258]: 25.33 KB
          - button "node_sets.json json 11 KB" [ref=f3e259] [cursor=pointer]:
            - generic [ref=f3e267]:
              - generic [ref=f3e268]:
                - generic [ref=f3e269]: node_sets.json
                - generic [ref=f3e270]: json
              - generic [ref=f3e271]: 11 KB
          - button "run_coordinate_instance.json json 1.28 KB" [ref=f3e272] [cursor=pointer]:
            - generic [ref=f3e280]:
              - generic [ref=f3e281]:
                - generic [ref=f3e282]: run_coordinate_instance.json
                - generic [ref=f3e283]: json
              - generic [ref=f3e284]: 1.28 KB
    - button "expand AI assistant" [ref=f3e286] [cursor=pointer]:
      - generic [ref=f3e289]: OBI Assistant
  - alert [ref=f3e290]
  - generic [ref=f3e292]:
    - alert [ref=f3e294]:
      - img "close-circle" [ref=f3e295]
      - generic [ref=f3e298]: We are having trouble running the simulation, please wait a few moments, and try again
    - generic "Close" [ref=f3e299] [cursor=pointer]:
      - img "close" [ref=f3e300]
```

# Test source

```ts
  227 |  * with, and the button is pressed once more; one that refuses is reported with
  228 |  * the status the browser could not show. Counting a grid changes nothing on the
  229 |  * server, which is what makes both the replay and the second press safe.
  230 |  */
  231 | async function generateCampaign(page: Page, submit: Locator): Promise<void> {
  232 |   const generated = callSent(page, GENERATES_THE_CAMPAIGN, COUNTS_THE_GRID);
  233 |   await submit.click(NO_NAVIGATION);
  234 |   const outcome = await generated;
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
> 327 |     throw new Error(
      |              ^ Error: Launching the campaign never reached the service: net::ERR_FAILED, and said "We are having trouble running the simulation, please wait a few moments, and try again".
  328 |       `${what} never reached the service: ${outcome.dropped}` +
  329 |         `${await whatTheAppSaid(page)}.${alsoSeen(page)}`
  330 |     );
  331 |   }
  332 | 
  333 |   // waitForResponse observes headers. The core API client decodes the body before
  334 |   // resolving api.post<string>(), so wait for that body before checking UI state.
  335 |   const completionError = await outcome.response.finished();
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
  353 |   const notice = lowCredits(page)
  354 |     .notice.or(page.getByRole('alert').filter({ hasText: /\S/ }))
  355 |     .first();
  356 | 
  357 |   const said = await notice
  358 |     .innerText()
  359 |     .then((text) => text.trim().replaceAll(/\s+/g, ' '))
  360 |     .catch(() => '');
  361 | 
  362 |   return said === '' ? '' : `, and said "${said}"`;
  363 | }
  364 | 
  365 | function alsoSeen(page: Page): string {
  366 |   const problems = pageProblems(page);
  367 |   return problems.length === 0 ? '' : `\nThe page also saw:\n${problems.join('\n')}`;
  368 | }
  369 | 
  370 | /**
  371 |  * Moves to one of the editor's tabs.
  372 |  *
  373 |  * The pointer is left wherever the last click landed, and a tooltip that opens
  374 |  * under it is drawn into a popper that can cover the tab bar and swallow every
  375 |  * click until the action gives up — thirty seconds spent being told that
  376 |  * "virtual" intercepts pointer events. Escape closes whatever is showing, and
  377 |  * what it dismissed stays shut until the pointer leaves and comes back, which
  378 |  * the click itself does.
  379 |  */
  380 | async function openTab(
  381 |   page: Page,
  382 |   editor: ReturnType<typeof scanConfigEditor>,
  383 |   id: string
  384 | ): Promise<void> {
  385 |   await page.keyboard.press('Escape');
  386 |   await editor.tab(id).click(NO_NAVIGATION);
  387 | }
  388 | 
  389 | /**
  390 |  * Waits for a coordinate to stop moving.
  391 |  *
  392 |  * The wait stays on the page it launched from. A campaign is held in the
  393 |  * editor's own state rather than in the URL, so reloading loses it: the page
  394 |  * comes back on the configuration tab with no coordinates to read. That rules
  395 |  * out the usual trick of polling a fresh page, and it is why a run longer than
  396 |  * the `@slow` job can hold has to be picked up from the Workflows activity
  397 |  * table instead of followed from here.
  398 |  *
  399 |  * `toPass` rather than a single long `toHaveText`, so a run that ends in
  400 |  * "error" is reported as that instead of as a timeout with nothing to say.
  401 |  */
  402 | export async function waitForCampaign(status: Locator, minutes: number): Promise<void> {
  403 |   await expect(async () => {
  404 |     const text = (await status.innerText()).trim();
  405 |     expect(text, `The campaign is still "${text}".`).toMatch(SETTLED);
  406 |   }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
  407 | }
  408 | 
```