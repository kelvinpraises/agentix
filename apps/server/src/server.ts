import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { errorHandler } from "@/api/middleware/errorHandler";
import authRoutes from "@/api/routes/auth";
import orbRoutes from "@/api/routes/orb";
import policyRoutes from "@/api/routes/policy";
import portfolioRoutes from "@/api/routes/portfolio";
import profileRoutes from "@/api/routes/profile";
import sectorRoutes from "@/api/routes/sector";
import threadRoutes from "@/api/routes/thread";
import tradeRoutes from "@/api/routes/trade";
import cronService from "@/services/core/cron-service";

dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/sectors", sectorRoutes);
app.use("/api/orbs", orbRoutes);
app.use("/api/threads", threadRoutes);
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
  // Start the master cron service
  cronService.start();
});
