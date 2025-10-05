import { describe, test, expect } from "vitest";
import { sanitizeUser } from "@/utils/user";

describe("User Utils", () => {
  describe("sanitizeUser", () => {
    test("should remove the password_hash property from the user object", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        password_hash: "a_very_secret_hash",
      };
      const sanitized = sanitizeUser(user);
      expect(sanitized).not.toHaveProperty("password_hash");
    });

    test("should keep all other properties of the user object", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password_hash: "a_very_secret_hash",
      };
      const sanitized = sanitizeUser(user);
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.name).toBe(user.name);
    });

    test("should return an object without password_hash when it is the only property", () => {
      const user = {
        password_hash: "a_very_secret_hash",
      };
      const sanitized = sanitizeUser(user);
      expect(sanitized).toEqual({});
    });

    test("should handle objects with many properties", () => {
        const user = {
            id: 1,
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
            password_hash: "a_very_secret_hash",
        };
        const sanitized = sanitizeUser(user);
        expect(sanitized).toEqual({
            id: 1,
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd',
        });
    });
  });
});
