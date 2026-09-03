# Bouton density

The Bouton density listing, under the experimental section of the Data page.

```gherkin
Feature: Bouton density listing

@private @readonly
Scenario: See the Bouton density table
  Given I am logged in
  And I am inside my project
  When I open the Bouton density listing
  Then I see the table
  And I see these columns:
    "Brain region", "Species", "M-type"
    "Mean ± STD [µm⁻¹]", "SEM", "N° of Measurements"
    "Contributors", "Lifecycle status"

@private @readonly
Scenario: See the Bouton density results
  Given I am on the Bouton density listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search the Bouton density listing
  Given I am on the Bouton density listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Bouton density table
  Given I am on the Bouton density listing
  When I open the column chooser
  And I turn on a column that is off:
    "Name", "Strain", "Subject name"
  Then that column appears in the table
  And turning it back off removes it

@private @readonly
Scenario: The Bouton density table offers no columns beyond these
  Given I am on the Bouton density listing
  When I open the column chooser
  Then 8 columns are on and 3 are off
  And no other column is on offer

@private @readonly
Scenario: Every Bouton density filter narrows the listing
  Given I am on the Bouton density listing
  When I filter by each of these columns in turn:
    "Brain region", "Species", "M-type"
    "Contributors", "Lifecycle status"
  Then a filter offering a list of values gives exactly the count it promised
  And a filter I type into gives no results for a value nothing matches
  And a range filter given a minimum above its maximum gives no results
  And clearing each filter brings the listing back
```
