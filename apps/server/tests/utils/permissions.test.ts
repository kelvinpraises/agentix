import { describe, test, expect } from "vitest";
import {
  parsePermission,
  isNetworkStoragePermission,
  isIsolatedStoragePermission,
  isWalletPermission,
  validatePermission,
} from "@/utils/permissions";

describe("Permissions Utils", () => {
  describe("parsePermission", () => {
    test("parses storage::isolated permission", () => {
      const result = parsePermission("storage::isolated");
      expect(result).toEqual({
        resource: "storage",
        scope: "isolated",
        identifier: undefined,
      });
    });

    test("parses storage::network::ethereum permission", () => {
      const result = parsePermission("storage::network::ethereum");
      expect(result).toEqual({
        resource: "storage",
        scope: "network",
        identifier: "ethereum",
      });
    });

    test("parses wallet::read permission", () => {
      const result = parsePermission("wallet::read");
      expect(result).toEqual({
        resource: "wallet",
        scope: "read",
        identifier: undefined,
      });
    });

    test("parses wallet::sign permission", () => {
      const result = parsePermission("wallet::sign");
      expect(result).toEqual({
        resource: "wallet",
        scope: "sign",
        identifier: undefined,
      });
    });
  });

  describe("isNetworkStoragePermission", () => {
    test("returns true for network storage permission", () => {
      expect(isNetworkStoragePermission("storage::network::ethereum")).toBe(true);
      expect(isNetworkStoragePermission("storage::network::solana")).toBe(true);
    });

    test("returns false for isolated storage permission", () => {
      expect(isNetworkStoragePermission("storage::isolated")).toBe(false);
    });

    test("returns false for wallet permission", () => {
      expect(isNetworkStoragePermission("wallet::read")).toBe(false);
      expect(isNetworkStoragePermission("wallet::sign")).toBe(false);
    });
  });

  describe("isIsolatedStoragePermission", () => {
    test("returns true for isolated storage permission", () => {
      expect(isIsolatedStoragePermission("storage::isolated")).toBe(true);
    });

    test("returns false for network storage permission", () => {
      expect(isIsolatedStoragePermission("storage::network::ethereum")).toBe(false);
    });

    test("returns false for wallet permission", () => {
      expect(isIsolatedStoragePermission("wallet::read")).toBe(false);
    });
  });

  describe("isWalletPermission", () => {
    test("returns true for wallet permissions", () => {
      expect(isWalletPermission("wallet::read")).toBe(true);
      expect(isWalletPermission("wallet::sign")).toBe(true);
    });

    test("returns false for storage permissions", () => {
      expect(isWalletPermission("storage::isolated")).toBe(false);
      expect(isWalletPermission("storage::network::ethereum")).toBe(false);
    });
  });

  describe("validatePermission", () => {
    test("validates correct isolated storage permission", () => {
      expect(validatePermission("storage::isolated")).toBe(true);
    });

    test("validates correct network storage permission", () => {
      expect(validatePermission("storage::network::ethereum")).toBe(true);
      expect(validatePermission("storage::network::solana")).toBe(true);
    });

    test("validates correct wallet permissions", () => {
      expect(validatePermission("wallet::read")).toBe(true);
      expect(validatePermission("wallet::sign")).toBe(true);
    });

    test("rejects invalid wallet scopes", () => {
      expect(validatePermission("wallet::invalid")).toBe(false);
      expect(validatePermission("wallet::write")).toBe(false);
    });

    test("rejects storage::isolated with identifier", () => {
      expect(validatePermission("storage::isolated::ethereum")).toBe(false);
    });

    test("rejects storage::network without identifier", () => {
      expect(validatePermission("storage::network")).toBe(false);
    });

    test("rejects permissions with too few parts", () => {
      expect(validatePermission("storage")).toBe(false);
      expect(validatePermission("wallet")).toBe(false);
    });

    test("rejects permissions with too many parts", () => {
      expect(validatePermission("storage::network::ethereum::extra")).toBe(false);
      expect(validatePermission("wallet::read::extra")).toBe(false);
    });

    test("rejects unknown resource types", () => {
      expect(validatePermission("unknown::scope")).toBe(false);
    });
  });
});