import type { PoolOptions } from "mysql2/promise";

export function mysqlConnectionOptions(connectionString: string): PoolOptions {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") throw new Error("DATABASE_URL must use the mysql:// protocol.");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !database || !url.username) throw new Error("DATABASE_URL must include a host, database and username.");
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
  };
}
