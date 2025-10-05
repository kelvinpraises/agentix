import { describe, test, expect } from "vitest";
import { createConfigHash } from "@/utils/threads";
import { ThreadConfig } from "@/types/threads";

describe("Thread Utils", () => {
  describe("createConfigHash", () => {
    test("generates consistent hash for same config", () => {
      const providerId = "test-provider";
      const config: ThreadConfig = {
        apiKey: "test-key",
        endpoint: "https://api.example.com",
      };

      const hash1 = createConfigHash(providerId, config);
      const hash2 = createConfigHash(providerId, config);

      expect(hash1).toBe(hash2);
    });

    test("generates different hash for different providerId", () => {
      const config: ThreadConfig = {
        apiKey: "test-key",
      };

      const hash1 = createConfigHash("provider-1", config);
      const hash2 = createConfigHash("provider-2", config);

      expect(hash1).not.toBe(hash2);
    });

    test("generates different hash for different config", () => {
      const providerId = "test-provider";
      const config1: ThreadConfig = { apiKey: "key-1" };
      const config2: ThreadConfig = { apiKey: "key-2" };

      const hash1 = createConfigHash(providerId, config1);
      const hash2 = createConfigHash(providerId, config2);

      expect(hash1).not.toBe(hash2);
    });

    test("generates same hash regardless of key order in config", () => {
      const providerId = "test-provider";
      const config1: ThreadConfig = {
        apiKey: "test-key",
        endpoint: "https://api.example.com",
        timeout: 5000,
      };
      const config2: ThreadConfig = {
        timeout: 5000,
        endpoint: "https://api.example.com",
        apiKey: "test-key",
      };

      const hash1 = createConfigHash(providerId, config1);
      const hash2 = createConfigHash(providerId, config2);

      expect(hash1).toBe(hash2);
    });

    test("generates hex string of expected length (SHA256)", () => {
      const hash = createConfigHash("test", {});

      // SHA256 produces 64 character hex string
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test("handles empty config", () => {
      const hash1 = createConfigHash("provider", {});
      const hash2 = createConfigHash("provider", {});

      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
    });

    test("handles nested objects in config", () => {
      const config: ThreadConfig = {
        nested: {
          deep: {
            value: "test",
          },
        },
      };

      const hash1 = createConfigHash("provider", config);
      const hash2 = createConfigHash("provider", config);

      expect(hash1).toBe(hash2);
    });
  });
});
