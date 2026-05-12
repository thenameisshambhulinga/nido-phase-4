import express from "express";
import mongoose from "mongoose";
import AMC from "../models/AMC.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =============================================================================
// AMC ROUTES
// =============================================================================

/**
 * GET /api/amc - List all AMCs
 */
router.get("/", async (req, res) => {
  try {
    const { companyId, status, startDate, endDate } = req.query;
    const query = {};

    if (companyId) query.companyId = String(companyId);
    if (status) query.status = String(status);

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const amcs = await AMC.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: amcs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/amc/:id - Get single AMC
 */
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid AMC ID" });
    }

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ success: false, error: "AMC not found" });
    }

    res.json({ success: true, data: amc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/amc - Create new AMC
 */
router.post("/", async (req, res) => {
  try {
    const payload = req.body || {};

    // Validate required fields
    const requiredFields = [
      "companyId",
      "companyName",
      "registeredAddress",
      "gstNumber",
      "contactPerson",
      "mobile",
      "email",
      "amcType",
      "amcCategory",
      "scopeNotes",
      "startDate",
      "endDate",
      "authorizedName",
      "authorizedDesignation",
      "authorizationDate",
    ];

    const missing = requiredFields.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const amc = new AMC({
      ...payload,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      authorizationDate: new Date(payload.authorizationDate),
      amcExpiry: payload.amcExpiry ? new Date(payload.amcExpiry) : undefined,
    });

    await amc.save();

    res.status(201).json({ success: true, data: amc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/amc/:id - Update AMC
 */
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid AMC ID" });
    }

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ success: false, error: "AMC not found" });
    }

    const updates = req.body;

    // Handle date fields
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.authorizationDate)
      updates.authorizationDate = new Date(updates.authorizationDate);
    if (updates.amcExpiry) updates.amcExpiry = new Date(updates.amcExpiry);

    Object.assign(amc, updates);
    await amc.save();

    res.json({ success: true, data: amc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/amc/:id - Partial update
 */
router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid AMC ID" });
    }

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ success: false, error: "AMC not found" });
    }

    const updates = req.body;

    // Handle date fields
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.authorizationDate)
      updates.authorizationDate = new Date(updates.authorizationDate);
    if (updates.amcExpiry) updates.amcExpiry = new Date(updates.amcExpiry);

    Object.assign(amc, updates);
    await amc.save();

    res.json({ success: true, data: amc });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/amc/:id - Delete AMC
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid AMC ID" });
    }

    const amc = await AMC.findByIdAndDelete(req.params.id);
    if (!amc) {
      return res.status(404).json({ success: false, error: "AMC not found" });
    }

    res.json({
      success: true,
      data: { message: "AMC deleted successfully" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/amc/:id/activate - Activate AMC
 */
router.post("/:id/activate", authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid AMC ID" });
    }

    const amc = await AMC.findById(req.params.id);
    if (!amc) {
      return res.status(404).json({ success: false, error: "AMC not found" });
    }

    amc.activate(req.user.email);
    await amc.save();

    res.json({ success: true, data: amc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/amc/company/:companyId - Get AMCs for a company
 */
router.get("/company/:companyId", async (req, res) => {
  try {
    const amcs = await AMC.find({
      companyId: req.params.companyId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: amcs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/amc/expiring - Get expiring AMCs
 */
router.get("/expiring/:days", async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const amcs = await AMC.getExpiringAMCs(days);

    res.json({ success: true, data: amcs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
