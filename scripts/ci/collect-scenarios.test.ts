/**
 * Runs the collector against a throwaway tree, because what it has to get right
 * is the file system: which scenario covers a spec, and where both land.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const SCRIPT = path.resolve(import.meta.dir, 'collect-scenarios.ts');

let root: string;

function write(file: string, body: string): void {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
}

/** One failing spec and one passing one, in the shape Playwright writes. */
function results(specs: { file: string; failed: boolean }[]): string {
  return JSON.stringify({
    suites: specs.map((spec) => ({
      title: path.basename(spec.file),
      file: spec.file,
      suites: [
        {
          title: 'A feature',
          specs: [
            {
              title: spec.failed ? 'breaks' : 'works',
              file: spec.file,
              line: 10,
              tests: [
                {
                  status: spec.failed ? 'unexpected' : 'expected',
                  projectName: 'staging',
                  results: [
                    {
                      status: spec.failed ? 'failed' : 'passed',
                      duration: 1000,
                      ...(spec.failed ? { error: { message: 'boom' } } : {}),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })),
  });
}

async function run(): Promise<void> {
  const proc = Bun.spawn(['bun', SCRIPT, 'results.json', 'report'], {
    cwd: root,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  await proc.exited;
}

const readIndex = (): Record<string, string> =>
  JSON.parse(fs.readFileSync(path.join(root, 'report/scenarios.json'), 'utf8'));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'collect-scenarios-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('collect-scenarios', () => {
  test('copies the scenario of a failing spec and indexes it', async () => {
    const spec = 'scenarios/workflows/simulate/simulate.spec.ts';
    write('scenarios/workflows/simulate/scenario.md', '# Simulate\n');
    write('results.json', results([{ file: spec, failed: true }]));

    await run();

    expect(
      fs.readFileSync(path.join(root, 'report/scenarios/workflows/simulate/scenario.md'), 'utf8')
    ).toBe('# Simulate\n');
    expect(readIndex()).toEqual({ [spec]: 'scenarios/workflows/simulate/scenario.md' });
  });

  test('falls back to the nearest scenario above the spec', async () => {
    const spec = 'scenarios/data/listings/deep/deep.spec.ts';
    write('scenarios/data/listings/scenario.md', '# Listings\n');
    write('results.json', results([{ file: spec, failed: true }]));

    await run();

    expect(readIndex()).toEqual({ [spec]: 'scenarios/data/listings/scenario.md' });
  });

  test('two specs under one scenario both point at it, and it is copied once', async () => {
    const first = 'scenarios/data/listings/one.spec.ts';
    const second = 'scenarios/data/listings/two.spec.ts';
    write('scenarios/data/listings/scenario.md', '# Listings\n');
    write(
      'results.json',
      results([
        { file: first, failed: true },
        { file: second, failed: true },
      ])
    );

    await run();

    expect(readIndex()).toEqual({
      [first]: 'scenarios/data/listings/scenario.md',
      [second]: 'scenarios/data/listings/scenario.md',
    });
    expect(fs.readdirSync(path.join(root, 'report/scenarios/data/listings'))).toEqual([
      'scenario.md',
    ]);
  });

  test('a passing spec is not collected, so nothing is written at all', async () => {
    write('scenarios/data/listings/scenario.md', '# Listings\n');
    write(
      'results.json',
      results([{ file: 'scenarios/data/listings/one.spec.ts', failed: false }])
    );

    await run();

    expect(fs.existsSync(path.join(root, 'report/scenarios.json'))).toBe(false);
  });

  test('a failing spec with no scenario anywhere above it leaves no index', async () => {
    write('results.json', results([{ file: 'scenarios/orphan/orphan.spec.ts', failed: true }]));

    await run();

    expect(fs.existsSync(path.join(root, 'report/scenarios.json'))).toBe(false);
  });
});
