const fs = require('node:fs/promises');
const path = require('node:path');

// Tail of the pending-update chain for each file. Every update waits for the
// previous one, so read-modify-write cycles on the same file never interleave.
// This is enough for a single Node process, which is the only deployment a
// JSON-file store supports anyway.
const updateQueues = new Map();

async function readJsonArray(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    // Returning [] here would make the next write overwrite the whole file.
    throw new Error(`Expected a JSON array in ${filePath}`);
  }

  return parsed;
}

async function renameWithRetry(from, to, attempts = 5) {
  try {
    await fs.rename(from, to);
  } catch (error) {
    // Windows refuses to replace a file another handle is reading; it clears quickly.
    if (attempts > 1 && (error.code === 'EPERM' || error.code === 'EBUSY')) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return renameWithRetry(from, to, attempts - 1);
    }
    throw error;
  }
}

async function writeJsonArray(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Write to a temp file and rename it over the original, so a crash
  // mid-write can never leave a truncated, unparseable file behind.
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    await renameWithRetry(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

/**
 * Serialised read-modify-write. `mutator` receives the current array, may
 * change it in place, and returns the value the caller wants back. The file
 * is only written when the mutator returns without throwing.
 */
function updateJsonArray(filePath, mutator) {
  const previous = updateQueues.get(filePath) || Promise.resolve();

  const run = previous.then(async () => {
    const items = await readJsonArray(filePath);
    const result = await mutator(items);
    await writeJsonArray(filePath, items);
    return result;
  });

  // The queue must keep going even if this update fails.
  const tail = run.catch(() => {});
  updateQueues.set(filePath, tail);
  tail.then(() => {
    if (updateQueues.get(filePath) === tail) {
      updateQueues.delete(filePath);
    }
  });

  return run;
}

module.exports = {
  readJsonArray,
  writeJsonArray,
  updateJsonArray,
};
