import mongoose from "mongoose";

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\d{10}$/;
const GST_REGEX =
  /^([0-9]{2})([A-Z]{5}[A-Z0-9]{4})([0-9]{4})([A-Z]{1})([0-9]{1})$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

// =============================================================================
// AMC SCHEMA
// =============================================================================

const amcSchema = new mongoose.Schema(
  {
    // Section 1 - Client Information (mandatory)
    companyId: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    registeredAddress: {
      type: String,
      required: [true, "Registered address is required"],
      trim: true,
    },
    gstNumber: {
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
    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return PHONE_REGEX.test(v);
        },
        message: "Mobile must be exactly 10 digits",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
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

    // Section 2 - AMC Type (mandatory)
    amcType: {
      type: String,
      enum: {
        values: ["new", "renewal", "extension"],
        message: "Invalid AMC type",
      },
      required: [true, "AMC type is required"],
    },
    amcReference: {
      type: String,
      trim: true,
    },
    amcExpiry: {
      type: Date,
    },

    // Section 3 - Category (mandatory)
    amcCategory: {
      type: String,
      enum: {
        values: ["it", "facility", "equipment", "software"],
        message: "Invalid AMC category",
      },
      required: [true, "AMC category is required"],
    },
    assetDetails: {
      type: String,
      trim: true,
    },
    servicesRequired: {
      type: [String],
      default: [],
    },

    // Section 5 - Common AMC Scope (mandatory)
    scopeNotes: {
      type: String,
      required: [true, "Scope notes is required"],
      trim: true,
    },

    // Section 6 - AMC Duration (mandatory)
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    durationMonths: {
      type: Number,
      min: 1,
      max: 60,
    },

    // Section 10 - Client Authorization (mandatory)
    authorizedName: {
      type: String,
      required: [true, "Authorized signatory name is required"],
      trim: true,
    },
    authorizedDesignation: {
      type: String,
      required: [true, "Authorized designation is required"],
      trim: true,
    },
    authorizationDate: {
      type: Date,
      required: [true, "Authorization date is required"],
    },

    // System fields
    status: {
      type: String,
      enum: {
        values: ["draft", "pending", "active", "expired", "terminated"],
        message: "Invalid status",
      },
      default: "draft",
      index: true,
    },
    amcNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    createdById: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: String,
      trim: true,
    },
    approvedDate: {
      type: Date,
    },

    // Additional fields for tracking
    notes: {
      type: String,
      trim: true,
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

// =============================================================================
// INDEXES
// =============================================================================

amcSchema.index({ amcNumber: 1 }, { unique: true });
amcSchema.index({ companyId: 1, status: 1 });
amcSchema.index({ startDate: 1, endDate: 1 });
amcSchema.index({ status: 1, createdAt: -1 });

// =============================================================================
// PRE-SAVE MIDDLEWARE
// =============================================================================

amcSchema.pre("save", async function (next) {
  // Generate AMC number if not exists
  if (!this.amcNumber) {
    const prefix = "AMC";
    const timestamp = Date.now().toString(36).toUpperCase();
    this.amcNumber = `${prefix}-${timestamp}`;
  }

  // Calculate duration
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    this.durationMonths = months + 1;
  }

  next();
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

amcSchema.methods.activate = function (approvedBy) {
  this.status = "active";
  this.approvedBy = approvedBy;
  this.approvedDate = new Date();
};

amcSchema.methods.expire = function () {
  this.status = "expired";
};

amcSchema.methods.terminate = function (reason) {
  this.status = "terminated";
  this.notes = (this.notes || "") + `\nTerminated: ${reason}`;
};

// =============================================================================
// STATIC METHODS
// =============================================================================

amcSchema.statics.generateAMCNumber = function () {
  const prefix = "AMC";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
};

amcSchema.statics.getActiveAMCs = function (companyId) {
  return this.find({
    companyId,
    status: "active",
    endDate: { $gte: new Date() },
  }).sort({ endDate: 1 });
};

amcSchema.statics.getExpiringAMCs = function (daysBeforeExpiry = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

  return this.find({
    status: "active",
    endDate: { $lte: futureDate, $gte: new Date() },
  }).sort({ endDate: 1 });
};

export default mongoose.model("AMC", amcSchema);
