import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productName: {
      type: String,
      trim: true,
      default: "",
    },
    masterProductId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    assignedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    vendorId: {
      type: String,
      trim: true,
      default: "",
    },
    vendorName: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pieces",
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

productSchema.pre("validate", function normalizeProductNames(next) {
  if (!this.name && this.productName) {
    this.name = this.productName;
  }
  if (!this.productName && this.name) {
    this.productName = this.name;
  }
  next();
});

productSchema.index({ name: 1 });
productSchema.index({ assignedClients: 1 });

export default mongoose.model("Product", productSchema);
