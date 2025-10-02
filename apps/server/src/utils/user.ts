export const sanitizeUser = <T extends { password_hash: string }>(
  user: T
): Omit<T, "password_hash"> => {
  const { password_hash, ...sanitizedUser } = user;
  return sanitizedUser as Omit<T, "password_hash">;
};
