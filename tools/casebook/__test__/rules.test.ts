import { describe, expect, test } from 'bun:test';

import { parseCasebook } from '../validator/parse';
import { checkCasebook, normalizeUser, seedLocation, USER_VALUES } from '../validator/rules';
import type { Diagnostic } from '../validator/types';

const fixtures = `${import.meta.dir}/fixtures`;
const fixture = (name: string) => Bun.file(`${fixtures}/${name}`).text();

/** Seeds are only looked for when a test is about them. */
async function check(text: string, file = 't.md', seeds = false): Promise<Diagnostic[]> {
  const { casebook } = parseCasebook(text, file);
  return checkCasebook(casebook, { seeds });
}

const rules = (diagnostics: Diagnostic[]) => diagnostics.map((d) => d.rule);
const at = (diagnostics: Diagnostic[], rule: string) =>
  diagnostics.filter((d) => d.rule === rule).map((d) => d.line);

describe('checkCasebook', () => {
  test('only six rules are errors; the rest are warnings', async () => {
    const found = await check(await fixture('broken.md'));
    const errors = [...new Set(found.filter((d) => d.severity === 'error').map((d) => d.rule))];

    expect(errors.toSorted()).toEqual(['bad-page', 'no-expected', 'no-user']);
    expect(found.filter((d) => d.severity === 'warning').length).toBeGreaterThan(5);
  });

  test('a good file has nothing to say', async () => {
    expect(await check(await fixture('minimal.md'))).toEqual([]);
    expect(await check(await fixture('public.md'))).toEqual([]);
    expect(await check(await fixture('workflow.md'), `${fixtures}/workflow.md`, true)).toEqual([]);
  });

  test('a legacy file is skipped', async () => {
    expect(await check(await fixture('legacy.md'))).toEqual([]);
  });

  test('every case needs a User', async () => {
    const found = await check('# T\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n');

    expect(found).toEqual([
      expect.objectContaining({ rule: 'no-user', line: 3, severity: 'error' }),
    ]);
  });

  test('User must be one of the seven', async () => {
    const found = await check(
      '# T\n\nUser: admin\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );

    expect(found).toEqual([
      expect.objectContaining({ rule: 'bad-user', line: 3, expected: USER_VALUES.join(' | ') }),
    ]);
  });

  test('User is read loosely and compared strictly', async () => {
    expect(normalizeUser('  Credits  ')).toBe('credits');

    const found = await check(
      '# T\n\nUser: Credits\n\n## C\n\nSteps:\n1. Launch it\n\nExpected:\n- Done "x"\n'
    );
    expect(found).toEqual([]);
  });

  test('a bad User suggests the nearest good one', async () => {
    const found = await check(
      '# T\n\nUser: authenticted\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );

    expect(found[0]?.fix).toBe('write "User: authenticated"');
  });

  test('a launch under a user who does not spend credits is flagged', async () => {
    const found = await check(
      '# T\n\nUser: authenticated\n\n## C\n\nSteps:\n1. Press "Launch builds"\n\nExpected:\n- Done "x"\n'
    );

    expect(found).toEqual([
      expect.objectContaining({
        rule: 'launch-without-credits',
        severity: 'warning',
        line: 8,
        fix: 'write "User: credits"',
      }),
    ]);
  });

  test('Steps and Expected are both required, and not empty', async () => {
    const noSteps = await check('# T\n\nUser: visitor\n\n## C\n\nExpected:\n- Done "x"\n');
    expect(rules(noSteps)).toEqual(['no-steps']);

    const noExpected = await check('# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Go\n');
    expect(rules(noExpected)).toEqual(['no-expected']);

    const empty = await check('# T\n\nUser: visitor\n\n## C\n\nSteps:\n\nExpected:\n- Done "x"\n');
    expect(empty).toEqual([expect.objectContaining({ rule: 'empty-section', line: 7 })]);
  });

  test('Only on takes a deployment name', async () => {
    const found = await check(
      '# T\n\nUser: visitor\nOnly on: everywhere\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );

    expect(found).toEqual([expect.objectContaining({ rule: 'bad-only-on', line: 4 })]);
  });

  test('Only on and Seed do not both say where a test runs', async () => {
    const found = await check(
      '# T\n\nUser: visitor\nSeed: a.json\nOnly on: staging\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );

    expect(rules(found)).toEqual(['only-on-with-seed']);
  });

  test('a Seed may be a bare name or a path', () => {
    const scenario = 'scenarios/workflows/build-synaptome/scenario.md';

    expect(seedLocation('seed.json', scenario)).toBe(
      'scenarios/workflows/build-synaptome/seed.json'
    );
    expect(seedLocation('  seed.json  ', scenario)).toBe(
      'scenarios/workflows/build-synaptome/seed.json'
    );
    expect(seedLocation('elsewhere/scan.json', scenario)).toBe('elsewhere/scan.json');
    expect(seedLocation('./elsewhere/scan.json', scenario)).toBe('elsewhere/scan.json');
    expect(seedLocation('seed.json', 'scenario.md')).toBe('seed.json');
    expect(seedLocation('   ', scenario)).toBeNull();
  });

  test('a Seed given as a path is found where the path says', async () => {
    const body = '\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n';

    const asPath = await check(
      `# T\n\nUser: visitor\nSeed: ${fixtures}/seed.json${body}`,
      't.md',
      true
    );
    expect(asPath).toEqual([]);

    const wrongPath = await check(
      `# T\n\nUser: visitor\nSeed: ${fixtures}/nope.json${body}`,
      't.md',
      true
    );
    expect(wrongPath).toEqual([
      expect.objectContaining({ rule: 'seed-not-found', severity: 'error' }),
    ]);
  });

  test('a bare Seed is looked for beside the scenario', async () => {
    const good = await check(
      '# T\n\nUser: visitor\nSeed: seed.json\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n',
      `${fixtures}/t.md`,
      true
    );
    expect(good).toEqual([]);

    const missing = await check(
      '# T\n\nUser: visitor\nSeed: nope.json\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n',
      `${fixtures}/t.md`,
      true
    );
    expect(missing).toEqual([expect.objectContaining({ rule: 'seed-not-found', line: 4 })]);

    const notJson = await check(
      '# T\n\nUser: visitor\nSeed: build-synaptome\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );
    expect(rules(notJson)).toEqual(['bad-seed']);
  });

  test('For each that names the seed needs a Seed', async () => {
    const found = await check(
      '# T\n\nUser: visitor\n\n## C\n\nFor each: configuration in the seed\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n'
    );

    expect(found).toEqual([expect.objectContaining({ rule: 'for-each-without-seed', line: 7 })]);
  });

  test('After must name a case above, and not itself', async () => {
    const found = await check(await fixture('chain.md'));

    expect(found.map((d) => [d.rule, d.line])).toEqual([
      ['forward-after', 7],
      ['unknown-after', 17],
      ['self-after', 27],
    ]);
  });

  test('two cases cannot share a name', async () => {
    const found = await check(await fixture('broken.md'));

    expect(at(found, 'duplicate-case')).toEqual([23]);
  });

  test('Page rejects pasted lab ids and selectors, and unknown hosts', async () => {
    const body = '\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Done "x"\n';
    const uuid = '6f3a1c2e-9b21-4d5e-8f70-1a2b3c4d5e6f';

    const pasted = await check(
      `# T\n\nUser: visitor\nPage: /app/virtual-lab/${uuid}/${uuid}/data${body}`
    );
    expect(pasted).toEqual([
      expect.objectContaining({
        rule: 'bad-page',
        fix: 'write "Page: /app/virtual-lab/{lab}/{project}/data"',
      }),
    ]);

    const selector = await check(`# T\n\nUser: visitor\nPage: div > [data-testid=x]${body}`);
    expect(rules(selector)).toEqual(['bad-page']);

    const host = await check(`# T\n\nUser: visitor\nPage: https://example.com/data${body}`);
    expect(host[0]?.message).toBe('"example.com" is not a host the tests run against.');

    const fine = await check(`# T\n\nUser: visitor\nPage: /data/morphologies${body}`);
    expect(fine).toEqual([]);
  });

  test('quotes must be straight and balanced', async () => {
    const curly = await check(
      '# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Click “Close”\n\nExpected:\n- Done "x"\n'
    );
    expect(curly).toEqual([expect.objectContaining({ rule: 'smart-quotes', line: 8 })]);

    const open = await check(
      '# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Shows "Login\n'
    );
    expect(open).toEqual([expect.objectContaining({ rule: 'unbalanced-quotes', line: 11 })]);
  });

  test('placeholders, ids and vague results are warnings', async () => {
    const found = await check(await fixture('broken.md'));

    expect(at(found, 'placeholder')).toEqual([15]);
    expect(at(found, 'before-without-note')).toEqual([16]);
    expect(at(found, 'vague-expected')).toEqual([17]);
    expect(found.find((d) => d.line === 15)?.severity).toBe('warning');

    const id = await check(
      '# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- Shows "scan-config-coordinate-c1a2dcf5-c0fd-4c3e-b0d5-d9b5efd3948f"\n'
    );
    expect(rules(id)).toEqual(['id-in-quotes']);
  });

  test('"before" is fine once something was noted, even in the case it comes after', async () => {
    const own = await check(
      '# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Note the count\n2. Search\n\nExpected:\n- The count is the same as before\n'
    );
    expect(own).toEqual([]);

    const chained = await check(
      '# T\n\nUser: visitor\n\n## A\n\nSteps:\n1. Note the count\n\nExpected:\n- Done "x"\n\n## B\n\nAfter: A\n\nSteps:\n1. Search\n\nExpected:\n- The count is fewer than before\n'
    );
    expect(chained).toEqual([]);
  });

  test('more than ten steps is a warning', async () => {
    const steps = Array.from({ length: 11 }, (_, i) => `${i + 1}. Step ${i + 1}`).join('\n');
    const found = await check(
      `# T\n\nUser: visitor\n\n## C\n\nSteps:\n${steps}\n\nExpected:\n- Done "x"\n`
    );

    expect(found).toEqual([
      expect.objectContaining({ rule: 'too-many-steps', severity: 'warning' }),
    ]);
  });

  test('a file with no case is reported', async () => {
    const found = await check('# T\n\nUser: visitor\n');

    expect(found).toEqual([expect.objectContaining({ rule: 'no-cases' })]);
  });

  test('implementation words are warnings', async () => {
    const found = await check(
      '# T\n\nUser: visitor\n\n## C\n\nSteps:\n1. Go\n\nExpected:\n- The css class is "x"\n'
    );

    expect(rules(found)).toEqual(['implementation-leak']);
  });
});
