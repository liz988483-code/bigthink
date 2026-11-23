import type { UserRole } from "../auth/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export {};
