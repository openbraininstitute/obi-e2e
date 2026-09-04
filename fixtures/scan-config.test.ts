import { expect, test } from 'bun:test';

import {
  loadScanConfigFixture,
  notDeployedHere,
  parseScanConfigFixture,
  scanConfigFixtureFiles,
} from './scan-config';

test('every scan-config fixture has a valid envelope', () => {
  const files = scanConfigFixtureFiles();
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const fixture = loadScanConfigFixture(file);
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
