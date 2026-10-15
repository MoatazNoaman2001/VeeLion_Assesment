const reportsService = require('../services/reports.service');
const { parseWindowDays } = require('../utils/reportsValidator');

async function getTasksSummary(req, res) {
  const windowDays = parseWindowDays(req.query);
  const summary = await reportsService.getTasksSummary({ windowDays });
  res.status(200).json(summary);
}

module.exports = {
  getTasksSummary,
};
