import { describe, test, expect, beforeEach, vi } from "vitest";
import { authService } from "@/services/user/auth-service";

type MockDb = {
  insertInto: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returningAll: ReturnType<typeof vi.fn>;
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>;
  selectFrom: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
  updateTable: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
};

vi.mock("@/infrastructure/database/turso-connection", () => ({
  db: {
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    executeTakeFirstOrThrow: vi.fn(),
    selectFrom: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    executeTakeFirst: vi.fn(),
    updateTable: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

import { db } from "@/infrastructure/database/turso-connection";
const mockDb = db as unknown as MockDb;

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    test("should insert and return new user", async () => {
      const mockUser = { id: 1, email: "test@example.com", password_hash: "hash" };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(mockUser);

      const result = await authService.createUser({
        email: "test@example.com",
        password_hash: "hash",
      });

      expect(mockDb.insertInto).toHaveBeenCalledWith("users");
      expect(mockDb.values).toHaveBeenCalledWith({
        email: "test@example.com",
        password_hash: "hash",
      });
      expect(mockDb.returningAll).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    test("should throw an error for duplicate email", async () => {
      const error = new Error("UNIQUE constraint failed: users.email");
      mockDb.executeTakeFirstOrThrow.mockRejectedValue(error);

      await expect(
        authService.createUser({
          email: "test@example.com",
          password_hash: "hash",
        })
      ).rejects.toThrow(error);
    });
  });

  describe("findUserByEmail", () => {
    test("should return user when found", async () => {
      const mockUser = { id: 1, email: "test@example.com", password_hash: "hash" };
      mockDb.executeTakeFirst.mockResolvedValue(mockUser);

      const result = await authService.findUserByEmail("test@example.com");

      expect(mockDb.selectFrom).toHaveBeenCalledWith("users");
      expect(mockDb.where).toHaveBeenCalledWith("email", "=", "test@example.com");
      expect(mockDb.selectAll).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    test("should return undefined when not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(undefined);
      const result = await authService.findUserByEmail("nonexistent@example.com");
      expect(result).toBeUndefined();
    });
  });

  describe("updateUser", () => {
    test("should return a successful update result", async () => {
      const userId = 1;
      const updates = { password_hash: "new_hash" };
      const mockUpdateResult = [{ numUpdatedRows: BigInt(1) }];

      mockDb.execute.mockResolvedValue(mockUpdateResult);

      const result = await authService.updateUser(userId, updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith("users");
      expect(mockDb.set).toHaveBeenCalledWith(updates);
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", userId);
      expect(result).toEqual(mockUpdateResult);
    });

    test("should return an update result with 0 rows affected if user not found", async () => {
      const userId = 999;
      const updates = { password_hash: "new_hash" };
      const mockUpdateResult = [{ numUpdatedRows: BigInt(0) }];

      mockDb.execute.mockResolvedValue(mockUpdateResult);

      const result = await authService.updateUser(userId, updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith("users");
      expect(mockDb.set).toHaveBeenCalledWith(updates);
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", userId);
      expect(result).toEqual(mockUpdateResult);
    });

    test("should handle database errors during update", async () => {
      const userId = 1;
      const updates = { password_hash: "new_hash" };
      const dbError = new Error("Database connection failed");

      mockDb.execute.mockRejectedValue(dbError);

      await expect(authService.updateUser(userId, updates)).rejects.toThrow(dbError);
    });
  });
});
