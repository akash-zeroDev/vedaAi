# Assessment retry handling

The queue is still `assessment-generation`; the worker still runs with concurrency **2**.
No new environment variables or dependencies are required.

## Lifecycle

New and regenerated assignments start `pending`. Each active attempt changes its
own generation to `processing`. A retryable attempt changes it back to `pending`
and throws a safe `AssessmentAttemptError`. BullMQ schedules the retry natively;
there is no provider retry loop. Jobs have **three total attempts**.

The custom strategy uses a 2-second exponential base with positive jitter:
2–3 seconds before attempt two and 4–6 seconds before attempt three. A provider
delay overrides the minimum, with jitter added above it, never below it. Delays
are capped at 120 seconds; a recommendation beyond that budget is terminal
instead of being shortened. There are no immediate retry storms from ambiguous
quota errors.

BullMQ emits its local `failed` event on retryable attempts too. Only an actual
native `failed` state triggers terminal reconciliation. MongoDB changes to
`failed` and emits `assignment:updated` failure only then. A bounded reconciliation
pass runs at worker readiness and every minute, paging through 50 failed jobs
per pass. This repairs a missed event or a MongoDB outage after the native
terminal transition. Reconciliation only reads queue metadata and finalizes
MongoDB; it never calls Gemini or re-enqueues failed jobs.

MongoDB retains the existing four statuses; no `retrying` enum or UI redesign is
needed. Polling continues through pending/delayed retries and only presents a
durable failure from the API. Poll requests have a 15-second timeout, are
cancelled on unmount/cancel, and do not overlap.

## Classification and provider transport

`assessmentRetry.ts` inspects the installed SDK's `GoogleGenerativeAIFetchError`
`status` and `errorDetails`, including `google.rpc.QuotaFailure` and
`google.rpc.RetryInfo`. It understands both protobuf duration strings and
seconds/nanoseconds objects. Free-text daily-quota matching is a fallback,
not the primary classifier.

| Failure | Policy |
| --- | --- |
| Gemini 500/502/503/504 | Retry, within the provider-delay budget |
| Temporary connection/reset/DNS-retry errors and timeouts | Retry |
| Temporary MongoDB network/selection/operation timeouts | Retry without regenerating a saved result |
| 429 with RetryInfo/Retry-After, without daily/zero quota | Retry no sooner than the recommended delay |
| Structured per-minute/second 429 without a delay | Conservatively wait 60/1 seconds, also respecting exponential backoff |
| Daily quota, zero quota, ambiguous 429, excessive delay | Stop immediately |
| 400, 401, 403, unsupported/blocked/malformed output, unknown permanent errors | Stop immediately |

Terminal attempts throw `UnrecoverableError`, even if the configured retry budget
has not been consumed. Three attempts is also enforced when an externally
created job specifies a larger budget. Existing queued jobs without `attempts`
retain their previous one-attempt behavior.

`@google/generative-ai` 0.24.1 discards HTTP response headers and wraps network
causes. The backend router therefore uses a single native `fetch` request to the
same Gemini 2.5 Flash REST endpoint, with the unchanged prompt, inline file
parts, response schema and token accounting. It constructs the installed SDK's
structured HTTP errors while retaining Retry-After, and preserves network
causes. API keys are sent in a header. Each request has a 60-second timeout.
There are no SDK/transport retries on top of BullMQ's attempts.

## Idempotence and notifications

- Results use an atomic `$setOnInsert` upsert with a deterministic MongoDB `_id`
  for each assignment/generation. Concurrent inserts use the existing unique
  `_id` index; no new unique-index migration is needed. Duplicate-key races read
  the winning document.
- Token usage is persisted with the result. Retries first check for a valid
  saved result and reuse it to finalize, without paying for another Gemini call.
- An optional `generationId` fences regeneration. Old delayed/in-flight jobs
  cannot overwrite a newer generation's status. Result reads check the current
  generation and only expose completed results. Historical jobs/results without
  a generation token remain readable.
- Creation/regeneration responses and terminal Socket.IO events include the
  optional generation token; existing response fields remain unchanged. The
  frontend stores it and ignores late events from superseded generations.
- Atomic compare-and-set terminal status transitions claim the right to emit
  completion/failure. Repeated native events and job redelivery do not emit
  duplicate terminal notifications for the same generation.
- Completion is emitted after result persistence and terminal MongoDB status.
  Cache operations are best effort and bounded at two seconds. Socket/cache
  failures do not trigger another paid generation or undo completed status.
