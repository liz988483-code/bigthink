import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const writeLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(180), category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(30).max(8000), location: z.string().trim().min(2).max(140),
  website: z.union([z.url(), z.literal("")]).optional(),
});
const requestSchema = z.object({
  title: z.string().trim().min(4).max(180), category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(30).max(8000), quantity: z.string().trim().min(1).max(120),
  deliveryLocation: z.string().trim().min(2).max(180),
  dueDate: z.preprocess((v)=>v===""?undefined:v,z.iso.date().optional()),
});

router.get("/suppliers/pending",requireAuth,requireRole("verification_officer","super_admin"),async(_req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT sp.id,sp.business_name,sp.category,sp.description,sp.location,sp.website,sp.created_at,u.full_name,u.email
     FROM supplier_profiles sp JOIN users u ON u.id=sp.user_id WHERE sp.verification_status='pending' ORDER BY sp.created_at ASC`,
  );
  return res.json({suppliers:rows});
});

router.patch("/suppliers/:profileId/verification",requireAuth,requireRole("verification_officer","super_admin"),async(req,res)=>{
  const parsed=z.object({status:z.enum(["verified","rejected"])}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Choose verified or rejected."});
  const [result]=await pool.execute("UPDATE supplier_profiles SET verification_status=? WHERE id=?",[parsed.data.status,String(req.params.profileId)]);
  if(!("affectedRows" in result)||result.affectedRows===0)return res.status(404).json({error:"Supplier profile not found."});
  return res.json({status:parsed.data.status});
});

router.get("/suppliers", async (_req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT id, business_name, category, description, location, website
     FROM supplier_profiles WHERE verification_status='verified' ORDER BY business_name ASC LIMIT 100`,
  );
  return res.json({suppliers:rows});
});

router.get("/suppliers/mine",requireAuth,requireRole("supplier","skilled_provider"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT id, business_name, category, description, location, website, verification_status, created_at
     FROM supplier_profiles WHERE user_id=? LIMIT 1`,[req.user!.id],
  );
  return res.json({profile:rows[0]??null});
});

router.put("/suppliers/mine",requireAuth,requireRole("supplier","skilled_provider"),writeLimit,async(req,res)=>{
  const parsed=profileSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Please check the supplier profile details.",fields:parsed.error.flatten().fieldErrors});
  const data=parsed.data;
  const id=randomUUID();
  await pool.execute(
    `INSERT INTO supplier_profiles (id,user_id,business_name,category,description,location,website)
     VALUES (?,?,?,?,?,?,NULLIF(?,'')) ON DUPLICATE KEY UPDATE business_name=VALUES(business_name),category=VALUES(category),
     description=VALUES(description),location=VALUES(location),website=VALUES(website),verification_status='pending'`,
    [id,req.user!.id,data.businessName,data.category,data.description,data.location,data.website??""],
  );
  return res.json({message:"Supplier profile saved for verification.",verificationStatus:"pending"});
});

router.get("/requests/mine",requireAuth,requireRole("buyer","employer"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT br.id,br.title,br.category,br.description,br.quantity,br.delivery_location,br.due_date,br.status,br.created_at,
      (SELECT COUNT(*) FROM supplier_responses sr WHERE sr.request_id=br.id) AS response_count
     FROM buyer_requests br WHERE br.buyer_id=? ORDER BY br.created_at DESC`,[req.user!.id],
  );
  return res.json({requests:rows});
});

router.get("/requests/:requestId/responses",requireAuth,requireRole("buyer","employer"),async(req,res)=>{
  const [owned]=await pool.execute<(RowDataPacket & {id:string})[]>("SELECT id FROM buyer_requests WHERE id=? AND buyer_id=? LIMIT 1",[String(req.params.requestId),req.user!.id]);
  if(!owned[0])return res.status(404).json({error:"Buyer request not found."});
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT sr.id,sr.supplier_id,sr.message,sr.status,sr.created_at,u.full_name AS supplier_name,sp.business_name,sp.category
     FROM supplier_responses sr JOIN users u ON u.id=sr.supplier_id JOIN supplier_profiles sp ON sp.user_id=sr.supplier_id
     WHERE sr.request_id=? ORDER BY sr.created_at DESC`,[String(req.params.requestId)],
  );
  return res.json({responses:rows});
});

router.post("/requests",requireAuth,requireRole("buyer","employer"),writeLimit,async(req,res)=>{
  const parsed=requestSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Please check the procurement request details.",fields:parsed.error.flatten().fieldErrors});
  const data=parsed.data;const id=randomUUID();
  await pool.execute("INSERT INTO buyer_requests (id,buyer_id,title,category,description,quantity,delivery_location,due_date) VALUES (?,?,?,?,?,?,?,?)",
    [id,req.user!.id,data.title,data.category,data.description,data.quantity,data.deliveryLocation,data.dueDate??null]);
  return res.status(201).json({id,status:"open",message:"Your request is open to verified suppliers."});
});

router.get("/requests/open",requireAuth,requireRole("supplier","skilled_provider"),async(_req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT br.id,br.title,br.category,br.description,br.quantity,br.delivery_location,br.due_date,br.created_at
     FROM buyer_requests br WHERE br.status='open' ORDER BY br.created_at DESC LIMIT 100`,
  );
  return res.json({requests:rows});
});

