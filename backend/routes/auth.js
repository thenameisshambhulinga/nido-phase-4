import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import {
  generateEmail,
  generateTemporaryPassword,
  generateUsername,
  hashPassword,
  normalizeRole,
  signJwt,
  verifyPassword,
} from "../utils/security.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  companyId: user.companyId,
  permissions: user.permissions || {},
  mustResetPassword: Boolean(user.mustResetPassword),
  status: user.status,
  lastLoginAt: user.lastLoginAt,
});

export async function ensureDefaultOwnerAccount() {
  const ownerEmail = process.env.DEFAULT_OWNER_EMAIL || "owner@nidotech.com";
  const ownerName = process.env.DEFAULT_OWNER_NAME || "System Owner";
  const existing = await User.findOne({ role: "OWNER" });
  if (existing) return existing;

  const tempPassword = process.env.DEFAULT_OWNER_PASSWORD || "Owner@12345!";
  const username = generateUsername(ownerName, []);
  return User.create({
    name: ownerName,
    email: ownerEmail,
    username,
    passwordHash: hashPassword(tempPassword),
    role: "OWNER",
    companyId: "nido-tech",
    permissions: { all: true },
    mustResetPassword: true,
    temporaryPasswordHash: hashPassword(tempPassword),
  });
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "email and password are required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      status: "active",
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signJwt(
      {
        sub: String(user._id),
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        mustResetPassword: Boolean(user.mustResetPassword),
      },
      JWT_SECRET,
      "7d",
    );

    res.json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const query = role === "OWNER" ? {} : { companyId: req.user.companyId };
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
      const { name, role, companyId, permissions = {}, email } = req.body || {};
      if (!name || !role) {
        return res
          .status(400)
          .json({ success: false, error: "name and role are required" });
      }

      if (email && !EMAIL_REGEX.test(String(email).trim().toLowerCase())) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid email format" });
      }

      const normalizedRole = normalizeRole(role);
      const existingUsernames = await User.find({}, { username: 1 }).lean();
      const username = generateUsername(
        name,
        existingUsernames.map((entry) => entry.username),
      );
      const generatedEmail =
        String(email || "")
          .trim()
          .toLowerCase() ||
        generateEmail(username, companyId || req.user.companyId || "nido-tech");

      const existingByEmail = await User.findOne({ email: generatedEmail });
      if (existingByEmail) {
        return res
          .status(409)
          .json({
            success: false,
            error: "User with this email already exists",
          });
      }

      const tempPassword = generateTemporaryPassword();

      const user = await User.create({
        name,
        username,
        email: generatedEmail,
        passwordHash: hashPassword(tempPassword),
        role: normalizedRole,
        companyId: companyId || req.user.companyId || "nido-tech",
        permissions,
        mustResetPassword: true,
        temporaryPasswordHash: hashPassword(tempPassword),
      });

      const credentials = {
        username,
        email: generatedEmail,
        temporaryPassword: tempPassword,
      };

      // Send credentials email asynchronously
      void sendEmail({
        to: generatedEmail,
        type: "credentials",
        data: {
          username,
          email: generatedEmail,
          temporaryPassword: tempPassword,
          createdBy: req.user.name || "System Administrator",
          userType: normalizedRole.replace(/_/g, " "),
          loginUrl: `${process.env.FRONTEND_URL || "http://localhost:8080"}/login`,
        },
        async: true,
      }).catch((err) => {
        console.error("Failed to send credentials email:", err);
      });

      res.status(201).json({
        success: true,
        data: {
          user: sanitizeUser(user),
          credentials,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.patch("/users/:id/reset-password", authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, error: "newPassword is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentRole = normalizeRole(req.user.role);
    if (currentRole !== "OWNER" && String(req.user.sub) !== String(user._id)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustResetPassword = false;
    user.temporaryPasswordHash = "";
    await user.save();

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      const { name, role, companyId, permissions, status } = req.body || {};
      if (name !== undefined) user.name = name;
      if (role !== undefined) user.role = normalizeRole(role);
      if (companyId !== undefined) user.companyId = companyId;
      if (permissions !== undefined) user.permissions = permissions;
      if (status !== undefined) user.status = status;

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
      const deleted = await User.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
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
