#!/usr/bin/env bun

/**
 * Records a run.
 *
 * `bun run test:video <spec>` writes one video.webm per test, under
 * test-results/videos/tests/<test>/, then joins each spec's videos, in the
 * order the tests appear in the file, into test-results/videos/<spec>.webm
 * (`scenarios/site/footer/footer.spec.ts` → `site-footer-footer.webm`). The
 * top level holds only the joined files. Each run starts from an empty folder.
 *
 * Usage: bun scripts/video.ts [playwright test arguments]
 *        bun scripts/video.ts --join        joins the last run's videos, nothing re-runs
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const OUT = 'test-results/videos';
const TESTS = `${OUT}/tests`;

type Attachment = { name: string; path?: string };
type Spec = { file: string; tests: { results: { attachments: Attachment[] }[] }[] };
type Suite = { suites?: Suite[]; specs?: Spec[] };
export type Results = { suites: Suite[] };

/** Video paths per spec file, in the order the specs appear in the file. */
export function videosBySpec(results: Results): Map<string, string[]> {
  const videos = new Map<string, string[]>();
  const walk = (suite: Suite): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        for (const result of test.results) {
          for (const attachment of result.attachments) {
            if (attachment.name !== 'video' || !attachment.path) continue;
            const list = videos.get(spec.file) ?? [];
            list.push(attachment.path);
            videos.set(spec.file, list);
          }
        }
      }
    }
    suite.suites?.forEach(walk);
  };
  results.suites.forEach(walk);
  return videos;
}

/** `scenarios/site/footer/footer.spec.ts` → `site-footer-footer`. */
export function videoName(file: string): string {
  return file
    .replace(/^scenarios\//, '')
    .replace(/\.spec\.ts$/, '')
    .replaceAll('/', '-');
}

/** The ffmpeg on PATH, else the one Playwright installed next to its browsers. */
function ffmpeg(): string {
  const onPath = Bun.which('ffmpeg');
  if (onPath) return onPath;
  // ponytail: macOS and Linux cache paths only; Windows keeps it under %LOCALAPPDATA%.
  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    path.join(
      os.homedir(),
      process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright'
    );
  const dir = fs
    .readdirSync(cache)
    .filter((name) => name.startsWith('ffmpeg-'))
    .toSorted()
    .at(-1);
  const bin =
    dir && fs.readdirSync(path.join(cache, dir)).find((name) => name.startsWith('ffmpeg-'));
  if (!dir || !bin) throw new Error('No ffmpeg found. Install one, or run `bun run browsers`.');
  return path.join(cache, dir, bin);
}

/** Joins each spec's videos into one file. All come from one viewport, so a stream copy is enough. */
function stitch(): void {
  const results = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8')) as Results;
  const bySpec = videosBySpec(results);
  if (bySpec.size === 0) {
    console.log(`\n  video  nothing to join: the last run recorded no test (see ${TESTS})`);
    return;
  }
  for (const [file, videos] of bySpec) {
    const target = path.join(OUT, `${videoName(file)}.webm`);
    const list = `${target}.txt`;
    fs.writeFileSync(list, videos.map((video) => `file '${video}'\n`).join(''));
    const run = Bun.spawnSync(
      [
        ffmpeg(),
        '-y',
        '-loglevel',
        'error',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        list,
        '-c',
        'copy',
        target,
      ],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    );
    fs.rmSync(list);
    if (run.exitCode !== 0) throw new Error(`ffmpeg could not join the videos of ${file}`);
    console.log(`\n  video ${target}  (${videos.length} tests)`);
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes('--join')) {
    stitch();
    process.exit(0);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  const run = Bun.spawnSync(
    ['bun', '--bun', 'node_modules/.bin/playwright', 'test', '--output', TESTS, ...args],
    { stdio: ['inherit', 'inherit', 'inherit'], env: { ...process.env, E2E_VIDEO: '1' } }
  );
  stitch();
  process.exit(run.exitCode);
}
