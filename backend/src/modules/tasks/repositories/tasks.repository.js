const { TASKS_FILE } = require('../../../config');
const { readJsonArray, updateJsonArray } = require('../../../utils/jsonStore');

async function findAll() {
  return readJsonArray(TASKS_FILE);
}

async function findById(taskId) {
  const tasks = await readJsonArray(TASKS_FILE);
  return tasks.find((task) => task.id === taskId) || null;
}

async function insert(task) {
  return updateJsonArray(TASKS_FILE, (tasks) => {
    tasks.push(task);
    return task;
  });
}

async function update(taskId, changes) {
  return updateJsonArray(TASKS_FILE, (tasks) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      return null;
    }

    tasks[index] = { ...tasks[index], ...changes };
    return tasks[index];
  });
}

async function remove(taskId) {
  return updateJsonArray(TASKS_FILE, (tasks) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      return null;
    }

    const [removed] = tasks.splice(index, 1);
    return removed;
  });
}

module.exports = {
  findAll,
  findById,
  insert,
  update,
  remove,
};
