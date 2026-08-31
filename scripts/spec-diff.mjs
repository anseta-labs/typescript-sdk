#!/usr/bin/env node
/**
 * Compares the previously committed spec against the freshly fetched one and
 * reports whether the regenerated client breaks consumers.
 *
 * The SDK always compiles against itself after regeneration, so compilation
 * proves nothing here: a renamed export is valid TypeScript. Breakage only
 * shows up in consumers, which CI never sees. Comparing the two specs is the
 * only signal available.
 *
 * Writes GitHub Actions outputs when GITHUB_OUTPUT is set, and a human summary
 * to stdout either way.
 */
import { appendFile, readFile } from 'node:fs/promises';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}

const previousPath = args.get('previous');
const currentPath = args.get('current');

if (!previousPath || !currentPath) {
  throw new Error('usage: spec-diff.mjs --previous <path> --current <path>');
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

/** operationId -> { route, required } for every operation in the document. */
function operations(spec) {
  const out = new Map();
  for (const [route, item] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(item)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      if (!op.operationId) continue;
      const required = new Set(
        (op.parameters ?? []).filter((p) => p.required).map((p) => `${p.in}:${p.name}`),
      );
      out.set(op.operationId, { route: `${method.toUpperCase()} ${route}`, required });
    }
  }
  return out;
}

/** Schema name -> Set of enum values, for schemas that are enums. */
function enums(spec) {
  const out = new Map();
  for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
    if (Array.isArray(schema.enum)) out.set(name, new Set(schema.enum));
  }
  return out;
}

const previous = await readJson(previousPath);
const current = await readJson(currentPath);

const previousPaths = Object.keys(previous.paths ?? {}).length;
const currentPaths = Object.keys(current.paths ?? {}).length;

const previousOps = operations(previous);
const currentOps = operations(current);

const removedOperations = [...previousOps.keys()].filter((id) => !currentOps.has(id));
const addedOperations = [...currentOps.keys()].filter((id) => !previousOps.has(id));

// Note the flipped direction: three checks ask what disappeared, this one asks
// what appeared, because a *new* required parameter is what breaks callers.
const newlyRequired = [];
for (const [id, op] of currentOps) {
  const before = previousOps.get(id);
  if (!before) continue;
  for (const param of op.required) {
    if (!before.required.has(param)) newlyRequired.push(`${id} (${param})`);
  }
}

const previousSchemas = new Set(Object.keys(previous.components?.schemas ?? {}));
const currentSchemas = new Set(Object.keys(current.components?.schemas ?? {}));
const removedSchemas = [...previousSchemas].filter((n) => !currentSchemas.has(n));
const addedSchemas = [...currentSchemas].filter((n) => !previousSchemas.has(n));

const currentEnums = enums(current);
const removedEnumValues = [];
for (const [name, values] of enums(previous)) {
  const now = currentEnums.get(name);
  if (!now) continue;
  for (const value of values) {
    if (!now.has(value)) removedEnumValues.push(`${name}.${value}`);
  }
}

const breaking =
  removedOperations.length > 0 ||
  removedSchemas.length > 0 ||
  newlyRequired.length > 0 ||
  removedEnumValues.length > 0;

const specVersion = current.info?.version ?? 'unknown';

const list = (label, items) =>
  items.length ? `**${label}**\n${items.map((i) => `- \`${i}\``).join('\n')}\n` : '';

const summary = [
  `Spec version \`${specVersion}\`, ${currentPaths} paths (was ${previousPaths}).`,
  '',
  breaking
    ? 'This change **breaks consumers**. Review the removals before merging.'
    : 'No consumer-breaking changes detected.',
  '',
  list('Removed operations', removedOperations),
  list('Newly required parameters', newlyRequired),
  list('Removed schemas', removedSchemas),
  list('Removed enum values', removedEnumValues),
  list('Added operations', addedOperations),
  list('Added schemas', addedSchemas),
]
  .filter(Boolean)
  .join('\n');

const section = (heading, entries) =>
  entries.length ? `### ${heading}\n${entries.map((e) => `- ${e}`).join('\n')}\n` : '';

const changelog = [
  section('Added', [...addedOperations, ...addedSchemas]),
  section(
    'Changed',
    newlyRequired.map((n) => `${n} is now required`),
  ),
  section('Removed', [...removedOperations, ...removedSchemas, ...removedEnumValues]),
]
  .filter(Boolean)
  .join('\n');

console.log(summary);

if (process.env.GITHUB_OUTPUT) {
  const delimiter = `EOF_${Math.abs(currentPaths * 7919)}`;
  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `breaking=${breaking}`,
      `spec_version=${specVersion}`,
      `summary<<${delimiter}`,
      summary,
      delimiter,
      `changelog<<${delimiter}`,
      changelog,
      delimiter,
      '',
    ].join('\n'),
  );
}
