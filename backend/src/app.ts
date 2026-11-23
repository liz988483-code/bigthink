import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import inquiryRoutes from "./routes/inquiries.js";
import opportunityRoutes from "./routes/opportunities.js";
import eventRoutes from "./routes/events.js";
import marketplaceRoutes from "./routes/marketplace.js";
import insightRoutes from "./routes/insights.js";
import candidateRoutes from "./routes/candidates.js";
import adminRoutes from "./routes/admin.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "X-File-Name"] }));
app.use("/api/candidates/me/resume", express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "4mb" }));
app.use("/api/candidates/me/documents", express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "4mb" }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });
app.use("/api", apiLimiter);

app.get("/api/health", async (_req, res) => {
  const { pool } = await import("./db/pool.js");
  await pool.query("SELECT 1");
  return res.json({ status: "ok", service: "bigthink-api" });
});
app.use("/api/auth", authRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/insights", insightRoutes);

app.use((_req, res) => res.status(404).json({ error: "API route not found." }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API request failed", error);
  return res.status(500).json({ error: "The request could not be completed. Please try again." });
});
