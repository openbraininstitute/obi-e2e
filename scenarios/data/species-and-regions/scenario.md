# Species and brain regions

The Data page and every listing share a species picker and a brain region
hierarchy. Both narrow what the listing shows.

Only Human, Mouse and Rat have a brain atlas. The rest have a single region, so
there is nothing to navigate and choosing a region does nothing.

```gherkin
Feature: Species and brain regions

@private @readonly
Scenario: Choose a species with an atlas
  Given I am on the Data page
  When I choose the "Mouse" species
  Then I see the 3D view
  And I see a brain region hierarchy with more than one region
  And the number of morphologies changes

@private @readonly
Scenario: Choose a species without an atlas
  Given I am on the Data page
  When I choose the "Cat" species
  Then I see a single region, so there is nothing to browse

@private @readonly
Scenario: Every species can be chosen
  Given I am on the Data page
  Then I can pick each of the nine species offered
  And each one leaves the page working

@private @readonly
Scenario: Change the brain region on a listing
  Given I am on the "Morphology" listing
  And I have chosen the "Mouse" species
  When I choose a different brain region
  Then the listing shows a different number of results

@private @readonly
Scenario: Change the species on a listing
  Given I am on the "Morphology" listing
  When I choose the "Mouse" species
  Then the listing shows fewer results than for all species
```
