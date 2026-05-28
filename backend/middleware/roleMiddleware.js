//backend/middleware/roleMiddleware.js

export const roleMiddleware =
  (allowedRoles = []) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const role = String(req.user?.role || "").toUpperCase();
    const normalized = allowedRoles.map((entry) =>
      String(entry || "").toUpperCase(),
    );

    if (!normalized.includes(role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
  };
