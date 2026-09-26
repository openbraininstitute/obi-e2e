# Workflow activities

The record of what a project has launched. Two pickers narrow it: one for the
category, one for the type within that category.

A project that has launched nothing shows the table with no entries, so a case
that needs an entry says so and steps aside when there is none.

User: authenticated

## Both pickers are offered above the table

Precondition:

1. Inside my project, on the Workflows page

Steps:

1. Look above the list of activities

Expected:

- There is a picker for the category
- There is a picker for the type
- There is a box to search activities by name
- There is a way to filter the columns

## The category picker offers all five categories

Precondition:

1. On the Workflows page

Steps:

1. Open the category picker

Expected:

- "Build" is offered
- "Simulate" is offered
- "Process data" is offered
- "Optimize" is offered
- "Validate" is offered

## The type picker offers the types of the chosen category

Precondition:

1. On the Workflows page, with "Build" chosen

Steps:

1. Open the type picker

Expected:

- "Ion channel" is offered under "Subcellular"
- "Single neuron" is offered under "Cellular"
- "Electron microscopy circuit" is offered under "Circuit"

## Choosing another category changes the type picker

Precondition:

1. On the Workflows page, with "Build" chosen

Steps:

1. Note which type is chosen
2. Choose the "Simulate" category

Expected:

- The category chosen is "Simulate"
- The table is still showing
- The type chosen is one that "Simulate" offers

## An activity offers what can be done with it

Precondition:

1. On the Workflows page, with an activity listed

Steps:

1. Select the first activity

Expected:

- Something can be done with it under "Actions"
