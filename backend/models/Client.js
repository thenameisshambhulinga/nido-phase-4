import mongoose from "mongoose";

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const GST_REGEX =
  /^([0-9]{2})([A-Z]{5}[A-Z0-9]{4})([0-9]{4})([A-Z]{1})([0-9]{1})$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^\d{10}$/;

// =============================================================================
// CLIENT SCHEMA
// =============================================================================

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: [true, "Client ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: [true, "Client code is required"],
      unique: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
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
      validate: {
        validator: function (v) {
          if (!v) return true;
          return EMAIL_REGEX.test(v);
        },
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return PHONE_REGEX.test(v);
        },
        message: "Phone must be exactly 10 digits",
      },
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
      enum: {
        values: ["active", "inactive", "suspended"],
        message: "Invalid status",
      },
      default: "active",
    },
    contractStart: Date,
    contractEnd: Date,
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    contactEmployeeId: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    contractType: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
    },
    gst: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return GST_REGEX.test(v.toUpperCase());
        },
        message: "Invalid GST number format",
      },
    },
    pan: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return PAN_REGEX.test(v.toUpperCase());
        },
        message: "Invalid PAN number format",
      },
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    zipCode: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return PINCODE_REGEX.test(v);
        },
        message: "Pincode must be 6 digits",
      },
    },
    currency: {
      type: String,
      trim: true,
      default: "INR",
    },
    timeZone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    contractDocuments: {
      type: [String],
      default: [],
    },
    assignedProducts: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// =============================================================================
// INDEXES
// =============================================================================

clientSchema.index({ clientCode: 1 }, { unique: true });
clientSchema.index({ clientId: 1 }, { unique: true });
clientSchema.index({ companyName: 1 });
clientSchema.index({ status: 1 });

// =============================================================================
// STATIC METHODS
// =============================================================================

clientSchema.statics.validateClientIdUnique = async function (clientId) {
  const existing = await this.findOne({ clientId: String(clientId) });
  return !existing;
};

clientSchema.statics.validateEmailUnique = async function (
  email,
  excludeId = null,
) {
  const query = { email: String(email).toLowerCase() };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await this.findOne(query);
  return !existing;
};

export default mongoose.model("Client", clientSchema);
