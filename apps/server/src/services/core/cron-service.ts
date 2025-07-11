import cron from "node-cron";

import { mastra } from "@/services/ai-agent";
import { db } from "@/database/turso-connection";

export const cronService = {
  start() {
    // Schedule a job to run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      console.log("Running trading cycle...");
      const users = await db.selectFrom("users").selectAll().execute();
      for (const user of users) {
        const userPolicy = await db
          .selectFrom("user_policies")
          .where("user_id", "=", user.id)
          .selectAll()
          .executeTakeFirst();
        const positions = await db
          .selectFrom("trades")
          .where("user_id", "=", user.id)
          .where("status", "=", "SUCCEEDED")
          .selectAll()
          .execute();
        const balances = {}; // This would be fetched from a wallet service

        const context = {
          userId: user.id,
          policy: userPolicy,
          positions,
          balances,
        };

        // await aiService.getTradingDecision(context);
      }
    });

    // Schedule a job to run every 20 seconds to monitor positions
    cron.schedule("*/20 * * * * *", async () => {
      console.log("Monitoring positions...");
      // This is where the position monitoring logic would go
    });
  },
};
