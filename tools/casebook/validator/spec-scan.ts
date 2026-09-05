/**
 * Reads a spec with oxc: its describe blocks, its tests, and its imports.
 * That is all the skeleton needs to add what is missing without touching what
 * is there.
 */

import { parseSync } from 'oxc-parser';

export type Describe = { title: string; bodyEnd: number };
export type SpecTest = { title: string; fixme: boolean };
export type Import = { start: number; end: number; names: string[] };

export type SpecScan = {
  parsed: boolean;
  describes: Describe[];
  tests: SpecTest[];
  /** Named imports by module: `@fixtures/tags` → its specifiers. */
  imports: Record<string, Import>;
};

const TEST_DECLARERS = new Set(['only', 'skip', 'fixme', 'fail']);

type Node = { type: string; start?: number; end?: number; [key: string]: unknown };

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as Node).type === 'string';
}

/** `test.describe.configure` → ['test', 'describe', 'configure']. */
function calleeChain(callee: unknown): string[] {
  if (!isNode(callee)) return [];
  if (callee.type === 'Identifier') return [String(callee.name)];
  if (callee.type === 'MemberExpression' && isNode(callee.property)) {
    return [...calleeChain(callee.object), String(callee.property.name ?? '')];
  }
  return [];
}

/**
 * A test title. A template such as `` `Build it: ${configuration.name}` ``
 * is one test per configuration, all titled after the same case; the case
 * title is the part before the colon.
 */
function titleOf(node: unknown): string | null {
  if (!isNode(node)) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && Array.isArray(node.quasis)) {
    const first = node.quasis[0];
    const value = isNode(first) ? (first.value as { cooked?: unknown } | undefined)?.cooked : null;
    return typeof value === 'string' ? value.replace(/:\s*$/, '') : null;
  }
  return null;
}

function functionArg(args: unknown[]): Node | null {
  const fn = args.find(
    (a) => isNode(a) && (a.type === 'ArrowFunctionExpression' || a.type === 'FunctionExpression')
  );
  return isNode(fn) ? fn : null;
}

export function scanSpec(specText: string, specFile: string): SpecScan {
  const parsed = parseSync(specFile, specText);
  const scan: SpecScan = { parsed: false, describes: [], tests: [], imports: {} };
  if (parsed.errors.length > 0) return scan;
  scan.parsed = true;

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return void node.forEach(walk);
    if (!isNode(node)) return;

    if (node.type === 'ImportDeclaration' && isNode(node.source)) {
      const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
      scan.imports[String(node.source.value)] = {
        start: node.start ?? 0,
        end: node.end ?? 0,
        names: specifiers.flatMap((s) =>
          isNode(s) && isNode(s.imported) ? [String(s.imported.name)] : []
        ),
      };
    }

    if (node.type === 'CallExpression') {
      const chain = calleeChain(node.callee);
      const args = Array.isArray(node.arguments) ? node.arguments : [];
      const title = titleOf(args[0]);
      const fn = functionArg(args);

      if (chain[0] === 'test' && title !== null && fn !== null) {
        if (chain.length === 2 && chain[1] === 'describe') {
          const body = fn.body;
          scan.describes.push({ title, bodyEnd: isNode(body) ? (body.end ?? 0) : 0 });
        } else if (chain.length === 1 || (chain.length === 2 && TEST_DECLARERS.has(chain[1]!))) {
          scan.tests.push({ title, fixme: chain[1] === 'fixme' });
        }
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key !== 'type') walk(value);
    }
  };

  walk(parsed.program);
  return scan;
}
