export const roleMiddleware =
  (allowedRoles = []) =>
  (req, res, next) => {
    const role = String(req.user?.role || "").toUpperCase();
    const normalized = allowedRoles.map((entry) =>
      String(entry || "").toUpperCase(),
    );

    if (!normalized.includes(role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    next();
  };
