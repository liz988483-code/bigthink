import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const applicationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const opportunitySchema = z.object({
  title: z.string().trim().min(4).max(180),
  organization: z.string().trim().min(2).max(180),
  type: z.enum(["job", "internship", "attachment"]),
  location: z.string().trim().min(2).max(140),
  duration: z.string().trim().min(2).max(80),
  description: z.string().trim().min(30).max(8000),
  applicationDeadline: z.iso.date().optional(),
});
const applicationSchema = z.object({ coverNote: z.string().trim().min(20).max(4000) });

type OpportunityRow = RowDataPacket & {
  id: string; title: string; organization: string; opportunity_type: "job" | "internship" | "attachment";
  location: string; duration: string; description: string; application_deadline: string | null; created_at: Date;
};

router.get("/mine/applications", requireAuth, async (req, res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string, unknown>)[]>(
    `SELECT a.id, a.status, a.created_at AS applied_at, o.id AS opportunity_id, o.title, o.organization, o.opportunity_type, o.location
     FROM applications a JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.candidate_id = ? ORDER BY a.created_at DESC`, [req.user!.id],
  );
  return res.json({ applications: rows });
});

router.get("/managed", requireAuth, requireRole("employer", "talent_admin", "super_admin"), async (req, res) => {
  const [rows] = await pool.execute<OpportunityRow[]>(
    `SELECT id, title, organization, opportunity_type, location, duration, description, application_deadline, created_at
     FROM opportunities WHERE (? IN ('talent_admin', 'super_admin') OR created_by = ?) ORDER BY created_at DESC`, [req.user!.role, req.user!.id],
  );
  return res.json({ opportunities: rows });
});

router.get("/managed/applications", requireAuth, requireRole("employer", "talent_admin", "super_admin"), async (req, res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string, unknown>)[]>(
    `SELECT a.id, a.status, a.cover_note, a.created_at AS applied_at, u.full_name AS candidate_name, u.email AS candidate_email,
      o.id AS opportunity_id, o.title AS opportunity_title,cp.skills AS candidate_skills,cp.capability_summary AS candidate_capabilities,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id',cd.id,'file_name',cd.file_name)) FROM candidate_documents cd WHERE cd.candidate_id=a.candidate_id) AS candidate_documents
     FROM applications a JOIN opportunities o ON o.id = a.opportunity_id JOIN users u ON u.id = a.candidate_id
     LEFT JOIN candidate_profiles cp ON cp.user_id=a.candidate_id
     WHERE (? IN ('talent_admin', 'super_admin') OR o.created_by = ?) ORDER BY a.created_at DESC`, [req.user!.role, req.user!.id],
  );
  return res.json({ applications: rows });
});

router.post("/", requireAuth, requireRole("employer", "talent_admin", "super_admin"), async (req, res) => {
  const parsed = opportunitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the opportunity details.", fields: parsed.error.flatten().fieldErrors });
  const item = parsed.data;
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO opportunities (id, title, organization, opportunity_type, location, duration, description, application_deadline, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, item.title, item.organization, item.type, item.location, item.duration, item.description, item.applicationDeadline ?? null, req.user!.id],
  );
  return res.status(201).json({ id, status: "draft", message: "Opportunity saved as a draft." });
});

router.patch("/:id/publish", requireAuth, requireRole("employer", "talent_admin", "super_admin"), async (req, res) => {
  const [result] = await pool.execute(
    `UPDATE opportunities SET status = 'published' WHERE id = ? AND status = 'draft'
     AND (? IN ('talent_admin', 'super_admin') OR created_by = ?)`, [String(req.params.id), req.user!.role, req.user!.id],
  );
  if (!("affectedRows" in result) || result.affectedRows === 0) return res.status(404).json({ error: "Draft opportunity not found for this account." });
  return res.json({ id: String(req.params.id), status: "published" });
});

