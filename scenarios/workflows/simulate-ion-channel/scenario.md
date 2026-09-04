# Ion channel simulation

The Ion channel simulation workflow, under Simulate on the Workflows page. It is
driven by a scan configuration from
`data/scan-configs/simulate-ion-channel.json`, following obi-one's own ion
channel example: the channel given a conductance, held at three voltages in
turn, and recorded.

```gherkin
Feature: Ion channel simulation

@private
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Ion channel"
  And I choose the ion channel model the fixture names
  Then "Generate simulation(s)" is offered
  And it is disabled

@private
Scenario Outline: Simulate an ion channel, once per configuration
  Given I have started the Ion channel simulation workflow
  And I have chosen the ion channel model the fixture names
  When I fill the configuration from the fixture
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate reaches "done"
  And its outputs are what the run recorded
```
