import { describe, expect, test } from 'bun:test';

import { parseArgs, type Results, runFolder, videoName, videosBySpec, withProject } from './video';

const spec = (file: string, ...videos: (string | undefined)[]) => ({
  file,
  tests: videos.map((video) => ({
    results: [
      {
        attachments: video
          ? [
              { name: 'trace', path: `${video}.zip` },
              { name: 'video', path: video },
            ]
          : [{ name: 'video' }],
      },
    ],
  })),
});

describe('videosBySpec', () => {
  test('keeps file order, groups by spec, skips tests without a video file', () => {
    const results: Results = {
      suites: [
        { specs: [spec('setup/auth.setup.ts', undefined)] },
        {
          suites: [
            { specs: [spec('scenarios/a/a.spec.ts', 'a1.webm', 'a2.webm')] },
            { specs: [spec('scenarios/b/b.spec.ts', 'b1.webm')] },
          ],
        },
      ],
    };
    expect([...videosBySpec(results)]).toEqual([
      ['scenarios/a/a.spec.ts', ['a1.webm', 'a2.webm']],
      ['scenarios/b/b.spec.ts', ['b1.webm']],
    ]);
  });
});

test('videoName flattens the scenario path', () => {
  expect(videoName('scenarios/site/footer/footer.spec.ts')).toBe('site-footer-footer');
  expect(videoName('scenarios/workflows/simulate-paired-neurons/video-recording.ts')).toBe(
    'workflows-simulate-paired-neurons'
  );
});

test('withProject records the journey unless a project is named', () => {
  expect(withProject(['scenarios/x'])).toEqual(['--project=video', 'scenarios/x']);
  expect(withProject(['--project=credits', 'a.spec.ts'])).toEqual([
    '--project=credits',
    'a.spec.ts',
  ]);
  expect(withProject(['--project', 'slow'])).toEqual(['--project', 'slow']);
});

test('parseArgs keeps our flags and passes the rest to Playwright', () => {
  expect(parseArgs(['--format=mp4', 'scenarios/x', '--headed'])).toEqual({
    format: 'mp4',
    join: false,
    test: ['scenarios/x', '--headed'],
  });
  expect(parseArgs(['--join'])).toEqual({ format: 'mov', join: true, test: [] });
  expect(parseArgs(['--join=test-results/videos/x/1'])).toEqual({
    format: 'mov',
    join: 'test-results/videos/x/1',
    test: [],
  });
  expect(() => parseArgs(['--format=avi'])).toThrow('mov or mp4 or webm');
});

test('runFolder gives each run its own folder, by scenario and start time', () => {
  const at = new Date('2026-11-09T16:02:11.345Z');
  expect(runFolder(['scenarios/workflows/simulate-whole-brain-male-cns/'], at)).toBe(
    'test-results/videos/workflows-simulate-whole-brain-male-cns/2026-11-09T16-02-11'
  );
  expect(runFolder(['--project=credits', 'scenarios/a', 'scenarios/b'], at)).toBe(
    'test-results/videos/run/2026-11-09T16-02-11'
  );
  // A second run a second later never lands in the first one's folder.
  expect(runFolder(['scenarios/a'], new Date(at.getTime() + 1000))).not.toBe(
    runFolder(['scenarios/a'], at)
  );
});
