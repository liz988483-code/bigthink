import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import "dotenv/config";
import { mysqlConnectionOptions } from "../src/db/connection-options.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to set up the database.");

const pool = mysql.createPool(mysqlConnectionOptions(connectionString));
try {
  const schema = await readFile(resolve("db/schema.sql"), "utf8");
  for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
  console.log("Bigthink database schema is ready.");
} finally {
  await pool.end();
}
