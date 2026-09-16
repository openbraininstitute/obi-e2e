import {
  loadSeed,
  notDeployedHere,
  runsOnThisDeployment,
} from "@fixtures/scan-config";
import { scanConfigWords } from "@fixtures/scan-config/activities";
import {
  campaignTags,
  campaignTimeout,
  runCampaign,
} from "@fixtures/steps/campaign";
import { enableFeature } from "@fixtures/steps/feature-flags";
import { openWorkflowsHub, startWorkflow } from "@fixtures/steps/workflows";
import { CREDITS } from "@fixtures/tags";
import { expect, test } from "@fixtures/test";
import { scanConfigEditor } from "@locators/scan-config";
import type { Page } from "@playwright/test";

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

/** This workflow browses for nothing, so the form is where starting it lands. */
const FORM_URL = new RegExp(`/configure/${fixture.workflow.type}`);

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

/*
 * Quarantined until the backend answers this origin. obi-one returns
 * `/declared/task/estimate` and `/declared/task/launch` with no
 * `Access-Control-Allow-Origin` header, so the browser drops both calls before
 * they leave and the launch never reaches the service. Nothing the form does
 * can get past that. Delete this line once obi-one allows the origin; the
 * scenario is unchanged underneath it.
 */
test.skip(
  true,
  "Blocked on obi-one: the declared-task endpoints refuse this origin (CORS).",
);

test.describe.configure({ timeout: campaignTimeout(fixture) });

/** Starts the workflow, leaving the form open. The recordings are picked inside it. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);

  await expect(page).toHaveURL(FORM_URL);
}

test.describe("Intracellular e-feature extraction", () => {
  test.beforeEach(async ({ page, context, workspace, baseURL }) => {
    // Before the hub loads: it renders the card disabled without the flag.
    const flag = fixture.requires?.featureFlag;
    if (flag && baseURL) await enableFeature(context, flag, baseURL);

    await openWorkflowsHub(page, workspace);
  });

  test(
    "The form will not launch until it is complete",
    { tag: CREDITS },
    async ({ page }) => {
      await openEditor(page);

      await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
      await expect(scanConfigEditor(page).submit).toBeDisabled();
    },
  );

  for (const configuration of fixture.cases) {
    test(
      `Generate an extraction campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page }) => {
        await openEditor(page);
        await runCampaign(page, fixture, configuration);
      },
    );
  }
});
