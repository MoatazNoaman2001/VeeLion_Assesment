# Code Review

Review of the starter code as it was received (first commit in this repository).
Line numbers refer to that commit. Each finding lists **what** is wrong, **why** it
matters and **how** I would fix it. Severity: 🔴 high · 🟠 medium · 🟢 low.


---

## Backend (Express.js)

### Bugs

#### 🔴 B1. PATCH /tasks/:id lets the client overwrite any field (mass assignment)
- **What:** `tasks.service.js:75-79` builds the updated task with `{ ...existingTask, ...updates }`,
  and the controller (`tasks.controller.js:44-73`) only checks that `title` or `completed` is
  *present*. Every other key in the body is written to disk.
  Reproduced: `PATCH /tasks/<id> {"completed":true,"id":"hijacked","createdAt":"1999","isAdmin":true}`
  returns and persists `id: "hijacked"` and a new `isAdmin` field.
- **Why:** a client can rename a task's id (breaking every link to it and possibly
  colliding with another task), forge `createdAt`, and store arbitrary data in the file.
- **Fix:** build the update from an allow-list (`title`, `completed`) only. The repository
  already contains `taskValidator.js`, which does this but was never wired in; use it.

#### 🔴 B2. Concurrent writes lose data (read-modify-write race)
- **What:** every task mutation does `await readJsonArray()` → change → `await writeJsonArray()`
  (`tasks.service.js:49-53`, `67-82`, `88-96`). Two requests that overlap both read the same
  snapshot and the second write discards the first.
  Reproduced: 20 parallel `POST /tasks` on a file with 3 tasks left **22** tasks instead of 23.
- **Why:** silent data loss in production, with no error for anyone.
- **Fix:** serialise mutations per file through a small in-process queue
  (`updateJsonArray(file, mutator)`), so every read-modify-write runs alone. This is
  enough for a single Node process, which is the only deployment JSON files support anyway.

#### 🟠 B3. Writes are not atomic
- **What:** `writeJsonArray` (`jsonStore.js:22-24`) and the activity service
  (`activity.service.js:47`) write straight over the live file.
- **Why:** a crash, a full disk or a kill signal halfway through a write leaves a truncated,
  unparseable JSON file, and from then on every request returns 500.
- **Fix:** write to a temp file in the same directory and `rename` it over the original
  (rename is atomic on the same filesystem).

#### 🟠 B4. A non-array JSON file is treated as empty, and the next write destroys it
- **What:** `jsonStore.js:11` returns `[]` when the file parses to anything other than an array.
- **Why:** if the file is ever hand-edited into `{ "tasks": [...] }` or similar, reads show
  "no tasks", and the next create overwrites the whole file with a single task.
  Data loss that hides itself.
- **Fix:** throw a clear error instead of pretending the store is empty.

#### 🟠 B5. Data paths depend on the process working directory
- **What:** both services resolve files with `path.join(process.cwd(), 'data', ...)`.
  Reproduced: starting the server with `node backend/src/server.js` from the repo root makes
  every request return 500 (`ENOENT ...\data\tasks.json`). If a `data/` folder happened to exist
  there, the API would silently read and write a different dataset instead.
- **Why:** behaviour changes depending on how the process manager starts the app.
- **Fix:** resolve from the source file location (`__dirname`), with a `DATA_DIR`
  environment variable as an override (which also lets tests use a temp directory).

#### 🟠 B6. Activity ids can collide
- **What:** `activity.service.js:40` uses `String(Date.now())` as the id.
- **Why:** two entries created in the same millisecond share an id. Lookups break, and the
  frontend uses the id as a React `key`, so rows can be dropped or duplicated during re-render.
- **Fix:** use the existing `createId()` (UUID) helper, as tasks already do.

#### 🟠 B7. POST /activity stores whatever it is given
- **What:** `createNewActivity` copies `b.action` and `b.info` with no checks
  (`activity.service.js:37-49`). Reproduced: `{"action":{"x":1},"info":[1,2]}` is stored as-is;
  an array body (`[1]`) creates an entry with neither field.
- **Why:** the documented contract is `action?: string, info?: string`. Objects in those
  fields break any consumer that renders or searches them (the frontend calls `.toLowerCase()`
  on them), and size is unbounded.
- **Fix:** validate the body (an object, optional strings with a length cap) and return 400
  otherwise, using the same `HttpError` flow as the tasks module.

#### 🟢 B8. Title rules differ between create and update
- **What:** create accepts a 1-character title. Update rejects anything shorter than 2
  characters (`tasks.service.js:59-61`). Reproduced: you can create `"a"` but you cannot rename a task to `"b"`.
- **Why:** inconsistent rules confuse clients, and they come from validation living in three
  places (controller, service, unused validator).
