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
  config: Record<string, unknown>;
  expect: {
    coordinateCount: number;
    generated?: ScanConfigFiles;
    completed?: ScanConfigFiles;
    built?: ScanConfigBuiltEntity;
  };
};

export type ScanConfigBuiltEntity = {
  name: string;
  properties: Record<string, string>;
};

export type ScanConfigScope = 'public' | 'project';

export type ScanConfigFiles = {
  inputs: string[];
  outputs: string[];
  views?: Record<string, string[]>;
};

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
  const coordinateCount = expected.coordinateCount;
  if (!Number.isInteger(coordinateCount) || (coordinateCount as number) < 1) {
    fail(`${at}.expect.coordinateCount must be a positive integer`);
  }

  return {
    name: text(entry.name, `${at}.name`),
    config,
    expect: {
      coordinateCount: coordinateCount as number,
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
  const views = record.views;
  if (views !== undefined && (!views || typeof views !== 'object' || Array.isArray(views))) {
    fail(`${at}.views must map a file name to the text its pane shows`);
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
              parseFileNames(shown, `${at}.views["${file}"]`, fail),
            ])
          ),
        }),
  };
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
