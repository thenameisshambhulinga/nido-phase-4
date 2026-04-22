import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  vendorId: {
    type: String,
    trim: true,
  },
  vendorName: {
    type: String,
    trim: true,
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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
