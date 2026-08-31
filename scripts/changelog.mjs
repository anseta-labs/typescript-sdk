#!/usr/bin/env node
/**
 * Two edits to CHANGELOG.md, neither of which anyone should do by hand.
 *
 *   add <<<block      merges a block into "## Unreleased", read from stdin
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

/** head: everything up to and including the Unreleased heading. */
function split(text) {
  const index = text.indexOf(UNRELEASED);
  if (index === -1) {
    throw new Error(`${CHANGELOG} has no "${UNRELEASED}" heading`);
  }
  const after = index + UNRELEASED.length;
  const rest = text.slice(after);
  const next = rest.search(/\n## /);
  return {
    head: text.slice(0, after),
    body: next === -1 ? rest : rest.slice(0, next),
    rest: next === -1 ? '' : rest.slice(next),
  };
}

/** Splits a section body into its "### " groups, keeping anything before them. */
function parse(body) {
  const preamble = [];
  const sections = new Map();
  let current = null;

  for (const line of body.split('\n')) {
    const heading = /^### (.+)$/.exec(line);
    if (heading) {
      current = heading[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    (current === null ? preamble : sections.get(current)).push(line);
  }
  return { preamble, sections };
}

function render(preamble, sections) {
  const parts = [];
  const intro = preamble.join('\n').trim();
  if (intro) parts.push(intro);

  for (const [heading, lines] of sections) {
    const entries = lines.join('\n').trim();
    if (entries) parts.push(`### ${heading}\n${entries}`);
  }
  return parts.join('\n\n');
}

async function add() {
  const block = await readStdin();
  if (!block) {
    console.log('Nothing to add.');
    return;
  }

  const text = await readFile(CHANGELOG, 'utf8');
  const { head, body, rest } = split(text);

  const existing = parse(body);
  const incoming = parse(block);

  // Anything the incoming block says before its first heading is prose worth
  // keeping, so it joins the preamble rather than being dropped.
  const preamble = [...existing.preamble, ...incoming.preamble];

  let merged = 0;
  for (const [heading, lines] of incoming.sections) {
    if (!existing.sections.has(heading)) existing.sections.set(heading, []);
    const target = existing.sections.get(heading);
    // Trim the blank lines either side of the join, or merged entries end up
    // separated by a gap that reads as two lists.
    while (target.length && !target[target.length - 1].trim()) target.pop();
    while (lines.length && !lines[0].trim()) lines.shift();
    for (const line of lines) {
      // Identical entries mean the same change was reported twice.
      if (line.trim() && target.includes(line)) continue;
      target.push(line);
      if (line.trim()) merged += 1;
    }
  }

  const rebuilt = render(preamble, existing.sections);
  await writeFile(CHANGELOG, `${head}\n\n${rebuilt}\n${rest || '\n'}`);
  console.log(
    `Merged ${merged} entries into ${UNRELEASED} across ${incoming.sections.size} section(s).`,
  );
}

async function release() {
  if (!/^\d+\.\d+\.\d+$/.test(argument ?? '')) {
    throw new Error('usage: changelog.mjs release <major.minor.patch>');
  }

  const text = await readFile(CHANGELOG, 'utf8');
  const { head, body, rest } = split(text);

  if (!body.trim()) {
    throw new Error(`${UNRELEASED} is empty. Describe the change before releasing ${argument}.`);
  }

  // Date rather than timestamp: a changelog entry is dated, not timed.
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    CHANGELOG,
    `${head}\n\n## ${argument} - ${today}\n${body.replace(/^\n+/, '\n')}${rest}`,
  );
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
