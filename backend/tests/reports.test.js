const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { buildTasksSummary } = require('../src/modules/reports/utils/buildTasksSummary');
const { startTestServer } = require('./helpers/testServer');

const now = new Date('2026-10-15T12:00:00.000Z');
const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

describe('buildTasksSummary', () => {
  test('counts tasks by derived status, always returning every status key', () => {
    const summary = buildTasksSummary({
      tasks: [{ completed: true }, { completed: false }, { completed: false }],
      activity: [],
      now,
      windowDays: 7,
    });

    assert.deepEqual(summary, {
      total: 3,
      byStatus: { todo: 2, 'in-progress': 0, done: 1 },
      recentActivityCount: 0,
    });
  });

  test('handles empty data', () => {
    const summary = buildTasksSummary({ tasks: [], activity: [], now, windowDays: 7 });
    assert.equal(summary.total, 0);
    assert.deepEqual(summary.byStatus, { todo: 0, 'in-progress': 0, done: 0 });
  });

  test('counts only activity inside the window and skips bad timestamps', () => {
    const activity = [
      { when: hoursAgo(1) },
      { when: hoursAgo(23) },
      { when: hoursAgo(25) },
      { when: hoursAgo(24 * 8) },
      { when: 'not a date' },
      {},
      { when: new Date(now.getTime() + 60_000).toISOString() },
    ];

    const countFor = (windowDays) =>
      buildTasksSummary({ tasks: [], activity, now, windowDays }).recentActivityCount;

    assert.equal(countFor(1), 2);
    assert.equal(countFor(7), 3);
    assert.equal(countFor(30), 4);
  });
});

describe('GET /reports/tasks-summary', () => {
  let api;

  before(async () => {
    api = await startTestServer({
      tasks: [
        { id: '1', title: 'a', completed: true },
        { id: '2', title: 'b', completed: false },
      ],
      activity: [
        { id: 'old', when: '2020-01-01T00:00:00.000Z' },
        { id: 'new', when: new Date().toISOString() },
      ],
    });
  });

  after(() => api.close());

  test('returns the documented shape with a 7-day default window', async () => {
    const { status, body } = await api.request('GET', '/reports/tasks-summary');

    assert.equal(status, 200);
    assert.deepEqual(body, {
      total: 2,
      byStatus: { todo: 1, 'in-progress': 0, done: 1 },
      recentActivityCount: 1,
    });
  });

  test('reflects writes made through the other modules', async () => {
    await api.request('POST', '/tasks', { title: 'Third task' });
    await api.request('POST', '/activity', { action: 'x' });

    const { body } = await api.request('GET', '/reports/tasks-summary');
    assert.equal(body.total, 3);
    assert.equal(body.byStatus.todo, 2);
    assert.equal(body.recentActivityCount, 2);
  });

  test('validates ?days=', async () => {
    for (const days of ['0', '366', '1.5', 'abc', '']) {
      const { status } = await api.request('GET', `/reports/tasks-summary?days=${days}`);
      assert.equal(status, 400, `days=${days}`);
    }

    const { status } = await api.request('GET', '/reports/tasks-summary?days=365');
    assert.equal(status, 200);
  });
});
