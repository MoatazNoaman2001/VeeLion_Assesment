const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { startTestServer } = require('./helpers/testServer');

let api;

before(async () => {
  api = await startTestServer({
    activity: [{ id: 'a1', action: 'seed', info: 'x', when: '2026-01-01T00:00:00.000Z' }],
  });
});

after(() => api.close());

test('GET /activity returns a raw array (unchanged contract)', async () => {
  const { status, body } = await api.request('GET', '/activity');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body));
  assert.equal(body[0].id, 'a1');
});

test('POST /activity stores action and info with a UUID and timestamp', async () => {
  const { status, body } = await api.request('POST', '/activity', { action: 'created', info: 'Task A' });

  assert.equal(status, 201);
  assert.equal(body.action, 'created');
  assert.equal(body.info, 'Task A');
  assert.match(body.id, /^[0-9a-f-]{36}$/);
  assert.ok(!Number.isNaN(Date.parse(body.when)));
});

test('POST /activity still accepts an empty body', async () => {
  const { status } = await api.request('POST', '/activity', {});
  assert.equal(status, 201);
});

test('POST /activity rejects non-string fields and non-object bodies', async () => {
  const cases = [{ action: { x: 1 } }, { info: [1, 2] }, [1], { action: 'a'.repeat(501) }];

  for (const payload of cases) {
    const { status } = await api.request('POST', '/activity', payload);
    assert.equal(status, 400, JSON.stringify(payload).slice(0, 40));
  }
});

test('concurrent activity entries get unique ids and are all persisted', async () => {
  const countBefore = (await api.readData('activity')).length;

  const responses = await Promise.all(
    Array.from({ length: 20 }, (_, index) => api.request('POST', '/activity', { action: `a${index}` }))
  );

  const ids = new Set(responses.map((response) => response.body.id));
  assert.equal(ids.size, 20);
  assert.equal((await api.readData('activity')).length, countBefore + 20);
});
