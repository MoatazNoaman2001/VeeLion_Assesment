const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { readJsonArray, updateJsonArray } = require('../src/utils/jsonStore');

async function tempFile(content) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'veelion-store-'));
  const file = path.join(dir, 'data.json');
  if (content !== undefined) {
    await fs.writeFile(file, content);
  }
  return file;
}

test('a missing or blank file reads as an empty array', async () => {
  assert.deepEqual(await readJsonArray(await tempFile()), []);
  assert.deepEqual(await readJsonArray(await tempFile('  \n')), []);
});

test('a non-array file throws instead of being treated as empty', async () => {
  const file = await tempFile('{"tasks": []}');

  await assert.rejects(readJsonArray(file), /Expected a JSON array/);
  await assert.rejects(updateJsonArray(file, (items) => items.push(1)));
  assert.equal(await fs.readFile(file, 'utf-8'), '{"tasks": []}');
});

test('concurrent updates are applied one after another', async () => {
  const file = await tempFile('[]');

  await Promise.all(
    Array.from({ length: 50 }, (_, index) => updateJsonArray(file, (items) => items.push(index)))
  );

  assert.equal((await readJsonArray(file)).length, 50);
});

test('a failing mutator leaves the file untouched and does not block the queue', async () => {
  const file = await tempFile('[1]');

  await assert.rejects(
    updateJsonArray(file, (items) => {
      items.push(2);
      throw new Error('boom');
    })
  );
  await updateJsonArray(file, (items) => items.push(3));

  assert.deepEqual(await readJsonArray(file), [1, 3]);
});

test('creates the data directory on first write', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'veelion-store-'));
  const file = path.join(dir, 'nested', 'data.json');

  await updateJsonArray(file, (items) => items.push('x'));

  assert.deepEqual(await readJsonArray(file), ['x']);
});
