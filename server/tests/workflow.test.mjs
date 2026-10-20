/**
 * Pure-logic tests for the workflow state machine. No database needed.
 * Run with:  node tests/workflow.test.mjs
 */
import assert from "node:assert/strict";
import {
  STATUS,
  STAGE_LABELS,
  ACTION_TO_STATUS,
  canTransition,
  isValidStatus,
} from "../src/utils/workflow.js";

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("Workflow state-machine tests:");

check("draft → submitted is allowed for a student", () => {
  assert.equal(canTransition(STATUS.DRAFT, STATUS.SUBMITTED, "student"), true);
});

check("student cannot approve a request", () => {
  assert.equal(canTransition(STATUS.SUBMITTED, STATUS.APPROVED, "student"), false);
});

check("staff can approve a submitted request", () => {
  assert.equal(canTransition(STATUS.SUBMITTED, STATUS.APPROVED, "staff"), true);
});

check("staff can approve a request under review", () => {
  assert.equal(canTransition(STATUS.UNDER_REVIEW, STATUS.APPROVED, "staff"), true);
});

check("admin can reject a request under review", () => {
  assert.equal(canTransition(STATUS.UNDER_REVIEW, STATUS.REJECTED, "admin"), true);
});

check("cannot move from approved to anything else (terminal)", () => {
  assert.equal(canTransition(STATUS.APPROVED, STATUS.SUBMITTED, "admin"), false);
  assert.equal(canTransition(STATUS.APPROVED, STATUS.REJECTED, "staff"), false);
});

check("cannot move from rejected to anything else (terminal)", () => {
  assert.equal(canTransition(STATUS.REJECTED, STATUS.SUBMITTED, "student"), false);
});

check("student can resubmit after correction required", () => {
  assert.equal(canTransition(STATUS.CORRECTION_REQUIRED, STATUS.SUBMITTED, "student"), true);
});

check("staff can request changes from under review", () => {
  assert.equal(canTransition(STATUS.UNDER_REVIEW, STATUS.CORRECTION_REQUIRED, "staff"), true);
});

check("staff cannot start review of an already approved request", () => {
  assert.equal(canTransition(STATUS.APPROVED, STATUS.UNDER_REVIEW, "staff"), false);
});

check("action map resolves known actions to statuses", () => {
  assert.equal(ACTION_TO_STATUS.approve, STATUS.APPROVED);
  assert.equal(ACTION_TO_STATUS.request_changes, STATUS.CORRECTION_REQUIRED);
  assert.equal(ACTION_TO_STATUS.resubmit, STATUS.SUBMITTED);
});

check("every status has a human stage label", () => {
  for (const s of Object.values(STATUS)) {
    assert.ok(STAGE_LABELS[s], `missing label for ${s}`);
  }
});

check("isValidStatus recognises valid statuses and rejects others", () => {
  assert.equal(isValidStatus("submitted"), true);
  assert.equal(isValidStatus("approved"), true);
  assert.equal(isValidStatus("deleted"), false);
  assert.equal(isValidStatus("hacked"), false);
});

console.log(`\n${passed} checks passed.`);
process.exit(0);
