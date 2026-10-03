# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scenarios/data/single-neuron-circuit/view/view.spec.ts >> Synaptome details >> Open one Synaptome beside the listing
- Location: scenarios/data/single-neuron-circuit/view/view.spec.ts:37:2

# Error details

```
TimeoutError: click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByTestId('data-table-container').getByRole('gridcell').filter({ hasText: /\S/ }).first()
    - locator resolved to <div col-id="name" role="gridcell" aria-colindex="1" class="ag-cell ag-cell-not-inline-editing ag-cell-normal-height ag-column-first ag-cell-value">Afferent-synaptome-864691135970442597</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-name="nextstep-prevent-click-overlay-right"></div> from <div data-name="nextstep-overlay">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-name="nextstep-prevent-click-overlay-right"></div> from <div data-name="nextstep-overlay">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div data-name="nextstep-prevent-click-overlay-right"></div> from <div data-name="nextstep-overlay">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - menubar "user CI Test's virtual lab/e2e-36726867714-1" [ref=e12]:
          - button "user CI Test" [ref=e13] [cursor=pointer]:
            - img "UserFilled" [ref=e14]
          - button [ref=e18] [cursor=pointer]:
            - heading "user CI Test's virtual lab" [level=3] [ref=e19]
          - button "e2e-36726867714-1" [ref=e22] [cursor=pointer]
          - button "toggle-workspace-panel" [ref=e23] [cursor=pointer]
        - link "Coins 2000.00" [ref=e26] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/credits
          - img "Coins"
          - generic [ref=e27]: "2000.00"
      - generic [ref=e28]:
        - link "Home" [ref=e31] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506
          - img "Home"
        - link "Data Explore" [ref=e34] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/data
          - generic [ref=e35]: Data
          - img "Explore"
        - link "Workflows Workflow" [ref=e38] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/workflows
          - generic [ref=e39]: Workflows
          - img "Workflow"
        - link "Notebooks Notebook" [ref=e42] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/notebooks
          - generic [ref=e43]: Notebooks
          - img "Notebook"
        - link "Reports" [ref=e46] [cursor=pointer]:
          - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/reports
        - generic [ref=e49]:
          - link [ref=e50] [cursor=pointer]:
            - /url: /app/virtual-lab/781aff8a-1ab3-45b2-886c-b42fd7954335/e33e6212-6d5d-4ecc-9f16-5c45920af506/help
          - generic [ref=e51]: Help
        - generic [ref=e53]:
          - generic [ref=e54] [cursor=pointer]:
            - img "Feedback star"
          - generic [ref=e55]: Feedback
    - generic [ref=e57]:
      - tablist [ref=e61]:
        - tab "Public" [selected] [ref=e62] [cursor=pointer]
        - tab "Project" [ref=e64] [cursor=pointer]
      - generic [ref=e66]:
        - generic [ref=e69]:
          - combobox [ref=e75] [cursor=pointer]:
            - generic [ref=e76]:
              - generic [ref=e77]: Species
              - generic [ref=e78]: All
          - generic [ref=e81]:
            - tablist [ref=e84]:
              - tab "Experimental" [selected] [ref=e85] [cursor=pointer]
              - tab "Model" [ref=e86] [cursor=pointer]
              - tab "Simulations" [ref=e87] [cursor=pointer]
            - generic [ref=e88]:
              - button "Morphology 6225 of 6225" [ref=e91] [cursor=pointer]:
                - generic [ref=e92]: Morphology
                - generic [ref=e94]:
                  - generic [ref=e95]: "6225"
                  - generic [ref=e96]: of
                  - generic [ref=e97]: "6225"
              - button "Single cell electrophysiology 2247 of 2247" [ref=e100] [cursor=pointer]:
                - generic [ref=e101]: Single cell electrophysiology
                - generic [ref=e103]:
                  - generic [ref=e104]: "2247"
                  - generic [ref=e105]: of
                  - generic [ref=e106]: "2247"
              - button "Ion channel electrophysiology 33198 of 33198" [ref=e109] [cursor=pointer]:
                - generic [ref=e110]: Ion channel electrophysiology
                - generic [ref=e112]:
                  - generic [ref=e113]: "33198"
                  - generic [ref=e114]: of
                  - generic [ref=e115]: "33198"
              - button "Neuron density 62 of 62" [ref=e118] [cursor=pointer]:
                - generic [ref=e119]: Neuron density
                - generic [ref=e121]:
                  - generic [ref=e122]: "62"
                  - generic [ref=e123]: of
                  - generic [ref=e124]: "62"
              - button "Bouton density 6 of 6" [ref=e127] [cursor=pointer]:
                - generic [ref=e128]: Bouton density
                - generic [ref=e130]:
                  - generic [ref=e131]: "6"
                  - generic [ref=e132]: of
                  - generic [ref=e133]: "6"
              - button "Synapse per connection 12 of 12" [ref=e136] [cursor=pointer]:
                - generic [ref=e137]: Synapse per connection
                - generic [ref=e139]:
                  - generic [ref=e140]: "12"
                  - generic [ref=e141]: of
                  - generic [ref=e142]: "12"
              - button "EM mesh 2739 of 2739" [ref=e145] [cursor=pointer]:
                - generic [ref=e146]: EM mesh
                - generic [ref=e148]:
                  - generic [ref=e149]: "2739"
                  - generic [ref=e150]: of
                  - generic [ref=e151]: "2739"
              - button "Intracellular e-feature extraction 0 of 0" [ref=e154] [cursor=pointer]:
                - generic [ref=e155]: Intracellular e-feature extraction
                - generic [ref=e157]:
                  - generic [ref=e158]: "0"
                  - generic [ref=e159]: of
                  - generic [ref=e160]: "0"
        - generic [ref=e162]:
          - generic [ref=e164]:
            - generic [ref=e165]:
              - button "Close search" [ref=e166] [cursor=pointer]
              - textbox "Search" [active] [ref=e171]:
                - /placeholder: Search for entities…
            - button "Filters" [ref=e172] [cursor=pointer]
            - button "Columns" [ref=e177] [cursor=pointer]
          - generic [ref=e184]:
            - generic [ref=e185]: No entities to show
            - grid [ref=e186]:
              - rowgroup [ref=e187]:
                - row [ref=e188]:
                  - columnheader "Name Filter Name" [ref=e189]:
                    - generic [ref=e191]:
                      - button "Name" [ref=e192] [cursor=pointer]
                      - button "Filter Name" [ref=e197] [cursor=pointer]
                  - columnheader "Description" [ref=e200]:
                    - button "Description" [ref=e203]
                  - columnheader "Brain region Filter Brain region" [ref=e205]:
                    - generic [ref=e207]:
                      - button "Brain region" [ref=e208] [cursor=pointer]
                      - button "Filter Brain region" [ref=e213] [cursor=pointer]
                  - columnheader "Species Filter Species" [ref=e216]:
                    - generic [ref=e218]:
                      - button "Species" [ref=e219] [cursor=pointer]
                      - button "Filter Species" [ref=e224] [cursor=pointer]
                  - columnheader "Scale" [ref=e227]:
                    - button "Scale" [ref=e230] [cursor=pointer]
                  - columnheader "Number of neurons Filter Number of neurons" [ref=e235]:
                    - generic [ref=e237]:
                      - button "Number of neurons" [ref=e238] [cursor=pointer]
                      - button "Filter Number of neurons" [ref=e243] [cursor=pointer]
                  - columnheader "Number of synapses Filter Number of synapses" [ref=e246]:
                    - generic [ref=e248]:
                      - button "Number of synapses" [ref=e249] [cursor=pointer]
                      - button "Filter Number of synapses" [ref=e254] [cursor=pointer]
                  - columnheader "Number of connections Filter Number of connections" [ref=e257]:
                    - generic [ref=e259]:
                      - button "Number of connections" [ref=e260] [cursor=pointer]
                      - button "Filter Number of connections" [ref=e265] [cursor=pointer]
                  - columnheader "Target simulator Filter Target simulator" [ref=e268]:
                    - generic [ref=e270]:
                      - button "Target simulator" [ref=e271] [cursor=pointer]
                      - button "Filter Target simulator" [ref=e276] [cursor=pointer]
                  - columnheader "Created by Filter Created by" [ref=e279]:
                    - generic [ref=e281]:
                      - button "Created by" [ref=e282] [cursor=pointer]
                      - button "Filter Created by" [ref=e287] [cursor=pointer]
                  - columnheader "Registration date Filter Registration date" [ref=e290]:
                    - generic [ref=e292]:
                      - button "Registration date" [ref=e293] [cursor=pointer]
                      - button "Filter Registration date" [ref=e298] [cursor=pointer]
                  - columnheader "Lifecycle status Filter Lifecycle status" [ref=e301]:
                    - generic [ref=e303]:
                      - button "Lifecycle status" [ref=e304]
                      - button "Filter Lifecycle status" [ref=e306] [cursor=pointer]
              - rowgroup [ref=e309]:
                - row [ref=e310] [cursor=pointer]:
                  - gridcell "Afferent-synaptome-864691135970442597" [ref=e311]
                  - gridcell [ref=e312]:
                    - generic [ref=e313]:
                      - paragraph [ref=e314]: Morphology skeleton with isolated spines and afferent synapses (Synaptome) of the neuron with pt_root_id 864691135970442597 in dataset Portion 65 of the IARPA MICrONS dataset
                      - button "Show the full description" [ref=e315]
                  - gridcell "Visual areas" [ref=e318]
                  - gridcell "Mus musculus" [ref=e319]
                  - gridcell "Single" [ref=e320]
                  - gridcell "1" [ref=e321]
                  - gridcell "3,396" [ref=e322]
                  - gridcell "3,188" [ref=e323]
                  - gridcell "NEURON" [ref=e324]
                  - gridcell "Michael Reimann" [ref=e325]
                  - gridcell "Nov 12, 2025" [ref=e326]
                  - gridcell "Active" [ref=e327]
                - row [ref=e329] [cursor=pointer]:
                  - gridcell "nbS1-O1__202247__cADpyr__L5_TPC_A" [ref=e330]
                  - gridcell [ref=e331]:
                    - generic [ref=e332]:
                      - paragraph [ref=e333]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 5. The neuron (me-model) has an e-type cADpyr, m-type L5_TPC:A, morphology class PYR and has a SONATA circuit node id of 202247 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L5TPC and morphology dend-rat_20150119_LH1_cell1_axon-rp111203_C3_idA_-_Scale_x1.000_y0.950_z1.000_-_Clone_0.
                      - button "Show the full description" [ref=e334]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e337]
                  - gridcell "Rattus norvegicus" [ref=e338]
                  - gridcell "Single" [ref=e339]
                  - gridcell "1" [ref=e340]
                  - gridcell "4,850" [ref=e341]
                  - gridcell "908" [ref=e342]
                  - gridcell "NEURON" [ref=e343]
                  - gridcell "Christoph Pokorny" [ref=e344]
                  - gridcell "Nov 11, 2025" [ref=e345]
                  - gridcell "Active" [ref=e346]
                - row [ref=e348] [cursor=pointer]:
                  - gridcell "nbS1-O1__188401__cADpyr__L5_TPC_B" [ref=e349]
                  - gridcell [ref=e350]:
                    - generic [ref=e351]:
                      - paragraph [ref=e352]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 5. The neuron (me-model) has an e-type cADpyr, m-type L5_TPC:B, morphology class PYR and has a SONATA circuit node id of 188401 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L5TPC and morphology dend-C030397A-P2_axon-rp100125_C1_idA_-_Scale_x1.000_y1.050_z1.000.
                      - button "Show the full description" [ref=e353]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e356]
                  - gridcell "Rattus norvegicus" [ref=e357]
                  - gridcell "Single" [ref=e358]
                  - gridcell "1" [ref=e359]
                  - gridcell "2,412" [ref=e360]
                  - gridcell "461" [ref=e361]
                  - gridcell "NEURON" [ref=e362]
                  - gridcell "Christoph Pokorny" [ref=e363]
                  - gridcell "Nov 11, 2025" [ref=e364]
                  - gridcell "Active" [ref=e365]
                - row [ref=e367] [cursor=pointer]:
                  - gridcell "nbS1-O1__178969__cSTUT__L5_NBC" [ref=e368]
                  - gridcell [ref=e369]:
                    - generic [ref=e370]:
                      - paragraph [ref=e371]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 5. The neuron (me-model) has an e-type cSTUT, m-type L5_NBC, morphology class INT and has a SONATA circuit node id of 178969 in the parent circuit nbS1-O1. It uses an e-model cSTUT_L6NGC and morphology rp110208_L5-2_idA_-_Scale_x1.000_y1.050_z1.000_-_Clone_3.
                      - button "Show the full description" [ref=e372]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e375]
                  - gridcell "Rattus norvegicus" [ref=e376]
                  - gridcell "Single" [ref=e377]
                  - gridcell "1" [ref=e378]
                  - gridcell "1,619" [ref=e379]
                  - gridcell "472" [ref=e380]
                  - gridcell "NEURON" [ref=e381]
                  - gridcell "Christoph Pokorny" [ref=e382]
                  - gridcell "Nov 11, 2025" [ref=e383]
                  - gridcell "Active" [ref=e384]
                - row [ref=e386] [cursor=pointer]:
                  - gridcell "nbS1-O1__173234__cADpyr__L5_TPC_C" [ref=e387]
                  - gridcell [ref=e388]:
                    - generic [ref=e389]:
                      - paragraph [ref=e390]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 5. The neuron (me-model) has an e-type cADpyr, m-type L5_TPC:C, morphology class PYR and has a SONATA circuit node id of 173234 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L5TPC and morphology dend-rp110722_C1_idA_axon-vd100825_INT_idA_-_Scale_x1.000_y1.050_z1.000_-_Clone_0.
                      - button "Show the full description" [ref=e391]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e394]
                  - gridcell "Rattus norvegicus" [ref=e395]
                  - gridcell "Single" [ref=e396]
                  - gridcell "1" [ref=e397]
                  - gridcell "2,509" [ref=e398]
                  - gridcell "528" [ref=e399]
                  - gridcell "NEURON" [ref=e400]
                  - gridcell "Christoph Pokorny" [ref=e401]
                  - gridcell "Nov 11, 2025" [ref=e402]
                  - gridcell "Active" [ref=e403]
                - row [ref=e405] [cursor=pointer]:
                  - gridcell "nbS1-O1__150094__cACint__L23_BP" [ref=e406]
                  - gridcell [ref=e407]:
                    - generic [ref=e408]:
                      - paragraph [ref=e409]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 2. The neuron (me-model) has an e-type cACint, m-type L23_BP, morphology class INT and has a SONATA circuit node id of 150094 in the parent circuit nbS1-O1. It uses an e-model cACint_L23MC and morphology C230998A-I3_-_Clone_13.
                      - button "Show the full description" [ref=e410]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e413]
                  - gridcell "Rattus norvegicus" [ref=e414]
                  - gridcell "Single" [ref=e415]
                  - gridcell "1" [ref=e416]
                  - gridcell "75" [ref=e417]
                  - gridcell "53" [ref=e418]
                  - gridcell "NEURON" [ref=e419]
                  - gridcell "Christoph Pokorny" [ref=e420]
                  - gridcell "Nov 11, 2025" [ref=e421]
                  - gridcell "Active" [ref=e422]
                - row [ref=e424] [cursor=pointer]:
                  - gridcell "nbS1-O1__149985__bIR__L23_BP" [ref=e425]
                  - gridcell [ref=e426]:
                    - generic [ref=e427]:
                      - paragraph [ref=e428]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 2. The neuron (me-model) has an e-type bIR, m-type L23_BP, morphology class INT and has a SONATA circuit node id of 149985 in the parent circuit nbS1-O1. It uses an e-model bIR_L23BP and morphology C230998A-I3_-_Scale_x1.000_y1.050_z1.000_-_Clone_6.
                      - button "Show the full description" [ref=e429]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e432]
                  - gridcell "Rattus norvegicus" [ref=e433]
                  - gridcell "Single" [ref=e434]
                  - gridcell "1" [ref=e435]
                  - gridcell "41" [ref=e436]
                  - gridcell "32" [ref=e437]
                  - gridcell "NEURON" [ref=e438]
                  - gridcell "Christoph Pokorny" [ref=e439]
                  - gridcell "Nov 11, 2025" [ref=e440]
                  - gridcell "Active" [ref=e441]
                - row [ref=e443] [cursor=pointer]:
                  - gridcell "nbS1-O1__145877__cADpyr__L2_IPC" [ref=e444]
                  - gridcell [ref=e445]:
                    - generic [ref=e446]:
                      - paragraph [ref=e447]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 2. The neuron (me-model) has an e-type cADpyr, m-type L2_IPC, morphology class PYR and has a SONATA circuit node id of 145877 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L2IPC and morphology sm080522a1-5_idA_-_Clone_2.
                      - button "Show the full description" [ref=e448]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e451]
                  - gridcell "Rattus norvegicus" [ref=e452]
                  - gridcell "Single" [ref=e453]
                  - gridcell "1" [ref=e454]
                  - gridcell "1,835" [ref=e455]
                  - gridcell "388" [ref=e456]
                  - gridcell "NEURON" [ref=e457]
                  - gridcell "Christoph Pokorny" [ref=e458]
                  - gridcell "Nov 11, 2025" [ref=e459]
                  - gridcell "Active" [ref=e460]
                - row [ref=e462] [cursor=pointer]:
                  - gridcell "nbS1-O1__142992__cADpyr__L2_TPC_A" [ref=e463]
                  - gridcell [ref=e464]:
                    - generic [ref=e465]:
                      - paragraph [ref=e466]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 2. The neuron (me-model) has an e-type cADpyr, m-type L2_TPC:A, morphology class PYR and has a SONATA circuit node id of 142992 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L2TPC and morphology dend-C280998A-P3_axon-sm100429b1-2_INT_idA_-_Scale_x1.000_y0.975_z1.000_-_Clone_11.
                      - button "Show the full description" [ref=e467]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e470]
                  - gridcell "Rattus norvegicus" [ref=e471]
                  - gridcell "Single" [ref=e472]
                  - gridcell "1" [ref=e473]
                  - gridcell "687" [ref=e474]
                  - gridcell "186" [ref=e475]
                  - gridcell "NEURON" [ref=e476]
                  - gridcell "Christoph Pokorny" [ref=e477]
                  - gridcell "Nov 11, 2025" [ref=e478]
                  - gridcell "Active" [ref=e479]
                - row [ref=e481] [cursor=pointer]:
                  - gridcell "nbS1-O1__142337__dNAC__L4_LBC" [ref=e482]
                  - gridcell [ref=e483]:
                    - generic [ref=e484]:
                      - paragraph [ref=e485]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 4. The neuron (me-model) has an e-type dNAC, m-type L4_LBC, morphology class INT and has a SONATA circuit node id of 142337 in the parent circuit nbS1-O1. It uses an e-model dNAC_L23SBC and morphology C310106C.
                      - button "Show the full description" [ref=e486]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e489]
                  - gridcell "Rattus norvegicus" [ref=e490]
                  - gridcell "Single" [ref=e491]
                  - gridcell "1" [ref=e492]
                  - gridcell "1,111" [ref=e493]
                  - gridcell "260" [ref=e494]
                  - gridcell "NEURON" [ref=e495]
                  - gridcell "Christoph Pokorny" [ref=e496]
                  - gridcell "Nov 11, 2025" [ref=e497]
                  - gridcell "Active" [ref=e498]
                - row [ref=e500] [cursor=pointer]:
                  - gridcell "nbS1-O1__140341__cADpyr__L4_SSC" [ref=e501]
                  - gridcell [ref=e502]:
                    - generic [ref=e503]:
                      - paragraph [ref=e504]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 4. The neuron (me-model) has an e-type cADpyr, m-type L4_SSC, morphology class INT and has a SONATA circuit node id of 140341 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L4TPC and morphology dend-rp120608_P_3_idD_axon-vd101102b_INT_idA_-_Scale_x1.000_y1.050_z1.000_-_Clone_1.
                      - button "Show the full description" [ref=e505]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e508]
                  - gridcell "Rattus norvegicus" [ref=e509]
                  - gridcell "Single" [ref=e510]
                  - gridcell "1" [ref=e511]
                  - gridcell "895" [ref=e512]
                  - gridcell "245" [ref=e513]
                  - gridcell "NEURON" [ref=e514]
                  - gridcell "Christoph Pokorny" [ref=e515]
                  - gridcell "Nov 11, 2025" [ref=e516]
                  - gridcell "Active" [ref=e517]
                - row [ref=e519] [cursor=pointer]:
                  - gridcell "nbS1-O1__137707__cADpyr__L4_TPC" [ref=e520]
                  - gridcell [ref=e521]:
                    - generic [ref=e522]:
                      - paragraph [ref=e523]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 4. The neuron (me-model) has an e-type cADpyr, m-type L4_TPC, morphology class PYR and has a SONATA circuit node id of 137707 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L4UPC and morphology dend-C260199A-P2_axon-C310897B-P3_-_Scale_x1.000_y0.950_z1.000_-_Clone_1.
                      - button "Show the full description" [ref=e524]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e527]
                  - gridcell "Rattus norvegicus" [ref=e528]
                  - gridcell "Single" [ref=e529]
                  - gridcell "1" [ref=e530]
                  - gridcell "626" [ref=e531]
                  - gridcell "181" [ref=e532]
                  - gridcell "NEURON" [ref=e533]
                  - gridcell "Christoph Pokorny" [ref=e534]
                  - gridcell "Nov 11, 2025" [ref=e535]
                  - gridcell "Active" [ref=e536]
                - row [ref=e538] [cursor=pointer]:
                  - gridcell "nbS1-O1__118960__cADpyr__L4_TPC" [ref=e539]
                  - gridcell [ref=e540]:
                    - generic [ref=e541]:
                      - paragraph [ref=e542]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 4. The neuron (me-model) has an e-type cADpyr, m-type L4_TPC, morphology class PYR and has a SONATA circuit node id of 118960 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L4UPC and morphology dend-sm100429a1-5_INT_idD_axon-mtC171001A_idA_-_Scale_x1.000_y1.050_z1.000.
                      - button "Show the full description" [ref=e543]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e546]
                  - gridcell "Rattus norvegicus" [ref=e547]
                  - gridcell "Single" [ref=e548]
                  - gridcell "1" [ref=e549]
                  - gridcell "3,167" [ref=e550]
                  - gridcell "675" [ref=e551]
                  - gridcell "NEURON" [ref=e552]
                  - gridcell "Christoph Pokorny" [ref=e553]
                  - gridcell "Nov 11, 2025" [ref=e554]
                  - gridcell "Active" [ref=e555]
                - row [ref=e557] [cursor=pointer]:
                  - gridcell "nbS1-O1__113515__cADpyr__L4_UPC" [ref=e558]
                  - gridcell [ref=e559]:
                    - generic [ref=e560]:
                      - paragraph [ref=e561]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 4. The neuron (me-model) has an e-type cADpyr, m-type L4_UPC, morphology class PYR and has a SONATA circuit node id of 113515 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L4UPC and morphology dend-rp100428-12_idD_axon-vd110125B_INT_idA_-_Scale_x1.000_y0.950_z1.000_-_Clone_0.
                      - button "Show the full description" [ref=e562]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e565]
                  - gridcell "Rattus norvegicus" [ref=e566]
                  - gridcell "Single" [ref=e567]
                  - gridcell "1" [ref=e568]
                  - gridcell "954" [ref=e569]
                  - gridcell "239" [ref=e570]
                  - gridcell "NEURON" [ref=e571]
                  - gridcell "Christoph Pokorny" [ref=e572]
                  - gridcell "Nov 11, 2025" [ref=e573]
                  - gridcell "Active" [ref=e574]
                - row [ref=e576] [cursor=pointer]:
                  - gridcell "nbS1-O1__108555__cIR__L6_NBC" [ref=e577]
                  - gridcell [ref=e578]:
                    - generic [ref=e579]:
                      - paragraph [ref=e580]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cIR, m-type L6_NBC, morphology class INT and has a SONATA circuit node id of 108555 in the parent circuit nbS1-O1. It uses an e-model cIR_L2SBC and morphology og060921a3_ch5_bc_h_zk_60x_1_-_Scale_x1.000_y0.975_z1.000_-_Clone_2.
                      - button "Show the full description" [ref=e581]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e584]
                  - gridcell "Rattus norvegicus" [ref=e585]
                  - gridcell "Single" [ref=e586]
                  - gridcell "1" [ref=e587]
                  - gridcell "837" [ref=e588]
                  - gridcell "231" [ref=e589]
                  - gridcell "NEURON" [ref=e590]
                  - gridcell "Christoph Pokorny" [ref=e591]
                  - gridcell "Nov 11, 2025" [ref=e592]
                  - gridcell "Active" [ref=e593]
                - row [ref=e595] [cursor=pointer]:
                  - gridcell "nbS1-O1__108348__dSTUT__L6_NBC" [ref=e596]
                  - gridcell [ref=e597]:
                    - generic [ref=e598]:
                      - paragraph [ref=e599]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type dSTUT, m-type L6_NBC, morphology class INT and has a SONATA circuit node id of 108348 in the parent circuit nbS1-O1. It uses an e-model dSTUT_L2SBC and morphology tkb060508_b1-b3_idD_-_Scale_x1.000_y0.950_z1.000_-_Clone_0.
                      - button "Show the full description" [ref=e600]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e603]
                  - gridcell "Rattus norvegicus" [ref=e604]
                  - gridcell "Single" [ref=e605]
                  - gridcell "1" [ref=e606]
                  - gridcell "1,412" [ref=e607]
                  - gridcell "369" [ref=e608]
                  - gridcell "NEURON" [ref=e609]
                  - gridcell "Christoph Pokorny" [ref=e610]
                  - gridcell "Nov 11, 2025" [ref=e611]
                  - gridcell "Active" [ref=e612]
                - row [ref=e614] [cursor=pointer]:
                  - gridcell "nbS1-O1__107464__cSTUT__L6_NBC" [ref=e615]
                  - gridcell [ref=e616]:
                    - generic [ref=e617]:
                      - paragraph [ref=e618]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cSTUT, m-type L6_NBC, morphology class INT and has a SONATA circuit node id of 107464 in the parent circuit nbS1-O1. It uses an e-model cSTUT_L6NGC and morphology og060829a1-4_idE_-_Scale_x1.000_y0.950_z1.000_-_Clone_3.
                      - button "Show the full description" [ref=e619]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e622]
                  - gridcell "Rattus norvegicus" [ref=e623]
                  - gridcell "Single" [ref=e624]
                  - gridcell "1" [ref=e625]
                  - gridcell "1,886" [ref=e626]
                  - gridcell "440" [ref=e627]
                  - gridcell "NEURON" [ref=e628]
                  - gridcell "Christoph Pokorny" [ref=e629]
                  - gridcell "Nov 11, 2025" [ref=e630]
                  - gridcell "Active" [ref=e631]
                - row [ref=e633] [cursor=pointer]:
                  - gridcell "nbS1-O1__104973__cADpyr__L6_TPC_C" [ref=e634]
                  - gridcell [ref=e635]:
                    - generic [ref=e636]:
                      - paragraph [ref=e637]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cADpyr, m-type L6_TPC:C, morphology class PYR and has a SONATA circuit node id of 104973 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L6BPC and morphology dend-tkb071123a2_ch10_ct_n_db_100x_1_axon-tkb061126a3_ch0_cc2_h_zk_60x_1_-_Scale_x1.000_y1.025_z1.000_-_Clone_1.
                      - button "Show the full description" [ref=e638]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e641]
                  - gridcell "Rattus norvegicus" [ref=e642]
                  - gridcell "Single" [ref=e643]
                  - gridcell "1" [ref=e644]
                  - gridcell "1,012" [ref=e645]
                  - gridcell "276" [ref=e646]
                  - gridcell "NEURON" [ref=e647]
                  - gridcell "Christoph Pokorny" [ref=e648]
                  - gridcell "Nov 11, 2025" [ref=e649]
                  - gridcell "Active" [ref=e650]
                - row [ref=e652] [cursor=pointer]:
                  - gridcell "nbS1-O1__93553__cADpyr__L6_TPC_A" [ref=e653]
                  - gridcell [ref=e654]:
                    - generic [ref=e655]:
                      - paragraph [ref=e656]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cADpyr, m-type L6_TPC:A, morphology class PYR and has a SONATA circuit node id of 93553 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L6BPC and morphology dend-tkb071114a2_ch2_cc2_n_db_100x_1_axon-tkb070125a3_ch1_cc2_b_hw_60x_1_-_Scale_x1.000_y0.950_z1.000.
                      - button "Show the full description" [ref=e657]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e660]
                  - gridcell "Rattus norvegicus" [ref=e661]
                  - gridcell "Single" [ref=e662]
                  - gridcell "1" [ref=e663]
                  - gridcell "1,730" [ref=e664]
                  - gridcell "482" [ref=e665]
                  - gridcell "NEURON" [ref=e666]
                  - gridcell "Christoph Pokorny" [ref=e667]
                  - gridcell "Nov 11, 2025" [ref=e668]
                  - gridcell "Active" [ref=e669]
                - row [ref=e671] [cursor=pointer]:
                  - gridcell "nbS1-O1__90238__cADpyr__L6_TPC_A" [ref=e672]
                  - gridcell [ref=e673]:
                    - generic [ref=e674]:
                      - paragraph [ref=e675]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cADpyr, m-type L6_TPC:A, morphology class PYR and has a SONATA circuit node id of 90238 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L6BPC and morphology dend-tkb060530a2_ch1_ct_n_ab_100x_1_axon-Fluo41_left.
                      - button "Show the full description" [ref=e676]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e679]
                  - gridcell "Rattus norvegicus" [ref=e680]
                  - gridcell "Single" [ref=e681]
                  - gridcell "1" [ref=e682]
                  - gridcell "1,313" [ref=e683]
                  - gridcell "384" [ref=e684]
                  - gridcell "NEURON" [ref=e685]
                  - gridcell "Christoph Pokorny" [ref=e686]
                  - gridcell "Nov 11, 2025" [ref=e687]
                  - gridcell "Active" [ref=e688]
                - row [ref=e690] [cursor=pointer]:
                  - gridcell "nbS1-O1__85406__cADpyr__L6_IPC" [ref=e691]
                  - gridcell [ref=e692]:
                    - generic [ref=e693]:
                      - paragraph [ref=e694]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type cADpyr, m-type L6_IPC, morphology class PYR and has a SONATA circuit node id of 85406 in the parent circuit nbS1-O1. It uses an e-model cADpyr_L6BPC and morphology dend-tkb060119b1_ch0_cc1_n_db_60x_2_axon-tkb060329a2_ch1_cc1_o_db_60x_2_-_Scale_x1.000_y0.975_z1.000_-_Clone_0.
                      - button "Show the full description" [ref=e695]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e698]
                  - gridcell "Rattus norvegicus" [ref=e699]
                  - gridcell "Single" [ref=e700]
                  - gridcell "1" [ref=e701]
                  - gridcell "1,279" [ref=e702]
                  - gridcell "347" [ref=e703]
                  - gridcell "NEURON" [ref=e704]
                  - gridcell "Christoph Pokorny" [ref=e705]
                  - gridcell "Nov 11, 2025" [ref=e706]
                  - gridcell "Active" [ref=e707]
                - row [ref=e709] [cursor=pointer]:
                  - gridcell "nbS1-O1__70183__bNAC__L6_SBC" [ref=e710]
                  - gridcell [ref=e711]:
                    - generic [ref=e712]:
                      - paragraph [ref=e713]: A single neuron synaptome from nbS1-O1 circuit, located in Layer 6. The neuron (me-model) has an e-type bNAC, m-type L6_SBC, morphology class INT and has a SONATA circuit node id of 70183 in the parent circuit nbS1-O1. It uses an e-model bNAC_L23NGC and morphology rp110120_L5-4_idB_-_Scale_x1.000_y1.025_z1.000_-_Clone_3.
                      - button "Show the full description" [ref=e714]
                  - gridcell "Primary somatosensory area, hindlimb representation" [ref=e717]
                  - gridcell "Rattus norvegicus" [ref=e718]
                  - gridcell "Single" [ref=e719]
                  - gridcell "1" [ref=e720]
                  - gridcell "357" [ref=e721]
                  - gridcell "119" [ref=e722]
                  - gridcell "NEURON" [ref=e723]
                  - gridcell "Christoph Pokorny" [ref=e724]
                  - gridcell "Nov 11, 2025" [ref=e725]
                  - gridcell "Active" [ref=e726]
              - rowgroup
              - rowgroup
              - rowgroup
          - generic [ref=e734]:
            - generic [ref=e735]:
              - list [ref=e736]:
                - listitem "Previous Page" [ref=e737]:
                  - button [disabled] [ref=e738]:
                    - img "left" [ref=e739]
                - listitem "1" [ref=e742] [cursor=pointer]
                - listitem "2" [ref=e744] [cursor=pointer]
                - listitem "Next Page" [ref=e746] [cursor=pointer]:
                  - button [ref=e747]:
                    - img "right" [ref=e748]
              - combobox [ref=e751] [cursor=pointer]:
                - generic: 30 / page
            - generic [ref=e752]: 31 results
    - button "expand AI assistant" [ref=e755] [cursor=pointer]:
      - generic [ref=e758]: OBI Assistant
  - alert [ref=e759]
  - generic [ref=e765]:
    - generic [ref=e766]:
      - heading "Data location" [level=1] [ref=e767]
      - generic [ref=e768]:
        - img "left" [ref=e769] [cursor=pointer]
        - generic [ref=e772]: 1 of 5
        - img "right" [ref=e773] [cursor=pointer]
    - paragraph [ref=e776]: Browse public and project data.
    - generic [ref=e777]:
      - button "Skip" [ref=e778] [cursor=pointer]
      - button "Next tip" [ref=e779] [cursor=pointer]
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
  9  | const SLUG = entitySlug(Type.SingleNeuronCircuit);
  10 | 
  11 | const PROPERTIES = [
  12 |   'brain_region',
  13 |   'species',
  14 |   'number_synapses',
  15 |   'number_connections',
  16 |   'build_category',
  17 |   'creation_date',
  18 |   'license',
  19 |   'lifecycle_status',
  20 | ];
  21 | 
  22 | const SECTIONS = ['viewer-scene', 'viewer-settings', 'metadata-grid', 'subject-details'];
  23 | 
  24 | test.use(WIDE_VIEWPORT);
  25 | 
  26 | test.describe('Synaptome details', () => {
  27 |   test.beforeEach(async ({ page, workspace }) => {
  28 |     const listing = entityListing(page);
  29 | 
  30 |     await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
  31 |     await expect(listing.cells.first()).toBeVisible();
  32 | 
> 33 |     await listing.cells.filter({ hasText: /\S/ }).first().click();
     |                                                          ^ TimeoutError: click: Timeout 30000ms exceeded.
  34 |     await expect(dataView(page).viewDetails).toBeVisible();
  35 |   });
  36 | 
  37 |   test('Open one Synaptome beside the listing', { tag: AUTHENTICATED }, async ({ page }) => {
  38 |     const view = dataView(page);
  39 | 
  40 |     await expect(view.miniName).toBeVisible();
  41 |     for (const property of PROPERTIES) {
  42 |       await expect(view.miniProperty(property)).toBeVisible();
  43 |     }
  44 |     await expect(view.miniDownload).toBeVisible();
  45 |   });
  46 | 
  47 |   test('Open the full Synaptome page', { tag: AUTHENTICATED }, async ({ page }) => {
  48 |     test.slow();
  49 |     const view = dataView(page);
  50 | 
  51 |     await view.viewDetails.click();
  52 |     await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));
  53 | 
  54 |     for (const name of SECTIONS) {
  55 |       await expect(view.section(name).first()).toBeVisible();
  56 |     }
  57 |   });
  58 | });
  59 | 
```