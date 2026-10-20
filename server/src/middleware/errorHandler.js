/**
 * Lightweight error type with an HTTP status code.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** 404 handler for unmatched routes. */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralised error handler. Hides internal stack traces from clients and
 * logs server errors for debugging.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error("Server error:", err);
  }
  res.status(status).json({
    error: status >= 500 ? "Something went wrong on the server." : err.message,
  });
}
