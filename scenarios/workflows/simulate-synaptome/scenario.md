# Synaptome simulation

The Synaptome simulation workflow, under Simulate on the Workflows page. It is
driven by a scan configuration from `data/scan-configs/simulate-synaptome.json`,
which follows obi-one's own ME-model-with-synapses example: spikes drawn from an
exponential interval, plus a somatic clamp.

```gherkin
Feature: Synaptome simulation

@private
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Synaptome"
  And I choose the synaptome the fixture names
  Then "Generate simulation(s)" is offered
  And it is disabled

@private
Scenario Outline: Simulate a synaptome, once per configuration
  Given I have started the Synaptome simulation workflow
  And I have chosen the synaptome the fixture names
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate reaches "done"
  And it has produced something
```
