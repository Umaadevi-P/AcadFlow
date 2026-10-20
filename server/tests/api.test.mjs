/**
 * End-to-end API tests for AcaFlow, run against an in-memory MongoDB so no local
 * database install is required.
 *   node tests/api.test.mjs
 *
 * Covers the full student→staff journey plus the security rules:
 * login, /me, documents search/details, request creation, ownership isolation,
 * role-based workflow actions, and invalid-transition rejection.
 */

// Configure environment BEFORE importing any app module so env.js picks these up.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:8443";
// Give the in-memory MongoDB instance longer to start on Windows.
process.env.MONGOMS_TIMEOUT = "60000";

import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let passed = 0;
let failed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed++;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`      ${err.message}`);
    });
}

let baseUrl;
let studentToken;
let staffToken;
let arjunToken;
let createdRequestId;

async function main() {
  // Start the in-memory MongoDB, THEN point the app at it, THEN import the app
  // modules (env.js captures MONGODB_URI at import time).
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
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const api = (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    return fetch(`${baseUrl}${path}`, { ...options, headers });
  };
  const json = async (path, options) => {
    const res = await api(path, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON response */
    }
    return { status: res.status, body };
  };

  console.log("End-to-end API tests (in-memory MongoDB):");

  await check("health endpoint reports ok", async () => {
    const { status, body } = await json("/api/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  await check("login as student succeeds and returns a token", async () => {
    const { status, body } = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "umaadevi@university.edu", password: "password123" }),
    });
    assert.equal(status, 200);
    assert.ok(body.token, "token missing");
    assert.equal(body.user.name, "Umaadevi");
    assert.equal(body.user.role, "student");
    studentToken = body.token;
  });

  await check("login with wrong password is rejected (401)", async () => {
    const { status } = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "umaadevi@university.edu", password: "wrong" }),
    });
    assert.equal(status, 401);
  });

  await check("login without a token cannot reach /me (401)", async () => {
    const { status } = await json("/api/auth/me");
    assert.equal(status, 401);
  });

  await check("/me returns the authenticated student", async () => {
    const { status, body } = await json("/api/auth/me", { token: studentToken });
    assert.equal(status, 200);
    assert.equal(body.user.studentId, "CSE21001");
  });

  await check("documents list returns 6 active documents", async () => {
    const { status, body } = await json("/api/documents", { token: studentToken });
    assert.equal(status, 200);
    assert.equal(body.count, 6);
  });

  await check("search by 'visa' returns the bonafide document", async () => {
    const { body } = await json("/api/documents?q=visa", { token: studentToken });
    const names = body.documents.map((d) => d.name);
    assert.ok(names.includes("Bonafide Certificate"));
  });

  await check("search by 'master abroad' normalises to higher studies", async () => {
    const { body } = await json("/api/documents?q=I%20need%20documents%20for%20my%20master%27s%20abroad", {
      token: studentToken,
    });
    const names = body.documents.map((d) => d.name);
    assert.ok(names.includes("Academic Transcript"), "expected Transcript in results");
  });

  await check("document details by slug include requirements + workflow", async () => {
    const { status, body } = await json("/api/documents/bonafide", { token: studentToken });
    assert.equal(status, 200);
    assert.equal(body.document.slug, "bonafide");
    assert.ok(body.document.requirements.length >= 4);
    assert.equal(body.document.workflow.length, 5);
  });

  await check("unknown document slug returns 404", async () => {
    const { status } = await json("/api/documents/does-not-exist", { token: studentToken });
    assert.equal(status, 404);
  });

  await check("student creates a bonafide request and gets an AF- id", async () => {
    const { status, body } = await json("/api/requests", {
      method: "POST",
      token: studentToken,
      body: JSON.stringify({ documentSlug: "bonafide", purpose: "Internship", notes: "Summer internship offer" }),
    });
    assert.equal(status, 201);
    assert.ok(/^AF-\d+$/.test(body.request.requestId), `unexpected id ${body.request.requestId}`);
    assert.equal(body.request.status, "submitted");
    createdRequestId = body.request.requestId;
  });

  await check("student's request list includes seeded + new requests", async () => {
    const { body } = await json("/api/requests", { token: studentToken });
    const ids = body.requests.map((r) => r.requestId);
    assert.ok(ids.includes("AF-2048"));
    assert.ok(ids.includes("AF-1983"));
    assert.ok(ids.includes("AF-1856"));
    assert.ok(ids.includes(createdRequestId));
  });

  await check("request detail returns activity history", async () => {
    const { status, body } = await json(`/api/requests/AF-2048`, { token: studentToken });
    assert.equal(status, 200);
    assert.equal(body.request.requestId, "AF-2048");
    assert.ok(body.activity.length >= 1);
  });

  await check("student cannot approve their own request (403)", async () => {
    const { status } = await json(`/api/requests/${createdRequestId}/status`, {
      method: "PATCH",
      token: studentToken,
      body: JSON.stringify({ action: "approve" }),
    });
    assert.equal(status, 403);
  });

  await check("login as staff succeeds", async () => {
    const { status, body } = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "staff@university.edu", password: "password123" }),
    });
    assert.equal(status, 200);
    staffToken = body.token;
  });

  await check("staff can approve the student's new request", async () => {
    const { status, body } = await json(`/api/requests/${createdRequestId}/status`, {
      method: "PATCH",
      token: staffToken,
      body: JSON.stringify({ action: "approve", comment: "Looks good." }),
    });
    assert.equal(status, 200);
    assert.equal(body.request.status, "approved");
    assert.ok(body.request.approvedAt);
  });

  await check("cannot transition out of an approved request (409)", async () => {
    const { status } = await json(`/api/requests/${createdRequestId}/status`, {
      method: "PATCH",
      token: staffToken,
      body: JSON.stringify({ action: "reject" }),
    });
    assert.equal(status, 409);
  });

  await check("staff can request changes on AF-2048", async () => {
    const { status, body } = await json(`/api/requests/AF-2048/status`, {
      method: "PATCH",
      token: staffToken,
      body: JSON.stringify({ action: "request_changes", comment: "Add passport number." }),
    });
    assert.equal(status, 200);
    assert.equal(body.request.status, "correction_required");
  });

  await check("student can resubmit a correction_required request", async () => {
    const { status, body } = await json(`/api/requests/AF-1983/status`, {
      method: "PATCH",
      token: studentToken,
      body: JSON.stringify({ action: "resubmit", purpose: "Higher studies" }),
    });
    assert.equal(status, 200);
    assert.equal(body.request.status, "submitted");
  });

  await check("invalid action is rejected (400)", async () => {
    const { status } = await json(`/api/requests/AF-1983/status`, {
      method: "PATCH",
      token: staffToken,
      body: JSON.stringify({ action: "mystery" }),
    });
    assert.equal(status, 400);
  });

  await check("request_changes without a comment is rejected (400)", async () => {
    const { status } = await json(`/api/requests/AF-1983/status`, {
      method: "PATCH",
      token: staffToken,
      body: JSON.stringify({ action: "request_changes" }),
    });
    assert.equal(status, 400);
  });

  await check("login as another student (Arjun) succeeds", async () => {
    const { status, body } = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "arjun@university.edu", password: "password123" }),
    });
    assert.equal(status, 200);
    arjunToken = body.token;
  });

  await check("another student cannot read Umaadevi's request (403)", async () => {
    const { status } = await json(`/api/requests/AF-2048`, { token: arjunToken });
    assert.equal(status, 403);
  });

  await check("another student only sees their own (empty) requests", async () => {
    const { body } = await json("/api/requests", { token: arjunToken });
    assert.equal(body.requests.length, 0);
  });

  await check("staff sees all requests across students", async () => {
    const { body } = await json("/api/requests", { token: staffToken });
    assert.ok(body.requests.length >= 4);
  });

  console.log(`\n${passed} passed, ${failed} failed.`);
  await mongoose.disconnect();
  await memory.stop();
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Test harness error:", err);
  process.exit(1);
});
