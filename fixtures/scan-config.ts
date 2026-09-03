import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * A scan-configuration fixture is one case for the form behind every
 * `/workflows/{activity}/configure/{type}` route.
 *
 * `config` is exactly the object the application posts to obi-one, so the same
 * file can drive the browser and, later, an API-level check. Everything else in
 * the envelope is only what a test needs to open the right editor and to know
 * what a user should see.
 *
 * Fixtures never contain credentials. An entity id belongs here only when the
 * QA project owns that entity; otherwise the fixture names the entity and the
 * test resolves it at run time.
 */
export type ScanConfigFixture = {
  name: string;
  activity: ScanConfigActivity;
  /** How the workflow is reached from the workflows hub. */
  workflow: {
    /** Visible name of the type card, for example `Synaptome`. Used in messages. */
    label: string;
    /** Kebab-case campaign type: both the card's test id and the configure URL. */
    type: string;
  };
  /** obi-one schema component name, used to resolve titles from `openapi.json`. */
  schemaName: string;
  /** Entities the `/new` browse step selects before the editor opens. */
  selection: ScanConfigSelection;
  /** What a deployment must have before the workflow is offered at all. */
  requires?: {
    /** An experimental feature that is off by default outside local and preview. */
    featureFlag?: string;
  };
  /**
   * One workflow can be configured several ways, and each is worth its own run.
   * Every case becomes a test of its own, so they run in parallel and a failure
   * names the configuration that broke.
   */
  cases: ScanConfigCase[];
};

export type ScanConfigCase = {
  /** Names the test. Short, and says what makes this configuration different. */
  name: string;
  /** The configuration itself, keyed by root element. */
  config: Record<string, unknown>;
  /** Only what a user can see or count. */
  expect: {
    /** Size of the campaign grid: one coordinate per combination of swept values. */
    coordinateCount: number;
    /** Exact text on the button that launches the campaign. */
    submitLabel: string;
    /** The files a coordinate carries the moment its campaign is generated. */
    generated?: ScanConfigFiles;
    /** The files it carries once the run has finished. */
    completed?: ScanConfigFiles;
    /** The entity the finished run registered, as its preview shows it. */
    built?: ScanConfigBuiltEntity;
  };
};

/**
 * What the right-hand pane shows for the entity a run produced. The properties
 * are label and value as a user reads them, so a build that starts producing a
 * different shape of thing fails here.
 */
export type ScanConfigBuiltEntity = {
  name: string;
  properties: Record<string, string>;
};

/** Which of the two tabs above the browse table the entities live under. */
export type ScanConfigScope = 'public' | 'project';

/**
 * The exact files a coordinate lists, by the name the panel shows. Both lists
 * are complete: a file the application starts or stops producing fails here
 * rather than passing unnoticed. Only names seen on a real run belong here, so
 * a workflow that has never been run through leaves them out.
 */
export type ScanConfigFiles = {
  inputs: string[];
  outputs: string[];
};

type SelectionBase = {
  /** Defaults to `public`, which is the tab the browse step opens on. */
  scope?: ScanConfigScope;
};

export type ScanConfigSelection =
  /** One entity, chosen from a table and confirmed with `Use model`. */
  | (SelectionBase & { mode: 'single'; entities: [string] })
  /** Several entities, confirmed with `Use selection`. */
  | (SelectionBase & { mode: 'multiple'; entities: string[]; prerequisite?: string });

export const SCAN_CONFIG_ACTIVITIES = ['build', 'simulate', 'extract', 'process'] as const;
export type ScanConfigActivity = (typeof SCAN_CONFIG_ACTIVITIES)[number];

export const SCAN_CONFIG_DIR = path.resolve(import.meta.dirname, '..', 'data', 'scan-configs');

/** Every fixture file on disk, so one unit test can validate the whole folder. */
export function scanConfigFixtureFiles(): string[] {
  return fs
    .readdirSync(SCAN_CONFIG_DIR)
    .filter((entry) => entry.endsWith('.json'))
    .toSorted();
}

export function loadScanConfigFixture(fileName: string): ScanConfigFixture {
  const file = path.join(SCAN_CONFIG_DIR, fileName);
  const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  return parseScanConfigFixture(raw, fileName);
}

/**
 * Validates the envelope, not the configuration body. The body is schema-driven
 * and open-ended, so obi-one is the only thing that can judge it; a malformed
 * envelope, by contrast, would otherwise fail halfway through a browser run.
 *
 * @throws Error naming the fixture and the offending field.
 */
