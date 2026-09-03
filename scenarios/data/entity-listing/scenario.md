# Entity listing

Every data type opens a listing built on the same grid.

```gherkin
Feature: Entity listing

@private @readonly
Scenario: Open the listing for a data type
  Given I am on the Data page
  When I choose a data type
  Then I land on that type's listing
  And I see the table
  And I see the search box and the filter and column controls

@private @readonly
Scenario: A type with data shows rows
  Given I am on the "Morphology" listing
  Then I see at least one morphology
  And I see the columns: Brain region, Species, M-type, Name
```

Every data type in every section is checked, using the list in
`fixtures/data-types.ts`.
