# Single neuron simulation

The Single neuron simulation workflow, under Simulate on the Workflows page. It
is driven by a scan configuration from
`data/scan-configs/simulate-single-neuron.json`, whose configurations follow
obi-one's own ME-model simulation example.

An ME-model campaign has no cost estimator behind it, so it launches straight
away rather than asking what it will cost first.

The fixture holds a second configuration that sweeps the clamp amplitude. It runs
through the same steps, and the only thing it expects of its coordinates is that
the first one finishes having produced something.

```gherkin
Feature: Single neuron simulation

@private @spends
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Single neuron"
  And I choose the ME-model the fixture names
  Then "Generate simulation(s)" is disabled

@private @spends
Scenario: Generate a simulation campaign from a scan configuration
  Given I have started the Single neuron simulation workflow
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And its inputs are "node_sets.json", "obi_one_coordinate.json" and "simulation_config.json"
  And it has produced nothing yet

@private @spends
Scenario: Launch the simulation and read what it recorded
  Given I have generated a single neuron simulation campaign
  When I press "Launch simulations"
  Then the coordinate leaves "created"
  And it reaches "done"
  And its outputs are "Recording 0.h5" and "spikes.h5"
  When I open "Recording 0.h5"
  Then I see the trace, against "Time (ms)" and "Voltage (mV)"
  When I open "spikes.h5"
  Then I see the spikes of "PopulationAll"

@private @spends
Scenario: A swept amplitude makes a grid
  Given I have started the Single neuron simulation workflow
  When I give the current clamp two amplitudes
  And I press "Generate simulation(s)"
  Then the campaign holds two coordinates, one per amplitude
  When I launch it
  Then the first coordinate reaches "done"
  And it has produced something
```
