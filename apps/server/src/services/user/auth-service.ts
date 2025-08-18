import { db } from "@/infrastructure/database/turso-connection";
import { NewUser, UserUpdate } from "@/models/User";

export const authService = {
  async createUser(user: NewUser) {
    return await db
      .insertInto("users")
      .values(user)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async findUserByEmail(email: string) {
    return await db
      .selectFrom("users")
      .where("email", "=", email)
      .selectAll()
      .executeTakeFirst();
  },

  async updateUser(id: number, userUpdate: UserUpdate) {
    return await db.updateTable("users").set(userUpdate).where("id", "=", id).execute();
  },
};
