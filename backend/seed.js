import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import Client from "./models/Client.js";
import Vendor from "./models/Vendor.js";
import Product from "./models/Product.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nido";
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataDir = path.join(__dirname, "data");

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Read JSON files
    const clientsData = JSON.parse(
      await readFile(path.join(dataDir, "clients.json"), "utf8"),
    );
    const vendorsData = JSON.parse(
      await readFile(path.join(dataDir, "vendors.json"), "utf8"),
    );
    const productsData = JSON.parse(
      await readFile(path.join(dataDir, "products.json"), "utf8"),
    );

    console.log(`📋 Read ${clientsData.length} clients`);
    console.log(`📋 Read ${vendorsData.length} vendors`);
    console.log(`📋 Read ${productsData.length} products`);

    // Remove duplicates (by code/identifier) and remove the id field
    const uniqueClients = Array.from(
      new Map(clientsData.map((c) => [c.clientCode, c])).values(),
    ).map((c) => {
      const { id, ...rest } = c;
      return rest;
    });
    const uniqueVendors = Array.from(
      new Map(vendorsData.map((v) => [v.vendorCode, v])).values(),
    ).map((v) => {
      const { id, ...rest } = v;
      return rest;
    });
    const uniqueProducts = Array.from(
      new Map(
        productsData.map((p) => [p.serialNumber || p.productName, p]),
      ).values(),
    ).map((p) => {
      const { id, ...rest } = p;
      return rest;
    });

    // Seed only empty collections
    const [clientCountBefore, vendorCountBefore, productCountBefore] =
      await Promise.all([
        Client.countDocuments(),
        Vendor.countDocuments(),
        Product.countDocuments(),
      ]);

    if (clientCountBefore === 0) {
      const clientResult = await Client.insertMany(uniqueClients);
      console.log(`✅ Inserted ${clientResult.length} clients`);
    } else {
      console.log(
        `ℹ️  Skipped clients seeding (existing: ${clientCountBefore})`,
      );
    }

    if (vendorCountBefore === 0) {
      const vendorResult = await Vendor.insertMany(uniqueVendors);
      console.log(`✅ Inserted ${vendorResult.length} vendors`);
    } else {
      console.log(
        `ℹ️  Skipped vendors seeding (existing: ${vendorCountBefore})`,
      );
    }

    if (productCountBefore === 0) {
      const productResult = await Product.insertMany(uniqueProducts);
      console.log(`✅ Inserted ${productResult.length} products`);
    } else {
      console.log(
        `ℹ️  Skipped products seeding (existing: ${productCountBefore})`,
      );
    }

    const clientCount = await Client.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const productCount = await Product.countDocuments();

    console.log(
      `\n📊 Total in DB - Clients: ${clientCount}, Vendors: ${vendorCount}, Products: ${productCount}`,
    );
    console.log("\n🎉 Database seeding completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
    process.exit(1);
  }
}

seedDatabase();