export function parseScanConfigFixture(value: unknown, source: string): ScanConfigFixture {
  const fail = (message: string): never => {
    throw new Error(`${source}: ${message}`);
  };
  const object = (v: unknown, at: string): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${at} must be an object`);
    return v as Record<string, unknown>;
  };
  const text = (v: unknown, at: string): string => {
    if (typeof v !== 'string' || v.trim() === '') fail(`${at} must be a non-empty string`);
    return v as string;
  };

  const root = object(value, 'the fixture');
  const activity = text(root.activity, 'activity');
  if (!SCAN_CONFIG_ACTIVITIES.includes(activity as ScanConfigActivity)) {
    fail(`activity must be one of ${SCAN_CONFIG_ACTIVITIES.join(', ')}, got "${activity}"`);
  }

  const workflow = object(root.workflow, 'workflow');
  const selection = object(root.selection, 'selection');
  const mode = text(selection.mode, 'selection.mode');
  if (mode !== 'single' && mode !== 'multiple') {
    fail(`selection.mode must be "single" or "multiple", got "${mode}"`);
  }

  const scope = selection.scope;
  if (scope !== undefined && scope !== 'public' && scope !== 'project') {
    fail(`selection.scope must be "public" or "project", got "${String(scope)}"`);
  }

  const entities = selection.entities;
  if (!Array.isArray(entities) || entities.length === 0) {
    fail('selection.entities must list at least one entity name');
  }
  (entities as unknown[]).forEach((entity, index) => text(entity, `selection.entities[${index}]`));
  if (mode === 'single' && (entities as unknown[]).length !== 1) {
    fail('selection.mode "single" takes exactly one entity');
  }

  const cases = root.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    fail('cases must hold at least one configuration');
  }

  const config = root.config;
  if (config !== undefined) {
    fail('config moved inside cases: give each configuration its own entry');
  }

  return {
    name: text(root.name, 'name'),
    activity: activity as ScanConfigActivity,
    workflow: {
      label: text(workflow.label, 'workflow.label'),
      type: text(workflow.type, 'workflow.type'),
    },
    schemaName: text(root.schemaName, 'schemaName'),
    selection: {
      mode,
      entities: entities as string[],
      ...(scope === undefined ? {} : { scope: scope as ScanConfigScope }),
      ...(selection.prerequisite === undefined
        ? {}
        : { prerequisite: text(selection.prerequisite, 'selection.prerequisite') }),
    } as ScanConfigSelection,
    ...(root.requires === undefined
      ? {}
      : { requires: parseRequires(object(root.requires, 'requires'), fail) }),
    cases: (cases as unknown[]).map((entry, index) =>
      parseCase(object(entry, `cases[${index}]`), `cases[${index}]`, fail, text, object)
    ),
  };
}

type TextReader = (value: unknown, at: string) => string;
type ObjectReader = (value: unknown, at: string) => Record<string, unknown>;

function parseCase(
  entry: Record<string, unknown>,
  at: string,
  fail: (message: string) => never,
  text: TextReader,
  object: ObjectReader
): ScanConfigCase {
  const config = object(entry.config, `${at}.config`);
  if (Object.keys(config).length === 0) {
    fail(`${at}.config must name at least one root element`);
  }

  const expected = object(entry.expect, `${at}.expect`);
  const coordinateCount = expected.coordinateCount;
  if (!Number.isInteger(coordinateCount) || (coordinateCount as number) < 1) {
    fail(`${at}.expect.coordinateCount must be a positive integer`);
  }

  return {
    name: text(entry.name, `${at}.name`),
    config,
    expect: {
      coordinateCount: coordinateCount as number,
      submitLabel: text(expected.submitLabel, `${at}.expect.submitLabel`),
      ...(expected.generated === undefined
        ? {}
        : { generated: parseFiles(expected.generated, `${at}.expect.generated`, fail) }),
      ...(expected.completed === undefined
        ? {}
        : { completed: parseFiles(expected.completed, `${at}.expect.completed`, fail) }),
      ...(expected.built === undefined
        ? {}
        : { built: parseBuiltEntity(expected.built, `${at}.expect.built`, fail, text, object) }),
    },
  };
}

function parseRequires(
  requires: Record<string, unknown>,
  fail: (message: string) => never
): { featureFlag?: string } {
  const flag = requires.featureFlag;
  if (flag === undefined) return {};
  if (typeof flag !== 'string' || flag.trim() === '') {
    fail('requires.featureFlag must be a non-empty string');
  }
  return { featureFlag: flag as string };
}

function parseFiles(value: unknown, at: string, fail: (message: string) => never): ScanConfigFiles {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${at} must be an object with "inputs" and "outputs"`);
  }

  const record = value as Record<string, unknown>;
  return {
    inputs: parseFileNames(record.inputs, `${at}.inputs`, fail),
    outputs: parseFileNames(record.outputs, `${at}.outputs`, fail),
  };
}

/** An empty list is meaningful: it says the panel shows nothing yet. */
function parseFileNames(value: unknown, at: string, fail: (message: string) => never): string[] {
  if (!Array.isArray(value)) fail(`${at} must be a list of file names`);
  for (const [index, name] of (value as unknown[]).entries()) {
    if (typeof name !== 'string' || name.trim() === '') {
      fail(`${at}[${index}] must be a non-empty string`);
    }
  }
  return value as string[];
}

function parseBuiltEntity(
  value: unknown,
  at: string,
  fail: (message: string) => never,
  text: TextReader,
  object: ObjectReader
): ScanConfigBuiltEntity {
  const record = object(value, at);
  const properties = object(record.properties, `${at}.properties`);

  if (Object.keys(properties).length === 0) {
    fail(`${at}.properties must name at least one property a user can read`);
  }

  for (const [label, shown] of Object.entries(properties)) {
    if (typeof shown !== 'string' || shown.trim() === '') {
      fail(`${at}.properties["${label}"] must be the value shown, as a string`);
    }
  }

  return {
    name: text(record.name, `${at}.name`),
    properties: properties as Record<string, string>,
  };
}
