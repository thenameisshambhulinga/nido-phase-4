import mongoose from "mongoose";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validateName,
  validatePhone,
  validateUsername,
} from "../utils/validators.js";

const ROLE_VALUES = [
  "OWNER",
  "INTERNAL_EMPLOYEE",
  "CLIENT_ADMIN",
  "CLIENT_USER",
  "VENDOR",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      validate: {
        validator: (value) => validateName(value),
        message: "Name must be 2-100 characters and contain valid letters only",
      },
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: (value) => validateUsername(value),
        message:
          "Username must be 3-30 characters using letters, numbers, _ or -",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: (value) => validateEmail(value),
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || validatePhone(value),
        message: "Phone must be exactly 10 digits",
      },
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ROLE_VALUES,
        message: "Invalid role",
      },
      index: true,
    },
    companyId: {
      type: String,
      default: null,
      index: true,
    },
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mustResetPassword: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "suspended"],
        message: "Invalid status",
      },
      default: "active",
      index: true,
    },
    temporaryPasswordHash: {
      type: String,
      default: "",
    },
    inviteTokenHash: {
      type: String,
      default: "",
      index: true,
    },
    inviteTokenExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: "",
      index: true,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

userSchema.pre("validate", function normalizeUserFields(next) {
  if (this.email) {
    this.email = normalizeEmail(this.email);
  }
  if (this.username) {
    this.username = String(this.username).trim().toLowerCase();
  }
  if (this.phone) {
    this.phone = normalizePhone(this.phone);
  }
  if (this.status !== "active") {
    this.isActive = false;
  }
  next();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1, companyId: 1 });

userSchema.statics.validateEmailUnique = async function validateEmailUnique(
  email,
  excludeId = null,
) {
  const query = { email: normalizeEmail(email) };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await this.findOne(query);
  return !existing;
};

userSchema.statics.validateUsernameUnique =
  async function validateUsernameUnique(username, excludeId = null) {
    const query = {
      username: String(username || "")
        .trim()
        .toLowerCase(),
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await this.findOne(query);
    return !existing;
  };

export const USER_ROLES = ROLE_VALUES;

export default mongoose.model("User", userSchema);
