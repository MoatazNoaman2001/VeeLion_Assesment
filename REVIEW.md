# Code Review

These are the notes I'd leave on a PR for the starter code, before I changed anything. Line
numbers point to the first commit. For the backend bugs I ran the API locally and reproduced
each one, so the examples below are real requests, not guesses.

I fixed most of this in the commits that follow. Where I left something alone on purpose, I
say why.

---

## Backend

### Bugs

**PATCH /tasks/:id lets the client overwrite any field.**
The service merges the body straight into the task (`{ ...existingTask, ...updates }` in
`tasks.service.js:75-79`), and the controller only checks that `title` or `completed` exists.
Anything else in the body is saved too. I sent
`{"completed":true,"id":"hijacked","createdAt":"1999","isAdmin":true}` and the task came back
with `id: "hijacked"` and a new `isAdmin` field, also written to the file.
This is the most serious one: a client can change a task's id, fake `createdAt`, or dump
any data into the file.
Fix: only copy `title` and `completed`. There's already a `taskValidator.js` in the repo that
does exactly this. It just was never imported.

**Parallel requests lose data.**
Every write is read file → change array → write file, with nothing stopping two requests from
overlapping. Both read the same array and the second write wins. I fired 20 `POST /tasks` at
once on a file with 3 tasks and ended up with 22, not 23. No error anywhere, one task just gone.
Fix: queue writes per file so each read-modify-write runs alone. One Node process is the only
setup a JSON file store can support anyway, so an in-memory queue is enough.

**Writes aren't atomic.**
`writeJsonArray` and the activity service write directly over the real file. If the process
dies halfway (crash, deploy, full disk), you're left with half a JSON file and every request
after that returns 500.
Fix: write to a temp file next to it, then `rename` it over the original.

**A file that isn't an array is treated as empty, and then overwritten.**
`jsonStore.js:11` returns `[]` if the JSON parses to something else, e.g. an object. Reads
show no tasks, and the next create saves a one-item array over the whole file.
Fix: throw an error instead. Failing loudly is better than quietly wiping data.

**Data paths depend on where you start the server.**
Both services build the path from `process.cwd()`. Running `node backend/src/server.js` from
the repo root makes every request fail with `ENOENT ...\data\tasks.json`. Worse, if a `data`
folder existed there, it would silently use a different dataset.
Fix: resolve paths from `__dirname`, and allow a `DATA_DIR` env variable (also handy for tests).

**Activity ids can collide.**
`String(Date.now())` is the id, so two entries in the same millisecond get the same one. The
frontend uses it as the React `key`, so that can also cause odd rendering.
Fix: use the `createId()` UUID helper that tasks already use.

**POST /activity accepts anything.**
No validation at all. `{"action":{"x":1},"info":[1,2]}` gets saved as is, and a body of `[1]`
creates an empty entry. The docs say both fields are optional strings, and the frontend calls
`.toLowerCase()` on them, so an object there breaks the search.
Fix: check the body is an object and the fields are strings with a max length, otherwise 400.

**Create and update have different title rules.**
You can create a task called `"a"`, but renaming a task to `"b"` fails with "Title is too
short" (`tasks.service.js:59-61`). This happens because validation lives in three places.
Fix: one validator for both, with a minimum of 2 characters (after trim) and a maximum of 200.
I kept the 2-character minimum that update already had and applied it to create too, since a
1-letter title isn't a useful task. The trade-off is that create is now a bit stricter: a client
that sends a 1-character title gets a 400 instead of a new task. None of the existing data is
affected.

### Performance

**The activity module uses sync file I/O.**
`existsSync`, `readFileSync` and `writeFileSync` on every request block the event loop, so all
other requests wait while the activity file is read. It gets worse as the file grows.
Fix: use the same async store as tasks.

**Everything is returned every time.**
`GET /activity` and `GET /tasks` return the whole file. The activity log only ever grows.
Fix: pagination (`?limit=&cursor=`) or SQLite later. I didn't change this, because current
clients expect the full array. It should be an opt-in agreed with whoever uses the API.

**Extra existence check before reading.**
`existsSync` then `readFileSync` is two calls and a small race. Just read and handle `ENOENT`,
like `jsonStore` already does.

### Security

**Mass assignment on PATCH.** Same issue as the first bug above. It's a security problem as
much as a bug.

**No size limits.**
Titles and activity fields have no max length, and `express.json()` allows 100kb by default.
It's easy to blow up the JSON files and make every read slower.
Fix: titles between 2 and 200 chars, max 500 for activity fields, and `express.json({ limit: '10kb' })`.
Rate limiting I'd leave to the proxy or gateway.

