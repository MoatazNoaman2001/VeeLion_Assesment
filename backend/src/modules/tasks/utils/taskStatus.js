// Statuses the reports contract exposes. Tasks only store a boolean
// `completed`, so nothing maps to "in-progress" yet: it is always reported
// (as 0) so the response shape stays stable for clients. Once tasks gain an
// explicit status field, only deriveTaskStatus() needs to change.
const TASK_STATUSES = ['todo', 'in-progress', 'done'];

function deriveTaskStatus(task) {
  return task.completed === true ? 'done' : 'todo';
}

module.exports = {
  TASK_STATUSES,
  deriveTaskStatus,
};
