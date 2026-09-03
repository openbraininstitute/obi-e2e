# Signed-in tests

Specs here run as the QA user. The `setup` project signs in once and saves the
storage state, so no spec logs in itself.

Use the `workspace` fixture for the QA lab and project ids:

```ts
test('...', async ({ page, workspace }) => {
  await page.goto(`/app/virtual-lab/lab/${workspace.labId}/project/${workspace.projectId}`);
});
```

Never create or delete anything outside that lab and project.
