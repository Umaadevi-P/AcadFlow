import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const app = createApp();

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`\n✓ AcaFlow API running on http://localhost:${env.port}`);
    console.log(`  Frontend origins allowed: ${env.clientUrls.join(", ")}\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start AcaFlow API:", err.message);
  process.exit(1);
});
