#!/usr/bin/env bun

/**
 * Records a run.
 *
 * `bun run test:video <scenario folder>` films the scenario's
 * `video-recording.ts` — its whole journey in one test, so one take — into a
 * folder of its own, test-results/videos/<scenario>/<date-time>/<scenario>.mov
 * (`scenarios/workflows/simulate-paired-neurons` →
 * `workflows-simulate-paired-neurons/2026-11-09T16-02-11/workflows-simulate-paired-neurons.mov`).
 * Every run writes only inside its own folder — its clips, its results.json,
 * its report and its film — and deletes nothing else, so two films can be shot
 * at once and an earlier take is never lost. The file declares its pace
 * (`film()` in fixtures/recording); every film is 1920x1080, laid out at the
 * video guide's 1512 wide and scaled up here. `E2E_VIDEO_SIZE=2560x1440`
 * changes the size for one run.
 *
 * Each joined video is re-encoded to H.264 in a .mov, the file the video
 * guide asks to keep, with the ffmpeg on PATH (`brew install ffmpeg`): the one
 * Playwright ships encodes VP8 but cannot decode it. `--format=mp4` puts the
 * same stream in an mp4; `--format=webm` keeps Playwright's file as it is,
 * at the size the page was laid out (1512x850), and needs no ffmpeg.
 * Playwright records at a fixed 1 Mbit/s, so the H.264 carries the same detail
 * in a file QuickTime, Teams and an editor open.
 *
 * With `--project=<name>` it records that project's tests instead, one
 * video.webm per test under <run folder>/tests/<test>/, joined per spec in
 * file order into <run folder>/<spec>.webm
 * (`scenarios/site/footer/footer.spec.ts` → `site-footer-footer.webm`).
 *
 * Usage: bun scripts/video.ts [--format=mov|mp4|webm] [playwright test arguments]
 *        bun scripts/video.ts --join[=<run folder>]   joins a run's videos again, the
 *                                                     latest run's by default; nothing re-runs
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { videoSize } from '@fixtures/recording';

/** Where every run's folder goes. */
const ROOT = 'test-results/videos';
const RESULTS = 'results.json';

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

/**
 * The folder one run writes to: named after the scenario it films, then the
 * time it started, to the second. A run of several scenarios, or of a
 * project, is filed under `run`.
 */
export function runFolder(test: string[], startedAt: Date): string {
  const scenarios = test.filter((arg) => arg.startsWith('scenarios/'));
  const [only] = scenarios;
  const name = scenarios.length === 1 && only ? videoName(only.replace(/\/+$/, '')) : 'run';
  const stamp = startedAt.toISOString().slice(0, 19).replaceAll(':', '-');
  return path.join(ROOT, name, stamp);
}

/** The run folder most recently written: the one `--join` alone picks. */
function latestRun(): string {
  const runs = fs.existsSync(ROOT)
    ? fs
        .readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
        .filter((entry) => path.basename(entry) === RESULTS)
        .map((entry) => path.join(ROOT, path.dirname(entry)))
        .filter((dir) => !dir.includes(`${path.sep}tests${path.sep}`))
    : [];
  const latest = runs.toSorted((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (!latest) throw new Error(`No run to join: no ${RESULTS} under ${ROOT}.`);
  return latest;
}

/** The first is the default: the guide's .mov. */
export const FORMATS = ['mov', 'mp4', 'webm'] as const;
export type Format = (typeof FORMATS)[number];

/** Our own flags, taken out before the rest goes to Playwright. */
export function parseArgs(argv: string[]): {
  format: Format;
  join: boolean | string;
  test: string[];
} {
  let format: Format = FORMATS[0];
  let join: boolean | string = false;
  const test: string[] = [];
  for (const arg of argv) {
    if (arg === '--join') join = true;
    else if (arg.startsWith('--join=')) join = arg.slice('--join='.length);
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
 * H.264 in a mov or an mp4, from a joined webm, scaled to the video size.
 * Lanczos keeps text edges sharp when scaling up; CRF 18 is visually lossless
 * for a screen recording, yuv420p is what every player decodes, and faststart
 * puts the index first so a player starts before the file has downloaded.
 */
function encode(webm: string, format: 'mov' | 'mp4'): string {
  const encoder = Bun.which('ffmpeg');
  if (!encoder) {
    throw new Error(
      `A ${format} needs an ffmpeg with libx264 on PATH (\`brew install ffmpeg\`): ` +
        'the one Playwright ships cannot decode the VP8 it recorded. --format=webm needs none.'
    );
  }
  const out = webm.replace(/\.webm$/, `.${format}`);
  const { width, height } = videoSize();
  const run = Bun.spawnSync(
    [
      encoder,
      '-y',
      '-loglevel',
      'error',
      '-i',
      webm,
      '-vf',
      `scale=${width}:${height}:flags=lanczos`,
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
      out,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  if (run.exitCode !== 0) throw new Error(`ffmpeg could not encode ${webm} as ${format}`);
  fs.rmSync(webm);
  return out;
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
function stitch(format: Format, out: string): void {
  const resultsFile = path.join(out, RESULTS);
  if (!fs.existsSync(resultsFile)) {
    console.log(`\n  video  nothing to join: the run wrote no ${resultsFile}`);
    return;
  }
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')) as Results;
  const bySpec = videosBySpec(results);
  if (bySpec.size === 0) {
    console.log(`\n  video  nothing to join: the run recorded no test (see ${out}/tests)`);
    return;
  }
  for (const [file, videos] of bySpec) {
    const target = path.join(out, `${videoName(file)}.webm`);
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
    const video = format === 'webm' ? target : encode(target, format);
    console.log(`\n  video ${video}  (${videos.length} tests)`);
  }
}

if (import.meta.main) {
  const { format, join, test } = parseArgs(process.argv.slice(2));
  if (join) {
    stitch(format, typeof join === 'string' ? join : latestRun());
    process.exit(0);
  }
  const out = runFolder(test, new Date());
  fs.mkdirSync(out, { recursive: true });
  console.log(`\n  video  this run writes to ${out}\n`);
  const run = Bun.spawnSync(
    [
      'bun',
      '--bun',
      'node_modules/.bin/playwright',
      'test',
      '--output',
      path.join(out, 'tests'),
      ...withProject(test),
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
      env: {
        ...process.env,
        E2E_VIDEO: '1',
        E2E_RESULTS_FILE: path.join(out, RESULTS),
        // The report too, and never opened: a waiting report server would hold the run.
        PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(out, 'report'),
        PLAYWRIGHT_HTML_OPEN: 'never',
      },
    }
  );
  stitch(format, out);
  process.exit(run.exitCode);
}
