const HttpError = require('../../../utils/httpError');

const MIN_TITLE_LENGTH = 2;
const MAX_TITLE_LENGTH = 200;

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }
}

function normalizeTitleIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'title')) {
    return;
  }

  if (typeof payload.title !== 'string') {
    throw new HttpError(400, '"title" must be a string.');
  }

  const trimmedTitle = payload.title.trim();
  if (!trimmedTitle) {
    throw new HttpError(400, '"title" cannot be empty.');
  }

  if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    throw new HttpError(400, `"title" must be at least ${MIN_TITLE_LENGTH} characters.`);
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    throw new HttpError(400, `"title" must be at most ${MAX_TITLE_LENGTH} characters.`);
  }

  normalized.title = trimmedTitle;
}

function normalizeCompletedIfPresent(payload, normalized) {
  if (!Object.hasOwn(payload, 'completed')) {
    return;
  }

  if (typeof payload.completed !== 'boolean') {
    throw new HttpError(400, '"completed" must be a boolean.');
  }

  normalized.completed = payload.completed;
}

function validateCreateTask(payload) {
  validatePayloadShape(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);

  if (!Object.hasOwn(normalized, 'title')) {
    throw new HttpError(400, '"title" is required.');
  }

  if (!Object.hasOwn(normalized, 'completed')) {
    normalized.completed = false;
  }

  return normalized;
}

function validateUpdateTask(payload) {
  validatePayloadShape(payload);

  const normalized = {};
  normalizeTitleIfPresent(payload, normalized);
  normalizeCompletedIfPresent(payload, normalized);

  if (Object.keys(normalized).length === 0) {
    throw new HttpError(400, 'Provide at least one updatable field.');
  }

  return normalized;
}

module.exports = {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  validateCreateTask,
  validateUpdateTask,
};
