#!/usr/bin/env node
/**
 * Writes openapi.json from a local file or URL.
 *
 * The source must be given explicitly, as an argument or via STAKEFI_SPEC.
 * There is deliberately no default: the deployed spec lags the API repo, and
 * `pnpm run generate` deletes src/ before regenerating, so a silent fallback to
 * a stale host would quietly rebuild the client against an older API.
 *
 * The base URL the generated client ships with is pinned here rather than read
 * out of the spec: the deployed spec's own `servers` list has pointed at hosts
 * that do not resolve, and typescript-fetch turns servers[0] into BASE_PATH.
 * Override with STAKEFI_BASE_URL when generating a client for another
 * environment.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_BASE_URL = 'https://preview.api.stakefi.network';
const OUTPUT = resolve(process.cwd(), 'openapi.json');

const source = process.argv[2] ?? process.env.STAKEFI_SPEC;
const baseUrl = process.env.STAKEFI_BASE_URL ?? DEFAULT_BASE_URL;

async function load(from) {
  if (!from.startsWith('http://') && !from.startsWith('https://')) {
    const path = resolve(process.cwd(), from);
    const text = await readFile(path, 'utf8');
    return parse(text, path);
  }

  const response = await fetch(from);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${from}: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!contentType.includes('json')) {
    throw new Error(
      `Expected JSON from ${from} but got content-type "${contentType}". ` +
        `First 200 characters: ${text.slice(0, 200)}`,
    );
  }
  return parse(text, from);
}

function parse(text, origin) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${origin} is not valid JSON: ${error.message}`);
  }
}

async function main() {
  if (!source) {
    throw new Error(
      'No spec source given. Pass a path or URL as the first argument, or set STAKEFI_SPEC.\n' +
        '  from the API repo:  STAKEFI_SPEC=../stakefi-developer-api/openapi.json pnpm run generate\n' +
        '  from a deployment:  STAKEFI_SPEC=https://preview.api.stakefi.network/v1/openapi.json pnpm run generate',
    );
  }

  const spec = await load(source);

  if (typeof spec.openapi !== 'string') {
    throw new Error(
      `${source} does not look like an OpenAPI document (no "openapi" version field)`,
    );
  }
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    throw new Error(`${source} has no paths; refusing to generate an empty client`);
  }
  if (!spec.info || typeof spec.info.version !== 'string') {
    throw new Error(`${source} has no info.version`);
  }

  spec.servers = [{ url: baseUrl, description: 'stakeFi Developer API' }];

  await writeFile(OUTPUT, `${JSON.stringify(spec, null, 2)}\n`);

  console.log(
    `Wrote ${OUTPUT} from ${source} (base path ${baseUrl}, ${Object.keys(spec.paths).length} paths, spec version ${spec.info.version})`,
  );
}

try {
  await main();
} catch (error) {
  console.error(`prepare-spec failed: ${error.message}`);
  process.exit(1);
}
