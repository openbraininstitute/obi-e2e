# Filtering a listing

```gherkin
Feature: Filtering a listing

@private @readonly
Scenario: Search narrows the results
  Given I am on the "Morphology" listing
  And I note how many results there are
  When I search for "Sst-IRES"
  Then I see fewer results than before
  And every result still belongs to the morphology listing

@private @readonly
Scenario: Clearing the search restores the results
  Given I have searched the "Morphology" listing
  When I clear the search box
  Then I see the original number of results

@private @readonly
Scenario: A search that matches nothing
  Given I am on the "Morphology" listing
  When I search for "zzzz-no-such-entity"
  Then I see no results

@private @readonly
Scenario: The additional filters are offered
  Given I am on the "Morphology" listing
  When I open the filters
  Then I see the additional filters, including "Generation type" and "Strain"

@private @readonly
Scenario: Opening a filter shows its control
  Given I have opened the filters on the "Morphology" listing
  When I choose the "ID" filter
  Then I see a box to type a value into
```

Not covered: the funnel beside each column header. See the note in the spec.
