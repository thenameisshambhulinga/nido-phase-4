//backend/routes/products.js
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

    const query = {};

    if (!["OWNER", "INTERNAL_EMPLOYEE"].includes(role)) {
      query.publicationStatus = "published";
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: products,
    });
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

    const role = String(req.user?.role || "").toUpperCase();

    if (!["OWNER", "INTERNAL_EMPLOYEE"].includes(role)) {
      const companyId = String(req.user?.companyId || "");

      const allowed =
        product.assignedClients.length === 0 ||
        product.assignedClients.some((id) => String(id) === companyId);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
        });
      }
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
      if (!req.body.productName || !String(req.body.productName).trim()) {
        return res.status(400).json({
          success: false,
          error: "Product name is required",
        });
      }

      if (!req.body.category || !String(req.body.category).trim()) {
        return res.status(400).json({
          success: false,
          error: "Category is required",
        });
      }

      const normalizedInventoryStatus = (() => {
        const raw = String(
          req.body.inventoryStatus || req.body.status || "In Stock",
        )
          .trim()
          .toLowerCase();

        if (raw.includes("low")) return "Low Stock";
        if (raw.includes("out")) return "Out Of Stock";

        return "In Stock";
      })();

      const normalizedPublicationStatus = (() => {
        const raw = String(req.body.publicationStatus || "draft")
          .trim()
          .toLowerCase();

        if (raw === "published") return "published";

        if (raw === "archived") return "archived";

        return "draft";
      })();

      const normalizedPayload = {
        productCode: String(req.body.productCode || "").trim(),

        sku: String(req.body.sku || "").trim(),

        productName: String(req.body.productName || "").trim(),

        description: String(req.body.description || "").trim(),

        brand: String(req.body.brand || "").trim(),

        category: String(req.body.category || "").trim(),

        subcategory: String(req.body.subcategory || "").trim(),

        tags: Array.isArray(req.body.tags) ? req.body.tags : [],

        productNotes: String(req.body.productNotes || "").trim(),

        images: Array.isArray(req.body.images) ? req.body.images : [],

        keySpecifications: Array.isArray(req.body.keySpecifications)
          ? req.body.keySpecifications
          : [],

        generalSpecifications: Array.isArray(req.body.generalSpecifications)
          ? req.body.generalSpecifications
          : [],

        vendorInventory: Array.isArray(req.body.vendorInventory)
          ? req.body.vendorInventory
          : [],

        stock: Number(req.body.stock || 0),

        price: Number(req.body.price || 0),

        publicationStatus: normalizedPublicationStatus,

        inventoryStatus: normalizedInventoryStatus,

        status:
          normalizedPublicationStatus === "draft"
            ? "draft"
            : normalizedInventoryStatus,
      };

      if (!normalizedPayload.productCode) {
        normalizedPayload.productCode = `PROD-${Date.now()}`;
      }

      const createdProduct = await Product.create(normalizedPayload);

      return res.status(201).json({
        success: true,
        data: createdProduct,
      });
    } catch (error) {
      console.error("PRODUCT CREATE ERROR:", error);

      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to create product",
      });
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

      const normalizedPayload = {
        ...req.body,

        subcategory: req.body.subcategory || req.body.subCategory || "",

        productName: req.body.productName || req.body.name || "",

        tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [],

        images: Array.isArray(req.body.images)
          ? req.body.images.filter(Boolean)
          : [],

        keySpecifications: Array.isArray(req.body.keySpecifications)
          ? req.body.keySpecifications
          : [],

        generalSpecifications: Array.isArray(req.body.generalSpecifications)
          ? req.body.generalSpecifications
          : [],

        vendorInventory: Array.isArray(req.body.vendorInventory)
          ? req.body.vendorInventory
          : [],
      };

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...normalizedPayload,
          updatedAt: new Date(),
        },
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

      const normalizedPayload = {
        ...req.body,

        subcategory: req.body.subcategory || req.body.subCategory || "",

        productName: req.body.productName || req.body.name || "",

        tags: Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [],

        images: Array.isArray(req.body.images)
          ? req.body.images.filter(Boolean)
          : [],

        keySpecifications: Array.isArray(req.body.keySpecifications)
          ? req.body.keySpecifications
          : [],

        generalSpecifications: Array.isArray(req.body.generalSpecifications)
          ? req.body.generalSpecifications
          : [],

        vendorInventory: Array.isArray(req.body.vendorInventory)
          ? req.body.vendorInventory
          : [],
      };

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...normalizedPayload,
          updatedAt: new Date(),
        },
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
