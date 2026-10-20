/**
 * Cross-origin integration smoke test.
 * Starts the real Express app against an in-memory MongoDB, then makes
 * browser-style requests (with an Origin header, including a CORS preflight)
 * to confirm the React frontend on :8443 can reach the API on :5000.
 *   node tests/integration.mjs
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:8443";
process.env.MONGOMS_TIMEOUT = "60000";

import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const ORIGIN = "http://localhost:8443";
let passed = 0;
let failed = 0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}\n      ${e.message}`); }
};

async function main() {
  const memory = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memory.getUri();
  const { connectDB } = await import("../src/config/db.js");
  const { runSeed } = await import("../src/seed/seed.js");
  const { createApp } = await import("../src/app.js");
  await connectDB();
  await runSeed();

  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  console.log("Cross-origin integration tests:");

  await check("CORS preflight for login returns 204 + allow-origin + allow-credentials", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    const allowHeaders = (res.headers.get("access-control-allow-headers") || "").toLowerCase();
    assert.ok(allowHeaders.includes("authorization"), "Authorization header not allowed");
  });

  await check("login from the frontend origin succeeds cross-origin", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ email: "umaadevi@university.edu", password: "password123" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
  });

  let token;
  {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN },
      body: JSON.stringify({ email: "umaadevi@university.edu", password: "password123" }),
    });
    token = (await res.json()).token;
  }

  await check("documents list reachable with Bearer token cross-origin", async () => {
    const res = await fetch(`${base}/api/documents`, {
      headers: { Origin: ORIGIN, Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 6);
  });

  await check("document details reachable cross-origin", async () => {
    const res = await fetch(`${base}/api/documents/bonafide`, {
      headers: { Origin: ORIGIN, Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.document.slug, "bonafide");
  });

  console.log(`\n${passed} passed, ${failed} failed.`);
  server.close();
  await mongoose.disconnect();
  await memory.stop();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("Harness error:", e); process.exit(1); });
