import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Import routes
import { errorHandler } from "@/api/middleware/errorHandler";
import authRoutes from "@/api/routes/auth";
import policyRoutes from "@/api/routes/policy";
import portfolioRoutes from "@/api/routes/portfolio";
import profileRoutes from "@/api/routes/profile";
import tradeRoutes from "@/api/routes/trade";

dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.use(errorHandler);

const BACKEND_PORT = process.env.BACKEND_PORT || 4848;

if (!process.env.BACKEND_PORT) {
  console.warn(
    `⚠️ [agentix-server]: BACKEND_PORT is not set, using default port ${BACKEND_PORT}`
  );
}

app.listen(BACKEND_PORT, () => {
  console.log(`🤖 [agentix-server]: running at http://localhost:${BACKEND_PORT}`);
});