import express from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { sendEmail } from "../utils/emailService.js";
import {
  ensurePositiveNumber,
  normalizeEmail,
  validateEmail,
} from "../utils/validators.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const STATUS = {
  PENDING: "pending",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  CONFIRMED: "confirmed",
  ASSIGNED: "assigned",
  PROCESSING: "processing",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

const ALL_STATUSES = new Set(Object.values(STATUS));

const normalizeStatus = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return STATUS.PENDING;
  if (normalized === "placed") return STATUS.CONFIRMED;
  if (normalized === "approved") return STATUS.APPROVED;
  if (normalized === "new") return STATUS.PENDING;
  if (normalized === "processing") return STATUS.PROCESSING;
  if (normalized === "assigned") return STATUS.ASSIGNED;
  if (normalized === "completed" || normalized === "delivered") {
    return STATUS.COMPLETED;
  }
  if (normalized === "cancelled" || normalized === "canceled") {
    return STATUS.CANCELLED;
  }
  if (normalized === "rejected") return STATUS.REJECTED;
  if (normalized === "confirmed") return STATUS.CONFIRMED;
  if (normalized === "pending approval") return STATUS.PENDING_APPROVAL;
  if (normalized === "pending_approval") return STATUS.PENDING_APPROVAL;
  if (normalized === "pending") return STATUS.PENDING;
  return normalized;
};

const pushStatusHistory = (order, status, actor, note = "") => {
  const nextHistory = Array.isArray(order.statusHistory)
    ? [...order.statusHistory]
    : [];
  nextHistory.push({
    status,
    actor,
    note,
    timestamp: new Date(),
  });
  order.statusHistory = nextHistory;
};

const sumItems = (items = []) =>
  items.reduce((sum, item) => sum + ensurePositiveNumber(item.totalCost), 0);

const normalizeItems = (itemsInput = []) =>
  itemsInput
    .map((item, index) => {
      const quantity = ensurePositiveNumber(item.quantity);
      const pricePerItem = ensurePositiveNumber(
        item.pricePerItem ?? item.price ?? item.unitPrice,
      );
      const totalCost = ensurePositiveNumber(
        item.totalCost ?? item.total,
        quantity * pricePerItem,
      );

      return {
        productId: String(item.productId || item.id || `item-${index}`),
        name: String(item.name || "Item"),
        description: String(item.description || ""),
        sku: String(item.sku || ""),
        category: String(item.category || ""),
        vendorId: String(item.vendorId || ""),
        vendorName: String(item.vendorName || ""),
        quantity,
        pricePerItem,
        totalCost,
      };
    })
    .filter((item) => item.quantity > 0);

const normalizePayload = (payload = {}) => {
  const itemsSource = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.products)
      ? payload.products
      : [];
  const items = normalizeItems(itemsSource);
  const subtotal = ensurePositiveNumber(payload.subtotal, sumItems(items));
  const tax = ensurePositiveNumber(payload.tax);
  const shippingCharges = ensurePositiveNumber(payload.shippingCharges);
  const totalAmount = ensurePositiveNumber(
    payload.totalAmount ?? payload.total,
    subtotal + tax + shippingCharges,
  );

  return {
    orderNumber: String(payload.orderNumber || "").trim(),
    clientId: String(payload.clientId || "").trim(),
    companyId: String(payload.companyId || "").trim(),
    organization: String(payload.organization || "").trim(),
    requesterEmail: normalizeEmail(payload.requesterEmail || ""),
    requestingUser: String(payload.requestingUser || "").trim(),
    approvingUser: String(payload.approvingUser || "").trim(),
    vendorId: String(payload.vendorId || "").trim(),
    vendorName: String(payload.vendorName || "").trim(),
    status: normalizeStatus(payload.status),
    orderDate: payload.orderDate ? new Date(payload.orderDate) : new Date(),
    items,
    subtotal,
    tax,
    shippingCharges,
    totalAmount,
    paymentMethod: String(payload.paymentMethod || "").trim(),
    deliveryMethod: String(payload.deliveryMethod || "").trim(),
    billingAddress: String(payload.billingAddress || "").trim(),
    shippingAddress: String(payload.shippingAddress || "").trim(),
    trackingNumber: String(payload.trackingNumber || "").trim(),
    comments: String(payload.comments || "").trim(),
    commentHistory: Array.isArray(payload.commentHistory)
      ? payload.commentHistory
      : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    ownerNotificationEmail: normalizeEmail(
      payload.ownerNotificationEmail || "",
    ),
    assignedUser: String(payload.assignedUser || "").trim(),
    assignedAnalyst: String(payload.assignedAnalyst || "").trim(),
    analystTeam: String(payload.analystTeam || "").trim(),
    createdByRole: String(payload.createdByRole || "").trim(),
  };
};