- **Fix:** one validator used by both operations (non-empty after trim, with a maximum length).
  I chose "non-empty" for both, which only *relaxes* the update rule, so no existing client breaks.

### Performance

#### 🟠 P1. Synchronous file I/O in the activity module
- **What:** `existsSync`, `readFileSync`, `writeFileSync` on every request (`activity.service.js`).
- **Why:** each call blocks the event loop, so every other request (tasks included) waits
  while the activity file is read or written. The cost grows with the file size.
- **Fix:** use the same async `jsonStore` as the tasks module.

#### 🟢 P2. Whole file read and returned on every request
- **What:** `GET /activity` and `GET /tasks` load and return the entire file. There is no
  pagination.
- **Why:** an activity log only grows, so response size and parse time grow without limit.
- **Fix (proposed):** add `?limit=&cursor=` pagination, or move to SQLite once this outgrows
  a file. I did **not** change the default response, because existing clients expect the
  full array. Pagination should be an opt-in addition agreed with the API consumers.

#### 🟢 P3. Existence check before every read
- **What:** `existsSync` followed by `readFileSync` (`activity.service.js:7-11`).
- **Why:** two syscalls where one does the job, and a check-then-act race.
- **Fix:** just read the file and handle `ENOENT`, as `jsonStore` already does.

### Security

#### 🔴 S1. Mass assignment on PATCH: see B1

#### 🟠 S2. No limits on input size
- **What:** titles, `action` and `info` have no maximum length. `express.json()` uses the
  default 100 kb limit, so a single request can still store ~100 kb of text, and it can
  be repeated.
- **Why:** an easy way to bloat the JSON files and slow every read (see P2).
- **Fix:** cap field lengths in validation (done: 200 characters for titles, 500 for activity
  fields), set an explicit `express.json({ limit: '10kb' })` (done). Rate limiting belongs at
  the proxy or gateway level (not done, out of scope).

#### 🟢 S3. Framework fingerprinting via `X-Powered-By: Express`
- **Why:** it tells attackers which stack and which CVEs to try.
- **Fix:** `app.disable('x-powered-by')`. In a real deployment I would add `helmet`; I kept
  dependencies unchanged here.

#### 🟢 S4. No authentication or authorisation
- Anyone who can reach the port can read, change and delete everything. That is acceptable
  for this exercise because the API sits behind the Next.js server proxy, but it must not be
  exposed publicly as-is. Noted so it is a conscious decision, not an oversight.

### Maintainability

#### 🟠 M1. Validation duplicated in three places, and the real validator is unused
- **What:** the tasks controller validates, the service validates again with *different*
  rules, and `utils/taskValidator.js` (the cleanest of the three) is never imported.
- **Why:** rules drift (see B8). Every change has to be made three times, and
  readers cannot tell which one is authoritative.
- **Fix:** controller → validator → service. The service trusts already-normalised input.

#### 🟠 M2. Services mix business logic with file access
- **What:** each service builds its own file path and calls `fs`/`jsonStore` directly.
- **Why:** the new Reports module needs to read both datasets. Without a data-access
  layer it would have to copy the file paths and parsing a third time.
- **Fix:** a small repository per module (`tasks.repository.js`, `activity.repository.js`)
  that owns its file. Services and Reports use the repositories.

#### 🟢 M3. Duplicate functions `loadDataA` / `loadDataB`
- **What:** two byte-for-byte identical functions (`activity.service.js:6-30`).
- **Fix:** one function (and then replaced by the repository).

#### 🟢 M4. Inconsistent response envelopes
- **What:** tasks responses are wrapped in `{ data }`, activity responses are raw arrays/objects.
- **Why:** each client needs per-endpoint parsing.
- **Fix (proposed):** version the API (`/v2`) or add the envelope behind a flag. I kept both
  shapes, because changing them would break production clients.

#### 🟢 M5. No automated tests
- **Fix:** added `node:test` tests (no new dependencies) covering validation, mass-assignment
  protection, concurrent writes and the reports aggregation, run against a temporary data directory.

### Code quality

#### 🟢 Q1. Unclear names in the activity module
- `aSvc`, `c`, `x`, `b`, `one`, `made`, `fp`, and `get_activity` (snake_case among camelCase).
  Renamed to say what they hold.

#### 🟢 Q2. Controller mutates `req.body`
- `tasks.controller.js:26,32` rewrites `payload.title` / `payload.completed` in place.
  Mutating the request makes the data flow hard to follow, and it surprises any later middleware.
  The validator now returns a new, normalised object.

#### 🟢 Q3. Activity routes are not wrapped in `asyncHandler`
- They only worked because the handlers were synchronous. Once I/O is async, a rejected
  promise would crash the process (Express 4 does not catch rejections). Wrapped like the tasks routes.

#### 🟢 Q4. Dead fallback in `id.js`
- `randomUUID` exists in every supported Node version (≥14.17). The `Date.now()+Math.random()`
  fallback is weaker than a UUID and is never reached. Removed.

