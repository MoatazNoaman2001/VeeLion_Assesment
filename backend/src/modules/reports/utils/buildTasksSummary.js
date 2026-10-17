const { TASK_STATUSES, deriveTaskStatus } = require('../../tasks/utils/taskStatus');

const DAY_MS = 24 * 60 * 60 * 1000;

function countByStatus(tasks) {
  const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));

  for (const task of tasks) {
    counts[deriveTaskStatus(task)] += 1;
  }

  return counts;
}

function countRecentActivity(entries, { now, windowDays }) {
  const end = now.getTime();
  const start = end - windowDays * DAY_MS;

  return entries.filter((entry) => {
    const time = Date.parse(entry.when);
    return time >= start && time <= end;
  }).length;
}

function buildTasksSummary({ tasks, activity, now, windowDays }) {
  return {
    total: tasks.length,
    byStatus: countByStatus(tasks),
    recentActivityCount: countRecentActivity(activity, { now, windowDays }),
  };
}

module.exports = {
  buildTasksSummary,
};
