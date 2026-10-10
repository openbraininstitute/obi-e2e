# E-model optimization

The E-Model optimization workflow, under Optimize on the Workflows page. It fits
an e-model to the e-features extracted from a recording: the user names the
e-model, picks its e-type, the extracted features and a morphology, chooses the
ion channels, places each one on the sections it lives on, and says which of
their conductances the optimizer may move, and between which bounds. obi-one
describes the form and the seed fills it in; only the Mechanisms section is
built by hand in the app, as four tabs of its own.

Nothing is browsed for first: every input is picked inside the form. The
features have to exist before the form can be filled, and a new project holds
none, so the test extracts them first, with the "Intracellular EFeatures"
workflow on recording "C060109A1-SR-C1", a cADpyr cell, as `targets.json` beside
this file describes.

The e-model is a cADpyr one to match, on a layer 5 pyramidal morphology. It
follows a campaign a scientist ran by hand: sodium and two potassium channels
on the soma, the same three and a persistent sodium channel on the axon, each
conductance free between bounds. The morphology needs every section list the
form's default passive parameters name, apical dendrites included: an
interneuron, which has none, is refused two seconds into the run.

The seed keeps the run as short as the optimizer allows: two individuals, one
generation, where the hand-run campaign took thirty. Even so it takes longer
than the nightly suite can wait for, so the seed marks it slow. The seed also
says which deployments the workflow runs on, so no line here does.

User: credits
Seed: seed.json

## The form will not launch until it is complete

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Open "Optimize"
2. Start "E-Model optimization"

Expected:

- The form opens, with nothing to browse for first
- "Generate optimization(s)" is disabled

## Optimize an e-model against extracted e-features and launch it

For each: configuration in the seed

Precondition:

1. My project holds the e-features `targets.json` describes: the extraction was run in it, and reached "done"
2. The "E-Model optimization" form is open

Steps:

1. Fill in the campaign, then name the e-model and choose its e-type, the
   e-features the extraction produced (from my project) and the morphology the
   seed names
2. Under "Mechanism Selection", add the ion channel models the seed names, and
   under "Region Assignment" give each section list the ones the seed puts there
3. Under "Parameters Selection", let the optimizer move each parameter the seed
   names, between its bounds
4. Fill in the optimization settings from the seed

Expected:

- The button reads "Generate optimization(s)"
- The button is enabled

Steps:

1. Press "Generate optimization(s)"

Expected:

- The optimizations tab opens by itself
- There are as many coordinates as the seed says
- The first coordinate reads "created"
- Its inputs are exactly: "obi_one_coordinate.json"
- It has produced no outputs yet
- The launch button reads "Launch optimizations"

Steps:

1. Go back to the configuration tab

Expected:

- The button now reads "New optimization campaign"

Steps:

1. Open the optimizations tab again
2. Press "Launch optimizations"

Expected:

- An estimated cost breakdown is shown, with a "Confirm" to press

Steps:

1. Press "Confirm"

Expected:

- The coordinate leaves "created"
- The coordinate reaches "done" (within 30 minutes)
- Its inputs are exactly: "Task configuration" and "obi_one_coordinate.json"
- Its outputs are exactly: "Task logs", the e-model "E2E_cADpyr", the ME-model
  built from it, "E2E_cADpyr MEModel", and the optimization's "final.json" and
  "analysis_figures"

Steps:

1. Open "Task logs"

Expected:

- The log reads "Task execution completed."