- JSON logs include job/assignment IDs, attempt budget, category, HTTP status,
  retry delay and outcome. Raw provider errors, keys, prompts, generated papers
  and uploaded content are not logged by the assessment path.

## Tests

From `backend/`:

```sh
npm run build
npm test
```

Tests use Node's built-in test runner and the existing ts-node. They mock Gemini,
MongoDB, Socket.IO and Redis Lua I/O, but execute the installed BullMQ
`Job.moveToFailed`, backoff selection and `UnrecoverableError` handling. No
production services, real Gemini quota, external Redis or new test dependencies
are needed. They cover success, retries/exhaustion, structured quota/auth errors,
durable-result recovery, atomic persistence, safe logs, regeneration fencing,
duplicate notifications and terminal reconciliation after a database outage.
The actual frontend hook is also executed with mocked browser/React effects to
verify long polling, terminal errors, cancellation, generation fencing and the
existing successful-navigation path.

## Changed files

Paths below are relative to `veda-ai-assessment/`.

| File | Purpose |
| --- | --- |
| `backend/src/queues/assessmentQueue.ts` | Three-attempt defaults and job generation ownership |
| `backend/src/utils/assessmentRetry.ts` | Structured error classification and native custom backoff |
| `backend/src/utils/llmRouter.ts` | One bounded Gemini request retaining provider retry headers/details |
| `backend/src/utils/promptBuilder.ts` | Remove raw generated-content logging; safe JSON parse error |
| `backend/src/workers/assessmentWorker.ts` | Worker wiring, concurrency 2, bounded caches and terminal reconciliation |
| `backend/src/workers/assessmentProcessor.ts` | Attempt lifecycle, outcome notifications and reconciliation policy |
| `backend/src/workers/assessmentPersistence.ts` | Atomic status claims and idempotent, generation-scoped result upserts |
| `backend/src/models/Assignment.ts` | Optional generation ownership token |
| `backend/src/models/Result.ts` | Durable generation token and token usage |
| `backend/src/services/assignment.service.ts` | Generation creation/rotation and safe result/cache reads |
| `frontend/src/lib/models/Assignment.ts` | Match the optional generation field |
| `frontend/src/store/useAssessmentStore.ts` | Track/reset the currently displayed generation |
| `frontend/src/hooks/useAssignmentLifecycle.ts` | Retry-safe polling and stale Socket.IO event filtering |
| `frontend/src/app/dashboard/output/[jobId]/page.tsx` | Track ownership when loading/regenerating assessments |
| `backend/tests/assessment-retry.test.cjs` | Native BullMQ retry decisions and mocked failure lifecycle |
| `backend/tests/assessment-persistence.test.cjs` | Atomic MongoDB operation contracts and duplicate-key recovery |
| `backend/tests/assignment-service.test.cjs` | API contracts, generation fencing and historical compatibility |
| `backend/tests/gemini-transport.test.cjs` | Mocked HTTP/schema/headers and safe provider errors |
| `backend/tests/frontend-polling.test.cjs` | Execute the frontend hook with mocked browser effects |
| `backend/package.json` | Enable automated tests using installed Node/ts-node tooling |
| `backend/RETRY_HANDLING.md` | Retry behavior, testing and deployment guidance |

## Deployment considerations and limits

Deploy the backend and frontend changes together when ready; this task does not
deploy, migrate production data, change credentials, or run live load tests.
Drain/stop old workers before deploying the new queue policy: an old worker does
not know the new custom strategy or generation tokens. Do not run old and new
worker implementations against the same queue during a rolling deployment.

BullMQ is at-least-once. A crash after Gemini answers but **before** MongoDB saves
the result can still require another provider call. MongoDB and Redis cannot be
committed atomically here. A persisted valid result takes precedence during
terminal reconciliation; BullMQ may retain a failed bookkeeping record even
though the assignment is recovered as completed. Logs distinguish that recovery.

Socket.IO is best effort, not a durable message broker. A crash after the status
claim but before emit can lose an event; API polling is the recovery mechanism.
This implementation prevents duplicate emissions from normal redelivery; it
does not promise transactional exactly-once delivery to a browser.

A stale in-flight generation can leave an unreferenced result if regeneration
happens precisely during its database write. It is isolated by its generation
token and cannot replace the current generation. Already-existing historical
duplicate documents are not automatically deleted. Authentication and the
separate toolkit workers are outside this change.

Provider delay/backoff is per job, not a global Gemini rate limiter. Sustained
traffic above account quota still requires admission control or a queue-wide
limiter. No daily-quota job is automatically retried the next day.
