import { SandboxedJob } from "bullmq";

import { db } from "@/database/turso-connection";
import { aiAgentService } from "@/services/ai-agent";
import { portfolioService } from "@/services/user/portfolio-service";

/**
 * This is the sandboxed processor for the strategy queue.
 * It runs in a separate process to avoid blocking the main event loop.
 *
 * @param job The job from the strategy queue, containing the tradeActionId.
 */
module.exports = async (job: SandboxedJob) => {
  const { userId } = job.data;
  console.log(`🤖 [user-trading-queue] Processing job for user ${userId}`);

  try {
    // 1. Fetch user's full context
    const user = await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const policy = await db
      .selectFrom("user_policies")
      .where("user_id", "=", userId)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();
    if (!policy) {
      console.warn(
        `⚠️ [user-trading-queue] No active policy for user ${userId}. Skipping.`
      );
      return;
    }

    const walletBalances = await portfolioService.getWalletBalances(userId);
    const openPositions = await portfolioService.getOpenPositions(userId);

    const userContext = {
      userId,
      policy,
      walletBalances,
      openPositions,
    };

    await aiAgentService.runAnalysis(userContext);

    console.log(`✅ [user-trading-queue] Successfully processed job for user ${userId}`);
  } catch (error) {
    console.error(
      `❌ [user-trading-queue] Failed to process job for user ${userId}:`,
      error
    );
    // The job will be retried automatically based on the queue's default options
    throw error;
  }
};
