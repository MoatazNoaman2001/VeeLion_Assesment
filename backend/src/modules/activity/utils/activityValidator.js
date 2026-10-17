const HttpError = require('../../../utils/httpError');

const MAX_FIELD_LENGTH = 500;
const TEXT_FIELDS = ['action', 'info'];

function validateCreateActivity(payload) {
  const body = payload === undefined ? {} : payload;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }

  const normalized = {};

  for (const field of TEXT_FIELDS) {
    const value = body[field];
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value !== 'string') {
      throw new HttpError(400, `"${field}" must be a string.`);
    }

    if (value.length > MAX_FIELD_LENGTH) {
      throw new HttpError(400, `"${field}" must be at most ${MAX_FIELD_LENGTH} characters.`);
    }

    normalized[field] = value;
  }

  return normalized;
}

module.exports = {
  MAX_FIELD_LENGTH,
  validateCreateActivity,
};