const buildOrderScope = (req) => {
  const role = String(req.user?.role || "").toUpperCase();
  const companyId = String(req.user?.companyId || "");
  const organization = String(req.user?.organization || "");

  if (role === "OWNER" || role === "INTERNAL_EMPLOYEE") {
    return {};
  }

  if (role === "VENDOR") {
    const clauses = [
      companyId ? { vendorId: companyId } : null,
      organization ? { vendorName: organization } : null,
    ].filter(Boolean);
    return clauses.length ? { $or: clauses } : { _id: null };
  }

  const clauses = [
    companyId ? { companyId } : null,
    organization ? { organization } : null,
  ].filter(Boolean);
  return clauses.length ? { $or: clauses } : { _id: null };
};

const canAccessOrder = (req, order) => {
  const role = String(req.user?.role || "").toUpperCase();
  if (role === "OWNER" || role === "INTERNAL_EMPLOYEE") return true;

  const companyId = String(req.user?.companyId || "");
  const organization = String(req.user?.organization || "");

  if (role === "VENDOR") {
    return (
      (companyId && String(order.vendorId || "") === companyId) ||
      (organization && String(order.vendorName || "") === organization)
    );
  }

  return (
    (companyId && String(order.companyId || "") === companyId) ||
    (organization && String(order.organization || "") === organization)
  );
};

const sendOrderPlacedEmail = async (order) => {
  const to = order.requesterEmail;
  if (!validateEmail(to)) return;

  await sendEmail({
    to,
    type: "order",
    data: {
      name: order.requestingUser || "Customer",
      clientName: order.requestingUser || "Customer",
      orderNumber: order.orderNumber,
      items: order.items || [],
      totalAmount: order.totalAmount || 0,
    },
    async: false,
  });
};

const sendOrderApprovedEmail = async (order) => {
  const to = order.requesterEmail;
  if (!validateEmail(to)) return;

  await sendEmail({
    to,
    type: "approval",
    data: {
      name: order.requestingUser || "Customer",
      clientName: order.requestingUser || "Customer",
      orderNumber: order.orderNumber,
      approvedBy: order.approvingUser || "Nido Tech",
      items: order.items || [],
      totalAmount: order.totalAmount || 0,
    },
    async: false,
  });
};

const sendInvoiceEmail = async (order, invoice) => {
  const recipients = [
    order.requesterEmail,
    order.ownerNotificationEmail,
  ].filter(
    (value, index, array) =>
      validateEmail(value) && array.indexOf(value) === index,
  );

  if (!recipients.length) return;

  await sendEmail({
    to: recipients,
    type: "invoice",
    data: {
      name: order.requestingUser || order.organization || "Customer",
      clientName: order.requestingUser || order.organization || "Customer",
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      totalAmount: invoice.total || 0,
      dueDate: invoice.dueDate || "",
      invoiceUrl: `${process.env.FRONTEND_URL || "https://app.nidotech.com"}/sales/invoices/${invoice._id}`,
    },
    async: false,
  });
};

const notifyApprovers = async (order) => {
  const admins = await User.find({
    role: "CLIENT_ADMIN",
    status: "active",
    isActive: true,
    $or: [
      order.companyId ? { companyId: order.companyId } : null,
      order.organization ? { organization: order.organization } : null,
    ].filter(Boolean),
  })
    .select("email")
    .lean();

  const recipients = admins
    .map((entry) => normalizeEmail(entry.email))
    .filter(
      (value, index, array) =>
        validateEmail(value) && array.indexOf(value) === index,
    );

  if (!recipients.length) return;

  await sendEmail({
    to: recipients,
    type: "order",
    data: {
      name: "Client Admin",
      clientName: order.requestingUser || "Client User",
      orderNumber: order.orderNumber,
      items: order.items || [],
      totalAmount: order.totalAmount || 0,
    },
    async: false,
  });
};

const sendVendorAssignmentEmail = async (order) => {
  if (!order.vendorId && !order.vendorName) return;

  // Send email to order requester
  const to = order.requesterEmail;
  if (validateEmail(to)) {
    await sendEmail({
      to,
      type: "order",
      data: {
        name: order.requestingUser || "Customer",
        clientName: order.requestingUser || "Customer",
        orderNumber: order.orderNumber,
        title: "Order Assigned to Vendor",
        intro: `Your order has been assigned to vendor <b>${order.vendorName || order.vendorId}</b> for fulfillment.`,
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
      },
      async: false,
    });
  }
};

const buildInvoiceNumber = (orderNumber) =>
  `INV-${String(orderNumber || Date.now())
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-16)}`;

