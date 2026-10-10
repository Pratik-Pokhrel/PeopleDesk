// Custom error class for the app : Services throw these, teh error handler (error-handler.js in middleware) turns them into HTTP repsonses
export class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // All the custom defined errors along with status code and message
  static badRequest(message, details) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication Reqired") {
    return new AppError(401, "AUTHENTICATION_REQUIRED", message);
  }

  static forbidden(message = "You are not allowed to do this action") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource Not Found") {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(message) {
    return new AppError(409, "CONFLICT", message);
  }

  static internal(message = "Server Error : Something went wrong") {
    return new AppError(500, "INTERNAL_SERVER_ERROR", message);
  }
}
