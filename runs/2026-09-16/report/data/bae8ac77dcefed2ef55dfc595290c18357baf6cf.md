# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/workflows/simulate-brain-region/simulate-brain-region.spec.ts >> Brain region simulation >> Generate a simulation campaign without launching it: a constant current clamp on every biophysical neuron
- Location: scenarios/workflows/simulate-brain-region/simulate-brain-region.spec.ts:57:4

# Error details

```
Error: Generating the campaign sent no request.
The page also saw:
uncaught: Minified React error #419; visit https://react.dev/errors/419 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/07507a86-06d0-43ea-9fdd-6b313fcbe4a4/reports?_rsc=sYNkjj8arSLUYP2_ → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/07507a86-06d0-43ea-9fdd-6b313fcbe4a4/help?_rsc=sYNkjj8arSLUYP2_ → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/07507a86-06d0-43ea-9fdd-6b313fcbe4a4/notebooks/browse/analysis-notebook-template?_rsc=qxyHu46hX6INb3Nk → net::ERR_ABORTED
GET https://main.preview.openbraininstitute.org/app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/07507a86-06d0-43ea-9fdd-6b313fcbe4a4/reports?_rsc=iH1Dk-UpSImd6KQu → net::ERR_ABORTED
```

# Test source

```ts
  102 |   await new ScanConfigDriver(page).apply(configuration);
  103 | 
  104 |   await expect(editor.submit).toHaveText(words.generate);
  105 |   await expect(editor.submit).toBeEnabled();
  106 | 
  107 |   const generated = callSent(page, GENERATES_THE_CAMPAIGN);
  108 |   await editor.submit.click(NO_NAVIGATION);
  109 |   await expectAccepted(page, generated, 'Generating the campaign');
  110 | 
  111 |   // The completed response carries the campaign ID, but the editor enables the
  112 |   // tab only once it has read the grid back: server work, so the call's clock.
  113 |   await expect(editor.tab(words.resultsTab)).toBeEnabled({ timeout: CALL_TIMEOUT });
  114 | 
  115 |   await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);
  116 | 
  117 |   // The scenario reads the first coordinate, whatever the campaign holds.
  118 |   const status = results.coordinates.first().getByTestId('scan-config-status');
  119 |   await expect(status).toHaveText(/^created$/i);
  120 | 
  121 |   await checkGeneratedFiles(page, configuration);
  122 | 
  123 |   // Back on the form, the button offers a new campaign rather than the same one again.
  124 |   await openTab(page, editor, CONFIGURATION_TAB);
  125 |   await expect(editor.submit).toHaveText(words.newCampaign);
  126 | 
  127 |   await openTab(page, editor, words.resultsTab);
  128 | 
  129 |   await expect(results.launch).toContainText(words.launch);
  130 | 
  131 |   // A case the lab cannot afford to run stops with the button offered, unpressed.
  132 |   if (configuration.launch === false) return;
  133 | 
  134 |   const launched = callSent(page, LAUNCHES_THE_CAMPAIGN);
  135 |   await results.launch.click(NO_NAVIGATION);
  136 | 
  137 |   if (fixture.workflow.confirmsCost) {
  138 |     await expect(results.costConfirm).toBeVisible();
  139 |     await results.costConfirm.click(NO_NAVIGATION);
  140 |   }
  141 | 
  142 |   await expectAccepted(page, launched, 'Launching the campaign');
  143 | 
  144 |   await expect(
  145 |     status,
  146 |     'The launch was accepted, but the coordinate never left "created".'
  147 |   ).not.toHaveText(/^created$/i);
  148 | 
  149 |   if (!isFollowed(configuration)) return;
  150 | 
  151 |   await waitForCampaign(status, runMinutes(configuration));
  152 |   await expect(status).toHaveText(/^done$/i);
  153 | 
  154 |   await checkCompletedOutput(page, configuration);
  155 | }
  156 | 
  157 | /**
  158 |  * The call a button sends, watched from before the click.
  159 |  *
  160 |  * The app swallows what these answer — a 403 refusing a launch reaches the
  161 |  * console and nothing else, a 500 refusing to generate leaves the results tab
  162 |  * disabled and nothing on the page — so a run that watches only the editor
  163 |  * reports every backend refusal as an element that never moved. The call is
  164 |  * where the reason is. `page.waitForResponse()` resolves when response headers
  165 |  * arrive; `expectAccepted()` waits for the response body before allowing a UI
  166 |  * assertion that depends on it.
  167 |  */
  168 | function callSent(page: Page, url: RegExp): Promise<CallOutcome> {
  169 |   const matches = (request: Request) => request.method() === 'POST' && url.test(request.url());
  170 | 
  171 |   const answered = page
  172 |     .waitForResponse((response) => matches(response.request()), {
  173 |       timeout: CALL_TIMEOUT,
  174 |     })
  175 |     .then((response): CallOutcome => ({ response }))
  176 |     .catch(() => null);
  177 | 
  178 |   // A request the browser drops answers nothing, so the response wait alone
  179 |   // reports it as a button that sent nothing at all.
  180 |   const dropped = page
  181 |     .waitForEvent('requestfailed', {
  182 |       predicate: matches,
  183 |       timeout: CALL_TIMEOUT,
  184 |     })
  185 |     .then((request): CallOutcome => ({
  186 |       dropped: request.failure()?.errorText ?? 'failed',
  187 |     }))
  188 |     .catch(() => null);
  189 | 
  190 |   return Promise.race([answered, dropped]);
  191 | }
  192 | 
  193 | /** What a call did: answered, dropped by the browser, or never sent. */
  194 | type CallOutcome = { response: Response } | { dropped: string } | null;
  195 | 
  196 | /** Fails naming what the service said, rather than what the editor did not do. */
  197 | async function expectAccepted(page: Page, call: Promise<CallOutcome>, what: string): Promise<void> {
  198 |   const outcome = await call;
  199 | 
  200 |   if (outcome === null) {
  201 |     // The app refused before sending: no credits shows a notice and stops here.
> 202 |     throw new Error(`${what} sent no request${await whatTheAppSaid(page)}.${alsoSeen(page)}`);
      |              ^ Error: Generating the campaign sent no request.
  203 |   }
  204 | 
  205 |   if ('dropped' in outcome) {
  206 |     // The app catches this one and puts it in a notification.
  207 |     throw new Error(
  208 |       `${what} never reached the service: ${outcome.dropped}` +
  209 |         `${await whatTheAppSaid(page)}.${alsoSeen(page)}`
  210 |     );
  211 |   }
  212 | 
  213 |   // waitForResponse observes headers. The core API client decodes the body before
  214 |   // resolving api.post<string>(), so wait for that body before checking UI state.
  215 |   const completionError = await outcome.response.finished();
  216 | 
  217 |   if (completionError) {
  218 |     throw new Error(`${what} response did not finish: ${completionError}`);
  219 |   }
  220 | 
  221 |   if (!outcome.response.ok()) {
  222 |     const said = await outcome.response
  223 |       .text()
  224 |       .then((body) => body.replaceAll(/\s+/g, ' ').trim())
  225 |       .catch(() => '');
  226 |     throw new Error(
  227 |       `${what} was refused: ${outcome.response.status()} ${outcome.response.url()} ${said}`
  228 |     );
  229 |   }
  230 | }
  231 | 
  232 | async function whatTheAppSaid(page: Page): Promise<string> {
  233 |   const notice = lowCredits(page)
  234 |     .notice.or(page.getByRole('alert').filter({ hasText: /\S/ }))
  235 |     .first();
  236 | 
  237 |   const said = await notice
  238 |     .innerText()
  239 |     .then((text) => text.trim().replaceAll(/\s+/g, ' '))
  240 |     .catch(() => '');
  241 | 
  242 |   return said === '' ? '' : `, and said "${said}"`;
  243 | }
  244 | 
  245 | function alsoSeen(page: Page): string {
  246 |   const problems = pageProblems(page);
  247 |   return problems.length === 0 ? '' : `\nThe page also saw:\n${problems.join('\n')}`;
  248 | }
  249 | 
  250 | /**
  251 |  * Moves to one of the editor's tabs.
  252 |  *
  253 |  * The pointer is left wherever the last click landed, and a tooltip that opens
  254 |  * under it is drawn into a popper that can cover the tab bar and swallow every
  255 |  * click until the action gives up — thirty seconds spent being told that
  256 |  * "virtual" intercepts pointer events. Escape closes whatever is showing, and
  257 |  * what it dismissed stays shut until the pointer leaves and comes back, which
  258 |  * the click itself does.
  259 |  */
  260 | async function openTab(
  261 |   page: Page,
  262 |   editor: ReturnType<typeof scanConfigEditor>,
  263 |   id: string
  264 | ): Promise<void> {
  265 |   await page.keyboard.press('Escape');
  266 |   await editor.tab(id).click(NO_NAVIGATION);
  267 | }
  268 | 
  269 | /**
  270 |  * Waits for a coordinate to stop moving.
  271 |  *
  272 |  * The wait stays on the page it launched from. A campaign is held in the
  273 |  * editor's own state rather than in the URL, so reloading loses it: the page
  274 |  * comes back on the configuration tab with no coordinates to read. That rules
  275 |  * out the usual trick of polling a fresh page, and it is why a run longer than
  276 |  * the `@slow` job can hold has to be picked up from the Workflows activity
  277 |  * table instead of followed from here.
  278 |  *
  279 |  * `toPass` rather than a single long `toHaveText`, so a run that ends in
  280 |  * "error" is reported as that instead of as a timeout with nothing to say.
  281 |  */
  282 | export async function waitForCampaign(status: Locator, minutes: number): Promise<void> {
  283 |   await expect(async () => {
  284 |     const text = (await status.innerText()).trim();
  285 |     expect(text, `The campaign is still "${text}".`).toMatch(SETTLED);
  286 |   }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
  287 | }
  288 | 
```