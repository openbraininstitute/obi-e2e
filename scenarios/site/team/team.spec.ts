import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { GROUPS, memberNames, teamLocators } from './locators';

test.describe('Team page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team');
  });

  test('Open the Team page', { tag: VISITOR }, async ({ page }) => {
    const team = teamLocators(page);

    await expect(team.heading).toBeVisible();
    await expect(team.discoverTeam).toBeVisible();
  });

  test('The team is split into three groups', { tag: VISITOR }, async ({ page }) => {
    const team = teamLocators(page);

    for (const group of GROUPS) {
      await expect(team.group(group)).toBeVisible();
    }
  });

  test('Every member is pictured under their own name', { tag: VISITOR }, async ({ page }) => {
    const team = teamLocators(page);

    await expect(team.memberPhoto('Henry Markram')).toBeVisible();

    const names = await memberNames(page);
    expect(names.length).toBeGreaterThan(20);
    for (const name of names) {
      expect(name.trim()).not.toBe('');
    }
  });
});
