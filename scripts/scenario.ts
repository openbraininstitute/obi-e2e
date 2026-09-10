import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const title = Bun.argv.slice(2).join(' ').trim();

if (title === '') {
  console.error('usage: bun run scenario "<scenario title>"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (slug === '') {
  console.error('scenario: the title must contain at least one letter or number');
  process.exit(1);
}

const repositoryRoot = resolve(import.meta.dir, '..');
const scenarioDirectory = join(repositoryRoot, 'scenarios', slug);
const scenarioFile = join(scenarioDirectory, 'scenario.md');

if (await Bun.file(scenarioFile).exists()) {
  console.error(`scenario: ${relative(repositoryRoot, scenarioFile)} already exists`);
  process.exit(1);
}

const content = `# ${title}

<!-- possible User values: visitor, authenticated, credits, onboarding -->
<!-- visitor: signed-out user -->
<!-- authenticated: signed-in user in the run's project -->
<!-- credits: signed-in user whose test spends credits -->
<!-- onboarding: new user who owns nothing yet -->

User: authenticated

## Fill your first test use case

Steps:

1. write the first user action here

Expected:

- write the expected result here
`;

await mkdir(scenarioDirectory, { recursive: true });
await writeFile(scenarioFile, content);

console.log(`created ${relative(repositoryRoot, scenarioFile)}`);
