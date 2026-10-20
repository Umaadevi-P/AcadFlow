import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

/** Sign a JWT for an authenticated user. */
export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Require a valid Bearer token. Loads the user and attaches it to req.user.
 * Rejects with 401 if the token is missing, invalid, expired, or the account
 * is no longer active.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "This account is not available." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

/**
 * Attach the user if a token is present, but do not fail when there is none.
 * Useful for endpoints that are public but personalised when signed in.
 */
export async function attachUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (user && user.status === "active") req.user = user;
  } catch {
    /* invalid token is fine for optional auth */
  }
  next();
}

/**
 * Role guard. Usage: router.patch(..., requireRole("staff", "admin"), ...)
 * Must run after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to do that." });
    }
    next();
  };
}
