# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/workflows/simulate-small-microcircuit/simulate-small-microcircuit.spec.ts >> Small microcircuit simulation >> Generate a simulation campaign and launch it: a constant current clamp on every biophysical neuron
- Location: scenarios/workflows/simulate-small-microcircuit/simulate-small-microcircuit.spec.ts:40:4

# Error details

```
Error: The campaign is still "Running".

expect(received).toMatch(expected)

Expected pattern: /^(done|error)$/i
Received string:  "Running"

Call Log:
- Timeout 300000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - menubar "t1/e2e-42794707899-1" [ref=e12]:
          - button "CI Test User" [ref=e13] [cursor=pointer]:
            - img "UserFilled" [ref=e14]
          - button [ref=e18] [cursor=pointer]:
            - heading "t1" [level=3] [ref=e19]
          - button "e2e-42794707899-1" [ref=e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=e23] [cursor=pointer]
        - link "Coins 557.80" [ref=e26] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/credits
          - img "Coins"
          - generic [ref=e27]: "557.80"
      - generic [ref=e28]:
        - link "Home" [ref=e31] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a
          - img "Home"
        - link "Data Explore" [ref=e34] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/data
          - generic [ref=e35]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=e38] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/workflows
          - generic [ref=e39]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=e42] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/notebooks
          - generic [ref=e43]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=e46] [cursor=pointer]:
          - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/reports
        - generic [ref=e49]:
          - link [ref=e50] [cursor=pointer]:
            - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/help
          - generic [ref=e51]: Help
        - generic [ref=e53]:
          - generic [ref=e54] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=e55]: Feedback
    - generic [ref=e59]:
      - tablist "simulate workflow" [ref=e61]:
        - tab "configuration" [ref=e65] [cursor=pointer]
        - tab "simulations" [selected] [ref=e72] [cursor=pointer]
        - generic:
          - navigation "Breadcrumb" [ref=e80]:
            - list [ref=e81]:
              - listitem [ref=e82]:
                - link "Simulate" [ref=e83] [cursor=pointer]:
                  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/workflows?activity=simulate
              - listitem [ref=e84]
              - listitem [ref=e87]:
                - link "Small microcircuit" [ref=e88] [cursor=pointer]:
                  - /url: /app/virtual-lab/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/workflows?activity=simulate&type=small_microcircuit_simulation
              - listitem [ref=e89]
              - listitem [ref=e92]:
                - generic [ref=e94]:
                  - generic [ref=e95]: rCA1-CYLINDER-REF-1P
                  - generic [ref=e96]: C-8PV-01
          - button "Copy E2E small microcircuit simulation" [ref=e99] [cursor=pointer]:
            - generic [ref=e101]:
              - generic [ref=e102]: E2E small microcircuit si
              - generic [ref=e103]: mulation
      - tabpanel "simulations" [ref=e105]:
        - generic [ref=e107]:
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic:
                - checkbox "Select all" [disabled]
              - generic [ref=e111]: Select all
            - button "Simulation 0" [ref=e113] [cursor=pointer]:
              - generic [ref=e115]:
                - generic [ref=e116]: Simulation 0
                - generic [ref=e118]:
                  - button "Copy ID" [ref=e121]
                  - generic [ref=e123]:
                    - img "loading" [ref=e124]
                    - generic [ref=e127]: running
            - button "Launch simulations" [disabled] [ref=e131]
          - generic [ref=e137]:
            - generic [ref=e138]:
              - button "Inputs More information about input files" [disabled] [expanded] [ref=e139]:
                - generic [ref=e141]:
                  - generic [ref=e142]: Inputs
                  - button "More information about input files" [disabled] [ref=e143]:
                    - img "info-circle" [ref=e144]
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - button "Circuit 1" [expanded] [ref=e152] [cursor=pointer]:
                    - generic [ref=e153]: Circuit
                    - generic [ref=e154]: "1"
                  - button "Circuit directory folder" [ref=e158] [cursor=pointer]:
                    - generic [ref=e159]: Circuit directory
                    - generic [ref=e161]: folder
                - generic [ref=e162]:
                  - button "Simulation 4" [expanded] [ref=e163] [cursor=pointer]:
                    - generic [ref=e164]: Simulation
                    - generic [ref=e165]: "4"
                  - generic [ref=e168]:
                    - button "Launch Config config" [ref=e169] [cursor=pointer]:
                      - generic [ref=e170]: Launch Config
                      - generic [ref=e172]: config
                    - button "Node sets json" [ref=e173] [cursor=pointer]:
                      - generic [ref=e174]: Node sets
                      - generic [ref=e176]: json
                    - button "OBI-ONE Config json" [ref=e177] [cursor=pointer]:
                      - generic [ref=e178]: OBI-ONE Config
                      - generic [ref=e180]: json
                    - button "SONATA Simulation Config json" [ref=e181] [cursor=pointer]:
                      - generic [ref=e182]: SONATA Simulation Config
                      - generic [ref=e184]: json
            - generic [ref=e185]:
              - button "Outputs More information about output files" [disabled] [expanded] [ref=e186]:
                - generic [ref=e188]:
                  - generic [ref=e189]: Outputs
                  - button "More information about output files" [disabled] [ref=e190]:
                    - img "info-circle" [ref=e191]
              - button "Simulation Result 1" [ref=e199] [cursor=pointer]:
                - generic [ref=e200]: Simulation Result
                - generic [ref=e201]: "1"
          - generic [ref=e206]:
            - generic [ref=e208]:
              - textbox "Search logs" [ref=e210]
              - combobox [ref=e211] [cursor=pointer]:
                - generic [ref=e212]: Copy
              - combobox [ref=e213] [cursor=pointer]:
                - generic [ref=e214]: Download
            - generic [ref=e215]:
              - generic [ref=e218]:
                - generic [ref=e219]:
                  - generic [ref=e220]:
                    - button "LOG 10:20:49 AM – 10:20:50 AM 7 lines" [expanded] [ref=e221] [cursor=pointer]:
                      - generic [ref=e224]: LOG
                      - generic [ref=e225]: 10:20:49 AM – 10:20:50 AM
                      - generic [ref=e226]: 7 lines
                    - button "Copy these lines" [ref=e227] [cursor=pointer]
                  - generic [ref=e230]:
                    - generic [ref=e231]:
                      - generic "11/10/2026, 10:20:49 AM" [ref=e232]: 10:20:49 AM
                      - generic [ref=e233]: "[PHASE] EXECUTOR: Wrapper started at 1794306049.21"
                      - button "Copy log message" [ref=e234] [cursor=pointer]
                    - generic [ref=e237]:
                      - generic [ref=e239]: "Running in executor: python_3_12_openmpi5_neuron9_neurodamus"
                      - button "Copy log message" [ref=e240] [cursor=pointer]
                    - generic [ref=e243]:
                      - generic [ref=e245]: "[PHASE] Clone repository: https://github.com/openbraininstitute/obi-one.git at tag:2026.11.1"
                      - button "Copy log message" [ref=e246] [cursor=pointer]
                    - generic [ref=e249]:
                      - generic [ref=e251]: "[PHASE] Clone repository completed in 0.59s"
                      - button "Copy log message" [ref=e252] [cursor=pointer]
                    - generic [ref=e255]:
                      - generic [ref=e257]: "[PHASE] Install dependencies: launch_scripts/launch_task_for_single_config_asset/dependencies/neurodamus_image.txt"
                      - button "Copy log message" [ref=e258] [cursor=pointer]
                    - generic [ref=e261]:
                      - generic "11/10/2026, 10:20:50 AM" [ref=e262]: 10:20:50 AM
                      - generic [ref=e263]: "[PHASE] Install dependencies completed in 0.12s"
                      - button "Copy log message" [ref=e264] [cursor=pointer]
                    - generic [ref=e267]:
                      - generic [ref=e269]: Task is running.
                      - button "Copy log message" [ref=e270] [cursor=pointer]
                - generic [ref=e273]:
                  - generic [ref=e274]:
                    - button "STATUS 10:20:50 AM" [expanded] [ref=e275] [cursor=pointer]:
                      - generic [ref=e278]: STATUS
                      - generic [ref=e279]: 10:20:50 AM
                    - button "Copy these lines" [ref=e280] [cursor=pointer]
                  - generic [ref=e284]:
                    - generic "11/10/2026, 10:20:50 AM" [ref=e285]: 10:20:50 AM
                    - generic [ref=e286]: running
                    - button "Copy log message" [ref=e287] [cursor=pointer]
                - generic [ref=e290]:
                  - generic [ref=e291]:
                    - button "LOG 10:20:50 AM" [expanded] [ref=e292] [cursor=pointer]:
                      - generic [ref=e295]: LOG
                      - generic [ref=e296]: 10:20:50 AM
                    - button "Copy these lines" [ref=e297] [cursor=pointer]
                  - generic [ref=e301]:
                    - generic "11/10/2026, 10:20:50 AM" [ref=e302]: 10:20:50 AM
                    - generic [ref=e303]: "[PHASE] Task execution: Command: /workspace/user_venv/bin/python -u launch_scripts/launch_task_for_single_config_asset/main.py --task-type circuit_simulation_neurodamus_machine --config_entity_type Simulation --config_entity_id a9b24ef5-7238-4a8f-9318-a27183ac4bae --entity_cache True --scan_output_root ./obi-output --virtual_lab_id 0f1a91f7-e871-4780-8f94-79ae61d32d51 --project_id edc3e29d-e5a6-47f3-b25c-2385a1d1772a --execution_activity_type SimulationExecution --execution_activity_id 6958cc32-1cdf-4f80-8b4b-e57ec6b24b8e"
                    - button "Copy log message" [ref=e304] [cursor=pointer]
                - generic [ref=e307]:
                  - generic [ref=e308]:
                    - button "STDERR 10:20:50 AM – 10:20:54 AM 35 lines" [expanded] [ref=e309] [cursor=pointer]:
                      - generic [ref=e312]: STDERR
                      - generic [ref=e313]: 10:20:50 AM – 10:20:54 AM
                      - generic [ref=e314]: 35 lines
                    - button "Copy these lines" [ref=e315] [cursor=pointer]
                  - generic [ref=e318]:
                    - generic [ref=e319]:
                      - generic "11/10/2026, 10:20:50 AM" [ref=e320]: 10:20:50 AM
                      - generic [ref=e321]: "INFO:httpx2:HTTP Request: POST https://staging.cell-a.openbraininstitute.org/api/auth-manager/v1/access-token \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e322] [cursor=pointer]
                    - generic [ref=e325]:
                      - generic [ref=e327]: "INFO:httpx2:HTTP Request: PATCH https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation-execution/6958cc32-1cdf-4f80-8b4b-e57ec6b24b8e \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e328] [cursor=pointer]
                    - generic [ref=e331]:
                      - generic [ref=e333]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e334] [cursor=pointer]
                    - generic [ref=e337]:
                      - generic "11/10/2026, 10:20:51 AM" [ref=e338]: 10:20:51 AM
                      - generic [ref=e339]: INFO:numexpr.utils:NumExpr defaulting to 16 threads.
                      - button "Copy log message" [ref=e340] [cursor=pointer]
                    - generic [ref=e343]:
                      - generic [ref=e345]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation-execution/6958cc32-1cdf-4f80-8b4b-e57ec6b24b8e \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e346] [cursor=pointer]
                    - generic [ref=e349]:
                      - generic [ref=e351]: "INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Activity: <class 'entitysdk.models.simulation_execution.SimulationExecution'>(id=6958cc32-1cdf-4f80-8b4b-e57ec6b24b8e)"
                      - button "Copy log message" [ref=e352] [cursor=pointer]
                    - generic [ref=e355]:
                      - generic [ref=e357]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e358] [cursor=pointer]
                    - generic [ref=e361]:
                      - generic [ref=e363]: INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Fetched simulation config a9b24ef5-7238-4a8f-9318-a27183ac4bae
                      - button "Copy log message" [ref=e364] [cursor=pointer]
                    - generic [ref=e367]:
                      - generic [ref=e369]: "INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Simulation: a9b24ef5-7238-4a8f-9318-a27183ac4bae"
                      - button "Copy log message" [ref=e370] [cursor=pointer]
                    - generic [ref=e373]:
                      - generic [ref=e375]: INFO:obi_one.utils.benchmark:Starting stage_circuit...
                      - button "Copy log message" [ref=e376] [cursor=pointer]
                    - generic [ref=e379]:
                      - generic [ref=e381]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/circuit/6ff826be-c7bf-40e3-93e3-00a3b5a59c63 \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e382] [cursor=pointer]
                    - generic [ref=e385]:
                      - generic [ref=e387]: INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Fetched circuit 6ff826be-c7bf-40e3-93e3-00a3b5a59c63
                      - button "Copy log message" [ref=e388] [cursor=pointer]
                    - generic [ref=e391]:
                      - generic [ref=e393]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/circuit/6ff826be-c7bf-40e3-93e3-00a3b5a59c63/assets/5ef1d1fa-14f3-4242-81eb-60edb9e7dae3/list \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e394] [cursor=pointer]
                    - generic [ref=e397]:
                      - generic [ref=e399]: INFO:entitysdk.staging.circuit:Circuit 6ff826be-c7bf-40e3-93e3-00a3b5a59c63 staged at /workspace/user_repo/data/circuit/circuit_config.json
                      - button "Copy log message" [ref=e400] [cursor=pointer]
                    - generic [ref=e403]:
                      - generic [ref=e405]: INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Staged circuit 6ff826be-c7bf-40e3-93e3-00a3b5a59c63 config at /workspace/user_repo/data/circuit/circuit_config.json
                      - button "Copy log message" [ref=e406] [cursor=pointer]
                    - generic [ref=e409]:
                      - generic "11/10/2026, 10:20:53 AM" [ref=e410]: 10:20:53 AM
                      - generic [ref=e411]: INFO:obi_one.utils.benchmark:Finished stage_circuit in 0.21s
                      - button "Copy log message" [ref=e412] [cursor=pointer]
                    - generic [ref=e415]:
                      - generic [ref=e417]: INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Circuit staged at /workspace/user_repo/data/circuit
                      - button "Copy log message" [ref=e418] [cursor=pointer]
                    - generic [ref=e421]:
                      - generic [ref=e423]: INFO:obi_one.utils.benchmark:Starting compile_mechanisms...
                      - button "Copy log message" [ref=e424] [cursor=pointer]
                    - generic [ref=e427]:
                      - generic [ref=e429]: "INFO:obi_one.utils.process:Command: neurodamus-compile-mods --input-dir /workspace/user_repo/data/circuit/mod --output-dir /workspace/user_repo/data/circuit --with-internal-mods --simulator coreneuron --output-type json --cache-dir /data/scratch/shared-cache/mechanisms"
                      - button "Copy log message" [ref=e430] [cursor=pointer]
                    - generic [ref=e433]:
                      - generic [ref=e435]: "WARNING:obi_one.utils.process:stderr: INFO: Cache hit, materializing: /data/scratch/shared-***REDACTED***"
                      - button "Copy log message" [ref=e436] [cursor=pointer]
                    - generic [ref=e439]:
                      - generic [ref=e441]: INFO:obi_one.utils.benchmark:Finished compile_mechanisms in 2.03s
                      - button "Copy log message" [ref=e442] [cursor=pointer]
                    - generic [ref=e445]:
                      - generic [ref=e447]: "INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Mechanisms compiled: libnrnmech_path=PosixPath('/workspace/user_repo/data/circuit/x86_64/libnrnmech.so') libcorenrnmech_path=PosixPath('/workspace/user_repo/data/circuit/x86_64/libcorenrnmech.so') special_binary_path=PosixPath('/workspace/user_repo/data/circuit/x86_64/special')"
                      - button "Copy log message" [ref=e448] [cursor=pointer]
                    - generic [ref=e451]:
                      - generic [ref=e453]: INFO:obi_one.utils.benchmark:Starting stage_simulation...
                      - button "Copy log message" [ref=e454] [cursor=pointer]
                    - generic [ref=e457]:
                      - generic [ref=e459]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae/assets/e609d2c3-525c-4940-84b4-69687a402e2d \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e460] [cursor=pointer]
                    - generic [ref=e463]:
                      - generic [ref=e465]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae/assets/e609d2c3-525c-4940-84b4-69687a402e2d/download \"HTTP/1.1 307 Temporary Redirect\""
                      - button "Copy log message" [ref=e466] [cursor=pointer]
                    - generic [ref=e469]:
                      - generic [ref=e471]: "INFO:httpx2:HTTP Request: GET https://entitycore-data-staging.s3.amazonaws.com/private/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/assets/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae/simulation_config.json?AWSAccessKeyId=[REDACTED]&Signature=[REDACTED]&x-amz-security-token=[REDACTED] \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e472] [cursor=pointer]
                    - generic [ref=e475]:
                      - generic [ref=e477]: "INFO:entitysdk.downloaders.simulation:Downloaded 0 spike replay files: []"
                      - button "Copy log message" [ref=e478] [cursor=pointer]
                    - generic [ref=e481]:
                      - generic [ref=e483]: "INFO:httpx2:HTTP Request: GET https://staging.cell-a.openbraininstitute.org/api/entitycore/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae/assets/c2f64c12-a6e4-4286-bb26-184fc07a054a/download \"HTTP/1.1 307 Temporary Redirect\""
                      - button "Copy log message" [ref=e484] [cursor=pointer]
                    - generic [ref=e487]:
                      - generic [ref=e489]: "INFO:httpx2:HTTP Request: GET https://entitycore-data-staging.s3.amazonaws.com/private/0f1a91f7-e871-4780-8f94-79ae61d32d51/edc3e29d-e5a6-47f3-b25c-2385a1d1772a/assets/simulation/a9b24ef5-7238-4a8f-9318-a27183ac4bae/node_sets.json?AWSAccessKeyId=[REDACTED]&Signature=[REDACTED]&x-amz-security-token=[REDACTED] \"HTTP/1.1 200 OK\""
                      - button "Copy log message" [ref=e490] [cursor=pointer]
                    - generic [ref=e493]:
                      - generic "11/10/2026, 10:20:54 AM" [ref=e494]: 10:20:54 AM
                      - generic [ref=e495]: INFO:entitysdk.downloaders.simulation:Node sets file downloaded at /workspace/user_repo/data/node_sets.json
                      - button "Copy log message" [ref=e496] [cursor=pointer]
                    - generic [ref=e499]:
                      - generic [ref=e501]: INFO:entitysdk.staging.simulation:Staged Simulation a9b24ef5-7238-4a8f-9318-a27183ac4bae at /workspace/user_repo/data
                      - button "Copy log message" [ref=e502] [cursor=pointer]
                    - generic [ref=e505]:
                      - generic [ref=e507]: INFO:obi_one.utils.benchmark:Finished stage_simulation in 0.16s
                      - button "Copy log message" [ref=e508] [cursor=pointer]
                    - generic [ref=e511]:
                      - generic [ref=e513]: INFO:obi_one.scientific.tasks.simulation_execution.neuron.task:Simulation staged at /workspace/user_repo/data/simulation_config.json
                      - button "Copy log message" [ref=e514] [cursor=pointer]
                    - generic [ref=e517]:
                      - generic [ref=e519]: INFO:obi_one.utils.benchmark:Starting get_simulation_parameters...
                      - button "Copy log message" [ref=e520] [cursor=pointer]
                    - generic [ref=e523]:
                      - generic [ref=e525]: INFO:obi_one.utils.benchmark:Finished get_simulation_parameters in 0.10s
                      - button "Copy log message" [ref=e526] [cursor=pointer]
              - button "Scroll to top" [ref=e529] [cursor=pointer]
          - generic:
            - button "Back to the results"
    - button "expand AI assistant" [ref=e531] [cursor=pointer]:
      - generic [ref=e534]: OBI Assistant
  - alert [ref=e535]
```

