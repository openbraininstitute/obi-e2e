# Neuron density

The Neuron density listing, under the experimental section of the Data page.

```gherkin
Feature: Neuron density listing

@private @readonly
Scenario: See the Neuron density table
  Given I am logged in
  And I am inside my project
  When I open the Neuron density listing
  Then I see the table
  And I see these columns:
    "Brain region", "Species", "M-type"
    "E-type", "Density [1/mm³]", "N° of Measurements"
    "Name", "Age", "Contributors"
    "Registration date", "Lifecycle status"

@private @readonly
Scenario: See the Neuron density results
  Given I am on the Neuron density listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Neuron density listing
  Given I am on the Neuron density listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Neuron density table
  Given I am on the Neuron density listing
  When I open the column chooser
  And I turn on a column that is off:
    "Strain", "Subject name"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The Neuron density table offers no columns beyond these
  Given I am on the Neuron density listing
  When I open the column chooser
  Then 11 columns are on and 2 are off
  And no other column is on offer

@private @readonly
Scenario: Every Neuron density filter narrows the listing
  Given I am on the Neuron density listing
  When I filter by each of these columns in turn:
    "Brain region", "Species", "M-type"
    "E-type", "Name", "Contributors"
    "Registration date", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back

@private @readonly
Scenario: Page through the Neuron density listing
  Given I am on the Neuron density listing
  And there is more than one page of results
  When I go to page 2
  Then I see different results
  And the total number of results does not change
  When I go back to page 1
  Then I see the results I saw first
```
