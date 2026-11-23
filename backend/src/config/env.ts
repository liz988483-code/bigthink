import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().regex(/^mysql:\/\//, "DATABASE_URL must be a MySQL connection URL."),
  JWT_ACCESS_SECRET: z.string().regex(/^[a-fA-F0-9]{64}$/, "JWT_ACCESS_SECRET must be 32 random bytes encoded as 64 hexadecimal characters."),
});

export const env = envSchema.parse(process.env);
