const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function startTestServer({ tasks = [], activity = [] } = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veelion-api-'));
  await fs.writeFile(path.join(dataDir, 'tasks.json'), JSON.stringify(tasks));
  await fs.writeFile(path.join(dataDir, 'activity.json'), JSON.stringify(activity));
  process.env.DATA_DIR = dataDir;

  const app = require('../../src/app');
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, urlPath, body) {
    const response = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  async function readData(name) {
    return JSON.parse(await fs.readFile(path.join(dataDir, `${name}.json`), 'utf-8'));
  }

  async function close() {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  }

  return { baseUrl, request, readData, close };
}

module.exports = {
  startTestServer,
};
