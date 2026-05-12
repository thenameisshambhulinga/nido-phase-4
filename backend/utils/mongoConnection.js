import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import net from "net";
import os from "os";
import path from "path";
import mongoose from "mongoose";

const LOCAL_MONGO_URI_REGEX =
  /^mongodb:\/\/(?:[^@/]+@)?(?<host>localhost|127\.0\.0\.1)(?::(?<port>\d+))?(?:[/?]|$)/i;
const LOCAL_BIND_HOST = "127.0.0.1";
const DEFAULT_LOCAL_PORT = 27017;
const LOCAL_SERVER_SELECTION_TIMEOUT_MS = 5000;
const LOCAL_MONGO_DB_PATH =
  process.env.MONGO_DBPATH || path.join(os.tmpdir(), "nido_db");
const LOCAL_MONGO_LOG_PATH =
  process.env.MONGO_LOGPATH || path.join(os.tmpdir(), "nido_mongodb.log");

let localMongoStartPromise = null;

const parseLocalMongoUri = (mongoUri) => {
  const match = String(mongoUri || "").match(LOCAL_MONGO_URI_REGEX);
  if (!match) return null;

  return {
    host: match.groups?.host || LOCAL_BIND_HOST,
    port: Number(match.groups?.port || DEFAULT_LOCAL_PORT),
  };
};

const isConnectionRefusedError = (error) =>
  /ECONNREFUSED/i.test(String(error?.message || ""));

const waitForPort = (port, host = LOCAL_BIND_HOST, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const tryConnect = () => {
      const socket = new net.Socket();

      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(
            new Error(
              `Timed out waiting for MongoDB on ${host}:${port}. Check ${LOCAL_MONGO_LOG_PATH} for details.`,
            ),
          );
          return;
        }
        setTimeout(tryConnect, 250);
      });

      socket.connect(port, host);
    };

    tryConnect();
  });

const startLocalMongo = async (port, logger = console) => {
  if (!localMongoStartPromise) {
    localMongoStartPromise = (async () => {
      await mkdir(LOCAL_MONGO_DB_PATH, { recursive: true });
      await mkdir(path.dirname(LOCAL_MONGO_LOG_PATH), { recursive: true });

      logger.log(
        `MongoDB is not running locally. Starting mongod with dbpath ${LOCAL_MONGO_DB_PATH}...`,
      );

      await new Promise((resolve, reject) => {
        const child = spawn(
          "mongod",
          [
            "--dbpath",
            LOCAL_MONGO_DB_PATH,
            "--bind_ip",
            LOCAL_BIND_HOST,
            "--port",
            String(port),
            "--logpath",
            LOCAL_MONGO_LOG_PATH,
            "--logappend",
          ],
          {
            detached: true,
            stdio: "ignore",
          },
        );

        child.once("error", reject);
        child.once("spawn", () => {
          child.unref();
          resolve();
        });
      });

      await waitForPort(port, LOCAL_BIND_HOST);
      logger.log(`Local MongoDB is ready on ${LOCAL_BIND_HOST}:${port}.`);
    })().catch((error) => {
      localMongoStartPromise = null;
      throw error;
    });
  }

  return localMongoStartPromise;
};

const getConnectionOptions = (mongoUri) =>
  parseLocalMongoUri(mongoUri)
    ? { serverSelectionTimeoutMS: LOCAL_SERVER_SELECTION_TIMEOUT_MS }
    : {};

const createConnectionError = (mongoUri, error, autoStartAttempted = false) =>
  new Error(
    autoStartAttempted
      ? `Unable to connect to MongoDB at ${mongoUri} after attempting to start a local mongod. Start MongoDB manually or set MONGODB_URI/MONGO_URI to a reachable database. ${error.message}`
      : `Unable to connect to MongoDB at ${mongoUri}. ${error.message}`,
    { cause: error },
  );

export const resolveMongoUriFromEnv = (env = process.env) =>
  env.MONGODB_URI || env.MONGO_URI || "";

export async function connectToMongo(mongoUri, logger = console) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI or MONGO_URI is required.");
  }

  const localConfig = parseLocalMongoUri(mongoUri);

  try {
    await mongoose.connect(mongoUri, getConnectionOptions(mongoUri));
    return mongoose.connection;
  } catch (error) {
    if (!localConfig || !isConnectionRefusedError(error)) {
      throw createConnectionError(mongoUri, error);
    }

    await mongoose.disconnect().catch(() => {});

    try {
      await startLocalMongo(localConfig.port, logger);
      await mongoose.connect(mongoUri, getConnectionOptions(mongoUri));
      return mongoose.connection;
    } catch (retryError) {
      throw createConnectionError(mongoUri, retryError, true);
    }
  }
}
