import { clickUntil } from '@fixtures/interactions';
import { RUN_ID } from '@fixtures/run/env';
import { trackOnboardingLab, trackOnboardingProject } from '@fixtures/run/onboarding-workspace';
import { ONBOARDING } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { onboardingLocators } from './locators';

type OnboardingPage = Parameters<typeof onboardingLocators>[0];

const COUNTRY = 'Switzerland';
const AFFILIATION = 'E2E Test Organization';

/** A workspace route: the lab, then the project. */
const WORKSPACE_PATH = /^\/app\/virtual-lab\/([^/]+)\/([^/?#]+)$/;

/**
 * Provisioning creates the lab, its first project and its billing account on
 * the server, one streamed step at a time, before the next screen can show.
 */
const PROVISION_TIMEOUT = 90_000;

function workspaceOf(url: string): { labId: string; projectId: string } {
  const match = new URL(url).pathname.match(WORKSPACE_PATH);
  if (!match?.[1] || !match[2]) {
    throw new Error(`The onboarding user did not reach a workspace: ${url}`);
  }
  return { labId: match[1], projectId: match[2] };
}

/**
 * Goes through the first-run wizard, and records what it created.
 *
 * The identity step wants a country and an affiliation; the names come
 * prefilled. The provisioning step runs by itself and hands over to the
 * customization step, whose button opens the new project. The lab and that
 * first project are tracked as the run's own, so the teardown removes both.
 */
async function createVirtualLab(page: OnboardingPage): Promise<void> {
  const locators = onboardingLocators(page);

  await locators.country.fill(COUNTRY);
  await locators.countryOption(COUNTRY).click();
  await locators.affiliation.fill(AFFILIATION);
  await expect(locators.createVirtualLab).toBeEnabled();
  await locators.createVirtualLab.click();

  await expect(locators.goToProject).toBeEnabled({ timeout: PROVISION_TIMEOUT });
  await locators.goToProject.click();
  // The URL, not the load event: the project home keeps loading long after it
  // is usable, and `waitForURL` would wait out its clock on a page that is there.
  await expect.poll(() => new URL(page.url()).pathname).toMatch(WORKSPACE_PATH);

  const { labId, projectId } = workspaceOf(page.url());
  await trackOnboardingLab(labId, true);
  await trackOnboardingProject(labId, projectId);
}

/**
 * Waits for the workspace, creating the virtual lab first when the user has none.
 *
 * `/app/virtual-lab/sync` sends a user with no virtual lab to the first-run
 * wizard, not to a workspace. The onboarding user is the one that goes through
 * it; a retry of this serial group finds the lab it made and skips the wizard.
 */
async function enterWorkspace(page: OnboardingPage): Promise<void> {
  const locators = onboardingLocators(page);

  await expect(locators.profileButton.or(locators.createVirtualLab)).toBeVisible();
  if (await locators.createVirtualLab.isVisible()) await createVirtualLab(page);
}

async function openCurrentWorkspace(page: OnboardingPage) {
  await page.goto('/app/virtual-lab/sync');
  await enterWorkspace(page);
  await expect.poll(() => new URL(page.url()).pathname).toMatch(WORKSPACE_PATH);
  return workspaceOf(page.url());
}

test.describe.configure({ mode: 'serial' });

test.describe('Onboarding user', () => {
  test(
    'Onboarding user reaches the authenticated application after opening the home page',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      // Room for the wizard: provisioning alone may take most of a test's clock.
      test.slow();

      await page.goto('/');
      await expect(locators.homeHeading).toBeVisible();

      // The auth setup has already completed the real Keycloak sign-in for this project.
      await page.goto('/app/log-in');
      await enterWorkspace(page);
      await expect(page).toHaveURL(/\/app\/virtual-lab\//);
      await expect(locators.currentVirtualLab).toBeVisible();
      await expect(locators.currentProject).toBeVisible();
    }
  );

  test(
    'Onboarding user creates a project in the virtual lab',
    { tag: ONBOARDING },
    async ({ page }, testInfo) => {
      const locators = onboardingLocators(page);
      const { labId, projectId: initialProjectId } = await openCurrentWorkspace(page);
      // A serial group retries from its first test, and the first attempt may have
      // created its project already: a retry needs a name of its own.
      const retry = testInfo.retry ? ` retry ${testInfo.retry}` : '';
      const projectName = `Onboarding project ${RUN_ID}${retry}`;

      await clickUntil(locators.currentProject, locators.addProject);
      await locators.addProject.click();
      await expect(locators.modalShell).toBeVisible();

      await locators.projectName.fill(projectName);
      await locators.projectDescription.fill(
        'Created by the onboarding-user end-to-end scenario and removed after the run.'
      );
      await locators.createProject.click();

      await expect(locators.currentProject).toContainText(projectName);
      await expect
        .poll(() => new URL(page.url()).pathname.match(WORKSPACE_PATH)?.[2] ?? '')
        .not.toBe(initialProjectId);

      await trackOnboardingProject(labId, workspaceOf(page.url()).projectId);
    }
  );

  test(
    'Onboarding user opens the project invitation form',
    { tag: ONBOARDING },
    async ({ page }) => {
      const locators = onboardingLocators(page);
      const { labId, projectId } = await openCurrentWorkspace(page);

      await page.goto(`/app/virtual-lab/${labId}/${projectId}/team`);
      await clickUntil(locators.addProjectMember, locators.projectInviteHeading);

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
      await clickUntil(locators.currentVirtualLab, locators.labMembersTab);
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
      await clickUntil(locators.buyCredits, locators.purchaseCredits);
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

    await clickUntil(locators.profileButton, locators.subscriptionTab);
    await locators.subscriptionTab.click();

    await expect(locators.subscriptionSection).toBeVisible();
    await expect(locators.subscriptionTier).toHaveText('Free account');
    await expect(locators.changeSubscription).toBeVisible();
  });
});
