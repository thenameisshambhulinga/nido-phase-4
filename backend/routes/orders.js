import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const ORDER_STATUSES = new Set([
  "pending",
  "pending_approval",
  "approved",
  "placed",
  "assigned",
  "processing",
  "completed",
  "rejected",
  "cancelled",
]);

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildInvoiceNumber = (orderNumber) =>
  `INV-${String(orderNumber || Date.now())
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-16)}`;

const generateInvoiceForOrder = async (orderDoc) => {
  if (!orderDoc || orderDoc.invoiceId) {
    return null;
  }

  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = issueDate;
  const subtotal = safeNumber(
    orderDoc.totalAmount,
    (orderDoc.items || []).reduce(
      (sum, item) => sum + safeNumber(item.totalCost),
      0,
    ),
  );
  const invoiceNumber = buildInvoiceNumber(orderDoc.orderNumber);

  const existingInvoice = await Invoice.findOne({
    $or: [{ orderId: String(orderDoc._id) }, { invoiceNumber }],
  });

  if (existingInvoice) {
    orderDoc.invoiceId = String(existingInvoice._id);
    orderDoc.invoiceNumber = existingInvoice.invoiceNumber;
    if (!orderDoc.completedAt) {
      orderDoc.completedAt = new Date();
    }
    await orderDoc.save();
    return existingInvoice;
  }

  const invoice = await Invoice.create({
    invoiceNumber,
    orderId: String(orderDoc._id),
    orderNumber: orderDoc.orderNumber,
    vendorOrClient:
      orderDoc.organization || orderDoc.requestingUser || "Client",
    customerName: orderDoc.organization || "",
    customerId: orderDoc.clientId || "",
    type: orderDoc.vendorId ? "vendor" : "client",
    invoiceDate: issueDate,
    issueDate,
    dueDate,
    paymentTerms: orderDoc.paymentMethod || "Due on Receipt",
    billingAddress: orderDoc.billingAddress || "",
    shippingAddress: orderDoc.shippingAddress || "",
    emailRecipients: orderDoc.ownerNotificationEmail
      ? [orderDoc.ownerNotificationEmail]
      : [],
    items: (orderDoc.items || []).map((item) => ({
      description: item.description || item.name || "Order item",
      quantity: safeNumber(item.quantity),
      unitPrice: safeNumber(item.pricePerItem),
      total: safeNumber(item.totalCost),
    })),
    subtotal,
    tax: 0,
    cgst: 0,
    sgst: 0,
    adjustment: 0,
    shippingCharges: 0,
    total: subtotal,
    amountPaid: 0,
    balanceDue: subtotal,
    status: "SENT",
    paymentStatus: "UNPAID",
    notes: `Generated automatically from order ${orderDoc.orderNumber}`,
    termsAndConditions: "Auto-generated on order completion.",
    createdBy: "System",
  });

  orderDoc.invoiceId = String(invoice._id);
  orderDoc.invoiceNumber = invoice.invoiceNumber;
  orderDoc.completedAt = new Date();
  await orderDoc.save();

  return invoice;
};

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
      vendorId: item.vendorId || "",
      vendorName: item.vendorName || "",
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
    vendorId: payload.vendorId || "",
    vendorName: payload.vendorName || "",
    requesterEmail:
      payload.requesterEmail || payload.ownerNotificationEmail || "",
    createdByRole: String(
      payload.createdByRole || payload.requesterRole || payload.userRole || "",
    ),
    companyId: payload.companyId || "nido-tech",
    items,
    totalAmount,
  };
};

const pushHistory = (order, status, actor, note = "") => {
  const nextHistory = Array.isArray(order.statusHistory)
    ? [...order.statusHistory]
    : [];
  nextHistory.push({
    status,
    actor,
    note,
    timestamp: new Date().toISOString(),
  });
  order.statusHistory = nextHistory;
};

const sendOrderNotification = async (order, type) => {
  const recipient = order.requesterEmail || order.ownerNotificationEmail;
  if (!recipient) return;

  try {
    const data = {
      orderNumber: order.orderNumber || order._id,
      orderDate: order.createdAt || new Date(),
      items: order.items || [],
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shippingCharges: order.shippingCharges || 0,
      totalAmount: order.totalAmount || 0,
      clientName: order.shippingInfo?.fullName || "Client",
      clientEmail: recipient,
      organization: order.shippingInfo?.companyName || "Organization",
      deliveryAddress: order.shippingInfo?.address || "",
      shippingMethod: order.shippingMethod || "Standard",
      paymentMethod: order.paymentMethod || "Payment",
    };

    const templateType = type === "approved" ? "approval" : "order";

    // For approval emails, add approver info
    if (type === "approved") {
      data.approvedBy = "System Administrator";
    }

    void sendEmail({
      to: recipient,
      type: templateType,
      data,
      async: true,
    }).catch((err) => {
      console.error(`Failed to send ${type} email:`, err);
    });
  } catch (error) {
    console.error("Error in sendOrderNotification:", error);
  }
};

