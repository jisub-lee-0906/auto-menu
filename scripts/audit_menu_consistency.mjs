import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  ['playwright', 'test', 'tests/generator.spec.ts', '--project=logic'],
  { cwd: process.cwd(), encoding: 'utf8', stdio: 'inherit' },
);

if (result.error) {
  console.error(`Unable to run production generator tests: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
