import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

router.get("/mine/registrations", requireAuth, async (req, res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string, unknown>)[]>(
    `SELECT r.id, r.status, r.created_at AS registered_at, e.id AS event_id, e.title, e.category, e.venue, e.starts_at, e.ends_at
     FROM event_registrations r JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ? AND r.status = 'registered' ORDER BY e.starts_at ASC`, [req.user!.id],
  );
  return res.json({ registrations: rows });
});

router.get("/managed", requireAuth, async (req,res)=>{
  if(!(["events_admin","super_admin"].includes(req.user!.role)))return res.status(403).json({error:"Only event administrators can view managed events."});
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT e.id,e.title,e.category,e.venue,e.starts_at,e.status,e.capacity,
      COUNT(CASE WHEN r.status='registered' THEN 1 END) AS registered_count
     FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id
     WHERE (?='super_admin' OR e.created_by=?) GROUP BY e.id ORDER BY e.starts_at DESC`,[req.user!.role,req.user!.id],
  );
  return res.json({events:rows});
});

router.get("/managed/:id/registrations",requireAuth,async(req,res)=>{
  if(!(["events_admin","super_admin"].includes(req.user!.role)))return res.status(403).json({error:"Only event administrators can view event registrations."});
  const [events]=await pool.execute<(RowDataPacket & {id:string})[]>(
    "SELECT id FROM events WHERE id=? AND (?='super_admin' OR created_by=?) LIMIT 1",[String(req.params.id),req.user!.role,req.user!.id],
  );
  if(!events[0])return res.status(404).json({error:"Event not found for this account."});
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT r.id,r.status,r.created_at,u.full_name,u.email,u.role
     FROM event_registrations r JOIN users u ON u.id=r.user_id
     WHERE r.event_id=? AND r.status='registered' ORDER BY r.created_at ASC`,[String(req.params.id)],
  );
  return res.json({registrations:rows});
});

router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string, unknown>)[]>(
    `SELECT e.id, e.title, e.category, e.description, e.venue, e.starts_at, e.ends_at, e.capacity,
      (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered_count
     FROM events e WHERE e.status = 'published' AND e.starts_at >= UTC_TIMESTAMP() ORDER BY e.starts_at ASC LIMIT 100`,
  );
  return res.json({ events: rows });
});

router.post("/:id/registrations", requireAuth, registrationLimiter, async (req, res) => {
  const eventId = String(req.params.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [events] = await connection.execute<(RowDataPacket & { id: string; capacity: number | null })[]>(
      "SELECT id, capacity FROM events WHERE id = ? AND status = 'published' AND starts_at >= UTC_TIMESTAMP() FOR UPDATE", [eventId],
    );
    const event = events[0];
    if (!event) {
      await connection.rollback();
      return res.status(404).json({ error: "This event is not open for registration." });
    }
    const [current] = await connection.execute<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM event_registrations WHERE event_id = ? AND status = 'registered'", [eventId],
    );
    const [existing] = await connection.execute<(RowDataPacket & { status: string })[]>(
      "SELECT status FROM event_registrations WHERE event_id = ? AND user_id = ? LIMIT 1", [eventId, req.user!.id],
    );
    if (existing[0]?.status === "registered") {
      await connection.rollback();
      return res.status(409).json({ error: "You are already registered for this event." });
    }
    if (event.capacity !== null && current[0]!.total >= event.capacity) {
      await connection.rollback();
      return res.status(409).json({ error: "This event has reached its registration capacity." });
    }
    const id = randomUUID();
    await connection.execute(
      `INSERT INTO event_registrations (id, event_id, user_id, status) VALUES (?, ?, ?, 'registered')
       ON DUPLICATE KEY UPDATE status = 'registered', created_at = CURRENT_TIMESTAMP`, [id, eventId, req.user!.id],
    );
    await connection.commit();
    return res.status(201).json({ message: "You are registered for this event." });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.delete("/:id/registrations/me", requireAuth, async (req, res) => {
  const [result] = await pool.execute("UPDATE event_registrations SET status = 'cancelled' WHERE event_id = ? AND user_id = ? AND status = 'registered'", [String(req.params.id), req.user!.id]);
  if ("affectedRows" in result && result.affectedRows === 0) return res.status(404).json({ error: "No active registration was found." });
  return res.status(204).end();
});

const eventSchema = z.object({
  title: z.string().trim().min(4).max(180),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(20).max(8000),
  venue: z.string().trim().min(2).max(180),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime().optional(),
  capacity: z.number().int().positive().max(100000).nullable().optional(),
}).refine((event)=>!event.endsAt||new Date(event.endsAt)>new Date(event.startsAt),{message:"The event end time must be after its start time.",path:["endsAt"]});

router.post("/", requireAuth, async (req, res, next) => {
  if (!(["events_admin", "super_admin"].includes(req.user!.role))) return res.status(403).json({ error: "Only event administrators can create events." });
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the event details.", fields: parsed.error.flatten().fieldErrors });
  const event = parsed.data;
  const id = randomUUID();
  try {
    await pool.execute("INSERT INTO events (id, title, category, description, venue, starts_at, ends_at, capacity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, event.title, event.category, event.description, event.venue, new Date(event.startsAt), event.endsAt ? new Date(event.endsAt) : null, event.capacity ?? null, req.user!.id]);
    return res.status(201).json({ id, status: "draft", message: "Event created in draft status." });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/publish", requireAuth, async (req, res) => {
  if (!("events_admin" === req.user!.role || "super_admin" === req.user!.role)) return res.status(403).json({ error: "Only event administrators can publish events." });
  const [result] = await pool.execute("UPDATE events SET status = 'published' WHERE id = ? AND status = 'draft'", [String(req.params.id)]);
  if (!("affectedRows" in result) || result.affectedRows === 0) return res.status(404).json({ error: "Draft event not found." });
  return res.json({ id: String(req.params.id), status: "published" });
});

export default router;
