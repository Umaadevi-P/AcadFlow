/**
 * Seed script for AcaFlow.
 * Run with:  npm run seed   (from the server/ directory)
 *
 * Wipes and reloads demo users, documents and requests. Safe to re-run.
 * All passwords below are hashed by the User model's pre-save hook.
 */
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Request } from "../models/Request.js";
import { RequestActivity } from "../models/RequestActivity.js";
import { STATUS, STAGE_LABELS } from "../utils/workflow.js";

// --- small date helpers (keep seed data "current" relative to run time) ------
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// The shared 5-step workflow shown on every document details page.
const workflow = [
  { number: "01", title: "Request", description: "Tell us what it's for", icon: "send", tone: "lilac" },
  { number: "02", title: "Eligibility Check", description: "We check the basics", icon: "check", tone: "yellow" },
  { number: "03", title: "Department Review", description: "A person reviews it", icon: "users", tone: "peach" },
  { number: "04", title: "Document Creation", description: "Your document is made", icon: "file", tone: "mint" },
  { number: "05", title: "Secure Delivery", description: "Ready in your account", icon: "shield", tone: "blue" },
];

const documents = [
  {
    name: "Bonafide Certificate",
    slug: "bonafide",
    short: "Proof of your current student status.",
    description:
      "Official proof that you are currently enrolled as a student of the institution.",
    category: "Certificates",
    tags: ["Visa", "Bank Loan", "Scholarship", "Passport", "Internship"],
    purposes: ["visa", "bank loan", "scholarship", "passport", "internship", "travel", "embassy"],
    status: "Available to you",
    icon: "file",
    tone: "lilac",
    fee: "₹ Free",
    feeNote: "No application fee",
    delivery: "Digital",
    deliveryNote: "Delivery to your account",
    processingTime: "1–2 days",
    processingNote: "Working days",
    audience: "Students",
    audienceNote: "Currently enrolled",
    eligibility: [
      "Active student account",
      "Required student information available",
      "No additional clearance required",
    ],
    requirements: [
      { name: "Student ID", ready: true, icon: "file" },
      { name: "Fee Receipt", ready: true, icon: "file" },
      { name: "Passport Details", ready: false, icon: "passport" },
      { name: "Application Details", ready: false, icon: "file" },
    ],
    uses:
      "A bonafide certificate is commonly used as proof of student status for external applications and institutional requirements.",
    useTags: ["Visa", "Bank Loan", "Scholarship", "Internship", "Passport", "Travel / Embassy"],
    order: 1,
  },
  {
    name: "Academic Transcript",
    slug: "transcript",
    short: "Your official record of coursework and grades.",
    description:
      "A complete record of the courses, credits and grades you have earned during your studies.",
    category: "Academic Records",
    tags: ["Higher Studies", "Placement", "Scholarship"],
    purposes: ["higher studies", "placement", "scholarship", "job", "abroad", "masters", "phd"],
    status: "Request available",
    icon: "book",
    tone: "yellow",
    fee: "₹ 200",
    feeNote: "Per copy",
    processingTime: "3–5 days",
    processingNote: "Working days",
    audience: "Students",
    audienceNote: "All semesters completed or in progress",
    eligibility: ["All semesters completed or in progress", "No fee dues pending"],
    requirements: [
      { name: "Student ID", ready: true, icon: "file" },
      { name: "Latest Marksheet", ready: false, icon: "file" },
      { name: "Reason for Transcript", ready: false, icon: "file" },
    ],
    uses:
      "Transcripts are required for university admissions, job applications, scholarships and visa processes that need a verified academic history.",
    useTags: ["Higher Studies", "Placement", "Scholarship", "Visa"],
    order: 2,
  },
  {
    name: "Recommendation Letter",
    slug: "recommendation-letter",
    short: "A faculty recommendation for your next step.",
    description:
      "A formal letter of recommendation from a faculty member supporting your application.",
    category: "Letters",
    tags: ["Higher Studies", "Internship", "Scholarship"],
    purposes: ["higher studies", "internship", "scholarship", "job", "masters", "phd", "recommendation"],
    status: "Faculty approval required",
    icon: "mail",
    tone: "peach",
    fee: "₹ Free",
    feeNote: "No application fee",
    processingTime: "5–7 days",
    processingNote: "Depends on faculty",
    audience: "Students",
    audienceNote: "Completed a course with the faculty",
    eligibility: [
      "Completed at least one course with the faculty",
      "Provide the recipient details",
    ],
    requirements: [
      { name: "Faculty Name", ready: false, icon: "users" },
      { name: "Recipient Details", ready: false, icon: "mail" },
      { name: "Purpose", ready: false, icon: "file" },
    ],
    uses:
      "Recommendation letters strengthen applications for higher studies, internships, scholarships and jobs by vouching for your ability.",
    useTags: ["Higher Studies", "Internship", "Scholarship", "Placement"],
    order: 3,
  },
  {
    name: "No Objection Certificate",
    slug: "noc",
    short: "Institutional permission for external activities.",
    description:
      "An NOC confirming the institution has no objection to your participation in external activities.",
    category: "NOC",
    tags: ["Internship", "Placement", "Visa"],
    purposes: ["internship", "placement", "visa", "external activity", "event", "competition"],
    status: "Request available",
    icon: "shield",
    tone: "mint",
    fee: "₹ Free",
    feeNote: "No application fee",
    processingTime: "2–3 days",
    processingNote: "Working days",
    audience: "Students",
    audienceNote: "Active student account",
    eligibility: ["Active student account", "Provide details of the external activity"],
    requirements: [
      { name: "Student ID", ready: true, icon: "file" },
      { name: "Activity Details", ready: false, icon: "briefcase" },
      { name: "Organisation Name", ready: false, icon: "building" },
    ],
    uses:
      "NOCs are commonly needed for internships, external competitions, industrial visits and visa applications.",
    useTags: ["Internship", "Placement", "Visa", "Events"],
    order: 4,
  },
  {
    name: "Enrollment Certificate",
    slug: "enrollment-certificate",
    short: "Official confirmation of your enrollment.",
    description:
      "Confirms your current enrollment, program and academic year at the institution.",
    category: "Certificates",
    tags: ["Visa", "Bank Loan", "Higher Studies"],
    purposes: ["visa", "bank loan", "higher studies", "enrollment", "scholarship"],
    status: "Available to you",
    icon: "file",
    tone: "blue",
    fee: "₹ Free",
    feeNote: "No application fee",
    processingTime: "1–2 days",
    processingNote: "Working days",
    audience: "Students",
    audienceNote: "Currently enrolled",
    eligibility: ["Active student account", "Currently enrolled"],
    requirements: [
      { name: "Student ID", ready: true, icon: "file" },
      { name: "Program Details", ready: true, icon: "graduation" },
    ],
    uses:
      "Enrollment certificates prove active enrollment for visa, loan, scholarship and admission processes.",
    useTags: ["Visa", "Bank Loan", "Higher Studies", "Scholarship"],
    order: 5,
  },
  {
    name: "Fee Receipt",
    slug: "fee-receipt",
    short: "A record of your tuition fee payments.",
    description:
      "An official receipt confirming your tuition fee payments for a given semester.",
    category: "Academic Records",
    tags: ["Bank Loan", "Scholarship"],
    purposes: ["bank loan", "scholarship", "fee", "payment", "tax"],
    status: "Available to you",
    icon: "file",
    tone: "orange",
    fee: "₹ Free",
    feeNote: "No application fee",
    processingTime: "1 day",
    processingNote: "Same day, working hours",
    audience: "Students",
    audienceNote: "Fees paid for the semester",
    eligibility: ["Fees paid for the requested semester"],
    requirements: [
      { name: "Student ID", ready: true, icon: "file" },
      { name: "Semester", ready: false, icon: "calendar" },
    ],
    uses:
      "Fee receipts are required for education loans, scholarship claims and tax documentation.",
    useTags: ["Bank Loan", "Scholarship", "Tax"],
    order: 6,
  },
];

