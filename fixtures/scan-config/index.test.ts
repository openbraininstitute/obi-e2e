import { expect, test } from 'bun:test';

import { loadSeed, notDeployedHere, parseScanConfigFixture, seedFolders } from './index';

test('every scan-config fixture has a valid envelope', () => {
  const files = seedFolders();
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const fixture = loadSeed(file);
    expect(fixture.name).not.toBe('');
    expect(fixture.cases.length).toBeGreaterThan(0);

    for (const configuration of fixture.cases) {
      expect(configuration.name).not.toBe('');
      expect(configuration.expect.coordinateCount).toBeGreaterThan(0);
      expect(Object.keys(configuration.config).length).toBeGreaterThan(0);
    }
  }
});

test('a fixture naming an unknown activity is rejected', () => {
  expect(() => parseScanConfigFixture({ activity: 'imagine' }, 'bad.json')).toThrow(/activity/);
});

test('a single selection takes exactly one entity', () => {
  const fixture = {
    name: 'two entities, one slot',
    activity: 'build',
    env: ['staging'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a', 'b'] },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1 } }],
  };

  expect(() => parseScanConfigFixture(fixture, 'bad.json')).toThrow(/exactly one entity/);
});

test('a coordinate count below one is rejected', () => {
  const fixture = {
    name: 'no coordinates',
    activity: 'build',
    env: ['staging'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [{ name: 'none', config: { info: {} }, expect: { coordinateCount: 0 } }],
  };

  expect(() => parseScanConfigFixture(fixture, 'bad.json')).toThrow(/coordinateCount/);
});

test('a fixture still using a single config is rejected with a pointer', () => {
  const fixture = {
    name: 'the old shape',
    activity: 'build',
    env: ['staging'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    config: { info: {} },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1 } }],
  };

  expect(() => parseScanConfigFixture(fixture, 'old.json')).toThrow(/config moved inside cases/);
});

test('a fixture that declares no env at all is rejected', () => {
  const fixture = {
    name: 'nowhere',
    activity: 'build',
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1 } }],
  };

  expect(() => parseScanConfigFixture(fixture, 'bad.json')).toThrow(/env must be a list/);
});

test('an empty env is allowed, and means the fixture runs nowhere', () => {
  const fixture = {
    name: 'not ready',
    activity: 'build',
    env: [],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1 } }],
  };

  const parsed = parseScanConfigFixture(fixture, 'ok.json');
  expect(parsed.env).toEqual([]);
  expect(notDeployedHere(parsed)).toContain('no deployment yet');
});

test('a fixture naming a deployment that does not exist is rejected', () => {
  const fixture = {
    name: 'somewhere else',
    activity: 'build',
    env: ['staging', 'sandbox'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1 } }],
  };

  expect(() => parseScanConfigFixture(fixture, 'bad.json')).toThrow(/env\[1\]/);
});

function fixtureWithCompleted(completed: unknown) {
  return {
    name: 'one shape for every view',
    activity: 'build',
    env: ['staging'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [{ name: 'one', config: { info: {} }, expect: { coordinateCount: 1, completed } }],
  };
}

test('a view is either the text a pane shows or the properties a card reads out', () => {
  const parsed = parseScanConfigFixture(
    fixtureWithCompleted({
      inputs: [],
      outputs: ['spikes.h5', 'E2E synaptome build'],
      views: {
        'spikes.h5': ['PopulationAll'],
        'E2E synaptome build': { 'Number of synapses': '1' },
      },
    }),
    'ok.json'
  );

  const views = parsed.cases[0]?.expect.completed?.views;
  expect(views?.['spikes.h5']).toEqual(['PopulationAll']);
  expect(views?.['E2E synaptome build']).toEqual({ 'Number of synapses': '1' });
});

test('a card view with no properties is rejected', () => {
  expect(() =>
    parseScanConfigFixture(
      fixtureWithCompleted({ inputs: [], outputs: ['built'], views: { built: {} } }),
      'bad.json'
    )
  ).toThrow(/at least one property/);
});

test('a fixture still naming a built entity is rejected with a pointer', () => {
  const fixture = {
    name: 'the old shape',
    activity: 'build',
    env: ['staging'],
    workflow: { label: 'Synaptome', type: 'build-synaptome-campaign' },
    schemaName: 'MEModelSynapticModelPlacementScanConfig',
    selection: { mode: 'single', entities: ['a'] },
    cases: [
      {
        name: 'one',
        config: { info: {} },
        expect: { coordinateCount: 1, built: { name: 'x', properties: { Scale: 'Single' } } },
      },
    ],
  };

  expect(() => parseScanConfigFixture(fixture, 'old.json')).toThrow(/built moved into/);
});

test('a case can mark itself slow', () => {
  const fixture = fixtureWithCompleted({ inputs: [], outputs: [] });
  const parsed = parseScanConfigFixture(
    { ...fixture, cases: [{ ...fixture.cases[0], slow: true }] },
    'ok.json'
  );

  expect(parsed.cases[0]?.slow).toBe(true);
});

test('a slow flag that is not a boolean is rejected', () => {
  const fixture = fixtureWithCompleted({ inputs: [], outputs: [] });

  expect(() =>
    parseScanConfigFixture(
      { ...fixture, cases: [{ ...fixture.cases[0], slow: 'yes' }] },
      'bad.json'
    )
  ).toThrow(/slow must be true or false/);
});

test('a completed run can name the minutes it is given', () => {
  const parsed = parseScanConfigFixture(
    fixtureWithCompleted({ inputs: [], outputs: [], within: 30 }),
    'ok.json'
  );

  expect(parsed.cases[0]?.expect.completed?.within).toBe(30);
});

test('a budget that is not a positive number of minutes is rejected', () => {
  expect(() =>
    parseScanConfigFixture(fixtureWithCompleted({ inputs: [], outputs: [], within: 0 }), 'bad.json')
  ).toThrow(/within must be the number of minutes/);
});
