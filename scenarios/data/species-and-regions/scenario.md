# Species and brain regions

The Data page and every listing share a species picker and a brain region
hierarchy. Both narrow what the listing shows.

Only Human, Mouse and Rat have a brain atlas. The rest have a single region, so
there is nothing to navigate and choosing a region does nothing.

The species picker is remembered for the user, not for the tab, so a test that
changes it puts it back.

User: lab member

## Choose a species with an atlas

One test per species that has an atlas.

Precondition:

1. On the Data page

Steps:

1. Choose the species

Expected:

- The 3D view is showing
- The brain region hierarchy holds more than one region

## Choose a species without an atlas

One test per species that has no atlas.

Precondition:

1. On the Data page

Steps:

1. Choose the species

Expected:

- There is a single region, so there is nothing to browse

## Every species can be chosen

Precondition:

1. On the Data page

Steps:

1. Choose each of the nine species in turn

Expected:

- Each one leaves the page working

## Change the brain region on a listing

Precondition:

1. On the "Morphology" listing, with the "Mouse" species chosen

Steps:

1. Choose a different brain region

Expected:

- The listing shows a different number of results

## Change the species on a listing

Precondition:

1. On the "Morphology" listing

Steps:

1. Choose the "Mouse" species

Expected:

- The listing shows fewer results than it did for all species
