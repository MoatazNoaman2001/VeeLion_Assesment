const tasksRepository = require('../../tasks/repositories/tasks.repository');
const activityRepository = require('../../activity/repositories/activity.repository');
const { buildTasksSummary } = require('../utils/buildTasksSummary');

// Reads through the other modules' repositories instead of opening their
// files, so storage details stay in one place.
async function getTasksSummary({ windowDays, now = new Date() }) {
  const [tasks, activity] = await Promise.all([
    tasksRepository.findAll(),
    activityRepository.findAll(),
  ]);

  return buildTasksSummary({ tasks, activity, now, windowDays });
}

module.exports = {
  getTasksSummary,
};
