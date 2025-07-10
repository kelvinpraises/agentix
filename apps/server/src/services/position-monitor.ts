import { db } from "@/database/turso-connection";
import { notificationService } from "@/services/notification-service";

export const positionMonitorService = {
  async checkPositions() {
    const openPositions = await db
      .selectFrom('trade_actions')
      .where('status', '=', 'APPROVED')
      .selectAll()
      .execute()

    for (const position of openPositions) {
      // This is a placeholder for the actual position monitoring logic.
      // In a real application, this would fetch the current price of the asset and compare it to the stop-loss and take-profit levels.
      const currentPrice = 0; // Fetch the current price
      const stopLossPrice = 0; // Calculate the stop-loss price
      const takeProfitPrice = 0; // Calculate the take-profit price

      if (currentPrice <= stopLossPrice) {
        await notificationService.sendExitNotification(position.user_id, {
          position,
          reason: "stop_loss",
        });
      } else if (currentPrice >= takeProfitPrice) {
        await notificationService.sendExitNotification(position.user_id, {
          position,
          reason: "take_profit",
        });
      }
    }
  },
};
