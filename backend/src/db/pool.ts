import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import { mysqlConnectionOptions } from "./connection-options.js";

export const pool = mysql.createPool(mysqlConnectionOptions(env.DATABASE_URL));