// Demo accounts. Password is hashed by the User model before saving.
const users = [
  {
    name: "Umaadevi",
    email: "umaadevi@university.edu",
    password: "password123",
    role: "student",
    departmentCode: "CSE",
    year: "3rd Year",
    studentId: "CSE21001",
    status: "active",
  },
  {
    name: "Arjun Mehta",
    email: "arjun@university.edu",
    password: "password123",
    role: "student",
    departmentCode: "ECE",
    year: "2nd Year",
    studentId: "ECE22045",
    status: "active",
  },
  {
    name: "Dr. Priya Nair",
    email: "staff@university.edu",
    password: "password123",
    role: "staff",
    department: "Academic Office",
    status: "active",
  },
  {
    name: "Ravi Kumar",
    email: "admin@university.edu",
    password: "password123",
    role: "admin",
    department: "Administration",
    status: "active",
  },
];

export async function runSeed() {
  await connectDB();

  console.log("Clearing existing data…");
  await Promise.all([
    User.deleteMany({}),
    Document.deleteMany({}),
    Request.deleteMany({}),
    RequestActivity.deleteMany({}),
  ]);

  console.log("Creating users…");
  const userByEmail = {};
  for (const u of users) {
    userByEmail[u.email] = await User.create(u);
  }

  console.log("Creating documents…");
  const docBySlug = {};
  for (const d of documents) {
    docBySlug[d.slug] = await Document.create({ ...d, workflow });
  }

  const student = userByEmail["umaadevi@university.edu"];
  const staff = userByEmail["staff@university.edu"];
  const bonafide = docBySlug["bonafide"];
  const transcript = docBySlug["transcript"];

  console.log("Creating sample requests…");

  // 1) In review — Bonafide for a visa (mirrors AF-2048 on the original page).
  const r1 = await Request.create({
    requestId: "AF-2048",
    user: student._id,
    document: bonafide._id,
    documentName: bonafide.name,
    documentSlug: bonafide.slug,
    documentIcon: bonafide.icon,
    documentTone: bonafide.tone,
    purpose: "Visa application",
    notes: "",
    formData: {},
    status: STATUS.UNDER_REVIEW,
    stage: STAGE_LABELS[STATUS.UNDER_REVIEW],
    submittedAt: daysAgo(22),
    expectedCompletion: daysAgo(10),
    assignedDepartment: "Academic Office",
    assignedStaff: staff._id,
  });
  await RequestActivity.insertMany([
    { request: r1._id, actor: student._id, actorName: student.name, action: "submitted", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.SUBMITTED, comment: "Request submitted by student.", createdAt: daysAgo(22) },
    { request: r1._id, actor: staff._id, actorName: staff.name, action: "start_review", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.UNDER_REVIEW, comment: "", createdAt: daysAgo(20) },
  ]);

  // 2) Correction required — Transcript for higher studies (mirrors AF-1983).
  const r2 = await Request.create({
    requestId: "AF-1983",
    user: student._id,
    document: transcript._id,
    documentName: transcript.name,
    documentSlug: transcript.slug,
    documentIcon: transcript.icon,
    documentTone: transcript.tone,
    purpose: "Higher studies",
    notes: "Applying for a master's program abroad.",
    formData: {},
    status: STATUS.CORRECTION_REQUIRED,
    stage: STAGE_LABELS[STATUS.CORRECTION_REQUIRED],
    submittedAt: daysAgo(30),
    expectedCompletion: daysAgo(18),
    assignedDepartment: "Academic Office",
    assignedStaff: staff._id,
    reviewComment: "Semester 8 results haven't been published yet. We'll hold the request until they are available — no need to apply again.",
  });
  await RequestActivity.insertMany([
    { request: r2._id, actor: student._id, actorName: student.name, action: "submitted", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.SUBMITTED, comment: "Request submitted by student.", createdAt: daysAgo(30) },
    { request: r2._id, actor: staff._id, actorName: staff.name, action: "start_review", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.UNDER_REVIEW, comment: "", createdAt: daysAgo(28) },
    { request: r2._id, actor: staff._id, actorName: staff.name, action: "request_changes", previousStatus: STATUS.UNDER_REVIEW, newStatus: STATUS.CORRECTION_REQUIRED, comment: "Semester 8 results haven't been published yet.", createdAt: daysAgo(27) },
  ]);

  // 3) Completed — Bonafide issued (mirrors AF-1856).
  const r3 = await Request.create({
    requestId: "AF-1856",
    user: student._id,
    document: bonafide._id,
    documentName: bonafide.name,
    documentSlug: bonafide.slug,
    documentIcon: bonafide.icon,
    documentTone: bonafide.tone,
    purpose: "Bank loan",
    notes: "",
    formData: {},
    status: STATUS.APPROVED,
    stage: STAGE_LABELS[STATUS.APPROVED],
    submittedAt: daysAgo(25),
    expectedCompletion: daysAgo(22),
    approvedAt: daysAgo(22),
    assignedDepartment: "Academic Office",
    assignedStaff: staff._id,
  });
  await RequestActivity.insertMany([
    { request: r3._id, actor: student._id, actorName: student.name, action: "submitted", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.SUBMITTED, comment: "Request submitted by student.", createdAt: daysAgo(25) },
    { request: r3._id, actor: staff._id, actorName: staff.name, action: "start_review", previousStatus: STATUS.SUBMITTED, newStatus: STATUS.UNDER_REVIEW, comment: "", createdAt: daysAgo(24) },
    { request: r3._id, actor: staff._id, actorName: staff.name, action: "approve", previousStatus: STATUS.UNDER_REVIEW, newStatus: STATUS.APPROVED, comment: "Verified and approved.", createdAt: daysAgo(22) },
  ]);

  console.log("\n✓ Seed complete.");
  console.log("  Documents: 6");
  console.log("  Users: 4 (1 student demo, 1 extra student, 1 staff, 1 admin)");
  console.log("\nDemo accounts (password for all: password123):");
  console.log("  Student : umaadevi@university.edu");
  console.log("  Student : arjun@university.edu");
  console.log("  Staff   : staff@university.edu");
  console.log("  Admin   : admin@university.edu");
}

// Run automatically only when executed directly (`npm run seed`), not when
// imported by tests.
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  runSeed()
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
