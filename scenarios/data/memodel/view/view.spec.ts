import { showAllSpecies } from '@fixtures/choose-species';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';
import { scanConfigEditor } from '@locators/scan-config';

import { memodelViewLocators } from './locators';

const SLUG = entitySlug(Type.Memodel);

const PROPERTIES = [
  'brain_region',
  'mtype',
  'etype',
  'validation_status',
  'creation_date',
  'license',
  'lifecycle_status',
];

const SECTIONS = ['metadata-grid'];

const CAMPAIGN_FIELDS = ['campaign_name', 'campaign_description'];

const SIMULATION_TABS = ['configuration', 'simulations'];

test.use(WIDE_VIEWPORT);

test.describe('ME-model details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test('Open one ME-model beside the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const view = dataView(page);

    await expect(view.miniName).toBeVisible();
    for (const property of PROPERTIES) {
      await expect(view.miniProperty(property)).toBeVisible();
    }
    await expect(view.miniDownload).toBeVisible();
  });

  test('Open the full ME-model page', { tag: PRIVATE_READONLY }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });

  test('Open simulate page from details view', { tag: PRIVATE_READONLY }, async ({ page }) => {
    test.slow();
    const view = dataView(page);
    const memodel = memodelViewLocators(page);
    const editor = scanConfigEditor(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));
    await expect(view.simulate).toBeVisible();

    await view.simulate.click();
    await expect(page).toHaveURL(/\/workflows\/simulate\/configure\//);

    for (const name of SIMULATION_TABS) {
      await expect(editor.tab(name)).toBeVisible();
    }

    for (const key of CAMPAIGN_FIELDS) {
      await expect(memodel.campaignField(key)).toHaveValue('');
    }
  });
});
