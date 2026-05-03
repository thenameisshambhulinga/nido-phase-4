import mongoose from "mongoose";

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Order status enum values
export const ORDER_STATUSES = [
  "pending", // Initial status
  "pending_approval", // Awaiting client admin approval
  "approved", // Approved by client admin
  "confirmed", // Confirmed and visible to owner
  "assigned", // Assigned to vendor
  "processing", // Vendor processing
  "completed", // Completed/Delivered
  "rejected", // Rejected
  "cancelled", // Cancelled
];

// =============================================================================
// ORDER ITEM SCHEMA
// =============================================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    sku: { type: String, trim: true },
    category: { type: String, trim: true },
    vendorId: { type: String, trim: true, default: "" },
    vendorName: { type: String, trim: true, default: "" },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    pricePerItem: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    totalCost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: [0, "Total cannot be negative"],
    },
  },
  { _id: false },
);

// =============================================================================
// ORDER SCHEMA
// =============================================================================

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    clientId: {
      type: String,
      required: [true, "Client ID is required"],
      trim: true,
      index: true,
    },
    vendorId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    vendorName: {
      type: String,
      trim: true,
      default: "",
    },
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
    requestingUser: {
      type: String,
      trim: true,
      default: "",
    },
    requestingUserId: {
      type: String,
      trim: true,
      default: "",
    },
    approvingUser: {
      type: String,
      trim: true,
      default: "",
    },
    approvedBy: {
      type: String,
      trim: true,
      default: "",
    },
    approvingUserId: {
      type: String,
      trim: true,
      default: "",
    },
    assignedUser: {
      type: String,
      trim: true,
      default: "",
    },
    assignedAnalyst: {
      type: String,
      trim: true,
      default: "",
    },
    analystTeam: {
      type: String,
      trim: true,
      default: "Operations",
    },
    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: "Invalid order status",
      },
      default: "pending",
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    placementDate: {
      type: Date,
      default: null,
    },
    items: {
      type: [orderItemSchema],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    products: {
      type: [orderItemSchema],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total cannot be negative"],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryMethod: {
      type: String,
      trim: true,
      default: "",
    },
    billingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: "",
    },
    comments: {
      type: String,
      trim: true,
      default: "",
    },
    commentHistory: {
      type: [
        new mongoose.Schema({
          id: String,
          user: String,
          text: String,
          type: String,
          actor: String,
          action: String,
          note: String,
          timestamp: { type: Date, default: Date.now },
        }),
      ],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
    ownerNotificationEmail: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          return EMAIL_REGEX.test(v);
        },
        message: "Invalid email format",
      },
    },
    requesterEmail: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          return EMAIL_REGEX.test(v);
        },
        message: "Invalid email format",
      },
    },
    createdByRole: {
      type: String,
      trim: true,
      default: "",
    },
    companyId: {
      type: String,
      trim: true,
      default: "nido-tech",
      index: true,
    },
    statusHistory: {
      type: [
        new mongoose.Schema({
          status: String,
          actor: String,
          note: String,
          timestamp: { type: Date, default: Date.now },
        }),
      ],
      default: [],
    },
    invoiceId: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// =============================================================================
// INDEXES
// =============================================================================

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ clientId: 1, status: 1 });
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ companyId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// =============================================================================
// PRE-SAVE MIDDLEWARE
// =============================================================================

orderSchema.pre("save", function (next) {
  // Calculate totals if items exist
  if (this.items && this.items.length > 0 && !this.totalAmount) {
    this.subtotal = this.items.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0,
    );
    this.totalAmount = this.subtotal + this.tax + this.shippingCharges;
  }
  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

orderSchema.methods.addStatusHistory = function (status, actor, note = "") {
  this.statusHistory.push({
    status,
    actor,
    note,
    timestamp: new Date(),
  });
};

// =============================================================================
// STATIC METHODS
// =============================================================================

orderSchema.statics.validateOrderNumberUnique = async function (orderNumber) {
  const existing = await this.findOne({ orderNumber: String(orderNumber) });
  return !existing;
};

orderSchema.statics.getStatuses = function () {
  return ORDER_STATUSES;
};

export default mongoose.model("Order", orderSchema);
