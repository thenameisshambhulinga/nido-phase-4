//Product.js
import mongoose from "mongoose";

const VendorInventorySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  vendorName: String,
  quantity: {
    type: Number,
    default: 0,
  },
  pricePerItem: Number,
  leadTime: String,
});

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },

    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name is too short"],
      validate: {
        validator: (v) => typeof v === "string" && v.trim().length > 1,
        message: "Product name cannot be empty",
      },
    },

    description: String,

    brand: String,

    category: {
      type: String,
      trim: true,
      required: [true, "Category is required"],
      validate: {
        validator: (v) => typeof v === "string" && v.trim().length > 1,
        message: "Category cannot be empty",
      },
    },

    subcategory: String,

    tags: [String],

    productNotes: String,

    keySpecifications: [
      {
        specification: String,
        value: String,
        unit: String,
      },
    ],

    generalSpecifications: [
      {
        category: String,
        value: String,
      },
    ],

    images: [String],

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      default: 0,
    },

    vendorInventory: [VendorInventorySchema],

    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "In Stock",
        "Low Stock",
        "Out Of Stock",
        "active",
        "inactive",
        "discontinued",
      ],
      default: "draft",
    },

    publicationStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    inventoryStatus: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out Of Stock"],
      default: "In Stock",
    },

    // Backward compatibility fields
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    vendorName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
  },
  {
    timestamps: true,
  },
);

productSchema.index({ productName: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

export default mongoose.model("Product", productSchema);
