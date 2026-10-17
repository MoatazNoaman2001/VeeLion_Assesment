# Backend API Endpoints

Base URL: `http://localhost:3000`

The frontend never calls this from the browser. It goes through the Next.js route handlers in `app/api/*`, which forward the backend's status code (a backend 404 stays a 404). If the backend can't be reached the proxy answers `502`, and `504` if it times out.

## Shared Error Shape

```ts
type ErrorResponse = {
  error: {
    message: string;
  };
};
```

## Task Endpoints

### GET /tasks

Fetch all tasks.

```ts
type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

type GetTasksResponse = {
  data: Task[];
};
```

### GET /tasks/:id

Fetch one task by ID.

```ts
type GetTaskResponse = {
  data: Task;
};
```

Possible errors:
- `404` when task does not exist.

### POST /tasks

Create a task.

```ts
type CreateTaskRequest = {
  title: string; // required, trimmed, 2-200 characters
  completed?: boolean; // default false
};

type CreateTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is not an object.
- `400` when title is missing, not a string, or not 2-200 characters after trimming.

Unknown fields in the body are ignored.
- `400` when completed is not a boolean.

### PATCH /tasks/:id

Update task title or status.

```ts
type PatchTaskRequest = {
  title?: string; // same rule as create: 2-200 characters after trim
  completed?: boolean;
};

type PatchTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is invalid.
- `400` when no supported fields are provided.

Only `title` and `completed` are applied. Anything else in the body (`id`, `createdAt`, ...) is ignored.
- `404` when task does not exist.

### DELETE /tasks/:id

Delete task by ID.

```ts
type DeleteTaskResponse = void; // status 204
```

Possible errors:
- `404` when task does not exist.

## Activity Endpoints

### GET /activity

Fetch activity logs.

```ts
type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string; // ISO datetime
};

type GetActivityResponse = ActivityLog[];
```

### POST /activity

Create activity log entry.

```ts
type CreateActivityRequest = {
  action?: string;
  info?: string;
};

type CreateActivityResponse = ActivityLog;
```

Notes:
- `action` and `info` are optional, but if sent they must be strings of at most 500 characters, otherwise `400`.
- The body must be a JSON object (`400` for arrays).
- `id` is a UUID.
- Response shape for activity endpoints is raw objects/arrays (not wrapped in `data`).

## Reports Endpoints

### GET /reports/tasks-summary?days=7

Fetch summary statistics for tasks and activity.

`days` (optional, integer 1-365, default 7) sets what "recent" means for `recentActivityCount`. Anything else returns `400`.

```ts
type TasksSummary = {
  total: number;
  byStatus: {
    todo: number;
    "in-progress": number;
    done: number;
  };
  recentActivityCount: number;
};

type GetTasksSummaryResponse = TasksSummary;
```

Notes:
- `byStatus`: completed tasks count as `done`, the rest as `todo`. `in-progress` is always `0` for now because tasks only have a boolean `completed`. The key is still returned so the shape doesn't change later.
- `recentActivityCount`: activity entries whose `when` falls in the last `days` days. Entries with an invalid date are skipped.
- Response shape is raw object.
