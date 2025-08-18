import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import tradeCycler from "@/infrastructure/jobs/trading/trade-cycler";
import { errorHandler } from "@/interfaces/api/middleware/errorHandler";
import authRoutes from "@/interfaces/api/routes/auth";
import orbRoutes from "@/interfaces/api/routes/orb";
import policyRoutes from "@/interfaces/api/routes/policy";
import portfolioRoutes from "@/interfaces/api/routes/portfolio";
import profileRoutes from "@/interfaces/api/routes/profile";
import sectorRoutes from "@/interfaces/api/routes/sector";
import threadRoutes from "@/interfaces/api/routes/thread";
import tradeRoutes from "@/interfaces/api/routes/trade";

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
  // Start the cron jobs
  tradeCycler.start();
});
