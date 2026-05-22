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
      required: true,
      trim: true,
    },

    description: String,

    brand: String,

    category: String,

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
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      default: 0,
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
