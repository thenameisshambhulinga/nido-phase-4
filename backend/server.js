import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import clientRoutes from "./routes/clients.js";
import vendorRoutes from "./routes/vendors.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import invoiceRoutes from "./routes/invoices.js";
import emailRoutes from "./routes/email.js";
import authRoutes, { ensureDefaultOwnerAccount } from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI is required. Server will not start without it.",
  );
  process.exit(1);
}

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= ROOT ROUTE ================= */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nido Backend Running 🚀",
  });
});

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", message: "Server is running" },
  });
});

/* ================= ROUTES ================= */
/* ✅ ONLY USE /api PREFIX (STANDARD) */
app.use("/api/clients", clientRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/auth", authRoutes);

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* ================= DB + SERVER ================= */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    return ensureDefaultOwnerAccount().then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });
