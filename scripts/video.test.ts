import { describe, expect, test } from 'bun:test';

import { type Results, videoName, videosBySpec } from './video';

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
});
