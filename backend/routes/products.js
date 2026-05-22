import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import generateProductCode from "../utils/generateProductCode.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.use(authMiddleware);

// GET all products
router.get("/", async (req, res) => {
  try {
    const role = String(req.user?.role || "").toUpperCase();
    const companyId = String(req.user?.companyId || "");

    const query =
      role === "OWNER" || role === "INTERNAL_EMPLOYEE"
        ? {}
        : {
            $or: [
              { assignedClients: { $size: 0 } },
              companyId && isValidObjectId(companyId)
                ? { assignedClients: companyId }
                : null,
            ].filter(Boolean),
          };

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET product by ID
router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid product ID" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new product
router.post(
  "/",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      // Generate productCode only if not provided
      if (!req.body?.productCode) {
        req.body.productCode = await generateProductCode();
      }

      const productData = {
        ...req.body,
        productName: req.body?.productName || req.body?.name,
        status: req.body?.status || "draft",
        updatedAt: new Date(),
      };

      const product = new Product(productData);
      await product.save();
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

// PUT update product
router.put(
  "/:id",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product ID" });
      }
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true },
      );
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

// PATCH update product (backward compatible)
router.patch(
  "/:id",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product ID" });
      }
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true },
      );
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

// DELETE product
router.delete(
  "/:id",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid product ID" });
      }
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }
      res.json({
        success: true,
        data: { message: "Product deleted successfully" },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

export default router;
