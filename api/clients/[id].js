import mongoose from "mongoose";
import Client from "../../backend/models/Client.js";
import { connectToDatabase } from "../_mongo.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

export default async function handler(req, res) {
  const { id } = req.query;

  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, error: "Invalid client ID" });
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      const client = await Client.findById(id).lean();
      if (!client) {
        res.status(404).json({ success: false, error: "Client not found" });
        return;
      }

      res.status(200).json({ success: true, data: client });
      return;
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const body = await readJsonBody(req);
      const client = await Client.findByIdAndUpdate(
        id,
        { ...body, updatedAt: new Date() },
        { new: true, runValidators: true },
      ).lean();

      if (!client) {
        res.status(404).json({ success: false, error: "Client not found" });
        return;
      }

      res.status(200).json({ success: true, data: client });
      return;
    }

    if (req.method === "DELETE") {
      const deleted = await Client.findByIdAndDelete(id).lean();
      if (!deleted) {
        res.status(404).json({ success: false, error: "Client not found" });
        return;
      }

      res.status(200).json({ success: true, data: deleted });
      return;
    }

    res.setHeader("Allow", ["GET", "PATCH", "PUT", "DELETE"]);
    res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
