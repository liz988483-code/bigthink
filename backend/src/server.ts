import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

await pool.query("SELECT 1");
const server = app.listen(env.PORT, () => console.log(`Bigthink API listening on port ${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down Bigthink API.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
