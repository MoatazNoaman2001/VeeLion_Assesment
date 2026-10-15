const { createId } = require('../../../utils/id');
const activityRepository = require('../repositories/activity.repository');

async function getAllActivity() {
  return activityRepository.findAll();
}

async function createActivity({ action, info }) {
  return activityRepository.insert({
    id: createId(),
    action,
    info,
    when: new Date().toISOString(),
  });
}

module.exports = {
  getAllActivity,
  createActivity,
};
