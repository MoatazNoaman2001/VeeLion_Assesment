const { ACTIVITY_FILE } = require('../../../config');
const { readJsonArray, updateJsonArray } = require('../../../utils/jsonStore');

async function findAll() {
  return readJsonArray(ACTIVITY_FILE);
}

async function insert(entry) {
  return updateJsonArray(ACTIVITY_FILE, (entries) => {
    entries.push(entry);
    return entry;
  });
}

module.exports = {
  findAll,
  insert,
};
