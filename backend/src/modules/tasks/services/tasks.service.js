const { createId } = require('../../../utils/id');
const HttpError = require('../../../utils/httpError');
const tasksRepository = require('../repositories/tasks.repository');

async function getAllTasks() {
  return tasksRepository.findAll();
}

async function getTaskById(taskId) {
  const task = await tasksRepository.findById(taskId);

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return task;
}

async function createTask({ title, completed }) {
  const now = new Date().toISOString();

  return tasksRepository.insert({
    id: createId(),
    title,
    completed,
    createdAt: now,
    updatedAt: now,
  });
}

async function updateTask(taskId, changes) {
  const updatedTask = await tasksRepository.update(taskId, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  if (!updatedTask) {
    throw new HttpError(404, 'Task not found.');
  }

  return updatedTask;
}

async function deleteTask(taskId) {
  const removedTask = await tasksRepository.remove(taskId);

  if (!removedTask) {
    throw new HttpError(404, 'Task not found.');
  }

  return removedTask;
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
