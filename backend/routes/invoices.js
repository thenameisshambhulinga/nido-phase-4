import express from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInvoicePayload = (payload = {}) => {
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => {
        const quantity = safeNumber(item.quantity);
        const unitPrice = safeNumber(item.unitPrice ?? item.rate);
        const total = safeNumber(item.total, quantity * unitPrice);
        return {
          description: item.description || item.name || "Line item",
          quantity,
          unitPrice,
          total,
        };
      })
    : [];

  const subtotal = safeNumber(
    payload.subtotal,
    items.reduce((sum, item) => sum + safeNumber(item.total), 0),
  );
  const shippingCharges = safeNumber(payload.shippingCharges);
  const adjustment = safeNumber(payload.adjustment);
  const cgst = safeNumber(payload.cgst);
  const sgst = safeNumber(payload.sgst);
  const tax = safeNumber(payload.tax, cgst + sgst);
  const total = safeNumber(
    payload.total ?? payload.totalAmount,
    subtotal + tax + adjustment + shippingCharges,
  );
  const amountPaid = safeNumber(payload.amountPaid);
  const balanceDue = safeNumber(
    payload.balanceDue,
    Math.max(0, total - amountPaid),
  );

  return {
    ...payload,
    items,
    subtotal,
    shippingCharges,
    adjustment,
    cgst,
    sgst,
    tax,
    total,
    amountPaid,
    balanceDue,
  };
};

router.get("/", async (req, res) => {
  try {
    const { orderId, status, type } = req.query;
    const query = {};

    if (orderId) query.orderId = String(orderId);
    if (status) query.status = String(status).toUpperCase();
    if (type) query.type = String(type).toLowerCase();

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = normalizeInvoicePayload(req.body || {});

    if (!payload.invoiceNumber || !payload.vendorOrClient || !payload.dueDate) {
      return res.status(400).json({
        success: false,
        error: "invoiceNumber, vendorOrClient, and dueDate are required",
      });
    }

    const invoice = new Invoice({
      ...payload,
      type: String(payload.type || "client").toLowerCase(),
      status: String(payload.status || "DRAFT").toUpperCase(),
      paymentStatus: String(payload.paymentStatus || "UNPAID").toUpperCase(),
    });

    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid invoice ID" });
    }

    const payload = normalizeInvoicePayload(req.body || {});
    if (payload.status) payload.status = String(payload.status).toUpperCase();
    if (payload.paymentStatus) {
      payload.paymentStatus = String(payload.paymentStatus).toUpperCase();
    }
    if (payload.type) payload.type = String(payload.type).toLowerCase();

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({
      success: true,
      data: { message: "Invoice deleted successfully" },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
