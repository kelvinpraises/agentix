import { db } from "@/infrastructure/database/turso-connection";

import { PositionEnteredContent } from "@/types/journal";

export const portfolioService = {
  async getPortfolioSnapshots(sectorId: number) {
    return await db
      .selectFrom("portfolio_snapshots")
      .where("sector_id", "=", sectorId)
      .orderBy("snapshot_date", "desc")
      .selectAll()
      .execute();
  },

  async getWalletBalances(userId: number) {
    // TODO: Implement wallet balance fetching from on-chain data
    // This should fetch real-time balances from all orb wallets for the user
    console.log(`TODO: Fetching wallet balances for user ${userId}...`);
    return [];
  },

  async getOpenPositions(sectorId: number) {
    console.log(`Fetching open positions for sector ${sectorId}...`);

    // This query joins journal entries with their parent trade actions
    // to ensure we only fetch details for trades that are currently in an open state.
    const openTradeEntries = await db
      .selectFrom("journal_entries as je")
      .innerJoin("trade_actions as ta", "je.trade_action_id", "ta.id")
      .where("je.sector_id", "=", sectorId)
      .where("je.type", "=", "POSITION_ENTERED")
      .where("ta.status", "in", ["ANALYZING", "EXECUTING"])
      .select([
        "je.id",
        "je.trade_action_id",
        "je.content",
        "je.created_at",
        "ta.status as trade_status", // Select the definitive status from the parent table
      ])
      .execute();

    const openPositions = openTradeEntries
      .map((entry) => {
        const content = entry.content as PositionEnteredContent;

        // Parse trading pair into base/quote
        const [base, quote] = content.trading_pair.split("/");

        return {
          journalId: entry.id,
          tradeActionId: entry.trade_action_id,
          tradingPair: content.trading_pair,
          baseAsset: base,
          quoteAsset: quote,
          amount: parseFloat(content.amount),
          side: "buy", // Position entered implies a 'buy' action
          status: entry.trade_status, // Use the status from the trade_actions table
          dex: content.dex,
          chain: content.chain,
          transactionHash: content.transaction_hash,
          createdAt: entry.created_at,
        };
      })
      .filter(Boolean); // Filter out any nulls

    return openPositions;
  },
};
