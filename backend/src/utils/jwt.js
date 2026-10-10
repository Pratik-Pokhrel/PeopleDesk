// This file is responsible for handling the JWT tokens for the authentication

/* It imports the "JWT_SECRET" (an encoded string using library like openssl) from .env file,
   and issues the token if a user trying to authenticate is a valid user
*/
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

export function signToken(employeeId) {
  return jwt.sign({ sub: employeeId }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/* If the user is a valid user, then it returns the decoded payload,
   otherwise throws a 401 for anything wrong or mismatch (like wrong signature, expired token)
*/
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
}
