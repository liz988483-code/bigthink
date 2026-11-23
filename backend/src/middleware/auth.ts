import type { NextFunction, Request, Response } from "express";
import { accessTokenCookie, type UserRole, verifyAccessToken } from "../auth/jwt.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = req.cookies?.[accessTokenCookie] as string | undefined ?? bearer;
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.user = await verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid or has expired. Please sign in again." });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to perform this action." });
    return next();
  };
}
