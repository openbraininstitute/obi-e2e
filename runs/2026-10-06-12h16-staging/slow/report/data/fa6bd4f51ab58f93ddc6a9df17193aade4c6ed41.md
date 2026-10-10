# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/workflows/optimize-emodel/optimize-emodel.spec.ts >> E-model optimization >> Optimize an e-model against extracted e-features and launch it: sodium and potassium on the soma and the axon, one short generation
- Location: scenarios/workflows/optimize-emodel/optimize-emodel.spec.ts:53:4

# Error details

```
Error: The campaign is still "Pending".

expect(received).toMatch(expected)

Expected pattern: /^(done|error)$/i
Received string:  "Pending"

Call Log:
- Timeout 1800000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=f8e1]:
  - generic [ref=f8e6]:
    - generic [ref=f8e8]:
      - generic [ref=f8e9]:
        - menubar "t1/e2e-37457992612-1" [ref=f8e12]:
          - button "CI Test User" [ref=f8e13] [cursor=pointer]:
            - img "UserFilled" [ref=f8e14]
          - button [ref=f8e18] [cursor=pointer]:
            - heading "t1" [level=3] [ref=f8e19]
          - button "e2e-37457992612-1" [ref=f8e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=f8e23] [cursor=pointer]
        - link "Coins 176.85" [ref=f8e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/credits
          - img "Coins"
          - generic [ref=f8e27]: "176.85"
      - generic [ref=f8e28]:
        - link "Home" [ref=f8e31] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e
          - img "Home"
        - link "Data Explore" [ref=f8e34] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/data
          - generic [ref=f8e35]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=f8e38] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/workflows
          - generic [ref=f8e39]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=f8e42] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/notebooks
          - generic [ref=f8e43]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=f8e46] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/reports
        - generic [ref=f8e49]:
          - link [ref=f8e50] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/a57e7452-ea4f-4fc9-843a-63bcab99130e/help
          - generic [ref=f8e51]: Help
        - generic [ref=f8e53]:
          - generic [ref=f8e54] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=f8e55]: Feedback
    - generic [ref=f8e58]:
      - banner [ref=f8e59]:
        - generic [ref=f8e61]:
          - button "configuration" [ref=f8e62] [cursor=pointer]
          - button "optimizations" [ref=f8e63] [cursor=pointer]
        - button "Copy campaign ID" [ref=f8e66] [cursor=pointer]:
          - generic [ref=f8e67]: Copy optimization campaign ID
      - generic [ref=f8e71]:
        - generic [ref=f8e73]:
          - generic [ref=f8e74]:
            - generic:
              - checkbox "Select all" [disabled]
            - generic [ref=f8e75]: Select all
          - button "Emodel optimization 0" [ref=f8e77] [cursor=pointer]:
            - generic [ref=f8e79]:
              - generic [ref=f8e80]: Emodel optimization 0
              - generic [ref=f8e82]:
                - generic [ref=f8e84]:
                  - img "loading" [ref=f8e85]
                  - generic [ref=f8e88]: pending
                - button "Copy ID" [ref=f8e89]
          - button "Launch optimizations" [disabled] [ref=f8e94]
        - generic [ref=f8e100]:
          - generic [ref=f8e101]:
            - button "Inputs More information about input files" [disabled] [expanded] [ref=f8e102]:
              - generic [ref=f8e104]:
                - generic [ref=f8e105]: Inputs
                - button "More information about input files" [disabled] [ref=f8e106]:
                  - img "info-circle" [ref=f8e107]
            - generic [ref=f8e113]:
              - button "Task configuration config" [ref=f8e114] [cursor=pointer]:
                - generic [ref=f8e115]: Task configuration
                - generic [ref=f8e117]: config
              - button "obi_one_coordinate.json json" [ref=f8e118] [cursor=pointer]:
                - generic [ref=f8e119]: obi_one_coordinate.json
                - generic [ref=f8e121]: json
          - generic [ref=f8e122]:
            - button "Outputs More information about output files" [disabled] [expanded] [ref=f8e123]:
              - generic [ref=f8e125]:
                - generic [ref=f8e126]: Outputs
                - button "More information about output files" [disabled] [ref=f8e127]:
                  - img "info-circle" [ref=f8e128]
            - button "Task logs log" [ref=f8e135] [cursor=pointer]:
              - generic [ref=f8e136]: Task logs
              - generic [ref=f8e138]: log
        - generic [ref=f8e141]:
          - generic [ref=f8e143]:
            - textbox "Search logs" [ref=f8e145]
            - combobox [ref=f8e146] [cursor=pointer]:
              - generic [ref=f8e147]: Copy
            - combobox [ref=f8e148] [cursor=pointer]:
              - generic [ref=f8e149]: Download
          - generic [ref=f8e150]:
            - generic [ref=f8e153]:
              - generic [ref=f8e154]:
                - generic "10/6/2026, 11:49:00 AM" [ref=f8e155]: 11:49:00 AM
                - generic [ref=f8e156]:
                  - generic [ref=f8e157]:
                    - generic [ref=f8e159]:
                      - generic [ref=f8e160]: LOG
                      - generic [ref=f8e161]: "run_emodel_optimisation - INFO - Local store at `/data`: enabled"
                    - button "Copy log message" [ref=f8e162] [cursor=pointer]
                  - generic [ref=f8e163]:
                    - generic [ref=f8e165]:
                      - generic [ref=f8e166]: LOG
                      - generic [ref=f8e167]: Task is now running
                    - button "Copy log message" [ref=f8e168] [cursor=pointer]
                  - generic [ref=f8e169]:
                    - generic [ref=f8e171]:
                      - generic [ref=f8e172]: STATUS
                      - generic [ref=f8e173]: running
                    - button "Copy log message" [ref=f8e174] [cursor=pointer]
              - generic [ref=f8e175]:
                - generic "10/6/2026, 11:49:01 AM" [ref=f8e176]: 11:49:01 AM
                - generic [ref=f8e177]:
                  - generic [ref=f8e178]:
                    - generic [ref=f8e180]:
                      - generic [ref=f8e181]: LOG
                      - generic [ref=f8e182]: "httpx2 - INFO - HTTP Request: PATCH https://staging.cell-a.openbraininstitute.org/api/entitycore/task-activity/54848351-c47a-4ff9-bfbe-f331f82bc849 \"HTTP/1.1 503 Service Temporarily Unavailable\""
                    - button "Copy log message" [ref=f8e183] [cursor=pointer]
                  - generic [ref=f8e184]:
                    - generic [ref=f8e186]:
                      - generic [ref=f8e187]: LOG
                      - generic [ref=f8e188]: "Task execution failed: HTTP error 503 for PATCH https://staging.cell-a.openbraininstitute.org/api/entitycore/task-activity/54848351-c47a-4ff9-bfbe-f331f82bc849 data : None json : { \"status\": \"running\" } params : None response : <html> <head><title>503 Service Temporarily Unavailable</title></head> <body> <center><h1>503 Service Temporarily Unavailable</h1></center> </body> </html> : Traceback (most recent call last): File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/entitysdk/utils/http.py\", line 72, in make_db_api_request response.raise_for_status() File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/httpx2/_models.py\", line 827, in raise_for_status raise HTTPStatusError(message, request=request, response=self) httpx2.HTTPStatusError: Server error '503 Service Temporarily Unavailable' for url 'https://staging.cell-a.openbraininstitute.org/api/entitycore/task-activity/54848351-c47a-4ff9-bfbe-f331f82bc849' For more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503 The above exception was the direct cause of the following exception: Traceback (most recent call last): File \"/data/scratch/run_emodel_optimisation.py\", line 224, in job_wrapper yield File \"/data/scratch/run_emodel_optimisation.py\", line 539, in main activity_wrapper( File \"/uv/python/cpython-3.12.13-linux-x86_64-gnu/lib/python3.12/contextlib.py\", line 137, in __enter__ return next(self.gen) ^^^^^^^^^^^^^^ File \"/data/scratch/run_emodel_optimisation.py\", line 296, in activity_wrapper _update_activity_status({\"status\": ActivityStatus.running}) File \"/data/scratch/run_emodel_optimisation.py\", line 290, in _update_activity_status entitysdk_client.update_entity( File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/pydantic/_internal/_validate_call.py\", line 40, in wrapper_function return wrapper(*args, **kwargs) ^^^^^^^^^^^^^^^^^^^^^^^^ File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/pydantic/_internal/_validate_call.py\", line 137, in __call__ res = self.__pydantic_validator__.validate_python(pydantic_core.ArgsKwargs(args, kwargs)) ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/entitysdk/client.py\", line 334, in update_entity return core.update_entity( ^^^^^^^^^^^^^^^^^^^ File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/entitysdk/core.py\", line 300, in update_entity response = make_db_api_request( ^^^^^^^^^^^^^^^^^^^^ File \"/data/scratch/run-emodel-optimisation-venv/lib/python3.12/site-packages/entitysdk/utils/http.py\", line 81, in make_db_api_request raise EntitySDKError(message) from e entitysdk.exception.EntitySDKError: HTTP error 503 for PATCH https://staging.cell-a.openbraininstitute.org/api/entitycore/task-activity/54848351-c47a-4ff9-bfbe-f331f82bc849 data : None json : { \"status\": \"running\" } params : None response : <html> <head><title>503 Service Temporarily Unavailable</title></head> <body> <center><h1>503 Service Temporarily Unavailable</h1></center> </body> </html>"
                    - button "Copy log message" [ref=f8e189] [cursor=pointer]
                  - generic [ref=f8e190]:
                    - generic [ref=f8e192]:
                      - generic [ref=f8e193]: STATUS
                      - generic [ref=f8e194]: error
                    - button "Copy log message" [ref=f8e195] [cursor=pointer]
            - button "Scroll to top" [ref=f8e196] [cursor=pointer]
    - button "expand AI assistant" [ref=f8e198] [cursor=pointer]:
      - generic [ref=f8e201]: OBI Assistant
  - alert [ref=f8e202]
```

# Test source

```ts
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
> 406 |   }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
      |     ^ Error: The campaign is still "Pending".
  407 | }
  408 | 
```