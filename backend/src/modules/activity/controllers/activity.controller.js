const activityService = require('../services/activity.service');
const { validateCreateActivity } = require('../utils/activityValidator');

// Responses stay unwrapped (raw array / object) because existing clients
// depend on that shape; see REVIEW.md (M4).

async function listActivity(req, res) {
  const entries = await activityService.getAllActivity();
  res.status(200).json(entries);
}

async function createActivity(req, res) {
  const input = validateCreateActivity(req.body);
  const entry = await activityService.createActivity(input);
  res.status(201).json(entry);
}

module.exports = {
  listActivity,
  createActivity,
};
