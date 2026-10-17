const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { startTestServer } = require('./helpers/testServer');

const existingTask = {
  id: 'task-1',
  title: 'Existing task',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let api;

before(async () => {
  api = await startTestServer({ tasks: [existingTask] });
});

after(() => api.close());

test('GET /tasks wraps the list in { data }', async () => {
  const { status, body } = await api.request('GET', '/tasks');
  assert.equal(status, 200);
  assert.deepEqual(body.data[0], existingTask);
});

test('POST /tasks trims the title, defaults completed and ignores unknown fields', async () => {
  const { status, body } = await api.request('POST', '/tasks', {
    title: '  Write tests  ',
    id: 'chosen-by-client',
  });

  assert.equal(status, 201);
  assert.equal(body.data.title, 'Write tests');
  assert.equal(body.data.completed, false);
  assert.notEqual(body.data.id, 'chosen-by-client');
});

test('POST /tasks rejects invalid input with 400', async () => {
  const cases = [{}, { title: '   ' }, { title: 42 }, { title: 'ok', completed: 'yes' }, []];

  for (const payload of cases) {
    const { status, body } = await api.request('POST', '/tasks', payload);
    assert.equal(status, 400, JSON.stringify(payload));
    assert.equal(typeof body.error.message, 'string');
  }
});

test('PATCH /tasks/:id cannot overwrite id, createdAt or add fields', async () => {
  const { status, body } = await api.request('PATCH', '/tasks/task-1', {
    completed: true,
    id: 'hijacked',
    createdAt: '1999-01-01T00:00:00.000Z',
    isAdmin: true,
  });

  assert.equal(status, 200);
  assert.equal(body.data.id, 'task-1');
  assert.equal(body.data.completed, true);
  assert.equal(body.data.createdAt, existingTask.createdAt);
  assert.equal('isAdmin' in body.data, false);

  const stored = (await api.readData('tasks')).find((task) => task.id === 'task-1');
  assert.equal('isAdmin' in stored, false);
});

test('create and update share the same title length rule', async () => {
  assert.equal((await api.request('POST', '/tasks', { title: 'a' })).status, 400);
  assert.equal((await api.request('PATCH', '/tasks/task-1', { title: ' b ' })).status, 400);
  assert.equal((await api.request('POST', '/tasks', { title: 'x'.repeat(201) })).status, 400);

  const { status, body } = await api.request('PATCH', '/tasks/task-1', { title: 'ok' });
  assert.equal(status, 200);
  assert.equal(body.data.title, 'ok');
});

test('responses carry security headers and no X-Powered-By', async () => {
  const response = await fetch(api.baseUrl + '/tasks');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('PATCH /tasks/:id needs at least one known field', async () => {
  const { status } = await api.request('PATCH', '/tasks/task-1', { foo: 1 });
  assert.equal(status, 400);
});

test('unknown task ids return 404', async () => {
  assert.equal((await api.request('GET', '/tasks/missing')).status, 404);
  assert.equal((await api.request('PATCH', '/tasks/missing', { completed: true })).status, 404);
  assert.equal((await api.request('DELETE', '/tasks/missing')).status, 404);
});

test('concurrent creates are all persisted', async () => {
  const countBefore = (await api.readData('tasks')).length;

  await Promise.all(
    Array.from({ length: 25 }, (_, index) =>
      api.request('POST', '/tasks', { title: `Parallel ${index}` })
    )
  );

  assert.equal((await api.readData('tasks')).length, countBefore + 25);
});

test('DELETE /tasks/:id returns 204 and removes the task', async () => {
  const { body } = await api.request('POST', '/tasks', { title: 'To delete' });

  const { status } = await api.request('DELETE', `/tasks/${body.data.id}`);
  assert.equal(status, 204);
  assert.equal((await api.request('GET', `/tasks/${body.data.id}`)).status, 404);
});