const sendApprovalRequestEmails = async (order) => {
  const approvers = await User.find({
    companyId: order.companyId || "nido-tech",
    status: "active",
    role: { $in: ["CLIENT_ADMIN", "INTERNAL_EMPLOYEE"] },
  })
    .select("email")
    .lean();

  const recipients = [
    ...new Set(approvers.map((user) => user.email).filter(Boolean)),
  ];
  if (!recipients.length && order.ownerNotificationEmail) {
    recipients.push(order.ownerNotificationEmail);
  }
  if (!recipients.length) return;

  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + safeNumber(item.totalCost),
    0,
  );

  void sendEmail({
    to: recipients,
    type: "order",
    data: {
      orderNumber: order.orderNumber || order._id,
      orderDate: order.orderDate || order.createdAt || new Date(),
      items: order.items || [],
      subtotal,
      tax: safeNumber(order.tax),
      shippingCharges: safeNumber(order.shippingCharges),
      totalAmount: safeNumber(order.totalAmount, subtotal),
      clientName: order.requestingUser || "Client User",
      clientEmail: order.requesterEmail || "",
      organization: order.organization || "Client Organization",
      deliveryAddress: order.shippingAddress || "",
      shippingMethod:
        order.shippingMethod || order.deliveryMethod || "Standard",
      paymentMethod: order.paymentMethod || "Payment",
    },
    async: true,
  }).catch((err) => {
    console.error("Failed to send approval request email:", err);
  });
};

router.get("/", async (req, res) => {
  try {
    const { clientId, vendorId, status, orderNumber } = req.query;
    const query = {};

    if (clientId) query.clientId = String(clientId);
    if (vendorId) query.vendorId = String(vendorId);
    if (status) query.status = String(status).toLowerCase();
    if (orderNumber) query.orderNumber = String(orderNumber);
    if (req.query.companyId) query.companyId = String(req.query.companyId);

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

    const creatorRole = String(
      payload.createdByRole || payload.requesterRole || payload.userRole || "",
    ).toUpperCase();
    const normalizedStatus =
      creatorRole === "CLIENT_USER"
        ? "pending_approval"
        : creatorRole === "CLIENT_ADMIN"
          ? "placed"
          : String(payload.status || "pending").toLowerCase();
    if (!ORDER_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${normalizedStatus}'`,
      });
    }

    const order = new Order({
      ...payload,
      status: normalizedStatus,
    });

    pushHistory(
      order,
      normalizedStatus,
      payload.requestingUser || payload.createdBy || "System",
      "Order created",
    );

    await order.save();
    if (normalizedStatus === "pending_approval") {
      void sendApprovalRequestEmails(order);
    }
    void sendOrderNotification(
      order,
      normalizedStatus === "placed" ? "approved" : "placed",
    );
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
      if (!ORDER_STATUSES.has(payload.status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${payload.status}'`,
        });
      }
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    Object.assign(order, payload);
    if (payload.status === "completed" && !order.completedAt) {
      order.completedAt = new Date();
    }
    await order.save();
    if (order.status === "completed") {
      await generateInvoiceForOrder(order);
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
      if (!ORDER_STATUSES.has(payload.status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${payload.status}'`,
        });
      }
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    Object.assign(order, payload);
    if (payload.status === "completed" && !order.completedAt) {
      order.completedAt = new Date();
    }
    await order.save();
    if (order.status === "completed") {
      await generateInvoiceForOrder(order);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const status = String(req.body?.status || "").toLowerCase();
    if (!status) {
      return res
        .status(400)
        .json({ success: false, error: "status is required" });
    }
    if (!ORDER_STATUSES.has(status)) {
      return res
        .status(400)
        .json({ success: false, error: `Invalid status '${status}'` });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.status = status;
    pushHistory(
      order,
      status,
      req.user?.email || req.body?.actor || "System",
      "Status updated",
    );
    if (status === "completed" && !order.completedAt) {
      order.completedAt = new Date();
    }
    await order.save();
    if (status === "completed") {
      await generateInvoiceForOrder(order);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid order ID" });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      order.status = "approved";
      pushHistory(
        order,
        "approved",
        req.user.email,
        "Approved by client admin",
      );
      order.status = "placed";
      pushHistory(
        order,
        "placed",
        req.user.email,
        "Automatically placed after approval",
      );
      await order.save();

      await sendOrderNotification(order, "approved");

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.put("/:id/assign", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const { vendorId = "", vendorName = "", itemId = "" } = req.body || {};
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, error: "vendorId is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.vendorId = String(vendorId);
    order.vendorName = String(vendorName || order.vendorName || "");
    if (order.status === "pending") {
      order.status = "assigned";
    }

    if (itemId) {
      order.items = order.items.map((item) => {
        const currentItem =
          typeof item.toObject === "function" ? item.toObject() : item;
        return String(currentItem.productId || currentItem.id || "") ===
          String(itemId)
          ? {
              ...currentItem,
              vendorId: String(vendorId),
              vendorName: String(vendorName || order.vendorName || ""),
            }
          : currentItem;
      });
    } else {
      order.items = order.items.map((item) => {
        const currentItem =
          typeof item.toObject === "function" ? item.toObject() : item;
        return {
          ...currentItem,
          vendorId: String(vendorId),
          vendorName: String(vendorName || order.vendorName || ""),
        };
      });
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/:id/assign-vendor", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid order ID" });
    }

    const { vendorId = "", vendorName = "", itemId = "" } = req.body || {};
    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, error: "vendorId is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    order.vendorId = String(vendorId);
    order.vendorName = String(vendorName || order.vendorName || "");
    if (order.status === "pending") {
      order.status = "assigned";
    }

    if (itemId) {
      order.items = order.items.map((item) => {
        const currentItem =
          typeof item.toObject === "function" ? item.toObject() : item;
        return String(currentItem.productId || currentItem.id || "") ===
          String(itemId)
          ? {
              ...currentItem,
              vendorId: String(vendorId),
              vendorName: String(vendorName || order.vendorName || ""),
            }
          : currentItem;
      });
    } else {
      order.items = order.items.map((item) => {
        const currentItem =
          typeof item.toObject === "function" ? item.toObject() : item;
        return {
          ...currentItem,
          vendorId: String(vendorId),
          vendorName: String(vendorName || order.vendorName || ""),
        };
      });
    }

    await order.save();
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
