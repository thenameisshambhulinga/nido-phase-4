import express from "express";
import mongoose from "mongoose";
import Client from "../models/Client.js";
import { ensureBusinessId } from "../utils/businessIds.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\d{10}$/;
const GST_REGEX =
  /^([0-9]{2})([A-Z]{5}[A-Z0-9]{4})([0-9]{4})([A-Z]{1})([0-9]{1})$/i;
const PINCODE_REGEX = /^\d{6}$/;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateClientData = (data) => {
  const errors = [];

  if (!data.companyName || data.companyName.trim().length < 2) {
    errors.push("Company name is required");
  }

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    errors.push("Phone must be exactly 10 digits");
  }

  if (data.gst && !GST_REGEX.test(data.gst.toUpperCase())) {
    errors.push("Invalid GST number format");
  }

  if (data.zipCode && !PINCODE_REGEX.test(data.zipCode)) {
    errors.push("Pincode must be 6 digits");
  }

  return errors;
};

// =============================================================================
// CLIENT ROUTES
// =============================================================================

// GET all clients
router.get("/", async (req, res) => {
  try {
    const { status, companyName } = req.query;
    const query = {};

    if (status) query.status = String(status);
    if (companyName) {
      query.companyName = { $regex: companyName, $options: "i" };
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET client by ID
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid client ID" });
    }
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new client
router.post("/", async (req, res) => {
  try {
    const data = req.body || {};

    // Validate input
    const errors = validateClientData(data);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(", ") });
    }

    // Check for duplicate email
    if (data.email) {
      const existing = await Client.findOne({
        email: data.email.toLowerCase(),
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Client with this email already exists",
        });
      }
    }

    const sequence = (await Client.countDocuments()) + 1;
    const clientData = {
      ...data,
      clientId: ensureBusinessId(data?.clientId, "CID", sequence, 4),
      updatedAt: new Date(),
    };

    const client = new Client(clientData);
    await client.save();

    // Send welcome email if email provided
    if (client.email) {
      void sendEmail({
        to: client.email,
        type: "credentials",
        data: {
          companyName: client.companyName,
          email: client.email,
          temporaryPassword: "Welcome to Nido Platform",
          createdBy: "System Administrator",
          userType: "Client",
          loginUrl: `${process.env.FRONTEND_URL || "https://app.nidotech.com"}/login`,
        },
        async: true,
      }).catch((err) => console.error("Failed to send welcome email:", err));
    }

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT update client
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid client ID" });
    }

    const data = req.body || {};

    // Validate input (allow partial validation for updates)
    if (Object.keys(data).length > 0) {
      const errors = validateClientData(data);
      if (errors.length > 0) {
        return res
          .status(400)
          .json({ success: false, error: errors.join(", ") });
      }
    }

    // Check for duplicate email (excluding current client)
    if (data.email) {
      const existing = await Client.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Client with this email already exists",
        });
      }
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH update client (backward compatible)
router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid client ID" });
    }

    const data = req.body || {};
    if (data.email) {
      const existing = await Client.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Client with this email already exists",
        });
      }
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE client
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid client ID" });
    }
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }
    res.json({
      success: true,
      data: { message: "Client deleted successfully" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET clients by status
router.get("/status/:status", async (req, res) => {
  try {
    const clients = await Client.find({
      status: req.params.status,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
