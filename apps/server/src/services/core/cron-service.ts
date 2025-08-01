import cron from "node-cron";

import { userTradingQueue } from "@/config/queue-config";
import { db } from "@/database/turso-connection";

const cronService = {
  async start() {
    console.log("🤖 [cron-service] Starting master scheduler...");

    await this.cleanAllQueues();

    // This job ensures all users have their trading cycle scheduled.
    cron.schedule("*/5 * * * *", async () => {
      console.log("🤖 [cron-service] Running user scheduling job...");
      await this.scheduleUserTradingJobs();
    });

    // Initial run on startup
    await this.scheduleUserTradingJobs();
  },

  async cleanAllQueues() {
    console.log("🧹 [cron-service] Cleaning all queues...");
    await Promise.all([
      userTradingQueue.clean(0, Infinity, "completed"),
      userTradingQueue.clean(0, Infinity, "wait"),
      userTradingQueue.clean(0, Infinity, "active"),
      userTradingQueue.clean(0, Infinity, "paused"),
      userTradingQueue.clean(0, Infinity, "prioritized"),
      userTradingQueue.clean(0, Infinity, "delayed"),
      userTradingQueue.clean(0, Infinity, "failed"),
    ]);
    console.log("✅ [cron-service] Queues cleaned.");
  },

  async scheduleUserTradingJobs() {
    try {
      // 1. Fetch all users and their active policies
      const users = await db.selectFrom("users").selectAll().execute();
      const policies = await db
        .selectFrom("user_policies")
        .where("is_active", "=", true)
        .selectAll()
        .execute();
      const policyMap = new Map(policies.map((p) => [p.user_id, p]));
      const activeUserIdsWithPolicies = new Set(policies.map((p) => p.user_id));

      // 2. Fetch all job schedulers and map them by user ID
      const jobSchedulers = await userTradingQueue.getJobSchedulers();
      const jobMap = new Map<number, (typeof jobSchedulers)[0]>();
      for (const job of jobSchedulers) {
        if (job.id && job.id.startsWith("user-trade-cycle-")) {
          const userId = parseInt(job.id.split("-")[3], 10);
          if (!isNaN(userId)) {
            jobMap.set(userId, job);
          }
        }
      }

      // 3. Remove jobs for users who are no longer active or have no policy
      for (const [userId, job] of jobMap.entries()) {
        if (!activeUserIdsWithPolicies.has(userId)) {
          if (job.id) {
            await userTradingQueue.removeJobScheduler(job.id);
            console.log(`🧹 [cron-service] Removed stale job for user ${userId}.`);
          }
        }
      }

      let upsertedCount = 0;

      // 4. Schedule or update jobs for active users
      for (const user of users) {
        const policy = policyMap.get(user.id);
        if (!policy?.policy_document?.trading_preferences) {
          continue; // Skip users without active policies
        }

        const { frequency_minutes } = policy.policy_document.trading_preferences;
        if (!frequency_minutes) {
          console.warn(
            `⚠️ [cron-service] User ${user.id} policy has no frequency_minutes. Skipping.`
          );
          continue;
        }

        const schedulerId = `user-trade-cycle-${user.id}`;
        const newInterval = frequency_minutes * 60 * 1000;

        await userTradingQueue.upsertJobScheduler(
          schedulerId,
          { every: newInterval },
          {
            name: "user-trade-cycle",
            data: { userId: user.id },
          }
        );
        upsertedCount++;
      }

      if (upsertedCount > 0) {
        console.log(`✅ [cron-service] Upserted ${upsertedCount} user trading schedulers.`);
      } else {
        console.log("✅ [cron-service] All user trading jobs are up to date.");
      }
    } catch (error) {
      console.error("❌ [cron-service] Error scheduling user trading jobs:", error);
    }
  },
};

export default cronService;