# Test source

```ts
  520 | ): Promise<Response> {
  521 |   const outcome = await call;
  522 | 
  523 |   if (outcome === null) {
  524 |     // The app refused before sending: no credits shows a notice and stops here.
  525 |     throw new Error(`${what} sent no request${await whatTheAppSaid(page)}.${alsoSeen(page)}`);
  526 |   }
  527 | 
  528 |   if ('dropped' in outcome) {
  529 |     // The app catches this one and puts it in a notification.
  530 |     throw new Error(
  531 |       `${what} never reached the service: ${outcome.dropped}` +
  532 |         `${await whatTheAppSaid(page)}.${alsoSeen(page)}`
  533 |     );
  534 |   }
  535 | 
  536 |   // waitForResponse observes headers. The core API client decodes the body before
  537 |   // resolving api.post<string>(), so wait for that body before checking UI state.
  538 |   // A reload abandons the body, and `finished()` then never settles: a launch
  539 |   // waited out the rest of its test on one in a local run.
  540 |   const completionError = await onOnePage(
  541 |     page,
  542 |     () => outcome.response.finished(),
  543 |     `${what} was cut off: the page loaded again before the answer arrived.`
  544 |   );
  545 | 
  546 |   if (completionError) {
  547 |     throw new Error(`${what} response did not finish: ${completionError}`);
  548 |   }
  549 | 
  550 |   if (!outcome.response.ok()) {
  551 |     const said = await outcome.response
  552 |       .text()
  553 |       .then((body) => body.replaceAll(/\s+/g, ' ').trim())
  554 |       .catch(() => '');
  555 |     throw new Error(
  556 |       `${what} was refused: ${outcome.response.status()} ${outcome.response.url()} ${said}`
  557 |     );
  558 |   }
  559 | 
  560 |   return outcome.response;
  561 | }
  562 | 
  563 | async function whatTheAppSaid(page: Page): Promise<string> {
  564 |   // Next.js's route announcer is also role="alert" and holds the page title; the
  565 |   // app's error notification is the alert carrying antd's close-circle icon.
  566 |   const notice = lowCredits(page)
  567 |     .notice.or(
  568 |       page.getByRole('alert').filter({ has: page.getByRole('img', { name: 'close-circle' }) })
  569 |     )
  570 |     .first();
  571 | 
  572 |   const said = await notice
  573 |     .innerText()
  574 |     .then((text) => text.trim().replaceAll(/\s+/g, ' '))
  575 |     .catch(() => '');
  576 | 
  577 |   return said === '' ? '' : `, and said "${said}"`;
  578 | }
  579 | 
  580 | function alsoSeen(page: Page): string {
  581 |   const problems = pageProblems(page);
  582 |   return problems.length === 0 ? '' : `\nThe page also saw:\n${problems.join('\n')}`;
  583 | }
  584 | 
  585 | /**
  586 |  * Moves to one of the editor's tabs.
  587 |  *
  588 |  * The pointer is left wherever the last click landed, and a tooltip that opens
  589 |  * under it is drawn into a popper that can cover the tab bar and swallow every
  590 |  * click until the action gives up — thirty seconds spent being told that
  591 |  * "virtual" intercepts pointer events. Escape closes whatever is showing, and
  592 |  * what it dismissed stays shut until the pointer leaves and comes back, which
  593 |  * the click itself does.
  594 |  */
  595 | async function openTab(
  596 |   page: Page,
  597 |   editor: ReturnType<typeof scanConfigEditor>,
  598 |   id: string
  599 | ): Promise<void> {
  600 |   await page.keyboard.press('Escape');
  601 |   await editor.tab(id).click(NO_NAVIGATION);
  602 | }
  603 | 
  604 | /**
  605 |  * Waits for a coordinate to stop moving.
  606 |  *
  607 |  * The wait reads whatever the page shows; the editor asks the server itself.
  608 |  * A reload mid-wait sends the page back to the campaign (see `keepCampaign`),
  609 |  * and the locator then reads the reopened page. A run longer than the `@slow`
  610 |  * job can hold has to be picked up from the Workflows activity table instead
  611 |  * of followed from here.
  612 |  *
  613 |  * `toPass` rather than a single long `toHaveText`, so a run that ends in
  614 |  * "error" is reported as that instead of as a timeout with nothing to say.
  615 |  */
  616 | export async function waitForCampaign(status: Locator, minutes: number): Promise<void> {
  617 |   await expect(async () => {
  618 |     const text = (await status.innerText()).trim();
  619 |     expect(text, `The campaign is still "${text}".`).toMatch(SETTLED);
> 620 |   }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
      |     ^ Error: The campaign is still "Running".
  621 | }
  622 | 
```