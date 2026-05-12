import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  vendorCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  vendorName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: String,
  city: String,
  state: String,
  country: String,
  description: String,
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
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

vendorSchema.index({ vendorId: 1 });

export default mongoose.model("Vendor", vendorSchema);
