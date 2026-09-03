# Onboarding tests

Specs here run as the `onboarding` user, which owns no virtual lab. They cover
creating a virtual lab and creating projects inside it.

A user may own only one virtual lab, so these tests must delete what they create.
They clean up at the **start** as well as the end, because a run cancelled halfway
would otherwise leave a lab behind and block every later run.

Skipped automatically when `E2E_ONBOARDING_USERNAME` is not set.
