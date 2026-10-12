import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";

async function start() {
  // If database connection fails, server fails to boot and exits
  try {
    await connectDB();
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  // This stops the server from accepting requests and closes existing connections
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT")); // SIGINT = Signal Interrupt
  process.on("SIGTERM", () => shutdown("SIGTERM")); // SIGTERM = Signal Termination
}

start();
