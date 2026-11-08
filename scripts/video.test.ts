import { describe, expect, test } from 'bun:test';

import { parseArgs, type Results, videoName, videosBySpec, withProject } from './video';

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
  expect(parseArgs(['--join'])).toEqual({ format: 'webm', join: true, test: [] });
  expect(() => parseArgs(['--format=mov'])).toThrow('webm or mp4');
});
