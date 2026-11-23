import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

export const accessTokenCookie = "bigthink_access";
const signingKey = Buffer.from(env.JWT_ACCESS_SECRET, "hex");
const issuer = "bigthink-api";
const audience = "bigthink-platform";
export const accessTokenLifetimeSeconds = 15 * 60;

export type UserRole =
  | "candidate" | "employer" | "skilled_provider" | "supplier" | "buyer" | "event_member"
  | "super_admin" | "talent_admin" | "verification_officer" | "events_admin"
  | "supplier_admin" | "content_editor" | "finance_user" | "support_user";

export async function createAccessToken(user: { id: string; role: UserRole }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
    .setSubject(user.id)
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${accessTokenLifetimeSeconds}s`)
    .sign(signingKey);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, signingKey, {
    algorithms: ["HS256"],
    issuer,
    audience,
    typ: "at+jwt",
  });
  if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid access token claims.");
  }
  return { id: payload.sub, role: payload.role as UserRole };
}
