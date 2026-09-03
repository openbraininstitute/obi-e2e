# Shared locators

A locator belongs here once a second scenario needs it. Until then it lives in
its own scenario folder.

Moving a locator here is a deliberate step: every scenario that imports it is
then coupled to it, so a rename in the application breaks all of them at once.
That is the point. One fix, not five.

`helpers.ts` holds the role helpers every locator is built from.
