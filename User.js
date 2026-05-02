import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    nameNormalized: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: "", trim: true },
    username: { type: String, required: true, trim: true },
    usernameNormalized: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    passwordResetToken: { type: String, default: "" },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  const fn = String(this.fullName || "").trim();
  if (fn) {
    this.fullName = fn;
    this.nameNormalized = fn.toLowerCase();
  }
  const un = String(this.username || "").trim();
  if (un) {
    this.username = un;
    this.usernameNormalized = un.toLowerCase();
  }
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(String(plain), this.passwordHash);
};

export const DIGIT_PASSWORD_REGEX = /^[A-Za-z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\-]{4,10}$/;

export async function hashPassword(plain) {
  const value = String(plain);
  if (!DIGIT_PASSWORD_REGEX.test(value)) {
    throw new Error(
      "Password must be 4-10 characters and include alphabets, numbers, or special characters"
    );
  }
  return bcrypt.hash(value, 10);
}

export default mongoose.model("User", userSchema);