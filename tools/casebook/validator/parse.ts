/**
 * Reads a Casebook file into cases.
 *
 * Two zones. Under a heading, lines are fields or prose until the first
 * section. Inside a section, lines are steps and results.
 *
 * The section decides what a line means, not the mark in front of it: a dash
 * under `Steps:` is still a step. Only a line the parser cannot place at all
 * is an error. Everything else it takes, and says what it would rather see.
 */

import {
  CASE_ONLY_FIELDS,
  FIELD_KEYS,
  type Case,
  type Casebook,
  type Diagnostic,
  type FieldKey,
  type Item,
  type Section,
  type SectionKind,
  type Severity,
} from './types';

const H1 = /^#\s+(.+?)\s*$/;
const H2 = /^##\s+(.+?)\s*$/;
const H_OTHER = /^#{3,}\s/;
const SECTION = /^(Precondition|Steps|Expected):\s*$/;
const FIELD = /^([A-Z][A-Za-z ]{0,20}):\s+(.+?)\s*$/;
const NUMBERED = /^ {0,3}\d+[.)]\s+(.+?)\s*$/;
const DASHED = /^ {0,3}[-*]\s+(.+?)\s*$/;
const CONTINUATION = /^\s{2,}(\S.*?)\s*$/;
const FENCE = /^\s*```/;
const GHERKIN_FENCE = /^\s*```gherkin\b/m;

export type ParseResult = { casebook: Casebook; diagnostics: Diagnostic[] };
type Report = (
  severity: Severity,
  rule: string,
  line: number,
  message: string,
  rest?: Partial<Diagnostic>
) => void;

/** Edit distance, for "did you mean". */
export function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) rows[0]![j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i]![j] = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + cost
      );
    }
  }

  return rows[a.length]![b.length]!;
}

function nearestField(key: string): FieldKey | null {
  const lower = key.toLowerCase();
  let best: { key: FieldKey; score: number } | null = null;

  for (const known of FIELD_KEYS) {
    const score = distance(lower, known.toLowerCase());
    if (best === null || score < best.score) best = { key: known, score };
  }

  return best !== null && best.score <= 2 ? best.key : null;
}

