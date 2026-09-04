# Synaptome simulation

The Synaptome simulation workflow, under Simulate on the Workflows page. It is
driven by a scan configuration from `data/scan-configs/simulate-synaptome.json`,
which follows obi-one's own ME-model-with-synapses example: spikes drawn from an
exponential interval, plus a somatic clamp.

The spikes the stimulus will play are generated with the campaign, so they sit
among the inputs as a file of their own before anything runs.

```gherkin
Feature: Synaptome simulation

@private @spends
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Synaptome"
  And I choose the synaptome the fixture names
  Then "Generate simulation(s)" is disabled

@private @spends
Scenario: Generate a simulation campaign from a scan configuration
  Given I have started the Synaptome simulation workflow
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And its inputs hold the stimulus spikes, "Stimulus 0_spikes.h5", beside the circuit and simulation configs
  And it has produced nothing yet

@private @spends
Scenario: Launch the simulation and read what it recorded
  Given I have generated a synaptome simulation campaign
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And its outputs are "Recording 0.h5" and "spikes.h5"
  When I open "Recording 0.h5"
  Then I see the trace, against "Time (ms)" and "Voltage (mV)"
  When I open "spikes.h5"
  Then I see the spikes of "PopulationS1nonbarrel_neurons"
```
