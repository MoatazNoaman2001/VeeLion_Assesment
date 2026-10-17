# VeeLion Full-Stack Assessment

A small task management app: an Express API in `backend/` and a Next.js app in `frontend/`.
The data lives in two JSON files (`backend/data/tasks.json` and `backend/data/activity.json`).

My code review of the starter is in [REVIEW.md](REVIEW.md).

## Running it

You need Node 18.18 or newer.

**Backend** (runs on http://localhost:3000)

```bash
cd backend
npm install
npm start
```

**Frontend** (runs on http://localhost:3001)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend talks to the backend through its own `/api/*` routes, so the browser never calls
port 3000 directly. If your backend runs somewhere else, change `BACKEND_API_URL` in `.env.local`.

**Tests**

```bash
cd backend
npm test
```

## Pages

- `/tasks`: the Task Dashboard. Filter by status and mark tasks as completed or pending.
- `/activity`: the Activity Feed, newest first, with search.
- `/reports`: total tasks, tasks by status and recent activity, with a 24h / 7 days / 30 days window.

## What I changed

The short version. The details and the reasons are in REVIEW.md and the commit history.

Backend:
- Fixed PATCH so it can only change `title` and `completed` (before, you could overwrite the id).
- Writes to the JSON files are queued per file and written atomically, so parallel requests no
  longer lose data and a crash can't leave a broken file.
- Each module has a small repository that owns its file. The services and the new reports
  module go through it.
- One validator per module. Activity input is validated now, and ids are UUIDs.
- Added `GET /reports/tasks-summary`, plus `helmet` and a 10kb body limit.
- Added tests with `node:test`.

Frontend:
- The API proxy keeps the real status codes, encodes ids, has a timeout, and reads the backend
  URL on the server only.
- Rebuilt the Activity Feed: no more timer re-rendering every 1.4s, proper loading, error and
  empty states, and it no longer crashes when the API fails.
- In the Task Dashboard, a failed toggle no longer hides the list, and toggling several tasks at
  once works.
- Added the Reports page and restyled everything, with dark mode support.

## Things I left on purpose

- The response shapes are the same as before (`{ data }` for tasks, raw arrays for activity),
  because existing clients depend on them.
- `in-progress` is always 0 in the report. Tasks only have `completed: true/false`, and I didn't
  want to invent a rule for it.
- No pagination yet. It would change what `GET /activity` returns by default.
