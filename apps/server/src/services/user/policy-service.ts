import { db } from "@/database/turso-connection";
import { PolicyUpdate } from "@/models/Policy";

export const policyService = {
  async getUserPolicy(userId: number) {
    return await db
      .selectFrom("user_policies")
      .where("user_id", "=", userId)
      .selectAll()
      .executeTakeFirst();
  },

  async updateUserPolicy(userId: number, policyUpdate: PolicyUpdate) {
    return await db
      .updateTable("user_policies")
      .set(policyUpdate)
      .where("user_id", "=", userId)
      .execute();
  },
};
