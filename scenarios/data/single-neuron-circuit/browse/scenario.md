# Synaptome

The Synaptome listing, under the models section of the Data page.

```gherkin
Feature: Synaptome listing

@private @readonly
Scenario: See the Synaptome table
  Given I am logged in
  And I am inside my project
  When I open the Synaptome listing
  Then I see the table
  And I see these columns:
    "Name", "Description", "Brain region"
    "Species", "Scale", "Number of neurons"
    "Number of synapses", "Number of connections", "Target simulator"
    "Created by"

@private @readonly
Scenario: See the Synaptome results
  Given I am on the Synaptome listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Synaptome listing
  Given I am on the Synaptome listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: The Synaptome table offers no columns beyond these
  Given I am on the Synaptome listing
  When I open the column chooser
  Then 12 columns are on and 0 are off
  And no other column is on offer

@private @readonly
Scenario: Every Synaptome filter narrows the listing
  Given I am on the Synaptome listing
  When I filter by each of these columns in turn:
    "Name", "Brain region", "Species"
    "Number of neurons", "Number of synapses", "Number of connections"
    "Target simulator", "Created by", "Registration date"
    "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back

@private @readonly
Scenario: Page through the Synaptome listing
  Given I am on the Synaptome listing
  And there is more than one page of results
  When I go to page 2
  Then I see different results
  And the total number of results does not change
  When I go back to page 1
  Then I see the results I saw first
```
