import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import clientRoutes from "./routes/clients.js";
import vendorRoutes from "./routes/vendors.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nido";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Routes
app.use("/clients", clientRoutes);
app.use("/vendors", vendorRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

// Backward-compatible API-prefixed mounts
app.use("/api/clients", clientRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", message: "Server is running" },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", message: "Server is running" },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
