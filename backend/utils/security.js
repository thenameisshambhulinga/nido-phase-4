import crypto from "crypto";

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value) =>
  Buffer.from(
    value.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((value.length + 3) % 4),
    "base64",
  ).toString();

export const normalizeRole = (role = "") =>
  String(role || "")
    .trim()
    .toUpperCase();

export const generateUsername = (name, existingUsernames = []) => {
  const base =
    String(name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 12) || "user";

  let candidate = base;
  let counter = 1;
  const used = new Set(
    existingUsernames.map((entry) => String(entry).toLowerCase()),
  );

  while (used.has(candidate)) {
    candidate = `${base}${counter}`;
    counter += 1;
  }

  return candidate;
};

export const generateEmail = (username, companyId = "nidotech") => {
  const domain =
    String(companyId || "nidotech")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "") || "nidotech";
  return `${username}@${domain}.local`;
};

export const generateTemporaryPassword = () =>
  crypto.randomBytes(12).toString("base64url");

export const hashPassword = (
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) => {
  const hash = crypto
    .pbkdf2Sync(String(password), salt, 120000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash = "") => {
  const [salt, hash] = String(storedHash).split(":");
  if (!salt || !hash) return false;
  const nextHash = crypto
    .pbkdf2Sync(String(password), salt, 120000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(nextHash, "hex"),
  );
};

export const signJwt = (payload, secret, expiresIn = "7d") => {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expirySeconds = expiresIn.endsWith("d")
    ? Number(expiresIn.slice(0, -1)) * 86400
    : expiresIn.endsWith("h")
      ? Number(expiresIn.slice(0, -1)) * 3600
      : expiresIn.endsWith("m")
        ? Number(expiresIn.slice(0, -1)) * 60
        : Number(expiresIn) || 604800;

  const body = { ...payload, iat: issuedAt, exp: issuedAt + expirySeconds };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyJwt = (token, secret) => {
  const [encodedHeader, encodedPayload, signature] = String(token || "").split(
    ".",
  );
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (expectedSignature !== signature) return null;

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
};
