# Ion channel simulation

The Ion channel simulation workflow, under Simulate on the Workflows page. It is
driven by a scan configuration from
`data/scan-configs/simulate-ion-channel.json`, following obi-one's own ion
channel example: the channel given a conductance, held at three voltages in
turn, and recorded.

Unlike the other workflows, this one browses for nothing first. It opens straight
into the configuration, and the ion channel model is picked from a field inside
it while the rest of the form is filled.

```gherkin
Feature: Ion channel simulation

@private @spends
Scenario: The configuration is not launchable until it is complete
  Given I am logged in
  And I am inside my project
  When I start the "Simulate" workflow for "Ion channel"
  Then the configuration opens, with nothing to browse for first
  And "Generate simulation(s)" is disabled

@private @spends
Scenario: Generate a simulation campaign from a scan configuration
  Given I have started the Ion channel simulation workflow
  When I fill the configuration from the fixture, ion channel model included
  And I press "Generate simulation(s)"
  Then the "Simulations" tab opens
  And the button offers a new campaign instead
  And I see one coordinate for each combination of swept values
  And that coordinate is "created"
  And its inputs are "node_sets.json", "obi_one_coordinate.json" and "simulation_config.json"
  And it has produced nothing yet

@private @spends
Scenario: Launch the simulation and read what it recorded
  Given I have generated an ion channel simulation campaign
  When I press "Launch simulations"
  And I confirm what it will cost
  Then the coordinate leaves "created"
  And it reaches "done"
  And its outputs are "Recording 0.h5" and "spikes.h5"
  When I open "Recording 0.h5"
  Then I see the trace, against "Time (ms)" and "Voltage (mV)"
  When I open "spikes.h5"
  Then I see the spikes of "PopulationAll"
```
