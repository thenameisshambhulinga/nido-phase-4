import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const log = (...args) => console.log("[migrateData]", ...args);

const resolve = (name, fallback = "") => {
  const v = process.env[name] ?? fallback;
  return String(v);
};

const requireEnv = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

const getConnectionOptions = () => ({
  serverSelectionTimeoutMS: 15000,
});

const migrateCollection = async ({ sourceDb, targetDb, collectionName }) => {
  const srcColl = sourceDb.collection(collectionName);
  const tgtColl = targetDb.collection(collectionName);

  const cursor = srcColl.find({});
  const batchSize = 500;
  let batch = [];
  let totalCopied = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);

    if (batch.length >= batchSize) {
      // preserve _id
      await tgtColl.insertMany(batch, { ordered: false });
      totalCopied += batch.length;
      log(`${collectionName}: inserted ${totalCopied} docs...`);
      batch = [];
    }
  }

  if (batch.length) {
    await tgtColl.insertMany(batch, { ordered: false });
    totalCopied += batch.length;
  }

  return totalCopied;
};

async function main() {
  // Required: both URIs + db names.
  const OLD_MONGODB_URI = requireEnv("OLD_MONGODB_URI");
  const NEW_MONGODB_URI = requireEnv("MONGODB_URI");

  const OLD_MONGODB_DB = requireEnv("OLD_MONGODB_DB");
  const NEW_MONGODB_DB = requireEnv("NEW_MONGODB_DB");

  const COLLECTIONS = (
    process.env.COLLECTIONS ||
    "products,clients,vendors,users,organizations,orders,quotes"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  log("Connecting to old Mongo...");
  const oldConn = await mongoose
    .createConnection(OLD_MONGODB_URI, getConnectionOptions())
    .asPromise();

  log("Connecting to new Mongo...");
  const newConn = await mongoose
    .createConnection(NEW_MONGODB_URI, getConnectionOptions())
    .asPromise();

  const oldDb = oldConn.db(OLD_MONGODB_DB);
  const newDb = newConn.db(NEW_MONGODB_DB);

  log("Starting migration for collections:", COLLECTIONS.join(", "));

  for (const collectionName of COLLECTIONS) {
    // Ensure target collection exists by touching it.
    await newDb
      .collection(collectionName)
      .createIndex({ _id: 1 }, { name: "_id_1" })
      .catch(() => {});
    log(`Migrating ${collectionName}...`);

    const count = await migrateCollection({
      sourceDb: oldDb,
      targetDb: newDb,
      collectionName,
    });

    log(`${collectionName}: migrated ${count} docs`);
  }

  await oldConn.close();
  await newConn.close();

  log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
