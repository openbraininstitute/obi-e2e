/** Turns diagnostics into text, JSON, or GitHub annotations. */

import type { Diagnostic, FileResult } from './types';

export type Summary = {
  files: number;
  skipped: number;
  cases: number;
  errors: number;
  warnings: number;
};

export function summarize(results: FileResult[]): Summary {
  const all = results.flatMap((r) => r.diagnostics);
  return {
    files: results.length,
    skipped: results.filter((r) => r.casebook.legacy).length,
    cases: results.reduce((n, r) => n + r.casebook.cases.length, 0),
    errors: all.filter((d) => d.severity === 'error').length,
    warnings: all.filter((d) => d.severity === 'warning').length,
  };
}

export function formatDiagnostic(d: Diagnostic): string {
  const lines = [
    `${d.file}${d.line > 0 ? `:${d.line}` : ''}`,
    `  ${d.severity} ${d.rule} — ${d.message}`,
  ];
  if (d.found !== undefined) lines.push(`  Found:    ${d.found}`);
  if (d.expected !== undefined) lines.push(`  Expected: ${d.expected}`);
  if (d.fix !== undefined) lines.push(`  Fix:      ${d.fix}`);
  if (d.why !== undefined) lines.push(`  Why:      ${d.why}`);
  return lines.join('\n');
}

export function formatText(results: FileResult[]): string {
  const blocks: string[] = [];

  for (const r of results) {
    if (r.casebook.legacy) {
      blocks.push(`${r.file}\n  skipped — still a gherkin file`);
      continue;
    }
    for (const d of r.diagnostics) blocks.push(formatDiagnostic(d));
  }

  const s = summarize(results);
  const tally = [
    `${s.files} file${s.files === 1 ? '' : 's'}`,
    `${s.cases} case${s.cases === 1 ? '' : 's'}`,
    `${s.errors} error${s.errors === 1 ? '' : 's'}`,
    `${s.warnings} warning${s.warnings === 1 ? '' : 's'}`,
    ...(s.skipped > 0 ? [`${s.skipped} skipped (gherkin)`] : []),
  ].join(' · ');

  return [...blocks, tally].join('\n\n');
}

export function formatJson(results: FileResult[]): string {
  return JSON.stringify(
    {
      summary: summarize(results),
      files: results.map((r) => ({
        file: r.file,
        legacy: r.casebook.legacy,
        cases: r.casebook.cases.map((c) => c.title),
        diagnostics: r.diagnostics,
      })),
    },
    null,
    2
  );
}

function escape(s: string): string {
  return s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

/** One line per diagnostic, in the form GitHub Actions turns into a PR annotation. */
export function formatGithub(results: FileResult[]): string {
  const lines: string[] = [];

  for (const d of results.flatMap((r) => r.diagnostics)) {
    const body = [d.message, d.fix === undefined ? '' : `Fix: ${d.fix}`].filter(Boolean).join(' ');
    lines.push(
      `::${d.severity} file=${d.file},line=${Math.max(d.line, 1)},title=${escape(d.rule)}::${escape(body)}`
    );
  }

  return lines.join('\n');
}
