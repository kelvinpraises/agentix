import { db } from "@/infrastructure/database/turso-connection";
import { JournalEntryContent, TradeExecutionContent } from "@/types/journal";

export const portfolioService = {
  async getPortfolioSnapshots(userId: number) {
    return await db
      .selectFrom("portfolio_snapshots")
      .where("user_id", "=", userId)
      .orderBy("snapshot_date", "desc")
      .selectAll()
      .execute();
  },

  async getWalletBalances(userId: number) {
    // TODO: Replace with actual wallet balance fetching logic
    console.log(`Fetching wallet balances for user ${userId}...`);
    return {
      USD: 10000,
      ETH: 5,
      BTC: 0.5,
    };
  },

  async getOpenPositions(userId: number) {
    console.log(`Fetching open positions for user ${userId}...`);

    // This query joins journal entries with their parent trade actions
    // to ensure we only fetch details for trades that are currently in an open state.
    const openTradeEntries = await db
      .selectFrom("journal_entries as je")
      .innerJoin("trade_actions as ta", "je.trade_action_id", "ta.id")
      .where("je.user_id", "=", userId)
      .where("je.type", "=", "TRADE_EXECUTION")
      .where("ta.status", "in", [
        "ANALYZING",
        "PENDING_USER_ACTION",
        "APPROVED",
        "EXECUTING",
      ])
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
        const content = entry.content;

        if (content.contentType !== "TRADE_EXECUTION") {
          return null;
        }

        const tradeContent = content as TradeExecutionContent;
        const proposal = tradeContent.trade_details;

        if (proposal.proposalType !== "ENTER_POSITION") {
          return null;
        }

        return {
          journalId: entry.id,
          tradeActionId: entry.trade_action_id,
          symbol: proposal.pair,
          amount: parseFloat(proposal.amount),
          side: "buy", // EnterPositionProposal implies a 'buy' action
          status: entry.trade_status, // Use the status from the trade_actions table
          strategy: proposal.strategy,
          dex: proposal.dex,
          chain: proposal.chain,
          entryPrice: proposal.stopLossPrice, // Assuming stopLossPrice can be entry price contextually
          createdAt: entry.created_at,
        };
      })
      .filter(Boolean); // Filter out any nulls

    return openPositions;
  },
};
