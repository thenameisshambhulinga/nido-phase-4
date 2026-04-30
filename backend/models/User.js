import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN", "CLIENT_USER"],
      required: true,
      index: true,
    },
    companyId: { type: String, trim: true, default: "nido-tech", index: true },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    mustResetPassword: { type: Boolean, default: false },
    temporaryPasswordHash: { type: String, default: "" },
    lastLoginAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
