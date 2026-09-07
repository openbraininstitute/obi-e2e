import { describe, expect, test } from 'bun:test';

import { distance, parseCasebook } from '../validator/parse';

const fixture = (name: string) => Bun.file(`${import.meta.dir}/fixtures/${name}`).text();

describe('parseCasebook', () => {
  test('reads a minimal file into one case with three sections', async () => {
    const { casebook, diagnostics } = parseCasebook(await fixture('minimal.md'), 'minimal.md');

    expect(diagnostics).toEqual([]);
    expect(casebook.title).toBe('Morphology listing');
    expect(casebook.fields).toEqual([{ key: 'User', value: 'authenticated', line: 3 }]);
    expect(casebook.cases).toHaveLength(1);

    const [only] = casebook.cases;
    expect(only?.title).toBe('The close button keeps my search');
    expect(only?.sections.map((s) => s.kind)).toEqual(['Precondition', 'Steps', 'Expected']);
    expect(only?.sections[1]?.items.map((i) => i.text)).toEqual([
      'Search for "Sst-IRES"',
      'Note the result count',
      'Open the first result',
      'Click "Close"',
    ]);
    expect(only?.sections[2]?.items[1]).toEqual({
      text: 'The result count is the same as noted',
      line: 18,
    });
  });

  test('keeps prose above the first section, and joins wrapped lines', async () => {
    const { casebook, diagnostics } = parseCasebook(await fixture('workflow.md'), 'workflow.md');

    expect(diagnostics).toEqual([]);
    expect(casebook.prose).toHaveLength(2);
    expect(casebook.fields.map((f) => f.key)).toEqual(['User', 'Seed']);

    const generate = casebook.cases[1];
    expect(generate?.fields.map((f) => `${f.key}: ${f.value}`)).toEqual([
      'After: The form is not launchable until it is complete',
      'For each: configuration in the seed',
    ]);
    expect(generate?.sections[1]?.items[2]?.text).toBe(
      'Its inputs are exactly: "obi_one_coordinate.json"'
    );
  });

  test('lets Steps and Expected repeat inside one case', async () => {
    const { casebook } = parseCasebook(await fixture('workflow.md'), 'workflow.md');
    const launch = casebook.cases[2];

    expect(launch?.sections.map((s) => s.kind)).toEqual(['Steps', 'Expected', 'Steps', 'Expected']);
  });

  test('a case can override a file-level field', async () => {
    const { casebook } = parseCasebook(await fixture('workflow.md'), 'workflow.md');
    const viewer = casebook.cases[3];

    expect(viewer?.fields.find((f) => f.key === 'User')?.value).toBe('authenticated');
  });

  test('a gherkin file is legacy and is not parsed', async () => {
    const { casebook, diagnostics } = parseCasebook(await fixture('legacy.md'), 'legacy.md');

    expect(casebook.legacy).toBe(true);
    expect(casebook.cases).toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  test('the section decides what a line is, whatever mark it carries', async () => {
    const { casebook, diagnostics } = parseCasebook(await fixture('loose.md'), 'loose.md');
    const [only] = casebook.cases;

    expect(diagnostics.every((d) => d.severity === 'warning')).toBe(true);
    expect(only?.sections.map((s) => s.kind)).toEqual(['Precondition', 'Steps', 'Expected']);
    expect(only?.sections[1]?.items.map((i) => i.text)).toEqual([
      'Search for "Sst-IRES"',
      'Click "Close"',
    ]);
    expect(only?.sections[2]?.items.map((i) => i.text)).toEqual([
      'The search box still contains "Sst-IRES"',
    ]);
  });

  test('a field written after a section is still kept, with a warning', async () => {
    const { casebook, diagnostics } = parseCasebook(await fixture('loose.md'), 'loose.md');

    expect(casebook.cases[0]?.fields).toEqual([
      { key: 'Page', value: '/data/morphologies', line: 15 },
    ]);
    expect(diagnostics.filter((d) => d.rule === 'field-after-section')).toHaveLength(1);
  });

  test('a typo, a stray title and a missing title are warnings, not errors', () => {
    const typo = parseCasebook('# T\n\nUsers: authenticated\n', 't.md').diagnostics;
    expect(typo[0]).toMatchObject({ rule: 'unknown-field', severity: 'warning' });

    const missing = parseCasebook('## C\n\nExpected:\n- Done "x"\n', 't.md').diagnostics;
    expect(missing[0]).toMatchObject({ rule: 'no-title', severity: 'warning' });
  });

  test('names every line it cannot place', async () => {
    const { diagnostics } = parseCasebook(await fixture('broken.md'), 'broken.md');
    const at = (rule: string) => diagnostics.filter((d) => d.rule === rule).map((d) => d.line);

    expect(at('unknown-field')).toEqual([3]);
    expect(at('dashed-in-steps')).toEqual([9]);
    expect(at('unknown-line')).toEqual([11]);
    expect(at('numbered-in-expected')).toEqual([14]);
  });

  test('a typo in a field says which field was meant', () => {
    const { diagnostics } = parseCasebook('# T\n\nUsers: authenticated\n', 't.md');

    expect(diagnostics[0]).toMatchObject({
      rule: 'unknown-field',
      line: 3,
      fix: 'write "User: authenticated"',
    });
  });

  test('a sentence with a colon that is not near any field is prose', () => {
    const { casebook, diagnostics } = parseCasebook('# T\n\nWarning: this page is slow\n', 't.md');

    expect(diagnostics).toEqual([]);
    expect(casebook.prose).toEqual(['Warning: this page is slow']);
  });

  test('a field after a section is an error, not a step', () => {
    const text = '# T\n\n## C\n\nSteps:\n1. Go\nAfter: Other\n';
    const { diagnostics } = parseCasebook(text, 't.md');

    expect(diagnostics).toEqual([
      expect.objectContaining({ rule: 'field-after-section', line: 7 }),
    ]);
  });

  test('After and For each cannot sit on the whole file', () => {
    const { diagnostics } = parseCasebook('# T\n\nAfter: X\n', 't.md');

    expect(diagnostics).toEqual([expect.objectContaining({ rule: 'field-scope', line: 3 })]);
  });

  test('a step above any section is caught', () => {
    const { diagnostics } = parseCasebook('# T\n\n## C\n\n1. Go\n', 't.md');

    expect(diagnostics).toEqual([
      expect.objectContaining({ rule: 'item-outside-section', line: 5 }),
    ]);
  });

  test('a section with no case above it is caught', () => {
    const { diagnostics } = parseCasebook('# T\n\nSteps:\n1. Go\n', 't.md');

    expect(diagnostics.map((d) => d.rule)).toEqual([
      'section-outside-case',
      'item-outside-section',
    ]);
  });

  test('Precondition must be the first section, and there is one of it', () => {
    const text =
      '# T\n\n## C\n\nSteps:\n1. Go\n\nPrecondition:\n1. Here\n\nPrecondition:\n1. There\n';
    const { diagnostics } = parseCasebook(text, 't.md');

    expect(diagnostics.map((d) => [d.rule, d.line])).toEqual([
      ['precondition-not-first', 8],
      ['duplicate-precondition', 11],
    ]);
  });

  test('an indented line with nothing above it is an orphan', () => {
    const text = '# T\n\n## C\n\nExpected:\n\n    "alone"\n';
    const { diagnostics } = parseCasebook(text, 't.md');

    expect(diagnostics).toEqual([
      expect.objectContaining({ rule: 'orphan-continuation', line: 7 }),
    ]);
  });

  test('a missing title is reported on line 1', () => {
    const { diagnostics } = parseCasebook('## C\n\nSteps:\n1. Go\n', 't.md');

    expect(diagnostics).toEqual([expect.objectContaining({ rule: 'no-title', line: 1 })]);
  });

  test('a second title is a duplicate', () => {
    const { diagnostics } = parseCasebook('# A\n\n# B\n', 't.md');

    expect(diagnostics).toEqual([expect.objectContaining({ rule: 'duplicate-title', line: 3 })]);
  });

  test('windows line endings are fine', () => {
    const { casebook, diagnostics } = parseCasebook('# T\r\n\r\nUser: visitor\r\n', 't.md');

    expect(diagnostics).toEqual([]);
    expect(casebook.fields[0]?.value).toBe('visitor');
  });
});

describe('distance', () => {
  test('counts edits', () => {
    expect(distance('user', 'users')).toBe(1);
    expect(distance('seed', 'seed')).toBe(0);
    expect(distance('onlyon', 'only on')).toBe(1);
    expect(distance('page', 'after')).toBeGreaterThan(2);
  });
});