const ensureInvoiceForOrder = async (order) => {
  if (order.invoiceId) {
    return Invoice.findById(order.invoiceId);
  }

  const existing = await Invoice.findOne({
    $or: [
      { orderId: String(order._id) },
      { invoiceNumber: buildInvoiceNumber(order.orderNumber) },
    ],
  });
  if (existing) {
    order.invoiceId = String(existing._id);
    order.invoiceNumber = existing.invoiceNumber;
    await order.save();
    return existing;
  }

  const issueDate = new Date().toISOString().slice(0, 10);
  const invoice = await Invoice.create({
    invoiceNumber: buildInvoiceNumber(order.orderNumber),
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    vendorOrClient: order.organization || order.requestingUser || "Client",
    customerName: order.organization || order.requestingUser || "Client",
    customerId: order.clientId || "",
    type: "client",
    invoiceDate: issueDate,
    issueDate,
    dueDate: issueDate,
    paymentTerms: order.paymentMethod || "Due on Receipt",
    billingAddress: order.billingAddress || "",
    shippingAddress: order.shippingAddress || "",
    emailRecipients: [
      order.requesterEmail,
      order.ownerNotificationEmail,
    ].filter(Boolean),
    items: (order.items || []).map((item) => ({
      description: item.description || item.name || "Item",
      quantity: ensurePositiveNumber(item.quantity),
      unitPrice: ensurePositiveNumber(item.pricePerItem),
      total: ensurePositiveNumber(item.totalCost),
    })),
    subtotal: ensurePositiveNumber(order.subtotal, sumItems(order.items)),
    tax: ensurePositiveNumber(order.tax),
    cgst: 0,
    sgst: 0,
    adjustment: 0,
    shippingCharges: ensurePositiveNumber(order.shippingCharges),
    total: ensurePositiveNumber(order.totalAmount),
    amountPaid: 0,
    balanceDue: ensurePositiveNumber(order.totalAmount),
    status: "SENT",
    paymentStatus: "UNPAID",
    notes: `Generated automatically from order ${order.orderNumber}`,
    termsAndConditions: "System generated invoice.",
    createdBy: "System",
  });

  order.invoiceId = String(invoice._id);
  order.invoiceNumber = invoice.invoiceNumber;
  await order.save();
  return invoice;
};

const approveOrderFlow = async (order, actor) => {
  order.approvingUser = actor.name || actor.email || "Client Admin";
  order.approvingUserId = actor.sub || "";
  order.approvedBy = actor.sub || "";
  order.approvalDate = new Date();
  pushStatusHistory(
    order,
    STATUS.APPROVED,
    actor.email || actor.name || "Client Admin",
    "Approved by client admin",
  );
  order.status = STATUS.CONFIRMED;
  order.placementDate = new Date();
  pushStatusHistory(
    order,
    STATUS.CONFIRMED,
    actor.email || actor.name || "Client Admin",
    "Automatically confirmed after approval",
  );
  await order.save();
  await sendOrderApprovedEmail(order);
  return order;
};

router.use(authMiddleware);

