import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
function validFileContent(data:Buffer,mime:string){
  if(mime==="application/pdf")return data.subarray(0,5).toString()==="%PDF-";
  if(mime==="image/png")return data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(mime==="image/jpeg")return data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255;
  return false;
}
const profileSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(80)).max(40),
  capabilitySummary: z.string().trim().max(3000),
  opportunityPreference: z.enum(["job", "attachment", "both"]),
});
const assessmentSchema=z.object({answers:z.record(z.string(),z.number().int().min(1).max(5))});

router.get("/me", requireAuth, requireRole("candidate"), async (req,res) => {
  const [rows] = await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT cp.skills,cp.capability_summary,cp.opportunity_preference,cp.resume_name,cp.resume_mime,
      COALESCE(v.is_visible,FALSE) AS is_visible FROM candidate_profiles cp LEFT JOIN candidate_profile_visibility v ON v.user_id=cp.user_id WHERE cp.user_id=? LIMIT 1`,
    [req.user!.id],
  );
  const profile=rows[0];
  let skills: string[]=[];
  if(profile?.skills) skills=Array.isArray(profile.skills)?profile.skills as string[]:JSON.parse(String(profile.skills)) as string[];
  return res.json({profile:profile?{skills,capabilitySummary:profile.capability_summary,opportunityPreference:profile.opportunity_preference,resumeName:profile.resume_name,resumeMime:profile.resume_mime,isVisible:Boolean(profile.is_visible)}:null});
});

router.get("/directory",requireAuth,requireRole("employer","talent_admin","super_admin"),async(req,res)=>{
  const query=String(req.query.q??"").trim().slice(0,100);
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT u.id,u.full_name,cp.skills,cp.capability_summary,cp.opportunity_preference
     FROM users u JOIN candidate_profiles cp ON cp.user_id=u.id
     JOIN candidate_profile_visibility v ON v.user_id=u.id AND v.is_visible=TRUE
     WHERE (?='' OR cp.capability_summary LIKE CONCAT('%',?,'%') OR CAST(cp.skills AS CHAR) LIKE CONCAT('%',?,'%'))
     ORDER BY cp.updated_at DESC LIMIT 100`,[query,query,query],
  );
  return res.json({candidates:rows});
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

router.patch("/me/visibility",requireAuth,requireRole("candidate"),async(req,res)=>{
  const parsed=z.object({isVisible:z.boolean()}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Choose whether employers can discover your profile."});
  await pool.execute("INSERT INTO candidate_profile_visibility(user_id,is_visible) VALUES(?,?) ON DUPLICATE KEY UPDATE is_visible=VALUES(is_visible)",[req.user!.id,parsed.data.isVisible]);
  return res.json({isVisible:parsed.data.isVisible});
});

router.get("/me/assessment",requireAuth,requireRole("candidate"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & {answers:unknown})[]>("SELECT answers FROM candidate_assessments WHERE user_id=? LIMIT 1",[req.user!.id]);
  const answers=rows[0]?.answers;
  return res.json({answers:answers?(typeof answers==="string"?JSON.parse(answers):answers):{}});
});

router.put("/me/assessment",requireAuth,requireRole("candidate"),async(req,res)=>{
  const parsed=assessmentSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Assessment answers must use a rating from 1 to 5."});
  await pool.execute("INSERT INTO candidate_assessments(user_id,answers) VALUES(?,?) ON DUPLICATE KEY UPDATE answers=VALUES(answers)",[req.user!.id,JSON.stringify(parsed.data.answers)]);
  return res.json({message:"Career assessment saved."});
});

router.put("/me/resume", requireAuth, requireRole("candidate"), async (req,res) => {
  if(!Buffer.isBuffer(req.body))return res.status(400).json({error:"Upload a PDF or image file."});
  const mime=req.get("content-type")??"";
  const name=decodeURIComponent(req.get("x-file-name")??"resume").slice(0,255);
  if(!["application/pdf","image/jpeg","image/png"].includes(mime))return res.status(415).json({error:"Use a PDF, JPG or PNG file."});
  if(req.body.length===0||req.body.length>4*1024*1024)return res.status(413).json({error:"The file must be smaller than 4 MB."});
  if(!validFileContent(req.body,mime))return res.status(415).json({error:"The selected file does not match its file type."});
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

router.get("/me/documents",requireAuth,requireRole("candidate"),async(req,res)=>{
  const [documents]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    "SELECT id,file_name,mime_type,created_at FROM candidate_documents WHERE candidate_id=? ORDER BY created_at DESC",[req.user!.id],
  );
  return res.json({documents});
});

router.put("/me/documents",requireAuth,requireRole("candidate"),async(req,res)=>{
  if(!Buffer.isBuffer(req.body))return res.status(400).json({error:"Choose a file to upload."});
  const mime=req.get("content-type")??"";const name=decodeURIComponent(req.get("x-file-name")??"document").replace(/[\\/\r\n]/g,"_").slice(0,255);
  if(!["application/pdf","image/jpeg","image/png"].includes(mime))return res.status(415).json({error:"Use a PDF, JPG or PNG file."});
  if(req.body.length===0||req.body.length>4*1024*1024)return res.status(413).json({error:"Each file must be smaller than 4 MB."});
  if(!validFileContent(req.body,mime))return res.status(415).json({error:"The selected file does not match its file type."});
  const id=randomUUID();
  await pool.execute("INSERT INTO candidate_documents(id,candidate_id,file_name,mime_type,file_data) VALUES(?,?,?,?,?)",[id,req.user!.id,name,mime,req.body]);
  return res.status(201).json({document:{id,file_name:name,mime_type:mime}});
});

router.get("/me/documents/:documentId",requireAuth,requireRole("candidate"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & {file_name:string;mime_type:string;file_data:Buffer})[]>(
    "SELECT file_name,mime_type,file_data FROM candidate_documents WHERE id=? AND candidate_id=? LIMIT 1",[String(req.params.documentId),req.user!.id],
  );
  if(!rows[0])return res.status(404).json({error:"File not found."});
  res.setHeader("Content-Type",rows[0].mime_type);res.setHeader("Content-Disposition",`attachment; filename="${rows[0].file_name.replace(/[\"\\]/g,"")}"`);
  return res.send(rows[0].file_data);
});

router.delete("/me/documents/:documentId",requireAuth,requireRole("candidate"),async(req,res)=>{
  const [result]=await pool.execute("DELETE FROM candidate_documents WHERE id=? AND candidate_id=?",[String(req.params.documentId),req.user!.id]);
  if(!("affectedRows" in result)||result.affectedRows===0)return res.status(404).json({error:"File not found."});
  return res.json({message:"File deleted."});
});

export default router;
