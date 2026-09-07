/**
 * Checks a parsed Casebook and says what is wrong, in plain words.
 *
 * Only six things are errors, and each one silently breaks something:
 * a missing or unknown `User:`, a case with no `Expected:`, an `After:` that
 * names nothing, a `Seed:` that is not there, and a `Page:` carrying an id
 * from someone's own lab. The parser adds one more: a line it cannot place.
 *
 * Everything else is a warning. A scenario is written by a person and read by
 * an agent, and neither is helped by a tool that refuses the file over taste.
 */

import { distance } from './parse';
import {
  ENVIRONMENTS,
  USERS,
  type Case,
  type Casebook,
  type Diagnostic,
  type Field,
  type FieldKey,
  type Item,
  type Severity,
  type ValidateOptions,
} from './types';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const TEST_ID = /^[a-z0-9]+(?:-[a-z0-9]+){2,}$/;
const SMART_QUOTES = /[“”‘’]/;
const PLACEHOLDER = /\b(?:xxx+|todo|tbd|fixme|lorem)\b|\?\?\?/i;
const LAUNCHES = /\b(?:launch|launches|generate|generates)\b/i;
const BEFORE = /\b(?:as|than) before\b|\bbefore\b/i;
const NOTES = /^note\b/i;
const VAGUE = /\b(?:works|correctly|properly|as expected|fine|ok)\b/i;
const LEAK = /\b(?:css|xpath|selectors?|localStorage|sessionStorage|data-testid|endpoint|xhr)\b/i;
const SELECTOR_CHARS = /[>[\]#]/;
const HOSTS = new Set([
  'openbraininstitute.org',
  'www.openbraininstitute.org',
  'staging.openbraininstitute.org',
  'localhost',
]);

const MAX_STEPS = 10;

type Report = (
  severity: Severity,
  rule: string,
  line: number,
  message: string,
  rest?: Partial<Diagnostic>
) => void;

export const USER_VALUES = Object.keys(USERS);

export function normalizeUser(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

/**
 * Where a `Seed:` points. A bare name sits beside the scenario, which is how
 * every scenario keeps its own; anything with a slash is a path as written,
 * from the repository root.
 */
export function seedLocation(value: string, scenarioFile: string): string | null {
  const name = value.trim();
  if (name === '') return null;
  if (name.includes('/')) return name.replace(/^\.\//, '');

  const folder = scenarioFile.replace(/[/\\][^/\\]+$/, '');
  return folder === scenarioFile ? name : `${folder}/${name}`;
}

function field(owner: { fields: Field[] }, key: FieldKey): Field | undefined {
  return owner.fields.find((f) => f.key === key);
}

/** The case's field, or the file's. */
function resolve(casebook: Casebook, testCase: Case, key: FieldKey): Field | undefined {
  return field(testCase, key) ?? field(casebook, key);
}

function quotedStrings(text: string): string[] {
  return [...text.matchAll(/"([^"]*)"/g)].map((m) => m[1] ?? '');
}

export async function checkCasebook(
  casebook: Casebook,
  options: ValidateOptions = {}
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const file = casebook.file;
  const report: Report = (severity, rule, line, message, rest = {}) =>
    out.push({ rule, severity, file, line, message, ...rest });
  const error = (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) =>
    report('error', rule, line, message, rest);
  const warn = (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) =>
    report('warning', rule, line, message, rest);

  if (casebook.legacy) return out;

  if (casebook.cases.length === 0) {
    warn('no-cases', casebook.title === null ? 1 : 2, 'The file has no test case.', {
      expected: 'at least one "## " heading with Expected under it',
      fix: 'add "## <what the test checks>" and its sections',
    });
  }

  checkFields(casebook.fields, report);
  await checkSeed(field(casebook, 'Seed'), file, options, error);

  const titles = new Map<string, Case>();

  for (const [index, testCase] of casebook.cases.entries()) {
    const key = testCase.title.trim().toLowerCase();
    const earlier = titles.get(key);
    if (earlier === undefined) titles.set(key, testCase);
    else {
      warn('duplicate-case', testCase.line, 'Two cases in this file have the same name.', {
        found: testCase.title,
        expected: `a name no other case uses (the first is on line ${earlier.line})`,
        fix: 'rename one of them',
      });
    }

    checkFields(testCase.fields, report);
    await checkSeed(field(testCase, 'Seed'), file, options, error);

    // --- who runs it: a case with no User never runs, and nothing warns ---
    const user = resolve(casebook, testCase, 'User');
    if (user === undefined) {
      error('no-user', testCase.line, 'This case does not say who runs it.', {
        expected: `User: ${USER_VALUES.slice(0, 3).join(' | ')} …`,
        fix: 'write "User: authenticated" under the file title, or under this case',
        why: 'a case with no User never runs, and nothing else warns you',
      });
    }
    const userValue = user === undefined ? null : normalizeUser(user.value);

    const onlyOn = resolve(casebook, testCase, 'Only on');
    const seed = resolve(casebook, testCase, 'Seed');
    if (onlyOn !== undefined && seed !== undefined) {
      warn(
        'only-on-with-seed',
        onlyOn.line,
        'A seeded workflow usually says where it runs in the seed file.',
        {
          found: `Only on: ${onlyOn.value}`,
          fix: 'delete this line and set "env" in the seed file',
        }
      );
    }

    const forEach = field(testCase, 'For each');
    if (forEach !== undefined && /\bseed\b/i.test(forEach.value) && seed === undefined) {
      warn('for-each-without-seed', forEach.line, '"For each" names the seed, but none is set.', {
        fix: 'add "Seed: <file>" under the file title or under this case',
      });
    }

    // --- After: naming a case that is not there ---
    const after = field(testCase, 'After');
    if (after !== undefined) {
      const wanted = after.value.trim().toLowerCase();
      const target = titles.get(wanted);
      const later = casebook.cases
        .slice(index)
        .find((c) => c.title.trim().toLowerCase() === wanted);

      if (later === testCase) {
        error('self-after', after.line, 'A case cannot come after itself.', {
          fix: 'name a different case, or delete this line',
        });
      } else if (target === undefined && later !== undefined) {
        error('forward-after', after.line, '"After" must name a case written above this one.', {
          found: after.value,
          fix: `move "## ${later.title}" above "## ${testCase.title}"`,
        });
      } else if (target === undefined) {
        error('unknown-after', after.line, '"After" names a case that is not in this file.', {
          found: after.value,
          expected: casebook.cases
            .slice(0, index)
            .map((c) => c.title)
            .join(' | '),
          fix: 'copy the exact title of the case it follows',
        });
      }
    }

    // --- sections ---
    const sections = testCase.sections;
    const steps = sections.filter((s) => s.kind === 'Steps');
    const expected = sections.filter((s) => s.kind === 'Expected');
    const lastLine = lastLineOf(testCase);

    if (expected.length === 0) {
      error('no-expected', lastLine, 'This case checks nothing.', {
        expected: 'an "Expected:" section',
        fix: 'add "Expected:" and dash each thing that must be true',
        why: 'a test with no check passes for ever',
      });
    }
    if (steps.length === 0 && expected.length > 0) {
      warn('no-steps', lastLine, 'This case only looks; it does nothing.', {
        fix: 'add "Steps:" if the user does something, or leave it as it is',
      });
    }
    for (const section of sections) {
      if (section.items.length === 0) {
        warn('empty-section', section.line, `${section.kind} has no lines under it.`, {
          fix:
            section.kind === 'Expected'
              ? 'add "- <what must be true>"'
              : 'add "1. <what the user does>"',
        });
      }
    }

    const stepCount = steps.reduce((n, s) => n + s.items.length, 0);
    if (stepCount > MAX_STEPS) {
      warn('too-many-steps', steps[0]?.line ?? testCase.line, `This case has ${stepCount} steps.`, {
        expected: `${MAX_STEPS} or fewer`,
        fix: 'split it into two cases, the second one starting with "After:"',
        why: 'one case checks one thing',
      });
    }

    // --- the lines themselves ---
    const actions = sections.filter((s) => s.kind !== 'Expected').flatMap((s) => s.items);
    const results = expected.flatMap((s) => s.items);
    const noted = hasNote(casebook, testCase, new Set());

    for (const item of [...actions, ...results]) checkItemText(item, warn);

    for (const item of actions) {
      if (LAUNCHES.test(item.text) && userValue !== null && userValue !== 'credits') {
        warn(
          'launch-without-credits',
          item.line,
          'This step launches something, but the User is not the one that spends credits.',
          {
            found: item.text,
            fix: 'write "User: credits"',
            why: 'otherwise the test runs before the credit check, and fails when the lab is empty',
          }
        );
      }
    }

    for (const item of results) {
      if (BEFORE.test(item.text) && !noted) {
        warn(
          'before-without-note',
          item.line,
          'This compares with "before", but nothing was noted.',
          {
            found: item.text,
            fix: 'add a step "Note the <thing>" earlier, then write "the same as noted" here',
            why: 'without it the test has to guess which number you mean',
          }
        );
      }
      if (VAGUE.test(item.text) && quotedStrings(item.text).length === 0 && !/\d/.test(item.text)) {
        warn('vague-expected', item.line, 'This result is hard to check as written.', {
          found: item.text,
          fix: 'say what is on screen, in quotes, or give a number',
        });
      }
    }
  }

  return out;
}

function lastLineOf(testCase: Case): number {
  const last = testCase.sections.at(-1);
  return last?.items.at(-1)?.line ?? last?.line ?? testCase.line;
}

/** Whether the case, or a case it comes after, has a "Note …" step. */
function hasNote(casebook: Casebook, testCase: Case, seen: Set<Case>): boolean {
  if (seen.has(testCase)) return false;
  seen.add(testCase);

  const own = testCase.sections
    .filter((s) => s.kind !== 'Expected')
    .some((s) => s.items.some((i) => NOTES.test(i.text)));
  if (own) return true;

  const after = field(testCase, 'After');
  if (after === undefined) return false;

  const target = casebook.cases.find(
    (c) => c.title.trim().toLowerCase() === after.value.trim().toLowerCase()
  );
  return target === undefined ? false : hasNote(casebook, target, seen);
}

function checkItemText(
  item: Item,
  warn: (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) => void
): void {
  const { text, line } = item;

  if (SMART_QUOTES.test(text)) {
    warn('smart-quotes', line, 'This line has curly quotes, which do not match the screen.', {
      found: text,
      fix: 'replace “ ” ‘ ’ with " and \'',
      why: 'curly quotes usually come from pasting out of Word or a chat',
    });
  }

  if ((text.match(/"/g) ?? []).length % 2 === 1) {
    warn('unbalanced-quotes', line, 'A quote is opened and never closed.', {
      found: text,
      fix: 'put a " on both sides of the exact text on screen',
    });
  }

  if (PLACEHOLDER.test(text)) {
    warn('placeholder', line, 'This looks like placeholder text, not something a user sees.', {
      found: text,
      fix: 'open the page, copy the real words, paste them here',
      why: 'it is copied into the test as-is',
    });
  }

  for (const quoted of quotedStrings(text)) {
    if (UUID.test(quoted) || TEST_ID.test(quoted)) {
      warn(
        'id-in-quotes',
        line,
        'This quoted value looks like an id from the code, not words on screen.',
        {
          found: `"${quoted}"`,
          fix: 'replace it with the label the user reads',
          why: 'ids differ between staging and production',
        }
      );
    }
  }

  if (LEAK.test(text)) {
    warn('implementation-leak', line, 'This says how the page is built, not what a user sees.', {
      found: text,
      fix: 'describe the thing by the words on it',
    });
  }
}

function checkFields(fields: Field[], report: Report): void {
  const seen = new Set<FieldKey>();

  for (const f of fields) {
    if (seen.has(f.key)) {
      report('warning', 'duplicate-field', f.line, `"${f.key}:" is written twice here.`, {
        fix: 'keep one',
      });
    }
    seen.add(f.key);

    if (SMART_QUOTES.test(f.value)) {
      report('warning', 'smart-quotes', f.line, 'This line has curly quotes.', {
        found: `${f.key}: ${f.value}`,
        fix: 'replace “ ” ‘ ’ with " and \'',
      });
    }

    switch (f.key) {
      case 'User': {
        const value = normalizeUser(f.value);
        if (!(value in USERS)) {
          report(
            'error',
            'bad-user',
            f.line,
            `"${f.value}" is not a kind of user the tests know.`,
            {
              expected: USER_VALUES.join(' | '),
              fix: `write "User: ${nearestUser(value)}"`,
              why: 'the value picks which signed-in account runs the test',
            }
          );
        }
        break;
      }
      case 'Only on': {
        const value = f.value.trim().toLowerCase();
        if (!(ENVIRONMENTS as readonly string[]).includes(value)) {
          report('warning', 'bad-only-on', f.line, `"${f.value}" is not a deployment.`, {
            expected: ENVIRONMENTS.join(' | '),
            fix: 'write one of them, or delete the line to run on both',
          });
        }
        break;
      }
      case 'Page':
        checkPage(f, report);
        break;
      case 'Seed':
        if (!/\.json$/i.test(f.value.trim())) {
          report('warning', 'bad-seed', f.line, 'A seed is usually a .json file.', {
            found: f.value,
            fix: 'write the file name, such as "Seed: build-synaptome.json"',
          });
        }
        break;
      case 'After':
      case 'For each':
        break;
    }
  }
}

function nearestUser(value: string): string {
  let best = USER_VALUES[0] ?? 'authenticated';
  let bestScore = Number.POSITIVE_INFINITY;
  for (const known of USER_VALUES) {
    const score = distance(value, known);
    if (score < bestScore) {
      best = known;
      bestScore = score;
    }
  }
  return best;
}

function checkPage(f: Field, report: Report): void {
  const value = f.value.trim();

  // The one Page error: an id from the author's own lab is wrong every run.
  if (UUID.test(value)) {
    report('error', 'bad-page', f.line, 'This page holds an id that belongs to your lab.', {
      found: value,
      fix: `write "Page: ${value.replace(UUID, '{lab}').replace(UUID, '{project}')}"`,
      why: 'the run creates its own lab and project, so a pasted id is wrong every time',
    });
    return;
  }

  if (SELECTOR_CHARS.test(value) && !/^https?:\/\//i.test(value)) {
    report('warning', 'bad-page', f.line, 'Page is a place to start, not a way to find a thing.', {
      found: value,
      fix: 'write a path such as "/data/morphologies", or a URL, or leave the line out',
    });
    return;
  }

  if (/^https?:\/\//i.test(value)) {
    let host: string;
    try {
      host = new URL(value).hostname;
    } catch {
      report('warning', 'bad-page', f.line, 'This URL cannot be read.', { found: value });
      return;
    }
    if (!HOSTS.has(host)) {
      report('warning', 'bad-page', f.line, `"${host}" is not a host the tests run against.`, {
        found: value,
        expected: [...HOSTS].join(' | '),
        fix: 'paste the path only, starting with "/"',
      });
    }
  }
}

async function checkSeed(
  seed: Field | undefined,
  scenarioFile: string,
  options: ValidateOptions,
  error: (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) => void
): Promise<void> {
  if (seed === undefined || options.seeds === false) return;

  const where = seedLocation(seed.value, scenarioFile);
  if (where === null) return;

  if (!(await Bun.file(where).exists())) {
    error('seed-not-found', seed.line, `There is no "${where}".`, {
      found: seed.value,
      fix: seed.value.includes('/')
        ? 'check the path, or add the file'
        : 'name a file sitting beside this scenario, usually "seed.json"',
    });
  }
}
