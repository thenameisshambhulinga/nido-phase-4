import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  clientCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
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
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  contractStart: Date,
  contractEnd: Date,
  totalOrders: {
    type: Number,
    default: 0,
  },
  contactPerson: String,
  contractType: String,
  businessType: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Client", clientSchema);
