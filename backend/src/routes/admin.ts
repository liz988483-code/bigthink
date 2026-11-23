import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router=Router();
const roles=["candidate","employer","supplier","skilled_provider","buyer","event_member","talent_admin","verification_officer","events_admin","supplier_admin","content_editor","finance_user","support_user"] as const;

router.get("/overview",requireAuth,requireRole("super_admin"),async(_req,res)=>{
  const [[users],[opportunities],[applications],[suppliers],[registrations],[activity],[daily]] = await Promise.all([
    pool.execute<(RowDataPacket & {total:number})[]>("SELECT COUNT(*) AS total FROM users"),
    pool.execute<(RowDataPacket & {total:number})[]>("SELECT COUNT(*) AS total FROM opportunities"),
    pool.execute<(RowDataPacket & {total:number})[]>("SELECT COUNT(*) AS total FROM applications"),
    pool.execute<(RowDataPacket & {total:number})[]>("SELECT COUNT(*) AS total FROM supplier_profiles"),
    pool.execute<(RowDataPacket & {total:number})[]>("SELECT COUNT(*) AS total FROM event_registrations WHERE status='registered'"),
    pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
      `SELECT activity,type,created_at FROM (
        SELECT CONCAT('New account: ',full_name) AS activity,'user' AS type,created_at FROM users
        UNION ALL SELECT CONCAT('Opportunity posted: ',title),'opportunity',created_at FROM opportunities
        UNION ALL SELECT CONCAT('Application received: ',o.title),'application',a.created_at FROM applications a JOIN opportunities o ON o.id=a.opportunity_id
        UNION ALL SELECT CONCAT('Buyer request: ',title),'request',created_at FROM buyer_requests
        UNION ALL SELECT CONCAT('Event published: ',title),'event',created_at FROM events
      ) recent ORDER BY created_at DESC LIMIT 8`,
    ),
    pool.execute<(RowDataPacket & {day:string;total:number})[]>(
      `SELECT DATE(created_at) AS day,COUNT(*) AS total FROM (
        SELECT created_at FROM users WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 29 DAY)
        UNION ALL SELECT created_at FROM applications WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 29 DAY)
        UNION ALL SELECT created_at FROM buyer_requests WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 29 DAY)
        UNION ALL SELECT created_at FROM events WHERE created_at>=DATE_SUB(CURRENT_DATE,INTERVAL 29 DAY)
      ) activity GROUP BY DATE(created_at) ORDER BY day ASC`,
    ),
  ]);
  return res.json({metrics:{users:users[0]?.total??0,opportunities:opportunities[0]?.total??0,applications:applications[0]?.total??0,suppliers:suppliers[0]?.total??0,registrations:registrations[0]?.total??0},activity,daily});
});

router.get("/users",requireAuth,requireRole("super_admin"),async(req,res)=>{
  const query=String(req.query.q??"").trim().slice(0,100);
  const [users]=await pool.execute<(RowDataPacket & Record<string,unknown>)[]>(
    `SELECT id,full_name,email,role,created_at FROM users
     WHERE (?='' OR full_name LIKE CONCAT('%',?,'%') OR email LIKE CONCAT('%',?,'%'))
     ORDER BY created_at DESC LIMIT 100`,[query,query,query],
  );
  return res.json({users});
});

router.patch("/users/:userId/role",requireAuth,requireRole("super_admin"),async(req,res)=>{
  if(String(req.params.userId)===req.user!.id)return res.status(400).json({error:"You cannot change your own administrator role."});
  const parsed=z.object({role:z.enum(roles)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({error:"Choose a supported account role."});
  const [result]=await pool.execute("UPDATE users SET role=? WHERE id=?",[parsed.data.role,String(req.params.userId)]);
  if(!("affectedRows" in result)||result.affectedRows===0)return res.status(404).json({error:"User not found."});
  return res.json({message:"User role updated.",role:parsed.data.role});
});

export default router;
