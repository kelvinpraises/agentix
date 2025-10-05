import { describe, test, expect } from "vitest";
import { sanitizeOrbForResponse, sanitizeOrbsForResponse } from "@/utils/orb";
import { Orb } from "@/models/Orb";

describe("Orb Utils", () => {
  const mockOrb: Orb = {
    id: 1,
    sector_id: 1,
    name: "Test Orb",
    chain: "ethereum",
    wallet_address: "0x1234567890123456789012345678901234567890",
    privy_wallet_id: "privy_sensitive_wallet_id",
    asset_pairs: JSON.stringify({ "ETH/USDC": 1 }),
    config_json: JSON.stringify({ dex: "uniswap" }),
    context: "Test context",
    created_at: new Date("2025-01-01"),
    updated_at: null,
  };

  describe("sanitizeOrbForResponse", () => {
    test("removes privy_wallet_id from orb", () => {
      const sanitized = sanitizeOrbForResponse(mockOrb);

      expect(sanitized).not.toHaveProperty("privy_wallet_id");
      expect("privy_wallet_id" in sanitized).toBe(false);
    });

    test("preserves all other orb properties", () => {
      const sanitized = sanitizeOrbForResponse(mockOrb);

      expect(sanitized.id).toBe(mockOrb.id);
      expect(sanitized.sector_id).toBe(mockOrb.sector_id);
      expect(sanitized.name).toBe(mockOrb.name);
      expect(sanitized.chain).toBe(mockOrb.chain);
      expect(sanitized.wallet_address).toBe(mockOrb.wallet_address);
      expect(sanitized.asset_pairs).toBe(mockOrb.asset_pairs);
      expect(sanitized.config_json).toBe(mockOrb.config_json);
      expect(sanitized.context).toBe(mockOrb.context);
      expect(sanitized.created_at).toBe(mockOrb.created_at);
      expect(sanitized.updated_at).toBe(mockOrb.updated_at);
    });

    test("handles orb with null values", () => {
      const orbWithNulls: Orb = {
        ...mockOrb,
        context: null,
        updated_at: null,
      };

      const sanitized = sanitizeOrbForResponse(orbWithNulls);

      expect(sanitized.context).toBeNull();
      expect(sanitized.updated_at).toBeNull();
      expect(sanitized).not.toHaveProperty("privy_wallet_id");
    });
  });

  describe("sanitizeOrbsForResponse", () => {
    test("sanitizes array of orbs", () => {
      const orbs: Orb[] = [
        mockOrb,
        { ...mockOrb, id: 2, name: "Orb 2", privy_wallet_id: "privy_id_2" },
        { ...mockOrb, id: 3, name: "Orb 3", privy_wallet_id: "privy_id_3" },
      ];

      const sanitized = sanitizeOrbsForResponse(orbs);

      expect(sanitized).toHaveLength(3);
      sanitized.forEach((orb) => {
        expect(orb).not.toHaveProperty("privy_wallet_id");
      });
    });

    test("handles empty array", () => {
      const sanitized = sanitizeOrbsForResponse([]);

      expect(sanitized).toEqual([]);
      expect(sanitized).toHaveLength(0);
    });

    test("preserves orb data integrity in array", () => {
      const orbs: Orb[] = [mockOrb, { ...mockOrb, id: 2, name: "Orb 2" }];

      const sanitized = sanitizeOrbsForResponse(orbs);

      expect(sanitized[0].id).toBe(1);
      expect(sanitized[0].name).toBe("Test Orb");
      expect(sanitized[1].id).toBe(2);
      expect(sanitized[1].name).toBe("Orb 2");
    });
  });
});
