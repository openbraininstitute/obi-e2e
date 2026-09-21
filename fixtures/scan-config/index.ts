/** The seed each scenario keeps beside its spec, read and checked. */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { DEPLOYMENT_ENVS, type DeploymentEnv, deploymentEnv } from '../run/env';

/** One workflow: how to reach it, what to select, and its configurations. */
export type ScanConfigFixture = {
  name: string;
  activity: ScanConfigActivity;
  env: DeploymentEnv[];
  workflow: {
    label: string;
    type: string;
    confirmsCost?: boolean;
  };
  schemaName: string;
  selection: ScanConfigSelection;
  requires?: {
    featureFlag?: string;
  };
  cases: ScanConfigCase[];
};

export type ScanConfigCase = {
  name: string;
  /** A run too long for the nightly suite. It runs in the slow job instead. */
  slow?: boolean;
  /**
   * Set false for a campaign that is generated and read but never started.
   *
   * A simulation the lab cannot afford still has a form worth covering: the
   * case runs to the point where the launch button is offered and stops there,
   * so the workflow keeps its test without the launch that would be refused.
   */
  launch?: boolean;
  config: Record<string, unknown>;
  expect: {
    coordinateCount: number;
    generated?: ScanConfigFiles;
    /** Left out when the run is too long to sit through: it only has to start. */
    completed?: ScanConfigCompleted;
  };
};

/** What a finished run holds, and how long it is given to get there. */
export type ScanConfigCompleted = ScanConfigFiles & {
  /**
   * Minutes the run may take, from a run somebody watched.
   *
   * Left out, a case falls back to the blanket budget for its kind, and a `slow`
   * one is given four hours — long enough that a run which stalls holds the job
   * until it runs out of clock rather than failing while the reason is still
   * legible. A case that has been timed says so here instead.
   */
  within?: number;
};

export type ScanConfigScope = 'public' | 'project';

export type ScanConfigFiles = {
  inputs: string[];
  outputs: string[];
  views?: Record<string, ScanConfigView>;
};

/**
 * What opening one file shows: the text a pane holds, or, for the entity a run
 * registered, the properties its card reads out.
 */
export type ScanConfigView = string[] | Record<string, string>;

type SelectionBase = {
  scope?: ScanConfigScope;
};

export type ScanConfigSelection =
  | { mode: 'none' }
  | (SelectionBase & { mode: 'single'; entities: [string] })
  | (SelectionBase & { mode: 'multiple'; entities: string[]; prerequisite?: string });

export const SCAN_CONFIG_ACTIVITIES = ['build', 'simulate', 'extract', 'process'] as const;
export type ScanConfigActivity = (typeof SCAN_CONFIG_ACTIVITIES)[number];

/** A scenario folder keeps its seed beside its spec, under this name. */
export const SEED_NAME = 'seed.json';

const SCENARIOS_DIR = path.resolve(import.meta.dirname, '..', '..', 'scenarios');

/** Whether this workflow runs on the deployment under test. */
export function runsOnThisDeployment(fixture: ScanConfigFixture): boolean {
  return fixture.env.includes(deploymentEnv());
}

/** The skip message for a workflow this deployment does not offer. */
export function notDeployedHere(fixture: ScanConfigFixture): string {
  if (fixture.env.length === 0) {
    return `"${fixture.workflow.label}" runs on no deployment yet: its fixture names none.`;
  }

  return (
    `"${fixture.workflow.label}" is not offered on ${deploymentEnv()}: ` +
    `the fixture declares ${fixture.env.join(', ')}.`
  );
}

/** Every scenario folder that carries a seed, at any depth. */
export function seedFolders(): string[] {
  return fs
    .readdirSync(SCENARIOS_DIR, { recursive: true })
    .flatMap((entry) => {
      const relative = String(entry);
      if (path.basename(relative) !== SEED_NAME) return [];
      return [path.join(SCENARIOS_DIR, path.dirname(relative))];
    })
    .toSorted();
}

/** The seed beside a spec. A spec passes its own `import.meta.dir`. */
export function loadSeed(folder: string): ScanConfigFixture {
  const file = path.join(folder, SEED_NAME);
  const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  return parseScanConfigFixture(raw, path.relative(process.cwd(), file));
}

