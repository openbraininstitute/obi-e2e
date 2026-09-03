# API helpers

HTTP helpers for setting up and cleaning up test data (virtual labs, projects,
entities) without driving the browser.

Rules:

- Use these for **arranging** state, never for asserting what the user sees.
- On production, only touch the QA lab and project (`LAB_ID` / `PROJECT_ID`).
- Every helper that creates something must offer the matching delete.
