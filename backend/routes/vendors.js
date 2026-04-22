import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// GET all vendors
router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET vendor by ID
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH update vendor
router.patch("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE vendor
router.delete("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
