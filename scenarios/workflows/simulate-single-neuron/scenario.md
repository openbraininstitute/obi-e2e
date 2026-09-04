# Single neuron simulation

The Single neuron simulation workflow, under Simulate on the Workflows page. It
is driven by a scan configuration from
`data/scan-configs/simulate-single-neuron.json`, whose configurations follow
obi-one's own ME-model simulation example.

An ME-model campaign has no cost estimator behind it, so it launches straight
away rather than asking what it will cost first.

```gherkin
Feature: Single neuron simulation

@private
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Single neuron"
  And I choose the ME-model the fixture names
  Then "Generate simulation(s)" is offered
  And it is disabled

@private
Scenario Outline: Simulate a single neuron, once per configuration
  Given I have started the Single neuron simulation workflow
  And I have chosen the ME-model the fixture names
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  When I press "Launch simulations"
  Then the coordinate reaches "done"
  And it has produced something

@private
Scenario: A swept amplitude makes a grid
  Given I am configuring a single neuron simulation
  When I give the current clamp two amplitudes
  Then the campaign holds two coordinates, one per amplitude
```
