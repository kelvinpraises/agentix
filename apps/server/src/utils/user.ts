import { User } from "@/models/User";

export const sanitizeUser = (user: User): Omit<User, "password_hash"> => {
  const { password_hash, ...sanitizedUser } = user;
  return sanitizedUser;
};
