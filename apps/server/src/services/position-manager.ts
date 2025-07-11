import { db } from "@/database/turso-connection";
import { sendTradeProposal } from "@/services/notification-service";
import { TradeExecutionContent } from "@/types/journal";

function isTradeExecutionContent(obj: any): obj is TradeExecutionContent {
  return (
    obj &&
    obj.contentType === "TRADE_EXECUTION" &&
    typeof obj.trade_details === "object" &&
    obj.trade_details !== null &&
    "proposalType" in obj.trade_details
  );
}

export const positionManagerService = {
  async checkPositions() {
    const activeTradeActions = await db
      .selectFrom("trade_actions")
      .where("is_active", "=", true)
      .where("status", "=", "APPROVED")
      .selectAll()
      .execute();

    for (const action of activeTradeActions) {
      const latestExecutionEntry = await db
        .selectFrom("journal_entries")
        .where("trade_action_id", "=", action.id)
        .where("type", "=", "TRADE_EXECUTION")
        .orderBy("created_at", "desc")
        .select(["id", "content"])
        .executeTakeFirst();

      if (!latestExecutionEntry?.content) continue;

      try {
        const content = latestExecutionEntry.content;

        if (
          isTradeExecutionContent(content) &&
          content.trade_details.proposalType === "ENTER_POSITION"
        ) {
          const { stopLossPrice, takeProfitPrice } = content.trade_details;

          if (stopLossPrice === undefined && takeProfitPrice === undefined) {
            continue;
          }

          const currentPrice = 0; // TODO: Fetch the current price

          if (stopLossPrice !== undefined && currentPrice <= stopLossPrice) {
            console.log(`[PositionMonitor] Stop loss triggered for trade ${action.id}`);
            await sendTradeProposal(
              action.user_id,
              action.id,
              latestExecutionEntry.id,
              "EXIT_POSITION"
            );
          } else if (takeProfitPrice !== undefined && currentPrice >= takeProfitPrice) {
            console.log(`[PositionMonitor] Take profit triggered for trade ${action.id}`);
            await sendTradeProposal(
              action.user_id,
              action.id,
              latestExecutionEntry.id,
              "EXIT_POSITION"
            );
          }
        }
      } catch (error) {
        console.error(
          `[PositionMonitor] Error parsing journal entry content for trade action ${action.id}:`,
          error
        );
      }
    }
  },
};