router.post("/requests/:requestId/responses",requireAuth,requireRole("supplier","skilled_provider"),writeLimit,async(req,res)=>{
  const parsed=z.object({message:z.string().trim().min(20).max(4000)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Add details about your offer (at least 20 characters)."});
  const [profiles]=await pool.execute<(RowDataPacket & {verification_status:string})[]>("SELECT verification_status FROM supplier_profiles WHERE user_id=? LIMIT 1",[req.user!.id]);
  if(profiles[0]?.verification_status!=="verified")return res.status(403).json({error:"Your supplier profile must be verified before responding to buyer requests."});
  try{
    const id=randomUUID();
    const [result]=await pool.execute("INSERT INTO supplier_responses (id,request_id,supplier_id,message) SELECT ?,id,?,? FROM buyer_requests WHERE id=? AND status='open'",
      [id,req.user!.id,parsed.data.message,String(req.params.requestId)]);
    if(!("affectedRows" in result)||result.affectedRows===0)return res.status(404).json({error:"This buyer request is no longer open."});
    return res.status(201).json({message:"Your response has been sent to the buyer."});
  }catch(error){
    if(typeof error==="object"&&error!==null&&"code" in error&&error.code==="ER_DUP_ENTRY")return res.status(409).json({error:"You have already responded to this request."});
    throw error;
  }
});

router.get("/responses/mine",requireAuth,requireRole("supplier","skilled_provider"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT sr.id,sr.message,sr.status,sr.created_at,br.id AS request_id,br.title AS request_title,br.delivery_location
     FROM supplier_responses sr JOIN buyer_requests br ON br.id=sr.request_id WHERE sr.supplier_id=? ORDER BY sr.created_at DESC`,[req.user!.id],
  );
  return res.json({responses:rows});
});

router.get("/requests/:requestId/conversations/:supplierId",requireAuth,requireRole("buyer","employer","supplier","skilled_provider"),async(req,res)=>{
  const requestId=String(req.params.requestId);const supplierId=String(req.params.supplierId);
  const [threads]=await pool.execute<(RowDataPacket & {buyer_id:string;supplier_id:string})[]>(
    `SELECT br.buyer_id,sr.supplier_id FROM buyer_requests br JOIN supplier_responses sr ON sr.request_id=br.id
     WHERE br.id=? AND sr.supplier_id=? LIMIT 1`,[requestId,supplierId],
  );
  const thread=threads[0];
  if(!thread)return res.status(404).json({error:"Conversation not found."});
  const participant=req.user!.role==="supplier"||req.user!.role==="skilled_provider"?req.user!.id===thread.supplier_id:req.user!.id===thread.buyer_id;
  if(!participant)return res.status(403).json({error:"You are not part of this conversation."});
  const [messages]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT mm.id,mm.sender_id,mm.message,mm.created_at,u.full_name AS sender_name
     FROM marketplace_messages mm JOIN users u ON u.id=mm.sender_id
     WHERE mm.request_id=? AND mm.supplier_id=? ORDER BY mm.created_at ASC`,[requestId,supplierId],
  );
  return res.json({messages});
});

router.post("/requests/:requestId/conversations/:supplierId",requireAuth,requireRole("buyer","employer","supplier","skilled_provider"),writeLimit,async(req,res)=>{
  const parsed=z.object({message:z.string().trim().min(1).max(4000)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Write a message up to 4,000 characters."});
  const requestId=String(req.params.requestId);const supplierId=String(req.params.supplierId);
  const [threads]=await pool.execute<(RowDataPacket & {buyer_id:string;supplier_id:string})[]>(
    `SELECT br.buyer_id,sr.supplier_id FROM buyer_requests br JOIN supplier_responses sr ON sr.request_id=br.id
     WHERE br.id=? AND sr.supplier_id=? LIMIT 1`,[requestId,supplierId],
  );
  const thread=threads[0];
  if(!thread)return res.status(404).json({error:"Conversation not found."});
  const participant=req.user!.role==="supplier"||req.user!.role==="skilled_provider"?req.user!.id===thread.supplier_id:req.user!.id===thread.buyer_id;
  if(!participant)return res.status(403).json({error:"You are not part of this conversation."});
  const id=randomUUID();
  await pool.execute("INSERT INTO marketplace_messages(id,request_id,supplier_id,sender_id,message) VALUES(?,?,?,?,?)",[id,requestId,supplierId,req.user!.id,parsed.data.message]);
  return res.status(201).json({id,message:"Message sent."});
});

export default router;