router.patch("/applications/:applicationId/status", requireAuth, requireRole("employer", "talent_admin", "super_admin"), async (req, res) => {
  const parsed = z.object({ status: z.enum(["reviewing", "shortlisted", "declined"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose reviewing, shortlisted or declined." });
  const [result] = await pool.execute(
    `UPDATE applications a JOIN opportunities o ON o.id = a.opportunity_id SET a.status = ? WHERE a.id = ?
     AND (? IN ('talent_admin', 'super_admin') OR o.created_by = ?)`, [parsed.data.status, String(req.params.applicationId), req.user!.role, req.user!.id],
  );
  if (!("affectedRows" in result) || result.affectedRows === 0) return res.status(404).json({ error: "Application not found for this account." });
  return res.json({ id: String(req.params.applicationId), status: parsed.data.status });
});

router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<OpportunityRow[]>(
    `SELECT id, title, organization, opportunity_type, location, duration, description, application_deadline, created_at
     FROM opportunities WHERE status = 'published' AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
     ORDER BY created_at DESC LIMIT 100`,
  );
  return res.json({ opportunities: rows });
});

router.post("/:id/applications", requireAuth, requireRole("candidate"), applicationLimiter, async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Add a short cover note before applying.", fields: parsed.error.flatten().fieldErrors });
  const [opportunities] = await pool.execute<(RowDataPacket & { id: string })[]>(
    "SELECT id FROM opportunities WHERE id = ? AND status = 'published' AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE) LIMIT 1", [String(req.params.id)],
  );
  if (!opportunities[0]) return res.status(404).json({ error: "This opportunity is no longer accepting applications." });
  try {
    const id = randomUUID();
    await pool.execute("INSERT INTO applications (id, opportunity_id, candidate_id, cover_note) VALUES (?, ?, ?, ?)", [id, String(req.params.id), req.user!.id, parsed.data.coverNote]);
    return res.status(201).json({ id, status: "submitted", message: "Your application has been submitted." });
  } catch (error) {
    if (isDuplicate(error)) return res.status(409).json({ error: "You have already applied for this opportunity." });
    throw error;
  }
});

router.get("/applications/:applicationId/candidate-resume",requireAuth,requireRole("employer","talent_admin","super_admin"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & {resume_name:string|null;resume_mime:string|null;resume_data:Buffer|null})[]>(
    `SELECT cp.resume_name,cp.resume_mime,cp.resume_data FROM applications a
     JOIN opportunities o ON o.id=a.opportunity_id JOIN candidate_profiles cp ON cp.user_id=a.candidate_id
     WHERE a.id=? AND (? IN ('talent_admin','super_admin') OR o.created_by=?) LIMIT 1`,
    [String(req.params.applicationId),req.user!.role,req.user!.id],
  );
  const resume=rows[0];
  if(!resume?.resume_data)return res.status(404).json({error:"No résumé is attached to this application."});
  res.setHeader("Content-Type",resume.resume_mime??"application/octet-stream");
  res.setHeader("Content-Disposition",`attachment; filename="${(resume.resume_name??"candidate-file").replace(/[\"\\]/g,"")}"`);
  return res.send(resume.resume_data);
});

router.get("/applications/:applicationId/candidate-documents/:documentId",requireAuth,requireRole("employer","talent_admin","super_admin"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & {file_name:string;mime_type:string;file_data:Buffer})[]>(
    `SELECT cd.file_name,cd.mime_type,cd.file_data FROM applications a JOIN opportunities o ON o.id=a.opportunity_id
     JOIN candidate_documents cd ON cd.candidate_id=a.candidate_id WHERE a.id=? AND cd.id=?
     AND (? IN ('talent_admin','super_admin') OR o.created_by=?) LIMIT 1`,
    [String(req.params.applicationId),String(req.params.documentId),req.user!.role,req.user!.id],
  );
  if(!rows[0])return res.status(404).json({error:"File not found for an application you manage."});
  res.setHeader("Content-Type",rows[0].mime_type);res.setHeader("Content-Disposition",`attachment; filename="${rows[0].file_name.replace(/[\"\\]/g,"")}"`);
  return res.send(rows[0].file_data);
});

router.get("/:id", async (req, res) => {
  const [rows] = await pool.execute<OpportunityRow[]>(
    `SELECT id, title, organization, opportunity_type, location, duration, description, application_deadline, created_at
     FROM opportunities WHERE id = ? AND status = 'published' LIMIT 1`, [String(req.params.id)],
  );
  if (!rows[0]) return res.status(404).json({ error: "Opportunity not found." });
  return res.json({ opportunity: rows[0] });
});

function isDuplicate(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export default router;
