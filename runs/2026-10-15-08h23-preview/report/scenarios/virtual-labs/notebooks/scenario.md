# Notebooks

The notebooks a project can run: the ones the platform publishes, and the ones
the project made. Opening one shows what it does before anything is launched.

User: authenticated

## See the notebooks the platform publishes

Precondition:

1. Inside my project

Steps:

1. Open the Notebooks page

Expected:

- The "Public" and "Project" scopes are both offered
- The "Public" scope is the one selected
- At least one notebook is listed
- There is an "Open JupyterHub" button

## The listing shows the same five columns

Precondition:

1. On the Notebooks page

Steps:

1. Look at the columns

Expected:

- "Name" is one of them
- "Description" is one of them
- "Scale" is one of them
- "Contributors" is one of them
- "Registration date" is one of them

## Searching narrows the notebooks

Precondition:

1. On the Notebooks page

Steps:

1. Note how many results there are
2. Search for "Visualize"

Expected:

- There are fewer results than were noted
- There is still at least one

## Clearing the search brings them all back

After: Searching narrows the notebooks

Steps:

1. Clear the search box

Expected:

- The search box is empty
- There are as many results as were noted

## Filtering by name narrows the notebooks

Precondition:

1. On the Notebooks page

Steps:

1. Note how many results there are
2. Filter the "Name" column to those containing "Circuit registration"

Expected:

- There are fewer results than were noted
- "Circuit registration" is listed

## Clearing the name filter brings them all back

After: Filtering by name narrows the notebooks

Steps:

1. Reset the "Name" filter

Expected:

- There are as many results as were noted

## Opening a notebook shows what it does

Precondition:

1. On the Notebooks page

Steps:

1. Open the first notebook

Expected:

- The panel is headed with that notebook's name
- It gives the notebook's "Scale"
- It gives the notebook's "Contributors"
- It gives the notebook's "Registration date"
- A preview of the notebook's cells is showing
- It can be downloaded
- It can be run
- Its full details can be opened

## Switching to my project's notebooks

Precondition:

1. On the Notebooks page

Steps:

1. Choose the "Project" scope

Expected:

- The "Project" scope is the one now selected
- The page stays on the Notebooks page
- The columns are still showing
