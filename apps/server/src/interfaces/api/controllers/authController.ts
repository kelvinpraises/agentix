import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "@/models/User";
import { authService } from "@/services/user/auth-service";
import { sanitizeUser } from "@/utils/user";

interface RegisterRequestBody {
  email: string;
  password: string;
  ethWalletAddress?: string;
  solWalletAddress?: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: Omit<User, "password_hash">;
}

const authController = {
  async register(
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response<AuthResponse | { error: string }>
  ) {
    try {
      const { email, password } = req.body;
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "User with this email already exists." });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await authService.createUser({
        email,
        password_hash: hashedPassword,
      });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!,
        {
          expiresIn: "24h",
        });
      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while registering the user." });
    }
  },

  async login(
    req: Request<{}, {}, LoginRequestBody>,
    res: Response<AuthResponse | { error: string }>
  ) {
    try {
      const { email, password } = req.body;
      const user = await authService.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", {
        expiresIn: "24h",
      });
      res.json({ token, user: sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while logging in." });
    }
  },
};

export default authController;