/**
 * The Casebook validator: checks scenario files, and writes spec skeletons.
 */

import { parseCasebook } from './parse';
import { checkCasebook } from './rules';
import { skeleton, type Skeleton } from './skeleton';
import { scanSpec } from './spec-scan';
import type { Diagnostic, FileResult, ValidateOptions } from './types';

export { formatDiagnostic, formatGithub, formatJson, formatText, summarize } from './format';
export { distance, parseCasebook } from './parse';
export { checkCasebook, normalizeUser, seedLocation, USER_VALUES } from './rules';
export { skeleton, type Skeleton } from './skeleton';
export { scanSpec } from './spec-scan';
export * from './types';

const SCENARIO_GLOB = '**/scenario.md';

export async function validateText(
  text: string,
  file: string,
  options: ValidateOptions = {}
): Promise<FileResult> {
  const { casebook, diagnostics: parsed } = parseCasebook(text, file);
  const checked = await checkCasebook(casebook, options);
  return { file, casebook, diagnostics: [...parsed, ...checked].toSorted(byPosition) };
}

export async function validateFile(
  file: string,
  options: ValidateOptions = {}
): Promise<FileResult> {
  const result = await validateText(await Bun.file(file).text(), file, options);
  if (result.casebook.legacy) return result;

  // A stub nobody filled runs nothing, and stays green for ever.
  const specFile = specFor(folderOf(file));
  if (await Bun.file(specFile).exists()) {
    const stubs = scanSpec(await Bun.file(specFile).text(), specFile).tests.filter((t) => t.fixme);
    if (stubs.length > 0) {
      result.diagnostics.push({
        rule: 'stubs-unfilled',
        severity: 'warning',
        file: specFile,
        line: 0,
        message: `${stubs.length} test${stubs.length === 1 ? ' is' : 's are'} still fixme, so ${stubs.length === 1 ? 'that case runs' : 'those cases run'} nothing yet.`,
        found: stubs.map((t) => t.title).join(' | '),
        fix: 'run /e2e-generate on this scenario',
      });
    }
  }
  return result;
}

export type Found = {
  files: string[];
  /** Paths that are not there at all, so nothing could be read from them. */
  missing: string[];
  /** Folders that are there but hold no scenario file. */
  empty: string[];
};

/**
 * Every scenario file under the paths given. A folder is walked for
 * `scenario.md` at any depth. A `.md` path is taken as it is.
 */
export async function findCasebooks(paths: string[]): Promise<Found> {
  const files = new Set<string>();
  const missing: string[] = [];
  const empty: string[] = [];

  for (const raw of paths) {
    const path = raw.replace(/\/+$/, '') || '.';

    if (path.endsWith('.md')) {
      if (await Bun.file(path).exists()) files.add(path);
      else missing.push(path);
      continue;
    }

    let found = 0;
    try {
      for (const name of new Bun.Glob(SCENARIO_GLOB).scanSync({ cwd: path })) {
        files.add(`${path}/${name}`);
        found++;
      }
    } catch {
      missing.push(path);
      continue;
    }

    if (found === 0) empty.push(path);
  }

  return { files: [...files].toSorted(), missing, empty };
}

export async function validateFiles(
  files: string[],
  options: ValidateOptions = {}
): Promise<FileResult[]> {
  return Promise.all(files.map((f) => validateFile(f, options)));
}

export async function validatePaths(
  paths: string[],
  options: ValidateOptions = {}
): Promise<FileResult[]> {
  const { files } = await findCasebooks(paths);
  return validateFiles(files, options);
}

/** The folder a scenario lives in. */
export function folderOf(mdFile: string): string {
  return mdFile.replace(/[/\\][^/\\]+$/, '') || '.';
}

/** The spec for a scenario folder: always named after the folder. */
export function specFor(folder: string): string {
  const dir = folder.replace(/\/+$/, '');
  return `${dir}/${dir.split(/[/\\]/).at(-1)}.spec.ts`;
}

export type SkeletonResult = Skeleton & { file: string; specFile: string; created: boolean };

/** Writes or grows the spec beside each scenario. Legacy files are left alone. */
export async function skeletonFiles(files: string[]): Promise<SkeletonResult[]> {
  const out: SkeletonResult[] = [];

  for (const file of files) {
    const { casebook } = parseCasebook(await Bun.file(file).text(), file);
    if (casebook.legacy) continue;

    const specFile = specFor(folderOf(file));
    const exists = await Bun.file(specFile).exists();
    const existing = exists ? await Bun.file(specFile).text() : null;
    const result = skeleton(casebook, existing, specFile);

    if (result.text !== existing) {
      await Bun.write(specFile, result.text);
      // Best effort: the repo's formatter keeps the stubs within its line width.
      Bun.spawnSync(['bunx', 'oxfmt', specFile]);
    }

    out.push({ ...result, file, specFile, created: !exists });
  }

  return out;
}

function byPosition(a: Diagnostic, b: Diagnostic): number {
  return a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule);
}
