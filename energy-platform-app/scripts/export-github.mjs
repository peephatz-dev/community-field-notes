import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appRoot, '..');
const out = path.join(appRoot, 'out');
const publishDirectory = path.join(repoRoot, 'energy-platform');
await rm(publishDirectory, { recursive: true, force: true });
await mkdir(publishDirectory, { recursive: true });
await cp(out, publishDirectory, { recursive: true });
await writeFile(path.join(publishDirectory, '.nojekyll'), '');
await writeFile(path.join(repoRoot, '.nojekyll'), '');
console.log(`Copied static export to ${publishDirectory}`);
