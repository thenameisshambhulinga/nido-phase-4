import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import clientRoutes from "./routes/clients.js";
import vendorRoutes from "./routes/vendors.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import invoiceRoutes from "./routes/invoices.js";
import emailRoutes from "./routes/email.js";
import authRoutes, { ensureDefaultOwnerAccount } from "./routes/auth.js";
import amcRoutes from "./routes/amc.js";
import {
  connectToMongo,
  resolveMongoUriFromEnv,
} from "./utils/mongoConnection.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = resolveMongoUriFromEnv();
const CLIENT_ORIGIN = process.env.FRONTEND_URL || "*";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleFrontendDirs = [
  path.resolve(__dirname, "../frontend/dist"),
  path.resolve(__dirname, "../client/dist"),
  path.resolve(__dirname, "../dist"),
];

const frontendBuildDir = possibleFrontendDirs.find((dir) =>
  fs.existsSync(path.join(dir, "index.html")),
);

if (!MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI or MONGO_URI is required. Server will not start without it.",
  );
  process.exit(1);
}

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

if (frontendBuildDir) {
  app.use(express.static(frontendBuildDir));
}

/* ================= ROOT ROUTE ================= */
app.get("/", (req, res) => {
  if (frontendBuildDir) {
    return res.sendFile(path.join(frontendBuildDir, "index.html"));
  }

  return res.status(200).send(`
    <html>
      <head>
        <title>Nido Backend</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f6f7fb; }
          .box { background: white; padding: 24px; border-radius: 12px; max-width: 600px; }
          h1 { margin: 0 0 12px; }
          p { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Nido Backend Running 🚀</h1>
          <p>Backend server is active.</p>
          <p>Health check: <a href="/api/health">/api/health</a></p>
        </div>
      </body>
    </html>
  `);
});

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: { status: "ok", message: "Server is running" },
  });
});

/* ================= ROUTES ================= */
app.use("/api/clients", clientRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/amc", amcRoutes);

/* SPA fallback */
if (frontendBuildDir) {
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendBuildDir, "index.html"));
  });
}

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
connectToMongo(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    return ensureDefaultOwnerAccount().then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `❌ Port ${PORT} is already in use. Please stop the existing server or use a different port.`,
          );
          process.exit(1);
        }
        throw err;
      });
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  });
