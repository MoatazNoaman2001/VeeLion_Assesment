const path = require('node:path');

// Resolved from this file rather than process.cwd(), so the API reads the same
// files no matter which directory it is started from. DATA_DIR overrides it
// (used by the tests to run against a temporary copy).
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  DATA_DIR,
  TASKS_FILE: path.join(DATA_DIR, 'tasks.json'),
  ACTIVITY_FILE: path.join(DATA_DIR, 'activity.json'),
};
