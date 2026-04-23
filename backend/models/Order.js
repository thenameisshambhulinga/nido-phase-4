import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerItem: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    clientId: {
      type: String,
      required: true,
      trim: true,
    },
    vendorId: {
      type: String,
      trim: true,
      default: "",
    },
    organization: {
      type: String,
      trim: true,
      default: "",
    },
    requestingUser: {
      type: String,
      trim: true,
      default: "",
    },
    approvingUser: {
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
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    products: {
      type: [orderItemSchema],
      default: undefined,
    },
    totalAmount: {
      type: Number,
      required: true,
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
      type: Array,
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Order", orderSchema);
