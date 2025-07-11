import { db } from "@/database/turso-connection";

export const portfolioService = {
  async getPortfolioSnapshots(userId: number) {
    return await db
      .selectFrom("portfolio_snapshots")
      .where("user_id", "=", userId)
      .orderBy("snapshot_date", "desc")
      .selectAll()
      .execute();
  },
};