export function parseCasebook(text: string, file: string): ParseResult {
  const diagnostics: Diagnostic[] = [];
  const casebook: Casebook = {
    file,
    title: null,
    fields: [],
    prose: [],
    cases: [],
    legacy: GHERKIN_FENCE.test(text),
  };

  if (casebook.legacy) return { casebook, diagnostics };

  const report: Report = (severity, rule, line, message, rest = {}) => {
    diagnostics.push({ rule, severity, file, line, message, ...rest });
  };
  const error = (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) =>
    report('error', rule, line, message, rest);
  const warn = (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) =>
    report('warning', rule, line, message, rest);

  let current: Case | null = null;
  let section: Section | null = null;
  let lastItem: Item | null = null;
  let inFence = false;
  let sawContent = false;

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = index + 1;
    const trimmed = raw.trim();

    if (FENCE.test(raw)) {
      inFence = !inFence;
      if (section !== null) {
        error('unknown-line', line, 'A code block cannot sit inside a section.', {
          found: trimmed,
          fix: 'Move it above the first section, or delete it.',
        });
      }
      continue;
    }
    if (inFence) continue;

    if (trimmed === '') {
      lastItem = null;
      continue;
    }

    const h1 = H1.exec(raw);
    if (h1 !== null) {
      if (casebook.title !== null) {
        warn('duplicate-title', line, 'A file has one title, and this is a second one.', {
          found: trimmed,
          fix: 'Turn it into a case with "## ", or delete it.',
        });
      } else {
        if (sawContent) {
          warn('title-not-first', line, 'The title usually comes first in the file.', {
            found: trimmed,
            fix: 'Move this line to the top.',
          });
        }
        casebook.title = h1[1] ?? '';
      }
      sawContent = true;
      continue;
    }

    sawContent = true;

    const h2 = H2.exec(raw);
    if (h2 !== null) {
      current = { title: h2[1] ?? '', line, fields: [], prose: [], sections: [] };
      casebook.cases.push(current);
      section = null;
      lastItem = null;
      continue;
    }

    if (H_OTHER.test(raw)) {
      error('unknown-line', line, 'Only "#" for the title and "##" for a case are headings here.', {
        found: trimmed,
        fix: 'Use "## " for a case, or write this as plain text above the first section.',
      });
      continue;
    }

    // ---- inside a section ----
    if (section !== null && current !== null) {
      const heading = SECTION.exec(raw);
      if (heading !== null) {
        section = openSection(current, heading[1] as SectionKind, line, warn);
        lastItem = null;
        continue;
      }

      const numbered = NUMBERED.exec(raw);
      const dashed = numbered === null ? DASHED.exec(raw) : null;
      const item = numbered ?? dashed;

      if (item !== null) {
        const wantsDash = section.kind === 'Expected';
        if (wantsDash && numbered !== null) {
          warn('numbered-in-expected', line, 'Expected results usually read as dashed lines.', {
            found: trimmed,
            fix: `write "- ${numbered[1] ?? ''}"`,
          });
        }
        if (!wantsDash && dashed !== null) {
          warn('dashed-in-steps', line, `${section.kind} lines usually read as numbered.`, {
            found: trimmed,
            fix: `write "1. ${dashed[1] ?? ''}"`,
            why: 'numbers say the order matters, and in a step it does',
          });
        }

        lastItem = { text: item[1] ?? '', line };
        section.items.push(lastItem);
        continue;
      }

      const continuation = CONTINUATION.exec(raw);
      if (continuation !== null) {
        if (lastItem === null) {
          error(
            'orphan-continuation',
            line,
            'This indented line follows nothing it can continue.',
            {
              found: trimmed,
              fix: 'Put it under the step or result it belongs to, or start it with a number or dash.',
            }
          );
          continue;
        }
        lastItem.text += ` ${continuation[1] ?? ''}`;
        continue;
      }

      const late = FIELD.exec(raw);
      if (late !== null) {
        const key = fieldKey(late[1] ?? '');
        if (key !== null) {
          warn('field-after-section', line, 'Fields usually sit under the case title.', {
            found: trimmed,
            fix: `Move this line up, directly under "## ${current.title}".`,
          });
          current.fields.push({ key, value: late[2] ?? '', line });
          continue;
        }
      }

      error(
        'unknown-line',
        line,
        'Inside a section every line is a step, a result, a continuation, or blank.',
        {
          found: trimmed,
          fix:
            section.kind === 'Expected'
              ? `write "- ${trimmed}"`
              : `write "1. ${trimmed}", or move plain text above the first section`,
        }
      );
      continue;
    }

    // ---- under a heading, before the first section ----
    const heading = SECTION.exec(raw);
    if (heading !== null) {
      if (current === null) {
        error('section-outside-case', line, 'A section needs a case above it.', {
          found: trimmed,
          fix: 'Add a "## " heading with the name of this test above the section.',
        });
        continue;
      }
      section = openSection(current, heading[1] as SectionKind, line, warn);
      lastItem = null;
      continue;
    }

    const field = FIELD.exec(raw);
    if (field !== null) {
      const rawKey = field[1] ?? '';
      const value = field[2] ?? '';
      const key = fieldKey(rawKey);

      if (key === null) {
        // Not close to any field. It is prose, such as "Warning: slow page".
        (current ?? casebook).prose.push(trimmed);
        continue;
      }

      if (key !== rawKey) {
        warn('unknown-field', line, `"${rawKey}" is not a field, so this line is ignored.`, {
          found: trimmed,
          expected: FIELD_KEYS.map((k) => `${k}:`).join(', '),
          fix: `write "${key}: ${value}"`,
        });
        continue;
      }

      if (current === null && CASE_ONLY_FIELDS.includes(key)) {
        warn('field-scope', line, `"${key}:" belongs to one case, so this line is ignored.`, {
          found: trimmed,
          fix: 'Move it under the "## " heading of the case it applies to.',
        });
        continue;
      }

      (current ?? casebook).fields.push({ key, value, line });
      continue;
    }

    if (NUMBERED.test(raw) || DASHED.test(raw)) {
      error('item-outside-section', line, 'A step or result needs a section heading above it.', {
        found: trimmed,
        fix: 'Add "Precondition:", "Steps:" or "Expected:" on its own line above.',
      });
      continue;
    }

    (current ?? casebook).prose.push(trimmed);
  }

  if (casebook.title === null) {
    warn('no-title', 1, 'The file has no title.', {
      expected: 'a first line starting with "# "',
      fix: 'write "# <what this file covers>" as the first line',
    });
  }

  return { casebook, diagnostics };
}

function fieldKey(rawKey: string): FieldKey | null {
  return (FIELD_KEYS as readonly string[]).includes(rawKey)
    ? (rawKey as FieldKey)
    : nearestField(rawKey);
}

function openSection(
  owner: Case,
  kind: SectionKind,
  line: number,
  warn: (rule: string, line: number, message: string, rest?: Partial<Diagnostic>) => void
): Section {
  if (kind === 'Precondition') {
    if (owner.sections.some((s) => s.kind === 'Precondition')) {
      warn('duplicate-precondition', line, 'A case usually has one Precondition section.', {
        fix: 'Merge these lines into the first Precondition.',
      });
    } else if (owner.sections.length > 0) {
      warn('precondition-not-first', line, 'Precondition usually comes first.', {
        fix: 'Move this section to the top of the case.',
      });
    }
  }

  const section: Section = { kind, line, items: [] };
  owner.sections.push(section);
  return section;
}
