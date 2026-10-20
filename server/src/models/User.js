import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = ["student", "staff", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Hashed password — never selected by default and never returned to clients.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "student" },
    // Department a staff member belongs to (e.g. "Academic Office").
    department: { type: String, default: "" },
    // Student-facing display fields.
    departmentCode: { type: String, default: "" }, // e.g. "CSE"
    year: { type: String, default: "" }, // e.g. "3rd Year"
    studentId: { type: String, default: "" }, // e.g. "CSE21001"
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

// Hash the password before saving whenever it changes.
userSchema.pre("save", async function savePassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare a plaintext candidate against the stored hash.
userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Safe object returned to API clients — never includes the password hash.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    departmentCode: this.departmentCode,
    year: this.year,
    studentId: this.studentId,
    status: this.status,
  };
};

export const User = mongoose.model("User", userSchema);
