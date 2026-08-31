#!/usr/bin/env node
/**
 * Two edits to CHANGELOG.md, neither of which anyone should do by hand.
 *
 *   add <<<block      inserts a block under "## Unreleased", read from stdin
 *   release <version> renames "## Unreleased" to the version and today's date,
 *                     and opens a fresh empty Unreleased above it
 *
 * The regeneration workflow uses `add` so a spec change writes its own entry.
 * `release` is the one command that turns whatever accumulated there into a
 * released version, so the heading and the package version cannot drift.
 */
import { readFile, writeFile } from 'node:fs/promises';

const CHANGELOG = 'CHANGELOG.md';
const UNRELEASED = '## Unreleased';

const [command, argument] = process.argv.slice(2);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
}

function splitAtUnreleased(text) {
  const index = text.indexOf(UNRELEASED);
  if (index === -1) {
    throw new Error(`${CHANGELOG} has no "${UNRELEASED}" heading`);
  }
  const after = index + UNRELEASED.length;
  return { head: text.slice(0, after), tail: text.slice(after) };
}

async function add() {
  const block = await readStdin();
  if (!block) {
    console.log('Nothing to add.');
    return;
  }

  const text = await readFile(CHANGELOG, 'utf8');
  const { head, tail } = splitAtUnreleased(text);
  await writeFile(CHANGELOG, `${head}\n\n${block}\n${tail.replace(/^\n+/, '\n')}`);
  console.log(`Added ${block.split('\n').length} lines under ${UNRELEASED}.`);
}

async function release() {
  if (!/^\d+\.\d+\.\d+$/.test(argument ?? '')) {
    throw new Error('usage: changelog.mjs release <major.minor.patch>');
  }

  const text = await readFile(CHANGELOG, 'utf8');
  const { head, tail } = splitAtUnreleased(text);

  const body = tail.split(/\n## /)[0].trim();
  if (!body) {
    throw new Error(`${UNRELEASED} is empty. Describe the change before releasing ${argument}.`);
  }

  // Date rather than timestamp: a changelog entry is dated, not timed.
  const today = new Date().toISOString().slice(0, 10);
  const replaced = `${head.slice(0, -UNRELEASED.length)}${UNRELEASED}\n\n## ${argument} - ${today}${tail}`;

  await writeFile(CHANGELOG, replaced);
  console.log(`Released ${argument} (${today}); Unreleased is now empty.`);
}

try {
  if (command === 'add') await add();
  else if (command === 'release') await release();
  else throw new Error('usage: changelog.mjs add | release <version>');
} catch (error) {
  console.error(`changelog failed: ${error.message}`);
  process.exit(1);
}
