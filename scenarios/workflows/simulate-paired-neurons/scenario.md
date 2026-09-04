# Paired neurons simulation

The Paired neurons simulation workflow, under Simulate on the Workflows page. It
is driven by a scan configuration from
`data/scan-configs/simulate-paired-neurons.json`, following obi-one's own circuit
simulation example: a neuron set, a clamp on it, and a recording of it.

Two neurons are clamped, so the recording holds a trace for each of them.

```gherkin
Feature: Paired neurons simulation

@private @spends
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Paired neurons"
  And I choose the circuit the fixture names
  Then "Generate simulation(s)" is disabled

@private @spends
Scenario: Generate a simulation campaign from a scan configuration
  Given I have started the Paired neurons simulation workflow
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And its inputs are the circuit config, the node sets, the coordinate and the simulation config
  And it has produced nothing yet

@private @spends
Scenario: Launch the simulation and read what it recorded
  Given I have generated a paired neurons simulation campaign
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And its outputs are "Recording 0.h5" and "spikes.h5"
  When I open "Recording 0.h5"
  Then I see a trace for each of the two neurons, against "Time (ms)" and "Voltage (mV)"
  When I open "spikes.h5"
  Then I see the spikes of "PopulationS1nonbarrel_neurons"
```
