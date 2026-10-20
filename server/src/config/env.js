import dotenv from "dotenv";

// Load variables from server/.env (if present) into process.env.
dotenv.config();

/**
 * Centralised, validated environment access.
 * Every module reads configuration from here so there is a single source of
 * truth and a clear failure if something required is missing.
 */
export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acaflow",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Split CLIENT_URL on commas so multiple origins can be allow-listed.
  clientUrls: (process.env.CLIENT_URL || "http://localhost:8443")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  isDev: process.env.NODE_ENV !== "production",
};
