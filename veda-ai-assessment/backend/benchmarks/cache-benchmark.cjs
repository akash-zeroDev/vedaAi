/**
 * Graphite Redis assignment-list cache benchmark
 * Measures real deployed GET /api/assignments, comparing:
 *   - Redis cache MISS -> MongoDB query + Redis SET
 *   - Redis cache HIT  -> Redis GET
 *
 * NO assignment creation, NO Gemini calls, NO database writes.
 * Deletes only the assignment-list cache key for BENCH_USER_ID.
 *
 * Run from veda-ai-assessment/backend (where ioredis/dotenv are installed):
 * BACKEND_URL=https://vedaai-vl2b.onrender.com \
 * BENCH_USER_ID=graphite-benchmark-user \
 * RUNS=20 node benchmarks/cache-benchmark.cjs
 */
require("dotenv").config();
const Redis = require("ioredis");
const assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const { randomUUID } = require("node:crypto");

const BASE_URL = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
const USER_ID = process.env.BENCH_USER_ID || "graphite-benchmark-user";
const RUNS = Number(process.env.RUNS || 20);
const REDIS_URL = process.env.REDIS_URL;

if (!BASE_URL || !/^https?:\/\//.test(BASE_URL)) {
  console.error("Set BACKEND_URL to the deployed Express backend URL.");
  process.exit(1);
}
if (!REDIS_URL) {
  console.error("Set REDIS_URL in backend/.env to the *same* Redis used by Render.");
  process.exit(1);
}
if (!Number.isInteger(RUNS) || RUNS < 1 || RUNS > 100) {
  console.error("RUNS must be an integer between 1 and 100.");
  process.exit(1);
}

const KEY = `assignments:user:${USER_ID}`;
const redis = new Redis(REDIS_URL, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

async function getAssignmentList() {
  const start = performance.now();
  const url = `${BASE_URL}/api/assignments?benchmark=${randomUUID()}`;
  const response = await fetch(url, {
    headers: {
      "x-user-id": USER_ID,
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  const elapsedMs = performance.now() - start;
  if (!response.ok) {
    throw new Error(`GET /api/assignments returned ${response.status}: ${body.slice(0, 300)}`);
  }
  let data;
  try { data = JSON.parse(body); } catch {
    throw new Error("API did not return valid JSON");
  }
  if (!Array.isArray(data)) {
    throw new Error("Expected GET /api/assignments to return an array");
  }
  return { elapsedMs, data };
}

function percentile(numbers, p) {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.ceil(p / 100 * sorted.length) - 1];
}
function summary(numbers) {
  return {
    p50: percentile(numbers, 50),
    p90: percentile(numbers, 90),
    p95: percentile(numbers, 95),
    mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
  };
}
function show(label, xs) {
  const x = summary(xs);
  console.log(`${label.padEnd(20)} P50=${x.p50.toFixed(1)} ms | P90=${x.p90.toFixed(1)} ms | P95=${x.p95.toFixed(1)} ms | avg=${x.mean.toFixed(1)} ms`);
}

async function main() {
  try {
    const pong = await redis.ping();
    if (pong !== "PONG") throw new Error("Redis PING failed");
    console.log(`Connected to Redis. Testing ${BASE_URL}`);
    console.log(`User: ${USER_ID}; key: ${KEY}; paired runs: ${RUNS}`);
    console.log("Only this one user-list cache key will be deleted (not MongoDB records).\n");

    // Warm up HTTP connection/Render service; discarded from statistics.
    const initial = await getAssignmentList();
    console.log(`Warmup: ${initial.data.length} assignments returned.`);
    if (initial.data.length === 0) {
      throw new Error("No assignments found for benchmark user. Use the x-user-id from your earlier 30-job run for a realistic cache test.");
    }

    const misses = [], hits = [];
    for (let i = 1; i <= RUNS; i++) {
      await redis.del(KEY); // Forces only this user's assignment-list cache MISS.
      const cold = await getAssignmentList();
      const ttl = await redis.ttl(KEY); // Should be near 3600s on first use.
      if (ttl <= 0) {
        throw new Error(`Cache key was not populated after cold request (TTL=${ttl}). Verify REDIS_URL matches the deployed backend's Redis.`);
      }
      const warm = await getAssignmentList(); // Redis HIT, no Gemini.
      assert.deepEqual(warm.data, cold.data, "Cache HIT and MISS returned different results");
      misses.push(cold.elapsedMs);
      hits.push(warm.elapsedMs);
      console.log(`#${String(i).padStart(2)} | MISS ${cold.elapsedMs.toFixed(1)} ms | HIT ${warm.elapsedMs.toFixed(1)} ms | records ${cold.data.length}`);
    }

    console.log("\n--- CLIENT-OBSERVED API LATENCY ---");
    show("Cache MISS (MongoDB)", misses);
    show("Cache HIT (Redis)", hits);
    const missP50 = percentile(misses, 50);
    const hitP50 = percentile(hits, 50);
    const diff = missP50 - hitP50;
    console.log(`P50 difference: ${diff.toFixed(1)} ms`);
    console.log(`P50 speedup: ${(missP50/hitP50).toFixed(2)}x`);
    console.log(`P50 reduction: ${(100*(1-hitP50/missP50)).toFixed(1)}%`);
    console.log("\nNote: These timings include internet/network and Render latency.");
    console.log("Avoid interpreting this as raw Redis operation latency.");
    console.log("No Gemini calls were made.");
  } finally {
    redis.disconnect();
  }
}

main().catch(err => {
  console.error("\nBenchmark failed:", err.message);
  process.exitCode = 1;
});
