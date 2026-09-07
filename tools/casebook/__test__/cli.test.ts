import { describe, expect, test } from 'bun:test';

import { parseArgs } from '../validator/cli';
import { formatGithub, formatText, summarize } from '../validator/format';
import { findCasebooks, specFor, validatePaths } from '../validator/index';

const fixtures = `${import.meta.dir}/fixtures`;
const cli = `${import.meta.dir}/../validator/cli.ts`;
const repo = `${import.meta.dir}/../../..`;

function run(...args: string[]) {
  const result = Bun.spawnSync(['bun', cli, ...args], { cwd: repo });
  return { code: result.exitCode, out: result.stdout.toString(), err: result.stderr.toString() };
}

/** The file count out of a summary line like "7 files · 20 cases · 0 errors". */
function fileCount(out: string): number {
  return Number(/(\d+) files?\b/.exec(out)?.[1] ?? -1);
}

describe('parseArgs', () => {
  test('defaults to check, scenarios/, text', () => {
    expect(parseArgs([])).toEqual({
      command: 'check',
      paths: ['scenarios'],
      format: 'text',
      seeds: true,
      help: false,
      passthrough: [],
    });
  });

  test('reads a command and flags in any order', () => {
    expect(parseArgs(['skeleton', 'a', '--no-seeds'])).toMatchObject({
      command: 'skeleton',
      paths: ['a'],
      seeds: false,
    });
    expect(parseArgs(['a.md', '--json'])).toMatchObject({
      paths: ['a.md'],
      format: 'json',
      seeds: true,
    });
  });

  test('a flag it does not know is handed on, for run', () => {
    expect(parseArgs(['run', 'scenarios/site/home', '--headed', '--grep', 'x'])).toMatchObject({
      command: 'run',
      paths: ['scenarios/site/home', 'x'],
      passthrough: ['--headed', '--grep'],
    });
  });
});

describe('findCasebooks', () => {
  test('walks folders for scenario.md and takes .md files as given', async () => {
    const found = await findCasebooks([`${fixtures}/minimal.md`, `${fixtures}/loose.md`]);

    expect(found.files).toContain(`${fixtures}/minimal.md`);
    expect(found.missing).toEqual([]);
    expect(found.empty).toEqual([]);
  });

  test('a path that is not there is named, and one with no scenarios too', async () => {
    const found = await findCasebooks([
      `${fixtures}/nope`,
      `${fixtures}/nope/scenario.md`,
      `${fixtures}/empty`,
    ]);

    expect(found.files).toEqual([]);
    expect(found.missing).toEqual([`${fixtures}/nope`, `${fixtures}/nope/scenario.md`]);
    expect(found.empty).toEqual([`${fixtures}/empty`]);
  });

  test('one feature may hold a scenario folder per set of tests', async () => {
    const found = await findCasebooks([`${fixtures}/nested`]);

    expect(found.files).toEqual([
      `${fixtures}/nested/one/scenario.md`,
      `${fixtures}/nested/two/scenario.md`,
    ]);
    expect(found.empty).toEqual([]);

    // Each folder is its own scenario: its own spec, and its own seed.
    expect(specFor('scenarios/workflows/build-synaptome/viewer')).toBe(
      'scenarios/workflows/build-synaptome/viewer/viewer.spec.ts'
    );

    const results = await validatePaths([`${fixtures}/nested`], { seeds: true });
    expect(results.flatMap((r) => r.diagnostics)).toEqual([]);
  });

  test('the spec is always named after its folder', () => {
    expect(specFor('scenarios/workflows/build-synaptome')).toBe(
      'scenarios/workflows/build-synaptome/build-synaptome.spec.ts'
    );
    expect(specFor('scenarios/site/home/')).toBe('scenarios/site/home/home.spec.ts');
  });
});

describe('formats', () => {
  test('text ends with a tally, and names skipped files', async () => {
    const results = await validatePaths([`${fixtures}/minimal.md`, `${fixtures}/legacy.md`]);
    const text = formatText(results);

    expect(text).toContain('skipped — still a gherkin file');
    expect(text.trim().split('\n').at(-1)).toBe(
      '2 files · 1 case · 0 errors · 0 warnings · 1 skipped (gherkin)'
    );
  });

  test('sums up files, cases, errors and warnings', async () => {
    const results = await validatePaths(
      [`${fixtures}/minimal.md`, `${fixtures}/broken.md`, `${fixtures}/legacy.md`],
      { seeds: false }
    );

    expect(summarize(results)).toMatchObject({ files: 3, skipped: 1, cases: 4 });
    expect(summarize(results).errors).toBeGreaterThan(3);
  });

  test('github lines carry file, line and rule', async () => {
    const results = await validatePaths([`${fixtures}/broken.md`], { seeds: false });
    const [first] = formatGithub(results).split('\n');

    expect(first).toMatch(/^::warning file=.*broken\.md,line=3,title=unknown-field::/);
  });
});

describe('cli', () => {
  test('exits 0 on a good file', () => {
    const { code, out } = run(`${fixtures}/minimal.md`);

    expect(code).toBe(0);
    expect(out.trim()).toBe('1 file · 1 case · 0 errors · 0 warnings');
  });

  test('exits 1 on errors, and says what and where', () => {
    const { code, out } = run(`${fixtures}/broken.md`, '--no-seeds');

    expect(code).toBe(1);
    expect(out).toContain('broken.md:6\n  error no-user');
    expect(out).toContain('Fix:      write "User: authenticated" under the file title');
  });

  test('a file with only warnings exits 0', () => {
    const { code, out } = run(`${fixtures}/loose.md`, '--no-seeds');

    expect(code).toBe(0);
    expect(out).toContain('0 errors');
    expect(out).toContain('warning dashed-in-steps');
  });

  test('--json is machine readable', () => {
    const { code, out } = run(`${fixtures}/minimal.md`, '--json');
    const parsed = JSON.parse(out) as { summary: { errors: number }; files: { cases: string[] }[] };

    expect(code).toBe(0);
    expect(parsed.summary.errors).toBe(0);
    expect(parsed.files[0]?.cases).toEqual(['The close button keeps my search']);
  });

  test('checks one section without touching the rest', () => {
    const section = run('scenarios/workflows');
    const everything = run();

    expect(section.code).toBe(0);
    expect(everything.code).toBe(0);

    // Counted, not spelled out: a new scenario must not fail this.
    expect(fileCount(section.out)).toBeGreaterThan(0);
    expect(fileCount(section.out)).toBeLessThan(fileCount(everything.out));
  });

  test('a path that is not there fails loudly, rather than passing quietly', () => {
    const { code, err } = run('scenarios/nope');

    expect(code).toBe(1);
    expect(err).toContain('casebook: there is no "scenarios/nope"');
    expect(err).toContain('nothing to check');
  });

  test('run on a folder with no spec says to skeleton first', () => {
    const { code, err } = run('run', 'tools/casebook/__test__/fixtures/seeds');

    expect(code).toBe(1);
    expect(err).toContain('run `bun run casebook skeleton');
  });

  test('--help prints usage', () => {
    const { code, out } = run('--help');

    expect(code).toBe(0);
    expect(out).toContain('usage: bun run casebook');
  });
});