#### 🟢 Q5. Port mismatch across the project
- The backend defaults to **3000**, while the frontend `.env.example`, `lib/constants.ts` and
  `docs/backend-endpoints.md` all assume **4000**, and `next dev` also defaults to 3000.
  Following the README gives a frontend that cannot reach its API. I kept the backend on 3000
  (the documented production port), pointed the frontend config at it, and pinned the
  frontend dev server to 3001.

---

## Frontend (Next.js)

### Bugs

#### 🔴 F1. Activity Feed crashes when the API returns an error
- **What:** `app/activity/page.tsx:48-55` never checks `response.ok`. When the backend is down,
  `/api/activity` returns `500 { error: {...} }`, and that **object** is stored as the list
  (`data || []` is truthy). `forcedList.map` then throws and the whole page crashes.
- **Why:** an outage in one service takes the page down with an unhelpful error.
- **Fix:** check `response.ok`, keep `data`, `error` and `loading` as separate states, and
  render an error state with a retry button.

#### 🔴 F2. Proxy route handlers turn every backend error into 500
- **What:** `app/api/tasks/[id]/route.ts:23-27` (and the other handlers) respond with status 500
  for *any* thrown error. A backend `404 Task not found` or `400` validation error reaches the
  browser as a 500.
- **Why:** the UI cannot tell "this task was deleted" from "the server is broken". Monitoring
  also sees false 500s.
- **Fix:** throw a typed `BackendError` that carries the upstream status, and forward it.
  An unreachable backend maps to `502`, a timeout to `504`.

#### 🟠 F3. One failed toggle hides the whole task list
- **What:** `updateTaskStatus` sets the same `error` state as the initial load, and
  `TaskDashboard.tsx:47` only renders the list when `!error`.
- **Why:** a single failed PATCH replaces every task with an error box whose "Retry" refetches
  the list instead of retrying the action. The user loses their context.
- **Fix:** keep load errors and action errors separate. Show action errors as a dismissible
  banner above the list, which stays visible.

#### 🟠 F4. Toggling two tasks quickly re-enables a button that is still saving
- **What:** `updatingTaskId` holds a single id (`useTasks.ts:40`). Start task A, then task B:
  B overwrites A, and when A finishes it clears the state to `""` while B is still in flight.
- **Why:** B's button becomes clickable again during its request, so double submits are
  possible and the "Saving…" feedback is wrong.
- **Fix:** track pending ids in a `Set`.

#### 🟠 F5. Error parsing reports the wrong message
- **What:** in `requestJson` (`useTasks.ts:23-30`), when an error response is not JSON (for example
  an HTML 502 page from a proxy), the `catch` surfaces the JSON `SyntaxError`
  ("Unexpected token <…") instead of the status-based fallback. The `throw` inside the `try`
  is also caught by its own `catch` and re-wrapped, which works only by accident.
- **Fix:** parse the body in its own `try` and fall back to `Request failed (status)`.

#### 🟠 F6. Malformed JSON to `PATCH /api/tasks/:id` returns 500
- **What:** `await request.json()` throws on invalid JSON and lands in the generic 500 branch.
- **Fix:** catch the parse error and return 400.

### Performance

#### 🔴 FP1. Activity Feed re-renders forever on a 1.4 s timer
- **What:** `setInterval` increments `tick` every 1.4 s (`activity/page.tsx:63-69`). `tick` is a
  dependency of the filter effect, which writes `shownActivity`. That triggers another effect
  that copies the whole list into `forcedList`, and on odd ticks it clones every object. So
  each tick costs at least three renders, and every row re-renders, for data that never changes.
- **Why:** constant CPU and battery use for no visible benefit, and it scales with the list
  size. The clones also defeat any memoisation.
- **Fix:** remove the timer, `forcedList`, and `shownActivity` as state. The visible list is
  a `useMemo` of `(activity, query)`. Data refresh is now an explicit **Refresh** button.

#### 🟠 FP2. The same filter runs twice per update
- `applyFilterA` and then `applyFilterB` on its output (`activity/page.tsx:72-73`). They are
  the same predicate written with `includes` and with `indexOf`. Removed the duplicate.

#### 🟢 FP3. Search is not deferred
- Each keystroke filters the full list synchronously. Fine at 3 items, janky at thousands.
  `useDeferredValue` keeps typing responsive without adding a debounce timer.

### Security

#### 🟠 FS1. Unencoded id interpolated into the upstream URL
- **What:** `backendApi.ts:38` builds `` `${BACKEND}/tasks/${taskId}` `` from the route param.
  Next.js decodes the param, so `/api/tasks/..%2Factivity` produces `/tasks/../activity`, which
  the URL parser normalises to **`PATCH /activity`**. The proxy can reach endpoints it was never
  meant to expose.
