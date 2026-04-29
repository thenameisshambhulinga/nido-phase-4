import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      default: "",
    },
    vendorOrClient: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    customerId: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["vendor", "client"],
      default: "client",
      index: true,
    },
    invoiceDate: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: String,
      required: true,
      trim: true,
    },
    paymentTerms: {
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
    placeOfSupply: {
      type: String,
      trim: true,
      default: "",
    },
    emailRecipients: {
      type: [String],
      default: [],
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    cgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgst: {
      type: Number,
      default: 0,
      min: 0,
    },
    adjustment: {
      type: Number,
      default: 0,
    },
    shippingCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "SENT", "PARTIALLY PAID", "PAID", "OVERDUE"],
      default: "DRAFT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIALLY PAID", "PAID"],
      default: "UNPAID",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: "",
    },
    bankDetails: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
      default: "System",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Invoice", invoiceSchema);
