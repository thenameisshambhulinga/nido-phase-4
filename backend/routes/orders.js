import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeOrderPayload = (payload) => {
  const itemsInput = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.products)
      ? payload.products
      : [];

  const items = itemsInput.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const pricePerItem =
      Number(item.pricePerItem ?? item.price ?? item.unitPrice) || 0;
    const totalCost =
      Number(item.totalCost ?? item.total) || quantity * pricePerItem;

    return {
      productId: item.productId || item.id || "",
      name: item.name || "Unnamed Item",
      description: item.description || "",
      sku: item.sku || "",
      category: item.category || "",
      quantity,
      pricePerItem,
      totalCost,
    };
  });

  const totalAmount =
    Number(payload.totalAmount ?? payload.total) ||
    items.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

  return {
    ...payload,
    items,
    totalAmount,
  };
};

router.get("/", async (req, res) => {
  try {
    const { clientId, vendorId, status, orderNumber } = req.query;
    const query = {};

    if (clientId) query.clientId = String(clientId);
    if (vendorId) query.vendorId = String(vendorId);
    if (status) query.status = String(status).toLowerCase();
    if (orderNumber) query.orderNumber = String(orderNumber);

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizeOrderPayload(req.body || {});

    if (!payload.orderNumber || !payload.clientId) {
      return res.status(400).json({
        success: false,
        error: "orderNumber and clientId are required",
      });
    }

    const order = new Order({
      ...payload,
      status: String(payload.status || "pending").toLowerCase(),
    });

    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const payload = normalizeOrderPayload(req.body || {});
    if (payload.status) {
      payload.status = String(payload.status).toLowerCase();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const payload = normalizeOrderPayload(req.body || {});
    if (payload.status) {
      payload.status = String(payload.status).toLowerCase();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({
      success: true,
      data: { message: "Order deleted successfully" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
