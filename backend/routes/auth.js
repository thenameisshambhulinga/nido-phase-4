import crypto from "crypto";
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  generateTemporaryPassword,
  generateUsername,
  hashPassword,
  normalizeRole,
  signJwt,
  verifyJwt,
  verifyPassword,
} from "../utils/security.js";
import { resolveCompany, syncCompanyUser } from "../utils/companies.js";
import { sendEmail } from "../utils/emailService.js";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validateName,
  validatePhone,
} from "../utils/validators.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://app.nidotech.com";
const SETUP_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getAuthUserFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  return verifyJwt(token, JWT_SECRET);
};

const createTokenHash = (rawToken) =>
  crypto.createHash("sha256").update(String(rawToken)).digest("hex");

const createSetupLink = (rawToken) =>
  `${FRONTEND_URL.replace(/\/+$/, "")}/onboarding/${rawToken}`;

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  companyId: user.companyId ? String(user.companyId) : "",
  organization: user.organization || "",
  permissions: user.permissions || {},
  mustResetPassword: Boolean(user.mustResetPassword),
  status: user.status,
  isActive: Boolean(user.isActive),
  lastLoginAt: user.lastLoginAt,
  phone: user.phone || "",
  jobTitle: user.jobTitle || "",
  department: user.department || "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueSetupAccess = async (user, { newTemporaryPassword = null } = {}) => {
  const temporaryPassword = newTemporaryPassword || generateTemporaryPassword();
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.temporaryPasswordHash = hashPassword(temporaryPassword);
  user.passwordHash = hashPassword(temporaryPassword);
  user.mustResetPassword = true;
  user.inviteTokenHash = createTokenHash(rawToken);
  user.inviteTokenExpiresAt = new Date(Date.now() + SETUP_EXPIRY_MS);
  await user.save();

  return {
    temporaryPassword,
    setupToken: rawToken,
    setupLink: createSetupLink(rawToken),
  };
};

const sendUserInviteEmail = async ({ user, temporaryPassword, setupLink }) =>
  sendEmail({
    to: user.email,
    type: "credentials",
    data: {
      name: user.name,
      username: user.username,
      email: user.email,
      temporaryPassword,
      setupLink,
      loginUrl: `${FRONTEND_URL.replace(/\/+$/, "")}/login`,
      userType: user.role.replace(/_/g, " "),
    },
    async: false,
  });

const buildLoginPayload = (user) => {
  const token = signJwt(
    {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId ? String(user.companyId) : "",
      organization: user.organization || "",
      mustResetPassword: Boolean(user.mustResetPassword),
    },
    JWT_SECRET,
    "7d",
  );

  return {
    token,
    role: user.role,
    companyId: user.companyId ? String(user.companyId) : "",
    user: sanitizeUser(user),
  };
};

const resolveRoleDrivenCompany = async ({
  companyId,
  organization,
  role,
  email = "",
  phone = "",
}) => {
  const normalizedRole = normalizeRole(role);
  if (["OWNER", "INTERNAL_EMPLOYEE"].includes(normalizedRole)) {
    return null;
  }

  return resolveCompany({
    companyId,
    organization,
    type: normalizedRole,
    email,
    phone,
  });
};

