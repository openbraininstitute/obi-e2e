import { RUN_ID } from '@fixtures/run/env';
import { trackOnboardingProject } from '@fixtures/run/onboarding-workspace';
import { ONBOARDING } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { onboardingLocators } from './locators';

async function openCurrentWorkspace(page: Parameters<typeof onboardingLocators>[0]) {
  await page.goto('/app/virtual-lab/sync');
  await expect(page.getByTestId('user-profile-button')).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toMatch(/^\/app\/virtual-lab\/[^/]+\/[^/?#]+$/);

  const match = new URL(page.url()).pathname.match(/^\/app\/virtual-lab\/([^/]+)\/([^/?#]+)$/);
  if (!match?.[1] || !match[2]) {
    throw new Error(`The onboarding user did not reach a workspace: ${page.url()}`);
  }
  return { labId: match[1], projectId: match[2] };
}

test.describe.configure({ mode: 'serial' });

test.describe('Onboarding user', () => {
  test(
    'Onboarding user reaches the authenticated application after opening the home page',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);

      await page.goto('/');
      await expect(locators.homeHeading).toBeVisible();

      // The auth setup has already completed the real Keycloak sign-in for this project.
      await page.goto('/app/log-in');
      await expect(locators.profileButton).toBeVisible();
      await expect(page).toHaveURL(/\/app\/virtual-lab\//);
      await expect(locators.currentVirtualLab).toBeVisible();
      await expect(locators.currentProject).toBeVisible();
    }
  );

  test(
    'Onboarding user creates a project in the virtual lab',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      const { labId, projectId: initialProjectId } = await openCurrentWorkspace(page);
      const projectName = `Onboarding project ${RUN_ID}`;

      await locators.currentProject.click();
      await expect(locators.addProject).toBeVisible();
      await locators.addProject.click();
      await expect(locators.modalShell).toBeVisible();

      await locators.projectName.fill(projectName);
      await locators.projectDescription.fill(
        'Created by the onboarding-user end-to-end scenario and removed after the run.'
      );
      await locators.createProject.click();

      await expect(locators.currentProject).toContainText(projectName);
      await expect
        .poll(async () => {
          const match = new URL(page.url()).pathname.match(
            /^\/app\/virtual-lab\/([^/]+)\/([^/?#]+)$/
          );
          return match?.[2] ?? '';
        })
        .not.toBe(initialProjectId);

      const createdProject = new URL(page.url()).pathname.match(
        /^\/app\/virtual-lab\/([^/]+)\/([^/?#]+)$/
      );
      if (!createdProject?.[2])
        throw new Error(`The created project has no route ID: ${page.url()}`);
      await trackOnboardingProject(labId, createdProject[2]);
    }
  );

  test(
    'Onboarding user opens the project invitation form',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      const { labId, projectId } = await openCurrentWorkspace(page);

      await page.goto(`/app/virtual-lab/${labId}/${projectId}/team`);
      await locators.addProjectMember.click();

      await expect(locators.projectInviteHeading).toBeVisible();
      await expect(locators.projectInviteEmail).toBeVisible();
      await expect(locators.projectInviteRole).toBeVisible();
      await expect(locators.addProjectMemberField).toBeVisible();
      await expect(locators.sendProjectInvite).toBeVisible();
    }
  );

  test(
    'Onboarding user opens the virtual lab administrator invitation controls',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      const { labId, projectId } = await openCurrentWorkspace(page);

      await page.goto(`/app/virtual-lab/${labId}/${projectId}`);
      await locators.currentVirtualLab.click();
      await locators.labMembersTab.click();

      await expect(locators.teamMembers).toBeVisible();
      await expect(locators.addAdministrator).toBeVisible();
      await locators.addAdministrator.click();

      await expect(locators.labAdminInviteEmail).toBeVisible();
      await expect(locators.addLabAdministratorField).toBeVisible();
      await expect(locators.sendLabAdministratorInvite).toBeVisible();
    }
  );

  test(
    'Onboarding user reaches the credit verification gate',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      const { labId, projectId } = await openCurrentWorkspace(page);

      await page.goto(`/app/virtual-lab/${labId}/${projectId}/credits`);
      await locators.buyCredits.click();
      await locators.purchaseCredits.click();

      await expect(locators.creditVerificationDialog).toBeVisible();
      await expect(locators.creditVerificationHeading).toBeVisible();
      await expect(locators.purchaseEmail).toBeVisible();
      await expect(locators.sendVerificationEmail).toBeVisible();
    }
  );

  test('Onboarding user can open subscription settings', { tag: ONBOARDING }, async ({ page }) => {
    const locators = onboardingLocators(page);
    await openCurrentWorkspace(page);

    await locators.profileButton.click();
    await locators.subscriptionTab.click();

    await expect(locators.subscriptionSection).toBeVisible();
    await expect(locators.subscriptionTier).toHaveText('Free account');
    await expect(locators.changeSubscription).toBeVisible();
  });
});
