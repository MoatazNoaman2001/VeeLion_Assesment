const fs = require('node:fs/promises');
const path = require('node:path');

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
    throw new Error(`Expected a JSON array in ${filePath}`);
  }

  return parsed;
}

async function renameWithRetry(from, to, attempts = 5) {
  try {
    await fs.rename(from, to);
  } catch (error) {
    if (attempts > 1 && (error.code === 'EPERM' || error.code === 'EBUSY')) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return renameWithRetry(from, to, attempts - 1);
    }
    throw error;
  }
}

async function writeJsonArray(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    await renameWithRetry(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

function updateJsonArray(filePath, mutator) {
  const previous = updateQueues.get(filePath) || Promise.resolve();

  const run = previous.then(async () => {
    const items = await readJsonArray(filePath);
    const result = await mutator(items);
    await writeJsonArray(filePath, items);
    return result;
  });

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
