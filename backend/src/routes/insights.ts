import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router=Router();
const writerLimit=rateLimit({windowMs:60*60*1000,limit:30,standardHeaders:"draft-8",legacyHeaders:false});
const articleSchema=z.object({
  title:z.string().trim().min(8).max(220),category:z.string().trim().min(2).max(80),
  summary:z.string().trim().min(30).max(500),content:z.string().trim().min(100).max(50000),
  coverImage:z.union([z.url(),z.literal("")]).optional(),
});

router.get("/",async(_req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT slug,title,category,summary,cover_image,published_at FROM insights WHERE status='published' ORDER BY published_at DESC LIMIT 100`,
  );
  return res.json({articles:rows});
});

router.get("/mine",requireAuth,requireRole("content_editor","super_admin"),async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT id,slug,title,category,summary,status,published_at,created_at FROM insights WHERE author_id=? ORDER BY updated_at DESC`,[req.user!.id],
  );
  return res.json({articles:rows});
});

router.post("/",requireAuth,requireRole("content_editor","super_admin"),writerLimit,async(req,res)=>{
  const parsed=articleSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Please check the article details.",fields:parsed.error.flatten().fieldErrors});
  const data=parsed.data;const id=randomUUID();
  const slugBase=data.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,150);
  const slug=`${slugBase}-${id.slice(0,8)}`;
  await pool.execute("INSERT INTO insights (id,slug,title,category,summary,content,cover_image,author_id) VALUES (?,?,?,?,?,?,NULLIF(?,''),?)",
    [id,slug,data.title,data.category,data.summary,data.content,data.coverImage??"",req.user!.id]);
  return res.status(201).json({id,slug,status:"draft",message:"Article saved as a draft."});
});

router.patch("/:id/publish",requireAuth,requireRole("content_editor","super_admin"),async(req,res)=>{
  const [result]=await pool.execute("UPDATE insights SET status='published',published_at=UTC_TIMESTAMP() WHERE id=? AND author_id=? AND status='draft'",[String(req.params.id),req.user!.id]);
  if(!("affectedRows" in result)||result.affectedRows===0)return res.status(404).json({error:"Draft article not found for this account."});
  return res.json({status:"published"});
});

router.get("/:slug",async(req,res)=>{
  const [rows]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT slug,title,category,summary,content,cover_image,published_at FROM insights WHERE slug=? AND status='published' LIMIT 1`,[String(req.params.slug)],
  );
  if(!rows[0])return res.status(404).json({error:"Article not found."});
  return res.json({article:rows[0]});
});

export default router;
