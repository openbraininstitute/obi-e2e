# Circuit

The Circuit listing, under the models section of the Data page.

```gherkin
Feature: Circuit listing

@private @readonly
Scenario: See the Circuit table
  Given I am logged in
  And I am inside my project
  When I open the Circuit listing
  Then I see the table
  And I see these columns:
    "Name", "Subcircuits", "Description"
    "Brain region", "Species", "Scale"
    "Number of neurons", "Number of synapses", "Number of connections"
    "Build category"

@private @readonly
Scenario: See the Circuit results
  Given I am on the Circuit listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Circuit listing
  Given I am on the Circuit listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Circuit table
  Given I am on the Circuit listing
  When I open the column chooser
  And I turn on a column that is off:
    "Has morphologies", "Has point neurons", "Has electrical cell models"
    "Has spines", "Strain", "Subject name"
    "Contributors"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The Circuit table offers no columns beyond these
  Given I am on the Circuit listing
  When I open the column chooser
  Then 15 columns are on and 7 are off
  And no other column is on offer

@private @readonly
Scenario: Every Circuit filter narrows the listing
  Given I am on the Circuit listing
  When I filter by each of these columns in turn:
    "Name", "Brain region", "Species"
    "Scale", "Number of neurons", "Number of synapses"
    "Number of connections", "Build category", "Target simulator"
    "Derivation type", "Published in", "Experiment date"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
