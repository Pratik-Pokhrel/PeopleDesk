// This file's main purpose is to check the - "Authorization: Bearer <token>" header and attaches the logged in employee to req.user
// Ecpress forward any error thrown here (even the async code) to the error handler

import { AppError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";
import { employeeService } from "../modules/employees/index.js";

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) throw AppError.unauthorized();

  const { sub } = verifyToken(token);

  // One small query per request, in exchange for instant effect when an admin deactivates someone
  const employee = await employeeService.findActiveById(sub);
  if (!employee)
    throw AppError.unauthorized("This account is no longer active");

  req.user = employee;
  next();
}
