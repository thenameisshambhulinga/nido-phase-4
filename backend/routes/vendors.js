import express from "express";
import mongoose from "mongoose";
import Vendor from "../models/Vendor.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const emptyAnalytics = {
  totalSpend: 0,
  totalOrders: 0,
  monthlySpend: [],
  statusBreakdown: {
    pending: 0,
    processing: 0,
    completed: 0,
  },
};

// GET vendor analytics by ID
router.get("/:id/analytics", async (req, res) => {
  try {
    const { id } = req.params;
    const vendorIdMatches = [{ vendorId: id }];

    if (isValidObjectId(id)) {
      vendorIdMatches.push({ vendorId: new mongoose.Types.ObjectId(id) });
    }

    const [result] = await mongoose.connection
      .collection("orders")
      .aggregate([
        {
          $match: {
            $or: vendorIdMatches,
          },
        },
        {
          $addFields: {
            amountNumber: {
              $convert: {
                input: { $ifNull: ["$totalAmount", "$total"] },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
            normalizedStatus: {
              $toLower: { $ifNull: ["$status", ""] },
            },
            createdAtResolved: {
              $ifNull: [
                "$createdAt",
                {
                  $dateFromString: {
                    dateString: { $ifNull: ["$orderDate", null] },
                    onError: null,
                    onNull: null,
                  },
                },
              ],
            },
          },
        },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalSpend: { $sum: "$amountNumber" },
                  totalOrders: { $sum: 1 },
                },
              },
            ],
            monthly: [
              {
                $match: {
                  createdAtResolved: { $ne: null },
                },
              },
              {
                $group: {
                  _id: { $month: "$createdAtResolved" },
                  value: { $sum: "$amountNumber" },
                },
              },
              { $sort: { _id: 1 } },
            ],
            statuses: [
              {
                $group: {
                  _id: "$normalizedStatus",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    if (!result) {
      return res.json(emptyAnalytics);
    }

    const totalsRow = result.totals?.[0];
    const totalOrders = totalsRow?.totalOrders || 0;

    if (totalOrders === 0) {
      return res.json(emptyAnalytics);
    }

    const monthlySpend = (result.monthly || []).map((entry) => ({
      month: MONTH_LABELS[(entry._id || 1) - 1] || "",
      value: entry.value || 0,
    }));

    const statusBreakdown = {
      pending: 0,
      processing: 0,
      completed: 0,
    };

    (result.statuses || []).forEach((entry) => {
      const status = String(entry._id || "").toLowerCase();
      const count = entry.count || 0;

      if (status.includes("pending") || status.includes("new")) {
        statusBreakdown.pending += count;
      } else if (status.includes("processing") || status.includes("approved")) {
        statusBreakdown.processing += count;
      } else if (
        status.includes("completed") ||
        status.includes("delivered") ||
        status.includes("shipped")
      ) {
        statusBreakdown.completed += count;
      }
    });

    return res.json({
      totalSpend: totalsRow?.totalSpend || 0,
      totalOrders,
      monthlySpend,
      statusBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET all vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET vendor by ID
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid vendor ID" });
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new vendor
router.post("/", async (req, res) => {
  try {
    const vendorData = {
      ...req.body,
      updatedAt: new Date(),
    };
    const vendor = new Vendor(vendorData);
    await vendor.save();
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT update vendor
router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid vendor ID" });
    }
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH update vendor (backward compatible)
router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid vendor ID" });
    }
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE vendor
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid vendor ID" });
    }
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, error: "Vendor not found" });
    }
    res.json({
      success: true,
      data: { message: "Vendor deleted successfully" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
