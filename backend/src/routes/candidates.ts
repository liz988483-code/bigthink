import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const profileSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(80)).max(40),
  capabilitySummary: z.string().trim().max(3000),
  opportunityPreference: z.enum(["job", "attachment", "both"]),
});

router.get("/me", requireAuth, requireRole("candidate"), async (req,res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    "SELECT skills,capability_summary,opportunity_preference,resume_name,resume_mime FROM candidate_profiles WHERE user_id=? LIMIT 1",
    [req.user!.id],
  );
  const profile=rows[0];
  let skills: string[]=[];
  if(profile?.skills) skills=Array.isArray(profile.skills)?profile.skills as string[]:JSON.parse(String(profile.skills)) as string[];
  return res.json({profile:profile?{skills,capabilitySummary:profile.capability_summary,opportunityPreference:profile.opportunity_preference,resumeName:profile.resume_name,resumeMime:profile.resume_mime}:null});
});

router.put("/me", requireAuth, requireRole("candidate"), async (req,res) => {
  const parsed=profileSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Check your skills and profile details."});
  const {skills,capabilitySummary,opportunityPreference}=parsed.data;
  await pool.execute(
    `INSERT INTO candidate_profiles(user_id,skills,capability_summary,opportunity_preference) VALUES(?,?,?,?)
     ON DUPLICATE KEY UPDATE skills=VALUES(skills),capability_summary=VALUES(capability_summary),opportunity_preference=VALUES(opportunity_preference)`,
    [req.user!.id,JSON.stringify(skills),capabilitySummary,opportunityPreference],
  );
  return res.json({message:"Candidate profile saved."});
});

router.put("/me/resume", requireAuth, requireRole("candidate"), async (req,res) => {
  if(!Buffer.isBuffer(req.body))return res.status(400).json({error:"Upload a PDF or image file."});
  const mime=req.get("content-type")??"";
  const name=decodeURIComponent(req.get("x-file-name")??"resume").slice(0,255);
  if(!["application/pdf","image/jpeg","image/png"].includes(mime))return res.status(415).json({error:"Use a PDF, JPG or PNG file."});
  if(req.body.length===0||req.body.length>4*1024*1024)return res.status(413).json({error:"The file must be smaller than 4 MB."});
  await pool.execute(
    `INSERT INTO candidate_profiles(user_id,skills,capability_summary,opportunity_preference,resume_name,resume_mime,resume_data)
     VALUES(?,JSON_ARRAY(),'','both',?,?,?) ON DUPLICATE KEY UPDATE resume_name=VALUES(resume_name),resume_mime=VALUES(resume_mime),resume_data=VALUES(resume_data)`,
    [req.user!.id,name,mime,req.body],
  );
  return res.json({message:"File uploaded to your candidate profile.",resumeName:name});
});

router.get("/me/resume", requireAuth, requireRole("candidate"), async (req,res) => {
  const [rows]=await pool.execute<(RowDataPacket & {resume_name:string|null;resume_mime:string|null;resume_data:Buffer|null})[]>(
    "SELECT resume_name,resume_mime,resume_data FROM candidate_profiles WHERE user_id=? LIMIT 1",[req.user!.id],
  );
  const file=rows[0];
  if(!file?.resume_data)return res.status(404).json({error:"No file has been uploaded."});
  res.setHeader("Content-Type",file.resume_mime??"application/octet-stream");
  res.setHeader("Content-Disposition",`attachment; filename="${(file.resume_name??"resume").replace(/[\"\\]/g,"")}"`);
  return res.send(file.resume_data);
});

export default router;
