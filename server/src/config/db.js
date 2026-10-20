import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB and surface a clear, honest error if it is unavailable.
 * The app does NOT silently fall back to fake data — the caller decides what to
 * do when the connection genuinely fails.
 */
export async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("✗ MongoDB connection failed.");
    console.error(`  URI used: ${env.mongoUri.replace(/:([^:@]+)@/, ":***@")}`);
    console.error(
      "  Make sure MongoDB is running locally (mongodb://127.0.0.1:27017)\n" +
        "  or that MONGODB_URI points to a reachable MongoDB Atlas cluster.",
    );
    throw error;
  }
}
