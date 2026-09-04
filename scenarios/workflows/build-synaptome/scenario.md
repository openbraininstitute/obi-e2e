# Synaptome build

The Synaptome build workflow, under Build on the Workflows page. It is driven by
a scan configuration: obi-one describes the form, and the fixture at
`data/scan-configs/build-synaptome.json` fills it in.

That fixture holds more than one configuration, because one workflow can be set
up in more than one way and each is worth building. Every configuration becomes
a test of its own, so they run in parallel. One of them places its synapses by
clicking the morphology in the 3D viewer, so filling that configuration goes
through the viewer rather than through a field.

A build costs credits, so the project's balance decides whether it can run at
all. Both outcomes are covered. The scenario that meets an empty balance uses the
first configuration only.

```gherkin
Feature: Synaptome build

@private @spends
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Build" workflow for "Synaptome"
  And I choose the ME-model the fixture names
  Then "Generate build(s)" is disabled

@private @spends
Scenario: A project with no credits cannot generate a campaign
  Given I have started the Synaptome build workflow
  And my project has no credits
  When I fill the configuration from the fixture
  Then "Generate build(s)" is offered
  And it is enabled
  When I press "Generate build(s)"
  Then I am told the project has no credits
  And the "Results" tab stays disabled
  And the button still offers to generate, so no campaign was made

@private @spends
Scenario: Generate a build campaign, once per configuration
  Given I have started the Synaptome build workflow
  And my project has credits
  When I fill the configuration from the fixture
  And I press "Generate build(s)"
  Then the "Results" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And its only input is "obi_one_coordinate.json"
  And it has produced nothing yet

@private @spends
Scenario: Launch the build and read the run it produced
  Given I have generated a synaptome build campaign
  When I press "Launch builds"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And its inputs are exactly "Task configuration", "obi_one_coordinate.json" and "circuit_config.json"
  And its outputs are exactly "Task logs" and the synaptome, named after the campaign
  When I open "Task logs"
  Then I see the run's log, ending with the task completing
  And no entity sits beside it

@private @spends
Scenario: Read the synaptome the build produced
  Given I have launched the configuration whose fixture names what it builds
  When I open the synaptome in the outputs
  Then I see it named after the campaign
  And I see the properties the fixture names, such as "Number of synapses"
  And I can download it or view its details

@private @spends
Scenario: Pick locations on the morphology by clicking it
  Given I have started the Synaptome build workflow
  And I have added an "Explicit Morphology Locations" placement strategy
  Then the list of locations is empty
  When I click two neurites in the 3D viewer
  Then two locations appear in the list
  And a location's section id is filled in and cannot be typed over
  And its offset can be changed

@private @spends
Scenario: An offset stays within its section
  Given I have picked a location on the morphology
  When I set its offset to "0.5"
  Then it reads "0.50"
  When I set it above 1
  Then it is brought back to "1.00"
  When I set it below 0
  Then it is brought back to "0.00"

@private @spends
Scenario: A synapse group keeps at least one location
  Given I have picked two locations on the morphology
  When I remove one
  Then one is left
  And it offers no way to remove the last one

@private @spends
Scenario: Look at the morphology another way
  Given I have started the Synaptome build workflow
  Then the 3D visualization is showing
  When I switch to the dendrogram
  Then the dendrogram is showing
  And switching back returns to the 3D visualization

@private @spends
Scenario: Show the axon
  Given I am looking at the morphology
  When I open the viewer settings
  Then the axon is off
  When I turn it on
  Then it is on, and turning it off again hides it

@private @spends
Scenario: Add a zoom slider to the viewer
  Given I am looking at the morphology
  Then there is no zoom slider
  When I turn one on in the viewer settings
  Then the scale appears beside the morphology
  And turning it off takes it away

@private @spends
Scenario: The viewer opens with a scale bar and a solid neuron
  Given I am looking at the morphology
  When I open the viewer settings
  Then the scale bar is on
  And the neuron opacity is "100%"
```
