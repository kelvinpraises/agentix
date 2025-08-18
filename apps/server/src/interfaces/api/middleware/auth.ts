import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { db } from "@/infrastructure/database/turso-connection";

interface JwtPayload {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const user = await db
        .selectFrom("users")
        .where("id", "=", decoded.id)
        .select(["id", "email"])
        .executeTakeFirst();

      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ error: "Not authorized, user not found" });
      }
    } catch (error) {
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};
