import { db } from "@/database/turso-connection";
import { UserUpdate } from "@/models/User";

export const profileService = {
  async getUserProfile(userId: number) {
    return await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();
  },

  async updateUserProfile(userId: number, userUpdate: UserUpdate) {
    return await db.updateTable("users").set(userUpdate).where("id", "=", userId).execute();
  },
};
