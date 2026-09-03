# E-model

The E-model listing, under the models section of the Data page.

```gherkin
Feature: E-model listing

@private @readonly
Scenario: See the E-model table
  Given I am logged in
  And I am inside my project
  When I open the E-model listing
  Then I see the table
  And I see these columns:
    "Name", "Response", "Brain region"
    "Species", "M-type", "E-type"
    "Morphology", "Model cumulated score", "Contributors"
    "Registration date"

@private @readonly
Scenario: See the E-model results
  Given I am on the E-model listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the E-model listing
  Given I am on the E-model listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the E-model table
  Given I am on the E-model listing
  When I open the column chooser
  And I turn on a column that is off:
    "Segmented spines", "Ion channel models", "Strain"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The E-model table offers no columns beyond these
  Given I am on the E-model listing
  When I open the column chooser
  Then 11 columns are on and 3 are off
  And no other column is on offer

@private @readonly
Scenario: Every E-model filter narrows the listing
  Given I am on the E-model listing
  When I filter by each of these columns in turn:
    "Name", "Brain region", "Species"
    "M-type", "E-type", "Morphology"
    "Model cumulated score", "Contributors", "Registration date"
    "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back

@private @readonly
Scenario: Page through the E-model listing
  Given I am on the E-model listing
  And there is more than one page of results
  When I go to page 2
  Then I see different results
  And the total number of results does not change
  When I go back to page 1
  Then I see the results I saw first
```