router.get(
  "/owner",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      const query = {};
      if (req.query.status) {
        query.status = normalizeStatus(req.query.status);
      }
      const orders = await Order.find(query).sort({ createdAt: -1 });
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.get("/", async (req, res) => {
  try {
    const query = { ...buildOrderScope(req) };
    if (req.query.clientId) query.clientId = String(req.query.clientId);
    if (req.query.vendorId) query.vendorId = String(req.query.vendorId);
    if (req.query.companyId) query.companyId = String(req.query.companyId);
    if (req.query.orderNumber)
      query.orderNumber = String(req.query.orderNumber);
    if (req.query.status) query.status = normalizeStatus(req.query.status);

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

    if (!canAccessOrder(req, order)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(
  "/",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN", "CLIENT_USER"]),
  async (req, res) => {
    try {
      const payload = normalizePayload(req.body || {});
      if (!payload.orderNumber) {
        return res.status(400).json({
          success: false,
          error: "orderNumber is required",
        });
      }
      if (!payload.items.length) {
        return res.status(400).json({
          success: false,
          error: "At least one order item is required",
        });
      }

      const requesterRole = String(req.user.role || "").toUpperCase();
      const initialStatus =
        requesterRole === "CLIENT_USER"
          ? STATUS.PENDING
          : requesterRole === "CLIENT_ADMIN"
            ? STATUS.CONFIRMED
            : payload.status && ALL_STATUSES.has(payload.status)
              ? payload.status
              : STATUS.CONFIRMED;

      const order = new Order({
        ...payload,
        companyId: String(req.user.companyId || payload.companyId || ""),
        organization: req.user.organization || payload.organization || "",
        createdBy: String(req.user.sub || ""),
        requesterEmail: normalizeEmail(
          req.user.email || payload.requesterEmail || "",
        ),
        requestingUser:
          req.user.name || payload.requestingUser || "Client User",
        requestingUserId: String(req.user.sub || ""),
        createdByRole: requesterRole,
        status: initialStatus,
        subtotal: payload.subtotal,
        tax: payload.tax,
        shippingCharges: payload.shippingCharges,
        totalAmount: payload.totalAmount,
      });

      pushStatusHistory(
        order,
        initialStatus,
        req.user.email || req.user.name || "System",
        "Order created",
      );

      await order.save();
      await sendOrderPlacedEmail(order);
      if (initialStatus === STATUS.PENDING) {
        await notifyApprovers(order);
      }

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.patch(
  "/:id/approve",
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

      if (!canAccessOrder(req, order) && req.user.role !== "OWNER") {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      await approveOrderFlow(order, req.user);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.put(
  "/:id/status",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid order ID" });
      }

      const targetStatus = normalizeStatus(req.body?.status);
      if (!ALL_STATUSES.has(targetStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${targetStatus}'`,
        });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      if (!canAccessOrder(req, order)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      if (
        [STATUS.APPROVED, STATUS.CONFIRMED, STATUS.PROCESSING].includes(
          targetStatus,
        ) &&
        [STATUS.PENDING, STATUS.PENDING_APPROVAL].includes(
          normalizeStatus(order.status),
        ) &&
        ["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN"].includes(req.user.role)
      ) {
        await approveOrderFlow(order, req.user);
      } else {
        order.status = targetStatus;
        if (targetStatus === STATUS.REJECTED) {
          order.rejectionReason = String(
            req.body?.reason || order.rejectionReason || "",
          );
        }
        if (targetStatus === STATUS.CANCELLED) {
          order.cancelledAt = new Date();
        }
        if (targetStatus === STATUS.COMPLETED) {
          order.completedAt = new Date();
        }
        pushStatusHistory(
          order,
          targetStatus,
          req.user.email || req.user.name || "System",
          "Order status updated",
        );
        await order.save();
      }

      if (order.status === STATUS.COMPLETED) {
        const invoice = await ensureInvoiceForOrder(order);
        if (invoice) {
          await sendInvoiceEmail(order, invoice);
        }
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.patch(
  "/:id",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN", "CLIENT_USER"]),
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

      if (!canAccessOrder(req, order)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      const payload = normalizePayload({ ...order.toObject(), ...req.body });
      Object.assign(order, payload);
      const requestedStatus = req.body?.status
        ? normalizeStatus(req.body.status)
        : null;

      if (
        requestedStatus &&
        [STATUS.APPROVED, STATUS.CONFIRMED, STATUS.PROCESSING].includes(
          requestedStatus,
        ) &&
        [STATUS.PENDING, STATUS.PENDING_APPROVAL].includes(
          normalizeStatus(order.status),
        ) &&
        ["OWNER", "INTERNAL_EMPLOYEE", "CLIENT_ADMIN"].includes(req.user.role)
      ) {
        await approveOrderFlow(order, req.user);
      } else if (requestedStatus) {
        order.status = requestedStatus;
        pushStatusHistory(
          order,
          order.status,
          req.user.email || req.user.name || "System",
          "Order updated",
        );
        await order.save();
      } else {
        await order.save();
      }

      if (order.status === STATUS.COMPLETED) {
        const invoice = await ensureInvoiceForOrder(order);
        if (invoice) {
          await sendInvoiceEmail(order, invoice);
        }
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.put(
  "/:id/assign-vendor",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid order ID" });
      }

      const vendorId = String(req.body?.vendorId || "").trim();
      const vendorName = String(req.body?.vendorName || "").trim();
      const itemId = String(req.body?.itemId || "").trim();

      if (!vendorId && !vendorName) {
        return res.status(400).json({
          success: false,
          error: "vendorId or vendorName is required",
        });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      order.vendorId = vendorId || order.vendorId || "";
      order.vendorName = vendorName || order.vendorName || "";
      order.status = STATUS.ASSIGNED;

      if (itemId) {
        order.items = order.items.map((item) => {
          const current =
            typeof item.toObject === "function" ? item.toObject() : item;
          if (String(current.productId || "") !== itemId) {
            return current;
          }
          return {
            ...current,
            vendorId: order.vendorId,
            vendorName: order.vendorName,
          };
        });
      } else {
        order.items = order.items.map((item) => {
          const current =
            typeof item.toObject === "function" ? item.toObject() : item;
          return {
            ...current,
            vendorId: order.vendorId,
            vendorName: order.vendorName,
          };
        });
      }

      pushStatusHistory(
        order,
        STATUS.ASSIGNED,
        req.user.email || req.user.name || "Owner",
        `Vendor assigned: ${order.vendorName || order.vendorId}`,
      );

      await order.save();
      await sendVendorAssignmentEmail(order);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

router.delete(
  "/:id",
  roleMiddleware(["OWNER", "INTERNAL_EMPLOYEE"]),
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid order ID" });
      }

      const deleted = await Order.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      res.json({
        success: true,
        data: { message: "Order deleted successfully" },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

export default router;
