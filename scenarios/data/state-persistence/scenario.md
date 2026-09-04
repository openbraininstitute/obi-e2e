# What the listing remembers

The data table remembers how you left it. Filters, sorting, the page you were
on and the search box are kept for the tab. The column layout is kept for good.

Leaving a listing to look at one row and coming back is the interesting case,
because the two ways back behave differently on purpose.

```gherkin
Feature: What the listing remembers

@private @readonly
Scenario: The close button brings the listing back as it was
  Given I am on the "Morphology" listing
  And I have searched for "Sst-IRES"
  And I have opened one result
  When I close the details page
  Then I see my search still in the box
  And I see the same number of results as before

@private @readonly
Scenario: The breadcrumb starts the listing fresh
  Given I am on the "Morphology" listing
  And I have searched for "Sst-IRES"
  And I have opened one result
  When I go back through the breadcrumb
  Then the search box is empty
  And I see every result again

@private @readonly
Scenario: Leaving the section keeps the listing as it was
  Given I am on the "Morphology" listing
  And I have searched for "Sst-IRES"
  When I go to Workflows and come back
  Then I see my search still in the box
  And I see the same number of results as before

@private @readonly
Scenario: The column layout outlives a fresh start
  Given I am on the "Morphology" listing
  And I have turned off the "Contributors" column
  And I have opened one result
  When I go back through the breadcrumb
  Then the search is cleared
  But the "Contributors" column is still off
```
