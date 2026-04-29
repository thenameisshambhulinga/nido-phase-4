import mongoose from "mongoose";
import { readFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import Client from "./models/Client.js";
import Vendor from "./models/Vendor.js";
import Product from "./models/Product.js";
import { ensureBusinessId } from "./utils/businessIds.js";

dotenv.config();

const { MONGODB_URI } = process.env;
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataDir = path.join(__dirname, "data");

async function seedDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is required for seeding");
    }

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

    // Normalize business IDs and remove duplicate rows by stable business code.
    const uniqueClients = Array.from(
      new Map(clientsData.map((c) => [c.clientCode, c])).values(),
    ).map((c, index) => ({
      ...c,
      clientId: ensureBusinessId(c.clientId, "CID", index + 1, 4),
    }));
    const uniqueVendors = Array.from(
      new Map(vendorsData.map((v) => [v.vendorCode, v])).values(),
    ).map((v, index) => ({
      ...v,
      vendorId: ensureBusinessId(v.vendorId, "VID", index + 1, 4),
    }));
    const uniqueProducts = Array.from(
      new Map(
        productsData.map((p) => [
          p.masterProductId || p.productCode || p.sku || p.productName,
          p,
        ]),
      ).values(),
    ).map((p, index) => ({
      ...p,
      masterProductId: ensureBusinessId(p.masterProductId, "MP", index + 1, 4),
    }));

    let clientsUpserted = 0;
    for (const client of uniqueClients) {
      const { id, ...payload } = client;
      await Client.updateOne(
        { clientCode: payload.clientCode },
        { $set: payload },
        { upsert: true },
      );
      clientsUpserted += 1;
    }

    const validClientCodes = uniqueClients
      .map((client) => client.clientCode)
      .filter(Boolean);
    const staleClientsResult = await Client.deleteMany({
      clientCode: { $nin: validClientCodes },
    });

    let vendorsUpserted = 0;
    for (const vendor of uniqueVendors) {
      const { id, ...payload } = vendor;
      await Vendor.updateOne(
        { vendorCode: payload.vendorCode },
        { $set: payload },
        { upsert: true },
      );
      vendorsUpserted += 1;
    }

    const validVendorCodes = uniqueVendors
      .map((vendor) => vendor.vendorCode)
      .filter(Boolean);
    const staleVendorsResult = await Vendor.deleteMany({
      vendorCode: { $nin: validVendorCodes },
    });

    let productsUpserted = 0;
    for (const product of uniqueProducts) {
      const { id, ...payload } = product;
      await Product.updateOne(
        {
          $or: [
            { masterProductId: payload.masterProductId },
            { serialNumber: payload.serialNumber },
            { sku: payload.sku },
          ],
        },
        { $set: payload },
        { upsert: true },
      );
      productsUpserted += 1;
    }

    const validProductIds = uniqueProducts
      .map((product) => product.masterProductId)
      .filter(Boolean);
    const staleProductsResult = await Product.deleteMany({
      masterProductId: { $nin: validProductIds },
    });

    console.log(`✅ Upserted ${clientsUpserted} clients`);
    console.log(`✅ Upserted ${vendorsUpserted} vendors`);
    console.log(`✅ Upserted ${productsUpserted} products`);
    console.log(`🧹 Removed ${staleClientsResult.deletedCount || 0} stale clients`);
    console.log(`🧹 Removed ${staleVendorsResult.deletedCount || 0} stale vendors`);
    console.log(`🧹 Removed ${staleProductsResult.deletedCount || 0} stale products`);

    const clientCount = await Client.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const productCount = await Product.countDocuments();

    console.log(`\n📊 Total in DB - Clients: ${clientCount}, Vendors: ${vendorCount}, Products: ${productCount}`);
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
