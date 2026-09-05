/**
 * Writes the shape of a spec from a scenario, so the generator fills in code
 * rather than inventing structure.
 *
 * One `test.describe` per file, named after it. One test per case, titled
 * exactly as the case: the title is what ties a test to its case, so a rename
 * on either side shows up as a test with no case, or a case with no test.
 *
 * A case with no test comes in as `test.fixme`, with its English as comments.
 * `After:` is carried as a comment. `For each:` over the seed becomes the loop
 * this repo already writes, reading the seed beside the spec, with the case
 * title as the prefix of each test's title. Tests already there are never
 * touched.
 */

import { scanSpec, type SpecScan } from './spec-scan';
import { USERS, type Case, type Casebook } from './types';

export type Skeleton = {
  text: string;
  /** Cases stubbed in this run. */
  added: string[];
  /** Cases that already had a test. */
  kept: string[];
  /** Tests whose title matches no case: renamed, or removed from the scenario. */
  orphans: string[];
};

const TAGS = '@fixtures/tags';
const TEST = '@fixtures/test';
const SCAN_CONFIG = '@fixtures/scan-config';

function field(casebook: Casebook, testCase: Case, key: string): string | undefined {
  const own =
    testCase.fields.find((f) => f.key === key) ?? casebook.fields.find((f) => f.key === key);
  return own?.value.trim();
}

function tagFor(casebook: Casebook, testCase: Case): string {
  const value = (field(casebook, testCase, 'User') ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ');
  return USERS[value] ?? 'PRIVATE_READONLY';
}

function quote(text: string): string {
  return `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

/** `For each: configuration in the seed` → the name to loop under. */
function loopOf(casebook: Casebook, testCase: Case): { variable: string } | null {
  const forEach = testCase.fields.find((f) => f.key === 'For each')?.value;
  const seed = field(casebook, testCase, 'Seed');
  if (forEach === undefined || seed === undefined || !/\bseed\b/i.test(forEach)) return null;

  const variable = (forEach.trim().split(/\s+/)[0] ?? 'configuration').replaceAll(/\W/g, '');
  return { variable: variable || 'configuration' };
}

function stub(casebook: Casebook, testCase: Case): string {
  const loop = loopOf(casebook, testCase);
  const indent = loop === null ? '  ' : '    ';
  const inner = `${indent}  `;
  const tag = tagFor(casebook, testCase);

  const after = testCase.fields.find((f) => f.key === 'After');
  const notes = [
    ...(after === undefined ? [] : [`${inner}// After: ${after.value}`]),
    ...testCase.sections.flatMap((section) => {
      const label =
        section.kind === 'Steps' ? 'Step' : section.kind === 'Expected' ? 'Expect' : 'Precondition';
      return section.items.map((item) => `${inner}// ${label}: ${item.text}`);
    }),
  ];

  if (loop === null) {
    return [
      `${indent}test.fixme(${quote(testCase.title)}, { tag: ${tag} }, async () => {`,
      ...notes,
      `${indent}});`,
    ].join('\n');
  }

  const title = `\`${testCase.title.replaceAll('`', '\\`')}: \${${loop.variable}.name}\``;
  return [
    `  for (const ${loop.variable} of loadSeed(import.meta.dir).cases) {`,
    `${indent}test.fixme(${title}, { tag: ${tag} }, async () => {`,
    ...notes,
    `${indent}});`,
    '  }',
  ].join('\n');
}

/** What the stubs import, by module. */
function importsFor(casebook: Casebook, cases: Case[]): Record<string, string[]> {
  const needed: Record<string, Set<string>> = { [TAGS]: new Set(), [TEST]: new Set(['test']) };
  for (const c of cases) {
    needed[TAGS]!.add(tagFor(casebook, c));
    if (loopOf(casebook, c) !== null) {
      needed[SCAN_CONFIG] ??= new Set();
      needed[SCAN_CONFIG].add('loadSeed');
    }
  }
  return Object.fromEntries(Object.entries(needed).map(([m, names]) => [m, [...names].toSorted()]));
}

/** The text with one more named import from `module`, merged into an existing line when there is one. */
function ensureImport(text: string, scan: SpecScan, module: string, names: string[]): string {
  const have = scan.imports[module];
  if (have === undefined) return `import { ${names.join(', ')} } from '${module}';\n${text}`;

  const merged = [...new Set([...have.names, ...names])].toSorted();
  if (merged.length === have.names.length) return text;
  return `${text.slice(0, have.start)}import { ${merged.join(', ')} } from '${module}';${text.slice(have.end)}`;
}

export function skeleton(casebook: Casebook, existing: string | null, specFile: string): Skeleton {
  const title = casebook.title ?? 'Scenario';

  if (existing === null || existing.trim() === '') {
    const header = Object.entries(importsFor(casebook, casebook.cases))
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([module, names]) => `import { ${names.join(', ')} } from '${module}';`);
    const text = [
      ...header,
      '',
      `test.describe(${quote(title)}, () => {`,
      casebook.cases.map((c) => stub(casebook, c)).join('\n\n'),
      '});',
      '',
    ].join('\n');
    return { text, added: casebook.cases.map((c) => c.title), kept: [], orphans: [] };
  }

  const scan = scanSpec(existing, specFile);
  if (!scan.parsed) throw new Error(`${specFile} does not parse; fix it before adding to it`);

  const have = new Set(scan.tests.map((t) => t.title));
  const missing = casebook.cases.filter((c) => !have.has(c.title));
  const kept = casebook.cases.filter((c) => have.has(c.title)).map((c) => c.title);
  const wanted = new Set(casebook.cases.map((c) => c.title));
  const orphans = scan.tests.map((t) => t.title).filter((t) => !wanted.has(t));

  if (missing.length === 0) return { text: existing, added: [], kept, orphans };

  let text = existing;
  for (const [module, names] of Object.entries(importsFor(casebook, missing))) {
    // Re-scan each time: an added import moves every offset below it.
    text = ensureImport(text, scanSpec(text, specFile), module, names);
  }

  const describe = scanSpec(text, specFile).describes.find((d) => d.title === title);
  const stubs = missing.map((c) => stub(casebook, c)).join('\n\n');

  if (describe !== undefined) {
    const at = describe.bodyEnd - 1; // just before the closing brace of the describe body
    text = `${text.slice(0, at).trimEnd()}\n\n${stubs}\n${text.slice(at)}`;
  } else {
    text = `${text.trimEnd()}\n\ntest.describe(${quote(title)}, () => {\n${stubs}\n});\n`;
  }

  return { text, added: missing.map((c) => c.title), kept, orphans };
}
