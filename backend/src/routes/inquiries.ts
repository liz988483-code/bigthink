import { Router } from "express";
import { randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";

const router = Router();
const inquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many messages were sent. Please try again later." } });
const inquirySchema = z.object({
  fullName: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  inquiryType: z.enum(["research_support", "careers_talent", "procurement_supply", "events_networking", "partnership", "other"]),
  message: z.string().trim().min(10).max(4000),
  consent: z.literal(true),
});

router.post("/", inquiryLimiter, async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please review the form and required privacy consent.", fields: parsed.error.flatten().fieldErrors });
  const { fullName, email, phone, inquiryType, message } = parsed.data;
  const id = randomUUID();
  await pool.execute(
    "INSERT INTO inquiries (id, full_name, email, phone, inquiry_type, message) VALUES (?, ?, LOWER(?), NULLIF(?, ''), ?, ?)",
    [id, fullName, email, phone ?? "", inquiryType, message],
  );
  return res.status(201).json({ id, message: "Your message has been recorded. A Bigthink team member can follow up." });
});

export default router;
