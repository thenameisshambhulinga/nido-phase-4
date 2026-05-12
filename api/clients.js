import Client from "../backend/models/Client.js";
import { connectToDatabase } from "./_mongo.js";
import { ensureBusinessId } from "../backend/utils/businessIds.js";

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
  try {
    await connectToDatabase();

    if (req.method === "GET") {
      const clients = await Client.find().sort({ createdAt: -1 }).lean();
      res.status(200).json({ success: true, data: clients });
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const sequence = (await Client.countDocuments()) + 1;
      const clientData = {
        ...body,
        clientId: ensureBusinessId(body?.clientId, "CID", sequence, 4),
        updatedAt: new Date(),
      };

      const client = new Client(clientData);
      await client.save();
      res.status(201).json({ success: true, data: client.toObject() });
      return;
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
