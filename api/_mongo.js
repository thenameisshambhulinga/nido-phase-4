import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.__nidoMongoose) {
  globalForMongoose.__nidoMongoose = { conn: null, promise: null };
}

const cached = globalForMongoose.__nidoMongoose;

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required for the API route");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((connection) => connection.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
