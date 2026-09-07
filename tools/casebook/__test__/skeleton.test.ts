import { describe, expect, test } from 'bun:test';

import { parseCasebook } from '../validator/parse';
import { skeleton } from '../validator/skeleton';
import { scanSpec } from '../validator/spec-scan';

const SCENARIO = `# Viewer

User: authenticated

## Turn the axon on and off

Steps:
1. Open the viewer settings

Expected:
- The axon toggle is off

## Add a zoom slider

User: credits

Precondition:
1. On the viewer

Expected:
- There is no zoom slider
`;

const book = () => parseCasebook(SCENARIO, 'scenarios/site/viewer/scenario.md').casebook;

describe('skeleton', () => {
  test('a fresh spec: one describe named after the file, one fixme per case, English as comments', () => {
    const { text, added, kept, orphans } = skeleton(book(), null, 'viewer.spec.ts');

    expect(added).toEqual(['Turn the axon on and off', 'Add a zoom slider']);
    expect(kept).toEqual([]);
    expect(orphans).toEqual([]);

    expect(text).toContain("import { AUTHENTICATED, CREDITS } from '@fixtures/tags';");
    expect(text).toContain("import { test } from '@fixtures/test';");
    expect(text).toContain("test.describe('Viewer', () => {");
    expect(text).toContain(
      "test.fixme('Turn the axon on and off', { tag: AUTHENTICATED }, async () => {"
    );
    expect(text).toContain('    // Step: Open the viewer settings');
    expect(text).toContain('    // Expect: The axon toggle is off');
    expect(text).toContain("test.fixme('Add a zoom slider', { tag: CREDITS }, async () => {");
    expect(text).toContain('    // Precondition: On the viewer');
  });

  test('what it writes reads back as tests with those titles', () => {
    const { text } = skeleton(book(), null, 'viewer.spec.ts');
    const scan = scanSpec(text, 'viewer.spec.ts');

    expect(scan.describes.map((d) => d.title)).toEqual(['Viewer']);
    expect(scan.tests.map((t) => t.title)).toEqual([
      'Turn the axon on and off',
      'Add a zoom slider',
    ]);
  });

  test('an existing spec keeps its tests and gains only the missing case', () => {
    const existing = `import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

test.describe('Viewer', () => {
  test('Turn the axon on and off', { tag: AUTHENTICATED }, async ({ page }) => {
    await expect(page).toBeVisible();
  });
});
`;

    const { text, added, kept, orphans } = skeleton(book(), existing, 'viewer.spec.ts');

    expect(added).toEqual(['Add a zoom slider']);
    expect(kept).toEqual(['Turn the axon on and off']);
    expect(orphans).toEqual([]);
    expect(text).toContain('await expect(page).toBeVisible();');
    expect(text).toContain("import { AUTHENTICATED, CREDITS } from '@fixtures/tags';");
    expect(scanSpec(text, 'x').tests.map((t) => t.title)).toEqual([
      'Turn the axon on and off',
      'Add a zoom slider',
    ]);
    expect(scanSpec(text, 'x').describes).toHaveLength(1);
  });

  test('a test whose title matches no case is reported, never deleted', () => {
    const existing = `import { AUTHENTICATED, CREDITS } from '@fixtures/tags';
import { test } from '@fixtures/test';

test.describe('Viewer', () => {
  test('Turn the axon on and off', { tag: AUTHENTICATED }, async () => {});
  test('Add a zoom slider', { tag: CREDITS }, async () => {});
  test('An old test nobody asked for', { tag: AUTHENTICATED }, async () => {});
});
`;

    const { text, added, orphans } = skeleton(book(), existing, 'viewer.spec.ts');

    expect(added).toEqual([]);
    expect(orphans).toEqual(['An old test nobody asked for']);
    expect(text).toBe(existing);
  });

  test('a spec with no describe for this file gets one appended', () => {
    const existing = `import { test } from '@fixtures/test';\n\ntest('unrelated', async () => {});\n`;

    const { text } = skeleton(book(), existing, 'viewer.spec.ts');

    expect(text).toContain("test('unrelated', async () => {});");
    expect(text).toContain("test.describe('Viewer', () => {");
    expect(text.startsWith("import { AUTHENTICATED, CREDITS } from '@fixtures/tags';")).toBe(true);
  });

  test('running it twice changes nothing', () => {
    const once = skeleton(book(), null, 'viewer.spec.ts').text;
    const twice = skeleton(book(), once, 'viewer.spec.ts');

    expect(twice.text).toBe(once);
    expect(twice.added).toEqual([]);
  });

  test('a quote in a title is escaped', () => {
    const { casebook } = parseCasebook(
      "# T\n\nUser: visitor\n\n## It's fine\n\nExpected:\n- ok\n",
      't.md'
    );
    const { text } = skeleton(casebook, null, 't.spec.ts');

    expect(text).toContain("test.fixme('It\\'s fine'");
    expect(scanSpec(text, 't').tests.map((t) => t.title)).toEqual(["It's fine"]);
  });
});

