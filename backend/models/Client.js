import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
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
    companyLogo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone: {
      type: String,
      trim: true,
    },
    contactNumber: {
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
    contactEmployeeId: String,
    jobTitle: String,
    contractType: String,
    businessType: String,
    gst: String,
    pan: String,
    country: String,
    zipCode: String,
    currency: String,
    timeZone: String,
    paymentTerms: String,
    notes: String,
    contractDocuments: [String],
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  },
);

// Index for faster lookup
clientSchema.index({ clientCode: 1 });
clientSchema.index({ clientId: 1 });

export default mongoose.model("Client", clientSchema);
