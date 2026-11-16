/**
 * Graphite BullMQ + Gemini real-job benchmark.
 * Run from veda-ai-assessment/backend where bullmq/ioredis/dotenv are installed.
 * Sends up to 3 real assessment requests concurrently and reads BullMQ timestamps.
 * NO mocks, NO automatic retries, NO deletion, NO test worker.
 */
require("dotenv").config();
const { performance } = require("node:perf_hooks");
const fs = require("node:fs");
const { Queue } = require("bullmq");
const Redis = require("ioredis");

const BACKEND_URL = (
  process.env.BACKEND_URL || "https://vedaai-vl2b.onrender.com"
).replace(/\/+$/, "");
const REDIS_URL = process.env.REDIS_URL;
const USER_ID = process.env.BENCH_USER_ID || "graphite-benchmark-user";
const N = Number(process.env.JOBS || 3);
const MAX_WAIT_MS = 120_000;
const runId = new Date().toISOString().replace(/[:.]/g, "-");
if (!REDIS_URL) {
  console.error(
    "Missing REDIS_URL; set it to the SAME Redis instance used by Render.",
  );
  process.exit(1);
}
if (!Number.isInteger(N) || N < 1 || N > 3) {
  console.error("Set JOBS to 1, 2, or 3 for this initial live test.");
  process.exit(1);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
});
const queue = new Queue("assessment-generation", { connection: redis });

async function submit(i) {
  const start = performance.now();
  try {
    const response = await fetch(`${BACKEND_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
      body: JSON.stringify({
        title: `Graphite BullMQ benchmark ${runId}-${i}`,
        dueDate: "2027-01-01",
        totalQuestions: 1,
        totalMarks: 5,
        questionTypes: [{ type: "Short Answer", count: 1, marks: 5 }],
        instructions:
          "Generate one short beginner-level computer science question.",
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const apiMs = performance.now() - start;
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
    if (!response.ok || !body.jobId) {
      return {
        i,
        status: "submission_failed",
        apiMs,
        httpStatus: response.status,
        details: String(body.error || text).slice(0, 150),
      };
    }
    if (body.isCached) return { i, status: "cached_not_queued", apiMs };
    return { i, status: "submitted", jobId: String(body.jobId), apiMs };
  } catch (e) {
    return {
      i,
      status: "submission_failed",
      details: String(e.message).slice(0, 150),
    };
  }
}

async function observe(record) {
  if (!record.jobId) return record;
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const job = await queue.getJob(record.jobId);
    if (!job) return { ...record, status: "job_record_missing" };
    const state = await job.getState();
    if (state === "completed" || state === "failed") {
      const { timestamp, processedOn, finishedOn } = job;
      return {
        ...record,
        status: state,
        queuedAt: timestamp,
        processedOn,
        finishedOn,
        queueWaitMs:
          typeof processedOn === "number" ? processedOn - timestamp : null,
        workerMs:
          typeof finishedOn === "number" && typeof processedOn === "number"
            ? finishedOn - processedOn
            : null,
        totalJobMs:
          typeof finishedOn === "number" ? finishedOn - timestamp : null,
        attemptsMade: job.attemptsMade,
        failureCategory:
          state === "failed"
            ? /429|quota|rate.limit|resource.exhausted/i.test(
                job.failedReason || "",
              )
              ? "Gemini rate/quota"
              : "other"
            : undefined,
      };
    }
    await sleep(800);
  }
  return { ...record, status: "timeout_after_120s" };
}

function percentile(xs, p) {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.ceil((p / 100) * a.length) - 1];
}
function stats(label, xs) {
  if (!xs.length) return console.log(`${label}: no observations`);
  console.log(
    `${label}: P50=${percentile(xs, 50).toFixed(1)} ms | P90=${percentile(xs, 90).toFixed(1)} ms | P95=${percentile(xs, 95).toFixed(1)} ms (n=${xs.length})`,
  );
}

async function main() {
  await redis.ping();
  console.log(`Graphite: ${BACKEND_URL}`);
  console.log(
    `Submitting ${N} real requests concurrently; no retries. Using actual cloud Redis/BullMQ/Gemini.\n`,
  );
  const posted = await Promise.all(
    Array.from({ length: N }, (_, i) => submit(i + 1)),
  );
  posted.forEach((r) =>
    console.log(
      `POST #${r.i}: ${r.status}; API=${r.apiMs?.toFixed(1) ?? "-"} ms; jobId=${r.jobId || "-"}`,
    ),
  );
  const results = await Promise.all(posted.map(observe));
  console.log("\n--- JOBS ---");
  results.forEach((r) =>
    console.log(
      `#${r.i} ${r.status}: queueWait=${r.queueWaitMs?.toFixed(1) ?? "-"} ms, ` +
        `worker=${r.workerMs?.toFixed(1) ?? "-"} ms, ` +
        `queueToFinish=${r.totalJobMs?.toFixed(1) ?? "-"} ms` +
        (r.failureCategory ? `, errorType=${r.failureCategory}` : ""),
    ),
  );
  console.log("\n--- SUMMARY ---");
  stats(
    "API latency",
    results.filter((r) => Number.isFinite(r.apiMs)).map((r) => r.apiMs),
  );
  stats(
    "Queue wait",
    results
      .filter((r) => Number.isFinite(r.queueWaitMs))
      .map((r) => r.queueWaitMs),
  );
  stats(
    "Worker duration (successful)",
    results
      .filter((r) => r.status === "completed" && Number.isFinite(r.workerMs))
      .map((r) => r.workerMs),
  );
  stats(
    "Queue-to-finish (successful)",
    results
      .filter((r) => r.status === "completed" && Number.isFinite(r.totalJobMs))
      .map((r) => r.totalJobMs),
  );
  const success = results.filter(
    (r) => r.status === "completed" && Number.isFinite(r.finishedOn),
  );
  console.log(
    `Completed ${success.length}/${N}; failed jobs ${results.filter((r) => r.status === "failed").length}/${N}`,
  );
  const queued = results.filter((r) => Number.isFinite(r.queuedAt));
  if (success.length && queued.length) {
    const minutes =
      (Math.max(...success.map((r) => r.finishedOn)) -
        Math.min(...queued.map((r) => r.queuedAt))) /
      60000;
    if (minutes > 0)
      console.log(
        `Observed successful completion rate: ${(success.length / minutes).toFixed(2)} jobs/min during this batch window.`,
      );
  }
  console.log(
    "Note: 3 samples do not establish statistically reliable P95 or maximum capacity.",
  );
  const fileName = `bullmq-real-results-${runId}.json`;
  fs.writeFileSync(
    fileName,
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        backend: BACKEND_URL,
        jobs: N,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`Saved ${fileName}`);
}
main()
  .catch((e) => {
    console.error("Benchmark error:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queue.close().catch(() => {});
    redis.disconnect();
  });
