/**
 * Checks scenario files, and writes spec skeletons.
 *
 *   bun run casebook [paths…] [--json | --github] [--no-seeds]
 *   bun run casebook skeleton [paths…]
 *   bun run casebook run [paths…] [playwright flags]
 *
 * Paths default to scenarios/. Exit 1 when any error is found.
 */

import {
  findCasebooks,
  formatGithub,
  formatJson,
  formatText,
  skeletonFiles,
  specFor,
  summarize,
  validateFiles,
} from './index';

type Args = {
  command: 'check' | 'skeleton' | 'run';
  paths: string[];
  format: 'text' | 'json' | 'github';
  seeds: boolean;
  help: boolean;
  /** Flags this tool does not know, handed on to Playwright by `run`. */
  passthrough: string[];
};

export function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: 'check',
    paths: [],
    format: 'text',
    seeds: true,
    help: false,
    passthrough: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    switch (arg) {
      case 'check':
      case 'skeleton':
      case 'run':
        args.command = arg;
        break;
      case '--json':
        args.format = 'json';
        break;
      case '--github':
        args.format = 'github';
        break;
      case '--no-seeds':
        args.seeds = false;
        break;
      case '-h':
      case '--help':
        args.help = true;
        break;
      default:
        if (arg.startsWith('-')) args.passthrough.push(arg);
        else args.paths.push(arg);
    }
  }

  if (args.paths.length === 0) args.paths.push('scenarios');
  return args;
}

const HELP = `casebook — check scenario files, and write spec skeletons

usage: bun run casebook [check] [paths…] [options]
       bun run casebook skeleton [paths…]
       bun run casebook run [paths…] [playwright flags]

  paths          folders to walk for scenario.md, or .md files (default: scenarios)
                   scenarios                              everything
                   scenarios/workflows                    one section
                   scenarios/workflows/build-synaptome    one scenario

  check          the default: is every scenario well formed?
  skeleton       write the spec beside each scenario, or add the tests it lacks.
                 One test.describe per file, one test per case, titled as the case.
                 A case with no test comes in as test.fixme with its English as comments.
  run            run the spec of each folder given, through Playwright under Bun.
                 A folder runs <folder>/<folder>.spec.ts; a .spec.ts path runs as it is.
                 Any other flag (--headed, --grep …) is handed on to Playwright.

  --json         machine-readable output
  --github       one annotation per line, for GitHub Actions
  --no-seeds     skip the check that each Seed: file is really there

exit 1 when any error is found; warnings never fail the run`;

if (import.meta.main) {
  const args = parseArgs(Bun.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.command === 'run') {
    const specs: string[] = [];
    for (const path of args.paths) {
      const spec = path.endsWith('.spec.ts') ? path : specFor(path);
      if (!(await Bun.file(spec).exists())) {
        console.error(
          `casebook: there is no "${spec}" — run \`bun run casebook skeleton ${path}\` first`
        );
        process.exit(1);
      }
      specs.push(spec);
    }
    const playwright = Bun.spawnSync(
      ['bun', '--bun', 'playwright', 'test', ...specs, ...args.passthrough],
      { stdio: ['inherit', 'inherit', 'inherit'] }
    );
    process.exit(playwright.exitCode);
  }

  const { files, missing, empty } = await findCasebooks(args.paths);
  for (const path of missing) console.error(`casebook: there is no "${path}"`);
  for (const path of empty) console.error(`casebook: no scenario.md under "${path}"`);

  if (files.length === 0) {
    console.error(`casebook: nothing to check in ${args.paths.join(', ')}`);
    process.exit(1);
  }

  if (args.command === 'skeleton') {
    for (const r of await skeletonFiles(files)) {
      const what = r.created ? 'created' : r.added.length > 0 ? 'grown' : 'unchanged';
      console.log(`${r.specFile}  ${what}`);
      for (const t of r.added) console.log(`  + ${t}`);
      for (const t of r.orphans) console.log(`  ? test with no case: ${t}`);
    }
    process.exit(missing.length > 0 ? 1 : 0);
  }

  const results = await validateFiles(files, { seeds: args.seeds });
  const formatters = { json: formatJson, github: formatGithub, text: formatText };
  const output = formatters[args.format](results);
  if (output.length > 0) console.log(output);

  process.exit(summarize(results).errors > 0 || missing.length > 0 ? 1 : 0);
}