- **Fix:** `encodeURIComponent(taskId)`.

#### 🟠 FS2. Server-only config uses the `NEXT_PUBLIC_` prefix
- **What:** `NEXT_PUBLIC_BACKEND_API_URL` is only needed by server route handlers, but
  `NEXT_PUBLIC_` variables are inlined into any client bundle that imports `lib/constants.ts`.
- **Why:** it leaks internal infrastructure addresses to the browser as soon as someone
  imports the constant in a client component.
- **Fix:** read `BACKEND_API_URL` in a server-only module. `NEXT_PUBLIC_BACKEND_API_URL` is still
  accepted as a fallback so existing `.env.local` files keep working.

#### 🟢 FS3. No timeout on upstream requests
- A hung backend keeps Next.js route handlers open indefinitely. Added `AbortSignal.timeout`.

### Maintainability

#### 🟠 FM1. Activity Feed is a single 130-line client page
- Fetching, filtering, formatting and rendering all live in `app/activity/page.tsx`, and the
  whole route is a client component (so it cannot export `metadata`).
- **Fix:** server `page.tsx` (metadata, header) → client `ActivityFeed` → `useActivity` hook
  + presentational `ActivityItem`, mirroring the Tasks module's structure.

#### 🟠 FM2. Copy-pasted fetch logic in `backendApi.ts`
- Three functions repeat the same fetch → check → parse → re-throw. The `try/catch` that
  re-throws `new Error(error.message)` adds nothing and drops the original stack.
- **Fix:** one `backendRequest<T>()` helper. Each endpoint becomes a short function.

#### 🟢 FM3. Route handlers rely on implicit dynamic rendering
- GET route handlers in Next 14 are statically cached unless something marks them dynamic.
  Here that only happens because `fetch` uses `cache: "no-store"`. Remove that option and the
  task list would be frozen at build time. Added `export const dynamic = "force-dynamic"`.

#### 🟢 FM4. Inline styles everywhere
- Most layout is in `style={{…}}` objects. They cannot be themed, cannot use media queries or
  hover states, and they create new objects every render. Moved to CSS with design tokens.

### Code quality

#### 🟢 FQ1. Duplicate helpers
- `formatTimeA` / `formatTimeB` are identical, and the timestamp is rendered **twice** per row
  (`activity/page.tsx:124-126`). Replaced by one shared `formatDateTime` util and a `<time>` element.

#### 🟢 FQ2. Empty-string sentinels
- `error: ""` and `updatingTaskId: ""` stand in for "none". `null` (or a `Set`) says what is meant
  and keeps falsy-string bugs out.

#### 🟢 FQ3. `Content-Type: application/json` on GET requests
- `requestJson` sends a body content type on requests that have no body. Harmless, but it shows
  the helper was copy-pasted rather than designed. It is now set only when a body is sent.

### UX issues

#### 🟠 FU1. Activity Feed has no loading, error or empty states
- While fetching, and after a failure, the page shows an empty list that looks like "no activity".
  Added a skeleton, an error state with retry, and distinct empty states for "no activity yet"
  and "no matches for this search".

#### 🟠 FU2. Activity is shown oldest-first
- A feed is read newest-first. The backend returns entries in insertion order (unchanged for
  compatibility), so the client sorts by `when` descending.

#### 🟢 FU3. Timestamp shown twice per activity row

#### 🟢 FU4. Filters don't show counts, and there is no global navigation
- You can't see how many tasks are pending without clicking. Each page has only a "Back"
  link to the home page. Added counts on filter chips and a persistent top nav with the
  active page highlighted.

#### 🟢 FU5. Status wording
- The dashboard says *Pending / Completed*, while the report contract says
  *todo / in-progress / done*. I kept the dashboard labels (users know them) and mapped them
  on the reports page: *pending → To do*, *completed → Done*.

### React best practices

#### 🟠 FR1. Derived state stored in state
- `shownActivity` and `forcedList` are pure functions of `allActivity` + `query`, but they are
  kept in `useState` and synchronised with effects. That means extra renders and states that can go out of sync.
  Derived values belong in `useMemo` (or are just computed during render).

#### 🟠 FR2. Effects without cleanup for async work
- The fetch in `activity/page.tsx` and `useTasks` sets state after unmount and races when
  re-triggered (Strict Mode runs effects twice in development). Requests now use an
  `AbortController` that is aborted on cleanup.

#### 🟢 FR3. Functions declared inside the component body
- `formatTime*` and `applyFilter*` are re-created on every render and don't use props or
  state. They now live at module level.

#### 🟢 FR4. Missing accessibility semantics
- Loading text is not announced (`aria-live`/`aria-busy` missing), errors are not `role="alert"`,
  and the search input has only a placeholder (no label). Fixed.
