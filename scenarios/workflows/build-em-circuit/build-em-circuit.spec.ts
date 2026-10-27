import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import {
  campaignTags,
  campaignTimeout,
  registeredId,
  runCampaign,
  runForItsOutput,
} from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { expect, test } from '@fixtures/test';

const fixture = loadSeed(import.meta.dir);

/** The skeletonization that registers the morphology the build maps synapses onto. */
const skeletonization = loadSeed(import.meta.dir, 'skeletonization.json');

/** What the skeletonization lists its morphology as, once it has run. */
const SKELETONIZED_MORPHOLOGY = 'Skeletonized morphology';

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: campaignTimeout(fixture) + campaignTimeout(skeletonization) });

test.describe('Electron microscopy circuit build', () => {
  for (const configuration of fixture.cases) {
    test(
      `Generate a build campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page, workspace }) => {
        const [skeletonize] = skeletonization.cases;
        if (!skeletonize) throw new Error('skeletonization.json needs a configuration.');

        // No deployment holds a morphology derived from the dataset, so the
        // build starts from one this run skeletonizes into the project. obi-one
        // names it after the mesh's id and describes it by the neuron's, which
        // is what the seed searches for.
        await openWorkflowsHub(page, workspace);
        await startWorkflow(page, skeletonization.activity, skeletonization.workflow);
        const noMesh = await chooseEntities(page, skeletonization.selection);
        test.skip(noMesh !== null, noMesh ?? '');
        await runForItsOutput(page, skeletonization, skeletonize);
        const morphologyId = await registeredId(page, SKELETONIZED_MORPHOLOGY);

        await openWorkflowsHub(page, workspace);
        await startWorkflow(page, fixture.activity, fixture.workflow);

        const missing = await chooseEntities(page, fixture.selection, morphologyId);
        expect(
          missing,
          'The skeletonization registered the morphology, but the build does not offer it.'
        ).toBeNull();

        await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));

        await runCampaign(page, fixture, configuration);
      }
    );
  }
});
