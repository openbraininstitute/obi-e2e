# Data types

Every section of the Data page offers its own list of data types.

```gherkin
Feature: Data types

@private @readonly
Scenario: See the experimental data types
  Given I am on the Data page
  When I choose the "Experimental" section
  Then I see "Morphology", "Single cell electrophysiology",
    "Ion channel electrophysiology", "Neuron density", "Bouton density",
    "Synapse per connection" and "EM mesh"

@private @readonly
Scenario: See the model data types
  Given I am on the Data page
  When I choose the "Model" section
  Then I see "Ion channel model", "Synthesized morphology", "E-model",
    "ME-model", "Synaptome", "Circuit" and "Synaptome (legacy)"

@private @readonly
Scenario: See the simulation data types
  Given I am on the Data page
  When I choose the "Simulations" section
  Then I see "Ion channel", "Single neuron", "Synaptome", "Paired neurons",
    "Small microcircuit", "Microcircuit", "Whole brain circuit",
    "Single neuron (legacy)" and "Synaptome (legacy)"
```
