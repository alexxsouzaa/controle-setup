import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

function getVersion() {
  try {
    const describe = execSync('git describe --tags --always', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const match = describe.match(/^v?([\d.]+)(?:-(\d+))?(?:-g[0-9a-f]+)?$/);
    if (!match) return '0.0.0';
    const [, base, count] = match;
    return count ? `${base}-dev.${count}` : base;
  } catch {
    return '0.0.0';
  }
}

mkdirSync('src', { recursive: true });
writeFileSync('src/version.ts', `export const APP_VERSION = '${getVersion()}';\n`, 'utf8');
console.log(`version: ${getVersion()}`);
