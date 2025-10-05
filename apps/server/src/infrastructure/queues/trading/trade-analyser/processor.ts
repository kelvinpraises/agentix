import { SandboxedJob } from "bullmq";

import { db } from "@/infrastructure/database/turso-connection";
import { neuralAgent } from "@/interfaces/neural";
import { portfolioService } from "@/services/trading/portfolio-service";
import { SectorContext } from "@/types/sector";

/**
 * This is the sandboxed processor for the sector trading queue.
 * It runs in a separate process to avoid blocking the main event loop.
 *
 * @param job The job from the sector trading queue, containing sector context.
 */
module.exports = async (job: SandboxedJob) => {
  const { sectorId, userId, sectorName } = job.data;
  console.log(
    `[trade-analyser-queue] Processing job for sector ${sectorId} (${sectorName}) - user ${userId}`
  );

  try {
    // 1. Fetch sector's full context including user, policy, and orbs
    const user = await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const sector = await db
      .selectFrom("sectors")
      .where("id", "=", sectorId)
      .selectAll()
      .executeTakeFirst();
    if (!sector) {
      throw new Error(`Sector with ID ${sectorId} not found.`);
    }

    const policy = await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();
    if (!policy) {
      console.warn(
        `[trade-analyser-queue] No active policy for sector ${sectorId} (${sectorName}). Skipping.`
      );
      return;
    }

    // Fetch all orbs for this sector
    const orbs = await db
      .selectFrom("orbs")
      .where("sector_id", "=", sectorId)
      .selectAll()
      .execute();

    // Fetch threads for each orb
    const orbsWithThreads = await Promise.all(
      orbs.map(async (orb) => {
        const threads = await db
          .selectFrom("threads")
          .where("orb_id", "=", orb.id)
          .where("enabled", "=", true)
          .selectAll()
          .execute();
        return { ...orb, threads };
      })
    );

    const walletBalances = await portfolioService.getWalletBalances(userId);
    const openPositions = await portfolioService.getOpenPositions(userId);

    const sectorContext: SectorContext = {
      sectorId: sector.id,
      sectorName: sector.name,
      sectorType: sector.type,
      policy: policy.policy_document,
      orbs: orbsWithThreads.map((orb) => ({
        id: orb.id,
        name: orb.name,
        chain: orb.chain,
        context: orb.context,
        assetPairs: orb.asset_pairs,
        threads: orb.threads.map((t) => ({
          type: t.type,
          providerId: t.provider_id,
          description: t.description,
          config: t.config_json,
        })),
      })),
      walletBalances,
      openPositions,
    };

    await neuralAgent.runAnalysis(sectorContext);

    console.log(
      `[trade-analyser-queue] Successfully processed job for sector ${sectorId} (${sectorName})`
    );
  } catch (error) {
    console.error(
      `[trade-analyser-queue] Failed to process job for sector ${sectorId} (${sectorName}):`,
      error
    );
    // The job will be retried automatically based on the queue's default options
    throw error;
  }
};
