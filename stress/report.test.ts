import { describe, expect, test } from 'bun:test';

import { EXPERIMENTS, gridSize } from './experiments';
import {
  duration,
  normalise,
  peakConcurrent,
  percentile,
  renderReport,
  type Results,
} from './report';

describe('stress', () => {
  test('each experiment writes the number of simulations the handout says', () => {
    for (const e of Object.values(EXPERIMENTS)) {
      expect(gridSize(e.config('circuit', 'pop'))).toBe(e.simulations);
    }
  });

  test('percentile and peak concurrency', () => {
    expect(percentile([5, 1, 3, 2, 4], 50)).toBe(3);
    expect(percentile([], 95)).toBeUndefined();
    // Rounded once: 4 min 59.6 s is "5 min", never "4 min 60 s".
    expect(duration(299_600)).toBe('5 min');
    expect(duration(147_000)).toBe('2 min 27 s');
    expect(normalise('Job 01a1ea74-a1ac-7278-8135-38d2dae922c0 failed at 17:01:38')).toBe(
      'Job <id> failed at <time>'
    );
    // Two overlap, the third starts as the first ends: peak is 2, not 3.
    expect(
      peakConcurrent([
        { from: 0, to: 10 },
        { from: 5, to: 15 },
        { from: 10, to: 20 },
      ]).peak
    ).toBe(2);
  });

  test('the report says what happened in plain words', () => {
    const t = 1_000_000;
    const results: Results = {
      runId: 'r',
      env: 'staging',
      users: 2,
      experiments: [1],
      rampSeconds: 0,
      startedAt: t,
      endedAt: t + 600_000,
      projectId: 'p',
      calls: [
        {
          at: t,
          phase: 'launch',
          service: 'obi-one',
          ms: 300,
          status: 500,
          ok: false,
          error: 'boom',
        },
      ],
      students: [
        {
          user: 1,
          startedAt: t,
          experiments: [{ experiment: 1, generateMs: 4000, launchMs: 900 }],
        },
      ],
      simulations: [
        {
          user: 1,
          experiment: 1,
          jobId: 'j1',
          launchedAt: t,
          runningAt: t + 60_000,
          endedAt: t + 180_000,
          outcome: 'done',
          statuses: [],
        },
        { user: 2, experiment: 1, outcome: 'refused', error: 'launch: 500 boom', statuses: [] },
      ],
      cloud: [],
      insights: [],
      scaling: [],
      notChecked: ['x'],
      machines: [{ at: t, desired: 1, inService: 1, pending: 0, terminating: 0 }],
      containers: [
        {
          taskArn: 'a',
          jobId: 'j1',
          createdAt: t + 5_000,
          startedAt: t + 60_000,
          stoppingAt: t + 170_000,
          stoppedAt: t + 171_000,
          exitCode: 0,
        },
      ],
    };
    const md = renderReport(results);
    expect(md).toContain('1 of 2 simulations worked; 1 failed.');
    expect(md).toContain('created 1 container for 1 launched simulation');
    expect(md).toContain('1× obi-one launch → 500: boom');
  });
});
