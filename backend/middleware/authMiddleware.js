import { verifyJwt } from "../utils/security.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  const secret = process.env.JWT_SECRET || "dev-secret";

  const payload = verifyJwt(token, secret);
  if (!payload) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
};
