import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["client", "vendor"],
        message: "Company type must be client or vendor",
      },
      required: [true, "Company type is required"],
    },
    externalId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

companySchema.index({ name: 1, type: 1 }, { unique: true });
companySchema.index({ externalId: 1 }, { sparse: true });

export default mongoose.model("Company", companySchema);