**`X-Powered-By: Express` header.**
It tells anyone scanning which framework to target. I added `app.disable('x-powered-by')` to
remove it. I also found it worth adding `helmet` on top of that, so I did. It sets the usual
security headers (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`,
`X-Frame-Options` and so on) in one line, and it's small and well maintained. Helmet hides
`X-Powered-By` too, so the `disable` line is a bit redundant, but I kept it so the intent is
clear even if someone changes the helmet config later.

**No auth.**
Anyone who can reach the port can change or delete everything. That's OK here because only the
Next.js server talks to it, but it shouldn't be exposed publicly like this. I'm writing it down
so it's a known decision.

### Maintainability

**Validation is in three places and the good one is unused.**
The controller validates, the service validates again with different rules, and
`taskValidator.js` (the cleanest of the three) isn't imported anywhere. That's how the title
rules ended up different.
Fix: controller calls the validator, service trusts its output.

**Services know about files.**
Each service builds its own file path and reads it directly. The Reports module needs both
tasks and activity, so without a data layer it would be a third copy of the same file code.
Fix: a small repository per module that owns its file. Services and reports go through it.

**`loadDataA` and `loadDataB` are the same function.** Copy-paste, one is enough.

**Tasks responses use `{ data }`, activity responses don't.**
Clients have to handle each endpoint differently. I left it as is, because changing response
shapes in production breaks clients. If it matters, it belongs in a `/v2`.

**No tests.**
I added tests with `node:test` (no new packages) for validation, the PATCH fix, parallel writes
and the reports logic. They run against a temp data folder.

### Code quality

**Names in the activity module.** `aSvc`, `c`, `x`, `b`, `one`, `made`, `fp`, and `get_activity`
in snake_case next to camelCase. Renamed to say what they are.

**The controller changes `req.body`.** `tasks.controller.js:26,32` trims and defaults fields
directly on the request. It's harder to follow and can surprise other middleware. The validator
returns a new object instead.

**Activity routes don't use `asyncHandler`.** It only worked because the handlers were sync.
Once they're async, a rejected promise would crash the process in Express 4.

**Dead code in `id.js`.** `randomUUID` exists in every Node version we'd run, so the
`Date.now() + Math.random()` fallback never runs, and it's weaker anyway.

**Port mismatch.** The backend runs on 3000, but the frontend `.env.example`, `constants.ts` and
the endpoint docs all say 4000. On top of that, `next dev` also wants 3000. If you follow the
README, the frontend can't reach the API. I kept the backend on 3000, pointed the frontend at it,
and moved the frontend dev server to 3001.

---

## Frontend

### Bugs

**The Activity Feed crashes when the API fails.**
`app/activity/page.tsx:48-55` never checks `response.ok`. With the backend down, `/api/activity`
returns `{ error: {...} }`, that object gets stored as the list (`data || []` is truthy), and
`forcedList.map` throws. The whole page crashes.
Fix: check the response, keep data, loading and error as separate state, and show an error with
a retry button.

**The proxy turns every error into a 500.**
The route handlers return 500 for anything that throws. So a 404 "Task not found" from the
backend, or a 400, reaches the browser as a 500. The UI can't tell "deleted" from "broken".
Fix: a `BackendError` that keeps the real status and gets forwarded. Backend down becomes 502,
timeout becomes 504.

**One failed toggle hides all tasks.**
`updateTaskStatus` uses the same `error` state as the initial load, and the list only renders
when there's no error (`TaskDashboard.tsx:47`). So one failed PATCH replaces the list with an
error box, and its Retry button refetches the list instead of retrying the toggle.
Fix: separate load errors from action errors. Show action errors as a banner and keep the list.

**Toggling two tasks quickly breaks the saving state.**
`updatingTaskId` holds one id. Click A, then B: B replaces A, and when A finishes it clears the
state while B is still saving, so B's button is clickable again mid-request.
Fix: track pending ids in a `Set`.

**Wrong error message for non-JSON errors.**
In `requestJson` (`useTasks.ts:23-30`), if the error body isn't JSON (say an HTML 502 page), the
user sees "Unexpected token <" instead of a proper message. Also the `throw` inside the `try` is
caught by its own `catch`, which only works by accident.
Fix: parse the body in its own try and fall back to "Request failed (status)".

**Bad JSON to `PATCH /api/tasks/:id` gives 500.** `request.json()` throws and ends up in the
generic 500 branch. It should be a 400.

### Performance

**The Activity Feed re-renders forever.**
A `setInterval` bumps `tick` every 1.4s (`activity/page.tsx:63-69`). That re-runs the filter
effect, which sets `shownActivity`, which triggers another effect that copies the whole list
into `forcedList`, and on odd ticks it clones every item. That's several renders every 1.4s for
data that never changes, and it gets heavier the longer the list is.
Fix: remove the timer, `forcedList` and `shownActivity` state. The visible list is just a
`useMemo` of data + search. If you want fresh data, there's a Refresh button.

**The filter runs twice.** `applyFilterA` and `applyFilterB` are the same check (`includes` vs
`indexOf`) and both run on every update. One is enough.

**Search isn't deferred.** Every keystroke filters the full list. Fine with 3 items, slow with
thousands. `useDeferredValue` handles it without a debounce timer.

### Security

**The task id isn't encoded in the backend URL.**
`backendApi.ts:38` puts the route param straight into `/tasks/${taskId}`. Next decodes the param,
so calling `/api/tasks/..%2Factivity` makes the server send `PATCH /activity` to the backend.
The proxy can reach endpoints it was never meant to.
Fix: `encodeURIComponent(taskId)`.

**`NEXT_PUBLIC_` for a server-only value.**
The backend URL is only used in route handlers, but `NEXT_PUBLIC_` values get bundled into the
client the moment someone imports that constant in a client component. That leaks an internal
address.
Fix: read `BACKEND_API_URL` in a server-only module. The old variable still works as a fallback
so existing `.env.local` files don't break.

**No timeout on backend calls.** If the backend hangs, the route handler hangs too. Added
`AbortSignal.timeout`.

### Maintainability

**The Activity Feed is one 130-line client page.**
Fetching, filtering, formatting and rendering are all in `page.tsx`, and since the whole page is
a client component it can't export `metadata`.
Fix: same structure as Tasks. A server page, an `ActivityFeed` client component, a `useActivity`
hook and an `ActivityItem` component.

**Copy-pasted fetch code in `backendApi.ts`.**
Three functions do the same fetch, check, parse, rethrow. The `try/catch` that rethrows
`new Error(error.message)` adds nothing and loses the stack.
Fix: one `backendRequest<T>()` helper.

**Route handlers are dynamic by accident.**
In Next 14, GET route handlers are cached at build time unless something makes them dynamic.
Here it's only `cache: "no-store"` on the fetch. If someone removes it, the task list freezes.
Fix: `export const dynamic = "force-dynamic"`.

**Inline styles everywhere.** No theming, no hover or media queries, new objects every render.
Moving to CSS with shared variables fixes all of that.

### Code quality

**Duplicate helpers.** `formatTimeA` and `formatTimeB` are identical, and the date is shown twice
on every row (`activity/page.tsx:124-126`). One shared `formatDateTime` and a `<time>` tag.

**Empty strings meaning "nothing".** `error: ""` and `updatingTaskId: ""`. `null` (or a `Set`)
is clearer and avoids falsy-string bugs.

**`Content-Type: application/json` on GET.** `requestJson` always sends it, even with no body.
Harmless, but it should only be set when there's a body.

### UX issues

**No loading, error or empty state in the Activity Feed.** While loading, or after an error, it
just shows an empty list, which looks like "no activity". It needs a loading skeleton, an error
with retry, and different messages for "no activity yet" and "nothing matches your search".

**Oldest activity first.** A feed should show the newest first. I kept the backend order for
compatibility and sort on the client.

**Same timestamp twice per row.** See the duplicate helpers above.

**No counts on filters, no navigation.** You can't see how many tasks are pending without
clicking, and each page only has a Back link. Counts on the filter buttons and a top nav help.

**Different status names.** The dashboard says Pending / Completed, while the report API says
todo / in-progress / done. I kept the dashboard labels since users already know them, and on the
reports page I map them: Pending is "To do", Completed is "Done".

### React best practices

**Derived state kept in state.** `shownActivity` and `forcedList` are calculated from the data
and the search text, but they're stored with `useState` and kept in sync with effects. That
means extra renders and a chance for them to go out of sync. They should be `useMemo`, or just
computed during render.

**No cleanup in fetch effects.** The fetches in the activity page and `useTasks` can set state
after unmount, and they race if they run again (Strict Mode runs effects twice in dev). Use an
`AbortController` and abort it in the cleanup.

**Functions defined inside the component.** `formatTime*` and `applyFilter*` don't use props or
state, but they're recreated on every render. Move them out of the component.

**Accessibility.** Loading isn't announced (`aria-live` / `aria-busy`), errors don't have
`role="alert"`, and the search box only has a placeholder, no label.
