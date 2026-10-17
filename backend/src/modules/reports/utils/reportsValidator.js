const HttpError = require('../../../utils/httpError');

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 365;

function parseWindowDays(query) {
  if (query.days === undefined) {
    return DEFAULT_WINDOW_DAYS;
  }

  const days = Number(query.days);
  if (!Number.isInteger(days) || days < 1 || days > MAX_WINDOW_DAYS) {
    throw new HttpError(400, `"days" must be an integer between 1 and ${MAX_WINDOW_DAYS}.`);
  }

  return days;
}

module.exports = {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  parseWindowDays,
};
