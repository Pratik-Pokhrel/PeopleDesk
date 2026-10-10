// This file is used to identify an ADMIN, usage : router.post("/", authenticate, requireRole("ADMIN")), handler)
// This must run after "authenticate", as it reads "req.user"
import { AppError } from "../utils/errors.js";

export const requireRole =
  (...allowerdRoles) =>
  (req, res, next) => {
    if ((!req, res, next)) throw AppError.unauthorized();
    if (!allowerdRoles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