const WORKFLOW = `# Synaptome build

User: credits
Seed: build-synaptome.json

## The form will not launch until it is complete

Expected:
- "Generate build(s)" is disabled

## Generate a build campaign

After: The form will not launch until it is complete
For each: configuration in the seed

Steps:
1. Fill the form from the seed

Expected:
- The results tab is enabled
`;

describe('skeleton, the workflow shapes', () => {
  const workflow = () =>
    parseCasebook(WORKFLOW, 'scenarios/workflows/build-synaptome/scenario.md').casebook;

  test('After comes through as the first comment', () => {
    const { text } = skeleton(workflow(), null, 'x.spec.ts');

    expect(text).toContain('// After: The form will not launch until it is complete\n');
    expect(text.indexOf('// After:')).toBeLessThan(text.indexOf('// Step: Fill the form'));
  });

  test('For each over a seed becomes the loop this repo writes, and imports what it needs', () => {
    const { text } = skeleton(workflow(), null, 'x.spec.ts');

    expect(text).toContain("import { loadSeed } from '@fixtures/scan-config';");
    expect(text).toContain('for (const configuration of loadSeed(import.meta.dir).cases) {');
    expect(text).toContain(
      'test.fixme(`Generate a build campaign: ${configuration.name}`, { tag: CREDITS }, async () => {'
    );
  });

  test('a looped test reads back under its case title, so the skeleton stays idempotent', () => {
    const once = skeleton(workflow(), null, 'x.spec.ts').text;

    expect(scanSpec(once, 'x').tests.map((t) => t.title)).toEqual([
      'The form will not launch until it is complete',
      'Generate a build campaign',
    ]);
    expect(skeleton(workflow(), once, 'x.spec.ts').added).toEqual([]);
  });

  test('growing a spec that already imports from scan-config merges, never duplicates', () => {
    const existing = `import { loadSeed, notDeployedHere } from '@fixtures/scan-config';
import { CREDITS } from '@fixtures/tags';
import { test } from '@fixtures/test';

test.describe('Synaptome build', () => {
  test('The form will not launch until it is complete', { tag: CREDITS }, async () => {});
});
`;
    const { text, added } = skeleton(workflow(), existing, 'x.spec.ts');

    expect(added).toEqual(['Generate a build campaign']);
    expect(text.match(/from '@fixtures\/scan-config'/g)).toHaveLength(1);
    expect(text).toContain("import { loadSeed, notDeployedHere } from '@fixtures/scan-config';");
  });
});

describe('scanSpec', () => {
  test('reads describes, test titles of every kind, and the tag import', () => {
    const spec = `import { AUTHENTICATED, VISITOR } from '@fixtures/tags';
test.describe.configure({ mode: 'serial' });
test.describe('Group', () => {
  test('a', async () => {});
  test.skip('b', async () => {});
  test.fixme('c', async () => {});
  test.only('d', async () => {});
  test.skip(true, 'not a test');
});
`;
    const scan = scanSpec(spec, 'x.spec.ts');

    expect(scan.parsed).toBe(true);
    expect(scan.describes.map((d) => d.title)).toEqual(['Group']);
    expect(scan.tests).toEqual([
      { title: 'a', fixme: false },
      { title: 'b', fixme: false },
      { title: 'c', fixme: true },
      { title: 'd', fixme: false },
    ]);
    expect(scan.imports['@fixtures/tags']?.names).toEqual(['AUTHENTICATED', 'VISITOR']);
  });

  test('a spec that does not parse says so', () => {
    expect(scanSpec('test(  {{{', 'x.spec.ts').parsed).toBe(false);
  });
});