export async function ensureDefaultOwnerAccount() {
  const ownerEmail = normalizeEmail(
    process.env.DEFAULT_OWNER_EMAIL || "owner@nidotech.com",
  );
  const ownerName = process.env.DEFAULT_OWNER_NAME || "System Owner";
  const existing = await User.findOne({ role: "OWNER" });
  if (existing) return existing;

  const temporaryPassword =
    process.env.DEFAULT_OWNER_PASSWORD || "Owner@12345!";
  const existingUsernames = await User.find({}, { username: 1 }).lean();
  const username = generateUsername(
    ownerName,
    existingUsernames.map((entry) => entry.username),
  );

  const user = await User.create({
    name: ownerName,
    email: ownerEmail,
    username,
    passwordHash: hashPassword(temporaryPassword),
    temporaryPasswordHash: hashPassword(temporaryPassword),
    role: "OWNER",
    organization: "Nido Tech",
    mustResetPassword: false,
    isActive: true,
    status: "active",
    permissions: { all: true },
  });

  return user;
}

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!validateEmail(email) || !password) {
      return res.status(400).json({
        success: false,
        error: "Valid email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive || user.status !== "active") {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const matchesPrimary = verifyPassword(password, user.passwordHash);
    const matchesTemporary =
      user.temporaryPasswordHash &&
      verifyPassword(password, user.temporaryPasswordHash);

    if (!matchesPrimary && !matchesTemporary) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: buildLoginPayload(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const companyId = req.user.companyId || "";
    const organization = req.user.organization || "";
    const scopedClauses = [
      companyId && isValidObjectId(companyId) ? { companyId } : null,
      organization ? { organization } : null,
    ].filter(Boolean);

    const query =
      role === "OWNER" || role === "INTERNAL_EMPLOYEE"
        ? {}
        : scopedClauses.length
          ? { $or: scopedClauses }
          : { _id: null };

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(sanitizeUser) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(
  "/users",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    try {
      const {
        name,
        role,
        companyId,
        organization,
        permissions = {},
        email,
        phone = "",
        jobTitle = "",
        department = "",
      } = req.body || {};

      if (!validateName(name)) {
        return res
          .status(400)
          .json({ success: false, error: "Valid name is required" });
      }

      const normalizedEmailValue = normalizeEmail(email || "");
      if (!validateEmail(normalizedEmailValue)) {
        return res
          .status(400)
          .json({ success: false, error: "Valid email is required" });
      }

      const normalizedRole = normalizeRole(role);
      const company = await resolveRoleDrivenCompany({
        companyId,
        organization: organization || companyId,
        role: normalizedRole,
        email: normalizedEmailValue,
        phone,
      });

      const existingUsernames = await User.find({}, { username: 1 }).lean();
      const username = generateUsername(
        name,
        existingUsernames.map((entry) => entry.username),
      );

      const existsByEmail = await User.findOne({ email: normalizedEmailValue });
      if (existsByEmail) {
        return res.status(409).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      const user = await User.create({
        name: String(name).trim(),
        username,
        email: normalizedEmailValue,
        phone: phone ? normalizePhone(phone) : "",
        passwordHash: hashPassword(generateTemporaryPassword()),
        role: normalizedRole,
        companyId: company?._id || null,
        organization: company?.name || organization || companyId || "",
        permissions,
        mustResetPassword: true,
        isActive: true,
        status: "active",
        jobTitle,
        department,
      });

      if (company?._id) {
        await syncCompanyUser(company._id, user._id);
      }

      const { temporaryPassword, setupToken, setupLink } = await issueSetupAccess(
        user,
      );

      await sendUserInviteEmail({ user, temporaryPassword, setupLink });

      res.status(201).json({
        success: true,
        data: {
          user: sanitizeUser(user),
          credentials: {
            username,
            email: normalizedEmailValue,
            temporaryPassword,
          },
          setupToken,
          setupLink,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.get("/invitations/:token", async (req, res) => {
  try {
    const inviteTokenHash = createTokenHash(req.params.token);
    const user = await User.findOne({
      inviteTokenHash,
      inviteTokenExpiresAt: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Invitation is invalid or has expired",
      });
    }

    res.json({
      success: true,
      data: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization || "",
        expiresAt: user.inviteTokenExpiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/reset-password", async (req, res) => {
  try {
    const { token, currentPassword, newPassword } = req.body || {};
    const nextPassword = String(newPassword || "");

    if (nextPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long",
      });
    }

    if (token) {
      const user = await User.findOne({
        inviteTokenHash: createTokenHash(token),
        inviteTokenExpiresAt: { $gt: new Date() },
        isActive: true,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Invitation is invalid or has expired",
        });
      }

      user.passwordHash = hashPassword(nextPassword);
      user.mustResetPassword = false;
      user.temporaryPasswordHash = "";
      user.inviteTokenHash = "";
      user.inviteTokenExpiresAt = null;
      user.passwordResetTokenHash = "";
      user.passwordResetExpiresAt = null;
      user.emailVerified = true;
      await user.save();

      return res.json({ success: true, data: sanitizeUser(user) });
    }

    const authUser = getAuthUserFromRequest(req);
    if (!authUser?.sub) {
      return res.status(401).json({
        success: false,
        error: "Authentication or setup token is required",
      });
    }

    const user = await User.findById(authUser.sub);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const existingPassword = String(currentPassword || "");
    if (
      !existingPassword ||
      (!verifyPassword(existingPassword, user.passwordHash) &&
        !(
          user.temporaryPasswordHash &&
          verifyPassword(existingPassword, user.temporaryPasswordHash)
        ))
    ) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    user.passwordHash = hashPassword(nextPassword);
    user.mustResetPassword = false;
    user.temporaryPasswordHash = "";
    await user.save();

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/users/:id/reset-password", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const actingRole = normalizeRole(req.user.role);
    const isSelf = String(req.user.sub) === String(user._id);
    const { newPassword } = req.body || {};

    if (newPassword) {
      if (actingRole !== "OWNER" && !isSelf) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      if (String(newPassword).length < 8) {
        return res.status(400).json({
          success: false,
          error: "New password must be at least 8 characters long",
        });
      }

      user.passwordHash = hashPassword(newPassword);
      user.mustResetPassword = false;
      user.temporaryPasswordHash = "";
      user.inviteTokenHash = "";
      user.inviteTokenExpiresAt = null;
      await user.save();

      return res.json({ success: true, data: sanitizeUser(user) });
    }

    if (actingRole !== "OWNER") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const { temporaryPassword, setupToken, setupLink } = await issueSetupAccess(
      user,
    );
    await sendUserInviteEmail({ user, temporaryPassword, setupLink });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        credentials: {
          username: user.username,
          email: user.email,
          temporaryPassword,
        },
        setupToken,
        setupLink,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(
  "/users/:id/resend-invite",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user ID" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const { temporaryPassword, setupToken, setupLink } = await issueSetupAccess(
        user,
      );
      await sendUserInviteEmail({ user, temporaryPassword, setupLink });

      res.json({
        success: true,
        data: {
          user: sanitizeUser(user),
          credentials: {
            username: user.username,
            email: user.email,
            temporaryPassword,
          },
          setupToken,
          setupLink,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, error: "Invalid user ID" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      const {
        name,
        role,
        companyId,
        organization,
        permissions,
        status,
        isActive,
        phone,
        jobTitle,
        department,
      } = req.body || {};

      if (name !== undefined) {
        if (!validateName(name)) {
          return res
            .status(400)
            .json({ success: false, error: "Valid name is required" });
        }
        user.name = String(name).trim();
      }

      if (phone !== undefined) {
        if (phone && !validatePhone(phone)) {
          return res.status(400).json({
            success: false,
            error: "Phone must be exactly 10 digits",
          });
        }
        user.phone = normalizePhone(phone);
      }

      if (role !== undefined || companyId !== undefined || organization !== undefined) {
        const nextRole = role !== undefined ? normalizeRole(role) : user.role;
        const company = await resolveRoleDrivenCompany({
          companyId: companyId !== undefined ? companyId : user.companyId,
          organization:
            organization !== undefined ? organization : user.organization,
          role: nextRole,
          email: user.email,
          phone: user.phone,
        });

        user.role = nextRole;
        user.companyId = company?._id || null;
        user.organization =
          company?.name ||
          (organization !== undefined ? organization : user.organization);

        if (company?._id) {
          await syncCompanyUser(company._id, user._id);
        }
      }

      if (permissions !== undefined) user.permissions = permissions;
      if (status !== undefined) {
        user.status = String(status).toLowerCase();
        user.isActive = user.status === "active";
      }
      if (isActive !== undefined) {
        user.isActive = Boolean(isActive);
        user.status = user.isActive ? "active" : "inactive";
      }
      if (jobTitle !== undefined) user.jobTitle = jobTitle;
      if (department !== undefined) user.department = department;

      await user.save();
      res.json({ success: true, data: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, error: "Invalid user ID" });
      }

      const deleted = await User.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      res.json({
        success: true,
        data: { message: "User deleted successfully" },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

export default router;
