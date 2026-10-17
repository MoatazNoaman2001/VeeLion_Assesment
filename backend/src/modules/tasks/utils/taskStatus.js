const TASK_STATUSES = ['todo', 'in-progress', 'done'];

function deriveTaskStatus(task) {
  return task.completed === true ? 'done' : 'todo';
}

module.exports = {
  TASK_STATUSES,
  deriveTaskStatus,
};
