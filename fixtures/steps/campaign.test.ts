import { expect, test } from 'bun:test';

import type { ScanConfigCase } from '../scan-config';
import { campaignTags, campaignTimeout, replayHeaders } from './campaign';

function caseWith(options: { followed?: boolean; slow?: boolean } = {}): ScanConfigCase {
  return {
    name: 'one',
    ...(options.slow ? { slow: true } : {}),
    config: { info: {} },
    expect: {
      coordinateCount: 1,
      ...(options.followed ? { completed: { inputs: [], outputs: [] } } : {}),
    },
  };
}

test('an ordinary case runs in the nightly suite', () => {
  expect(campaignTags(caseWith({ followed: true }))).not.toContain('@slow');
});

test('a case its seed marks slow sits out the nightly suite', () => {
  expect(campaignTags(caseWith({ followed: true, slow: true }))).toContain('@slow');
});

test('a scenario gets the clock its slowest case needs', () => {
  const quick = { cases: [caseWith({ followed: true })] } as Parameters<typeof campaignTimeout>[0];
  const slow = {
    cases: [caseWith({ followed: true }), caseWith({ followed: true, slow: true })],
  } as Parameters<typeof campaignTimeout>[0];

  expect(campaignTimeout(quick)).toBe((5 + 3) * 60_000);
  expect(campaignTimeout(slow)).toBe((240 + 3) * 60_000);
});

test('a case that names its own budget gets that clock instead', () => {
  const timed = caseWith({ followed: true, slow: true });
  timed.expect.completed = { inputs: [], outputs: [], within: 30 };

  const fixture = { cases: [timed] } as Parameters<typeof campaignTimeout>[0];

  expect(campaignTimeout(fixture)).toBe((30 + 3) * 60_000);
});

test('a replay carries what the app set on the call and nothing of the browser', () => {
  const headers = replayHeaders({
    authorization: 'Bearer x',
    'content-type': 'application/json',
    'virtual-lab-id': 'lab',
    'project-id': 'project',
    origin: 'https://main.preview.openbraininstitute.org',
    referer: 'https://main.preview.openbraininstitute.org/app',
    'user-agent': 'Mozilla/5.0',
    'sec-fetch-mode': 'cors',
  });

  expect(Object.keys(headers).toSorted()).toEqual([
    'authorization',
    'content-type',
    'project-id',
    'virtual-lab-id',
  ]);
});
