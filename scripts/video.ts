#!/usr/bin/env bun

/**
 * Records a run.
 *
 * `bun run test:video <scenario folder>` films the scenario's
 * `video-recording.ts` — its whole journey in one test, so one take — into
 * test-results/videos/<scenario>.webm (`scenarios/workflows/simulate-paired-neurons`
 * → `workflows-simulate-paired-neurons.webm`). The file declares its pace and
 * picture size (`film()` in fixtures/recording.ts); `E2E_VIDEO_SIZE=2560x1440`
 * overrides the size for one run.
 *
 * `--format=mp4` re-encodes each joined video to H.264 with the ffmpeg on
 * PATH (`brew install ffmpeg`): the one Playwright ships encodes VP8 but
 * cannot decode it. Playwright records at a fixed 1 Mbit/s, so the mp4 carries
 * the same detail in a file QuickTime and Teams open.
 *
 * With `--project=<name>` it records that project's tests instead, one
 * video.webm per test under test-results/videos/tests/<test>/, joined per spec
 * in file order into test-results/videos/<spec>.webm
 * (`scenarios/site/footer/footer.spec.ts` → `site-footer-footer.webm`). The
 * top level holds only the joined files. Each run starts from an empty folder.
 *
 * Usage: bun scripts/video.ts [--format=webm|mp4] [playwright test arguments]
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

/**
 * `scenarios/site/footer/footer.spec.ts` → `site-footer-footer`;
 * `scenarios/workflows/simulate-paired-neurons/video-recording.ts` → `workflows-simulate-paired-neurons`.
 */
export function videoName(file: string): string {
  return file
    .replace(/^scenarios\//, '')
    .replace(/\/video-recording\.ts$/, '')
    .replace(/\.spec\.ts$/, '')
    .replaceAll('/', '-');
}

/** The `video` project unless the arguments pick one; it exists only while E2E_VIDEO is set. */
export function withProject(args: string[]): string[] {
  const picked = args.some((arg) => arg === '--project' || arg.startsWith('--project='));
  return picked ? args : ['--project=video', ...args];
}

export const FORMATS = ['webm', 'mp4'] as const;
export type Format = (typeof FORMATS)[number];

/** Our own flags, taken out before the rest goes to Playwright. */
export function parseArgs(argv: string[]): { format: Format; join: boolean; test: string[] } {
  let format: Format = 'webm';
  let join = false;
  const test: string[] = [];
  for (const arg of argv) {
    if (arg === '--join') join = true;
    else if (arg.startsWith('--format=')) {
      const asked = arg.slice('--format='.length);
      if (!FORMATS.includes(asked as Format)) {
        throw new Error(`--format takes ${FORMATS.join(' or ')}, not "${asked}".`);
      }
      format = asked as Format;
    } else test.push(arg);
  }
  return { format, join, test };
}

/**
 * H.264 in an mp4, from a joined webm. CRF 18 is visually lossless for a
 * screen recording, yuv420p is what every player decodes, and faststart puts
 * the index first so a browser plays it while it downloads.
 */
function toMp4(webm: string): string {
  const encoder = Bun.which('ffmpeg');
  if (!encoder) {
    throw new Error(
      'An mp4 needs an ffmpeg with libx264 on PATH (`brew install ffmpeg`): ' +
        'the one Playwright ships cannot decode the VP8 it recorded.'
    );
  }
  const mp4 = webm.replace(/\.webm$/, '.mp4');
  const run = Bun.spawnSync(
    [
      encoder,
      '-y',
      '-loglevel',
      'error',
      '-i',
      webm,
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      mp4,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  if (run.exitCode !== 0) throw new Error(`ffmpeg could not encode ${webm} as mp4`);
  fs.rmSync(webm);
  return mp4;
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
function stitch(format: Format): void {
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
    const video = format === 'mp4' ? toMp4(target) : target;
    console.log(`\n  video ${video}  (${videos.length} tests)`);
  }
}

if (import.meta.main) {
  const { format, join, test } = parseArgs(process.argv.slice(2));
  if (join) {
    stitch(format);
    process.exit(0);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  const run = Bun.spawnSync(
    [
      'bun',
      '--bun',
      'node_modules/.bin/playwright',
      'test',
      '--output',
      TESTS,
      ...withProject(test),
    ],
    { stdio: ['inherit', 'inherit', 'inherit'], env: { ...process.env, E2E_VIDEO: '1' } }
  );
  stitch(format);
  process.exit(run.exitCode);
}
