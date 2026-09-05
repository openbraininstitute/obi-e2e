# What the listing remembers

The data table remembers how you left it. Filters, sorting, the page you were
on and the search box are kept for the tab. The column layout is kept for good.

Leaving a listing to look at one row and coming back is the interesting case,
because the two ways back behave differently on purpose.

User: lab member

## The close button brings the listing back as it was

Precondition:

1. On the "Morphology" listing

Steps:

1. Search for "Sst-IRES", and note how many results it leaves
2. Open one result, and go through to its details page
3. Close the details page

Expected:

- The search box still reads "Sst-IRES"
- The number of results is the same as noted

## The breadcrumb starts the listing fresh

Precondition:

1. On the "Morphology" listing

Steps:

1. Search for "Sst-IRES"
2. Open one result, and go through to its details page
3. Go back through the breadcrumb

Expected:

- The search box is empty
- Every result is showing again

## Leaving the section keeps the listing as it was

Precondition:

1. On the "Morphology" listing

Steps:

1. Search for "Sst-IRES", and note how many results it leaves
2. Go to Workflows and come back

Expected:

- The search box still reads "Sst-IRES"
- The number of results is the same as noted

## The column layout outlives a fresh start

Precondition:

1. On the "Morphology" listing

Steps:

1. Turn off the "Contributors" column
2. Open one result, and go through to its details page
3. Go back through the breadcrumb

Expected:

- The search box is empty
- The "Contributors" column is still off
