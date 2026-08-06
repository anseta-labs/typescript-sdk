// Post-processes the ESM build so Node can actually load it:
// tsc emits extensionless relative specifiers, which are invalid in Node ESM,
// and dist/esm needs its own package.json to opt out of the root CommonJS default.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const esmDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'esm');

if (!existsSync(esmDir)) {
  throw new Error(`ESM output directory not found: ${esmDir}`);
}

async function collectEmittedFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectEmittedFiles(full)));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

function resolveSpecifier(fileDir, specifier) {
  const target = resolve(fileDir, specifier);
  if (existsSync(`${target}.js`) || existsSync(`${target}.d.ts`)) {
    return `${specifier}.js`;
  }
  if (existsSync(join(target, 'index.js')) || existsSync(join(target, 'index.d.ts'))) {
    return `${specifier}/index.js`;
  }
  throw new Error(`Cannot resolve ESM specifier "${specifier}" from ${fileDir}`);
}

const files = await collectEmittedFiles(esmDir);
let rewritten = 0;

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const fileDir = dirname(file);
  const output = source.replace(
    /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]*)\2/g,
    (match, prefix, quote, specifier) => {
      if (/\.(js|mjs|cjs|json)$/.test(specifier)) {
        return match;
      }
      return `${prefix}${quote}${resolveSpecifier(fileDir, specifier)}${quote}`;
    },
  );
  if (output !== source) {
    await writeFile(file, output);
    rewritten += 1;
  }
}

await writeFile(join(esmDir, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);

console.log(
  `fix-esm: rewrote specifiers in ${rewritten}/${files.length} files, wrote dist/esm/package.json`,
);