/** Reads a fixture, and fails naming the field that is wrong. */
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

  const envs = root.env;
  if (!Array.isArray(envs)) {
    fail(
      `env must be a list of ${DEPLOYMENT_ENVS.join(' or ')}, empty if the workflow ` +
        'runs nowhere yet'
    );
  }
  for (const [index, name] of (envs as unknown[]).entries()) {
    if (!DEPLOYMENT_ENVS.includes(name as DeploymentEnv)) {
      fail(
        `env[${index}] must be one of ${DEPLOYMENT_ENVS.join(', ')}, got ${JSON.stringify(name)}`
      );
    }
  }

  const workflow = object(root.workflow, 'workflow');
  const selection = object(root.selection, 'selection');
  const mode = text(selection.mode, 'selection.mode');
  if (mode !== 'single' && mode !== 'multiple' && mode !== 'none') {
    fail(`selection.mode must be "none", "single" or "multiple", got "${mode}"`);
  }

  const scope = selection.scope;
  if (scope !== undefined && scope !== 'public' && scope !== 'project') {
    fail(`selection.scope must be "public" or "project", got "${String(scope)}"`);
  }

  const entities = mode === 'none' ? [] : selection.entities;
  if (mode !== 'none') {
    if (!Array.isArray(entities) || entities.length === 0) {
      fail('selection.entities must list at least one entity name');
    }
    (entities as unknown[]).forEach((entity, index) =>
      text(entity, `selection.entities[${index}]`)
    );
    if (mode === 'single' && (entities as unknown[]).length !== 1) {
      fail('selection.mode "single" takes exactly one entity');
    }
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
    env: envs as DeploymentEnv[],
    workflow: {
      label: text(workflow.label, 'workflow.label'),
      type: text(workflow.type, 'workflow.type'),
      confirmsCost: workflow.confirmsCost !== false,
    },
    schemaName: text(root.schemaName, 'schemaName'),
    selection: {
      mode,
      ...(mode === 'none' ? {} : { entities: entities as string[] }),
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
  if (expected.built !== undefined) {
    fail(
      `${at}.expect.built moved into completed.views: name the entity by its file, and give ` +
        'the properties its card reads out'
    );
  }

  const coordinateCount = expected.coordinateCount;
  if (!Number.isInteger(coordinateCount) || (coordinateCount as number) < 1) {
    fail(`${at}.expect.coordinateCount must be a positive integer`);
  }

  const slow = entry.slow;
  if (slow !== undefined && typeof slow !== 'boolean') {
    fail(`${at}.slow must be true or false`);
  }

  const launch = entry.launch;
  if (launch !== undefined && typeof launch !== 'boolean') {
    fail(`${at}.launch must be true or false`);
  }

  if (launch === false && expected.completed !== undefined) {
    fail(`${at} cannot expect a completed run when it never launches one`);
  }

  return {
    name: text(entry.name, `${at}.name`),
    ...(slow === true ? { slow: true } : {}),
    ...(launch === false ? { launch: false } : {}),
    config,
    expect: {
      coordinateCount: coordinateCount as number,
      ...(expected.generated === undefined
        ? {}
        : { generated: parseFiles(expected.generated, `${at}.expect.generated`, fail) }),
      ...(expected.completed === undefined
        ? {}
        : { completed: parseCompleted(expected.completed, `${at}.expect.completed`, fail) }),
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

/** The files a finished run holds, and the minutes it is given to finish. */
function parseCompleted(
  value: unknown,
  at: string,
  fail: (message: string) => never
): ScanConfigCompleted {
  const files = parseFiles(value, at, fail);
  const within = (value as Record<string, unknown>).within;

  if (within === undefined) return files;
  if (typeof within !== 'number' || !Number.isFinite(within) || within <= 0) {
    fail(`${at}.within must be the number of minutes the run may take`);
  }

  return { ...files, within: within as number };
}

function parseFiles(value: unknown, at: string, fail: (message: string) => never): ScanConfigFiles {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${at} must be an object with "inputs" and "outputs"`);
  }

  const record = value as Record<string, unknown>;
  const views = record.views;
  if (views !== undefined && (!views || typeof views !== 'object' || Array.isArray(views))) {
    fail(`${at}.views must map a file name to what opening it shows`);
  }

  return {
    inputs: parseFileNames(record.inputs, `${at}.inputs`, fail),
    outputs: parseFileNames(record.outputs, `${at}.outputs`, fail),
    ...(views === undefined
      ? {}
      : {
          views: Object.fromEntries(
            Object.entries(views as Record<string, unknown>).map(([file, shown]) => [
              file,
              parseView(shown, `${at}.views["${file}"]`, fail),
            ])
          ),
        }),
  };
}

/** A pane holds text; an entity card reads out properties. */
function parseView(value: unknown, at: string, fail: (message: string) => never): ScanConfigView {
  if (Array.isArray(value)) return parseFileNames(value, at, fail);

  if (!value || typeof value !== 'object') {
    fail(`${at} must be a list of the text its pane shows, or the properties its card reads out`);
  }

  const properties = value as Record<string, unknown>;
  if (Object.keys(properties).length === 0) {
    fail(`${at} must name at least one property a user can read`);
  }

  for (const [label, shown] of Object.entries(properties)) {
    if (typeof shown !== 'string' || shown.trim() === '') {
      fail(`${at}["${label}"] must be the value shown, as a string`);
    }
  }

  return properties as Record<string, string>;
}

function parseFileNames(value: unknown, at: string, fail: (message: string) => never): string[] {
  if (!Array.isArray(value)) fail(`${at} must be a list of file names`);
  for (const [index, name] of (value as unknown[]).entries()) {
    if (typeof name !== 'string' || name.trim() === '') {
      fail(`${at}[${index}] must be a non-empty string`);
    }
  }
  return value as string[];
}
