import { Router, type CookieOptions } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { rateLimit } from "express-rate-limit";
import argon2 from "argon2";
import { z } from "zod";
import { accessTokenCookie, accessTokenLifetimeSeconds, createAccessToken, type UserRole } from "../auth/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many sign-in attempts. Please try again later." } });
const roleSchema = z.enum(["candidate", "employer", "skilled_provider", "supplier", "buyer", "event_member"]);
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  role: roleSchema,
});
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
const cookieOptions: CookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/api" };

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the account details and try again.", fields: parsed.error.flatten().fieldErrors });
  const { fullName, email, password, role } = parsed.data;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  const id = randomUUID();
  try {
    await pool.execute("INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, LOWER(?), ?, ?)", [id, fullName, email, passwordHash, role]);
    const token = await createAccessToken({ id, role });
    res.cookie(accessTokenCookie, token, { ...cookieOptions, maxAge: accessTokenLifetimeSeconds * 1000 });
    return res.status(201).json({ user: { id, fullName, email: email.toLowerCase(), role, createdAt: new Date() } });
  } catch (error) {
    if (isUniqueViolation(error)) return res.status(409).json({ error: "An account with this email already exists." });
    throw error;
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password." });
  const { email, password } = parsed.data;
  const [rows] = await pool.execute<(RowDataPacket & { id: string; full_name: string; email: string; role: UserRole; password_hash: string })[]>(
    "SELECT id, full_name, email, role, password_hash FROM users WHERE email = LOWER(?) LIMIT 1", [email],
  );
  const user = rows[0];
  if (!user || !(await argon2.verify(user.password_hash, password))) return res.status(401).json({ error: "Email or password is incorrect." });
  const token = await createAccessToken({ id: user.id, role: user.role });
  res.cookie(accessTokenCookie, token, { ...cookieOptions, maxAge: accessTokenLifetimeSeconds * 1000 });
  return res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
});

router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.execute<(RowDataPacket & { id: string; full_name: string; email: string; role: UserRole; created_at: Date })[]>(
    "SELECT id, full_name, email, role, created_at FROM users WHERE id = ? LIMIT 1", [req.user!.id],
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Account no longer exists." });
  return res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, createdAt: user.created_at } });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(accessTokenCookie, cookieOptions);
  return res.status(204).end();
});

function isUniqueViolation(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export default router;
