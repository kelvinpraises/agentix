import cron from "node-cron";

import { db } from "@/infrastructure/database/turso-connection";
import { userTradingQueue } from "@/infrastructure/queues/config";

const tradeCycler = {
  async start() {
    console.log("[trade-cycler-cron] Starting trade cycler...");

    await this.cleanAllQueues();

    // This job ensures all sectors have their trading cycle scheduled.
    cron.schedule("*/5 * * * *", async () => {
      console.log("[trade-cycler-cron] Running sector scheduling job...");
      await this.scheduleSectorTradingJobs();
    });

    // Initial run on startup
    await this.scheduleSectorTradingJobs();
  },

  async cleanAllQueues() {
    console.log("🧹 [trade-cycler-cron] Cleaning all queues...");
    await Promise.all([
      userTradingQueue.clean(0, Infinity, "completed"),
      userTradingQueue.clean(0, Infinity, "wait"),
      userTradingQueue.clean(0, Infinity, "active"),
      userTradingQueue.clean(0, Infinity, "paused"),
      userTradingQueue.clean(0, Infinity, "prioritized"),
      userTradingQueue.clean(0, Infinity, "delayed"),
      userTradingQueue.clean(0, Infinity, "failed"),
    ]);
    console.log("[trade-cycler-cron] Queues cleaned.");
  },

  async scheduleSectorTradingJobs() {
    try {
      // 1. Fetch all sectors with their active policies
      const sectorsWithPolicies = await db
        .selectFrom("sectors")
        .innerJoin("sector_policies", "sector_policies.sector_id", "sectors.id")
        .where("sector_policies.is_active", "=", true)
        .select([
          "sectors.id as sector_id",
          "sectors.user_id",
          "sectors.name as sector_name",
          "sectors.type as sector_type",
          "sector_policies.policy_document",
          "sector_policies.id as policy_id",
        ])
        .execute();

      const activeSectorIds = new Set(sectorsWithPolicies.map((s) => s.sector_id));

      // 2. Fetch all job schedulers and map them by sector ID
      const jobSchedulers = await userTradingQueue.getJobSchedulers();
      const jobMap = new Map<number, (typeof jobSchedulers)[0]>();
      for (const job of jobSchedulers) {
        if (job.id && job.id.startsWith("sector-trade-cycle-")) {
          const sectorId = parseInt(job.id.split("-")[3], 10);
          if (!isNaN(sectorId)) {
            jobMap.set(sectorId, job);
          }
        }
      }

      // 3. Remove jobs for sectors that are no longer active or have no policy
      for (const [sectorId, job] of jobMap.entries()) {
        if (!activeSectorIds.has(sectorId)) {
          if (job.id) {
            await userTradingQueue.removeJobScheduler(job.id);
            console.log(`[trade-cycler-cron] Removed stale job for sector ${sectorId}.`);
          }
        }
      }

      let upsertedCount = 0;

      // 4. Schedule or update jobs for active sectors
      for (const sector of sectorsWithPolicies) {
        if (!sector.policy_document?.trading_preferences) {
          continue; // Skip sectors without trading preferences
        }

        const { frequency_minutes } = sector.policy_document.trading_preferences;
        if (!frequency_minutes) {
          console.warn(
            `[trade-cycler-cron] Sector ${sector.sector_id} (${sector.sector_name}) policy has no frequency_minutes. Skipping.`
          );
          continue;
        }

        const schedulerId = `sector-trade-cycle-${sector.sector_id}`;
        const newInterval = frequency_minutes * 60 * 1000;

        await userTradingQueue.upsertJobScheduler(
          schedulerId,
          { every: newInterval },
          {
            name: "sector-trade-cycle",
            data: {
              sectorId: sector.sector_id,
              userId: sector.user_id,
              sectorName: sector.sector_name,
              sectorType: sector.sector_type,
            },
          }
        );
        upsertedCount++;
      }

      if (upsertedCount > 0) {
        console.log(
          `[trade-cycler-cron] Upserted ${upsertedCount} sector trading schedulers.`
        );
      } else {
        console.log("[trade-cycler-cron] All sector trading jobs are up to date.");
      }
    } catch (error) {
      console.error("[trade-cycler-cron] Error scheduling sector trading jobs:", error);
    }
  },
};

export default tradeCycler;
