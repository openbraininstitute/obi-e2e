/** The shapes the validator reads and reports. */

export const FIELD_KEYS = ['User', 'Page', 'Seed', 'After', 'For each', 'Only on'] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

/** Fields that only make sense on one case, never on the whole file. */
export const CASE_ONLY_FIELDS: readonly FieldKey[] = ['After', 'For each'];

export const SECTION_KINDS = ['Precondition', 'Steps', 'Expected'] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const ENVIRONMENTS = ['staging', 'production'] as const;

/** What `User:` may say, and the constant in fixtures/tags.ts each one becomes. */
export const USERS: Record<string, string> = {
  visitor: 'VISITOR',
  authenticated: 'AUTHENTICATED',
  credits: 'CREDITS',
  onboarding: 'ONBOARDING',
};

export type Field = { key: FieldKey; value: string; line: number };

/** One step or one expected result. Wrapped lines are already joined. */
export type Item = { text: string; line: number };

export type Section = { kind: SectionKind; line: number; items: Item[] };

export type Case = {
  title: string;
  line: number;
  fields: Field[];
  prose: string[];
  sections: Section[];
};

export type Casebook = {
  file: string;
  title: string | null;
  fields: Field[];
  prose: string[];
  cases: Case[];
  /** True when the file still holds a gherkin block. It is skipped, not checked. */
  legacy: boolean;
};

export type Severity = 'error' | 'warning';

export type Diagnostic = {
  rule: string;
  severity: Severity;
  file: string;
  /** 1-based. 0 means the whole file. */
  line: number;
  message: string;
  found?: string;
  expected?: string;
  fix?: string;
  why?: string;
};

export type ValidateOptions = {
  /** Set false to skip checking that the file a `Seed:` names is really there. */
  seeds?: boolean;
};

export type FileResult = {
  file: string;
  casebook: Casebook;
  diagnostics: Diagnostic[];
};
