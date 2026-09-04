# Paired neurons simulation

The Paired neurons simulation workflow, under Simulate on the Workflows page. It
is driven by a scan configuration from
`data/scan-configs/simulate-paired-neurons.json`, following obi-one's own circuit
simulation example: a neuron set, a clamp on it, and a recording of it.

```gherkin
Feature: Paired neurons simulation

@private
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Paired neurons"
  And I choose the circuit the fixture names
  Then "Generate simulation(s)" is offered
  And it is disabled

@private
Scenario Outline: Simulate paired neurons, once per configuration
  Given I have started the Paired neurons simulation workflow
  And I have chosen the circuit the fixture names
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate reaches "done"
  And its outputs are the recording and the spikes it produced
```
