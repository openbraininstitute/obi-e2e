# Synapse per connection

The Synapse per connection listing, under the experimental section of the Data page.

```gherkin
Feature: Synapse per connection listing

@private @readonly
Scenario: See the Synapse per connection table
  Given I am logged in
  And I am inside my project
  When I open the Synapse per connection listing
  Then I see the table
    And I see the "Brain Region [From]" column
    And I see the "Brain Region [To]" column
    And I see the "Cell Type [From]" column
    And I see the "Cell Type [To]" column
    And I see the "Mean ± STD [µm⁻¹]" column
    And I see the "Species" column
    And I see the "Age" column
    And I see the "Contributors" column
    And I see the "Lifecycle status" column

@private @readonly
Scenario: See the Synapse per connection results
  Given I am on the Synapse per connection listing
  Then I see how many results there are
  And I see at least one result

@private @readonly
Scenario: Search narrows the Synapse per connection listing
  Given I am on the Synapse per connection listing
  When I search for something no entity matches
  Then I see no results
  And clearing the search brings them all back

@private @readonly
Scenario: Add a hidden column to the Synapse per connection table
  Given I am on the Synapse per connection listing
  When I open the column chooser
  And I turn on a column that is off, such as "Name", "Brain region", "Brain region acronym", "Strain", "Subject name"
  Then that column appears in the table

@private @readonly
Scenario: The Synapse per connection table offers no columns beyond these
  Given I am on the Synapse per connection listing
  When I open the column chooser
  Then 9 columns are on and 5 are off
  And there are no other columns on offer
```
