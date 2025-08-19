import { Router } from "express";
import { z } from "zod";

import authController from "@/interfaces/api/controllers/authController";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
    ethWalletAddress: z.string().optional(),
    solWalletAddress: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  }),
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

export default router;
