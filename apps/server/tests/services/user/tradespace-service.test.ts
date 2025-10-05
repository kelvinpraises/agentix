import { tradespaceService } from "@/services/user/tradespace-service";
import { beforeEach, describe, expect, test, vi } from "vitest";

type MockDb = {
  selectFrom: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  insertInto: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returningAll: ReturnType<typeof vi.fn>;
  updateTable: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  deleteFrom: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  fn: {
    max: ReturnType<typeof vi.fn>;
  };
};

// Mock the database module
vi.mock("@/infrastructure/database/turso-connection", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    deleteFrom: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
    executeTakeFirstOrThrow: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    fn: {
      max: vi.fn().mockReturnValue({
        as: vi.fn().mockReturnThis(),
      }),
    },
  } as MockDb,
}));

// Mock the wallet service
vi.mock("@/services/system/wallet/wallet-service", () => ({
  walletService: {
    generateWallet: vi.fn().mockResolvedValue({
      address: "0xMOCK_WALLET_ADDRESS",
      publicKey: "MOCK_PUBLIC_KEY",
    }),
  },
}));

// Import the mocked db AFTER the mock setup
import { db } from "@/infrastructure/database/turso-connection";
import { walletService } from "@/services/system/wallet/wallet-service";

// Cast the imported db to our mock type
const mockDb = db as unknown as MockDb;

describe("Tradespace Service", () => {
  let userId: number;

  beforeEach(() => {
    vi.clearAllMocks();
    userId = 1;
  });

  describe("Sector Operations", () => {
    test("createSector should create a new sector", async () => {
      const sectorData = {
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: "{}",
      };
      const expectedSector = { ...sectorData, user_id: userId, id: 1 };

      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedSector);

      const result = await tradespaceService.createSector(userId, sectorData);

      expect(mockDb.insertInto).toHaveBeenCalledWith("sectors");
      expect(mockDb.values).toHaveBeenCalledWith({ ...sectorData, user_id: userId });
      expect(result).toEqual(expectedSector);
    });

    test("getSectorById should retrieve a specific sector for a user", async () => {
      const sector = {
        id: 1,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
      };
      mockDb.executeTakeFirst.mockResolvedValue(sector);

      const result = await tradespaceService.getSectorById(sector.id, userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("sectors");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", sector.id);
      expect(mockDb.where).toHaveBeenCalledWith("user_id", "=", userId);
      expect(result).toEqual(sector);
    });

    test("getSectorById should return undefined for a non-existent sector", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(undefined);

      const result = await tradespaceService.getSectorById(999, userId);

      expect(result).toBeUndefined();
    });

    test("getUserSectors should retrieve all sectors for a user", async () => {
      const sectors = [
        {
          id: 2,
          user_id: userId,
          name: "Sector 2",
          type: "paper_trading" as const,
          settings: null,
        },
        {
          id: 1,
          user_id: userId,
          name: "Sector 1",
          type: "paper_trading" as const,
          settings: null,
        },
      ];
      mockDb.execute.mockResolvedValue(sectors);

      const result = await tradespaceService.getUserSectors(userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("sectors");
      expect(mockDb.where).toHaveBeenCalledWith("user_id", "=", userId);
      expect(mockDb.orderBy).toHaveBeenCalledWith("created_at", "desc");
      expect(result).toEqual(sectors);
    });

    test("updateSector should update an existing sector", async () => {
      const sector = {
        id: 1,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
      };
      const updates = { name: "Updated Sector Name" };
      const expectedSector = { ...sector, ...updates };

      mockDb.executeTakeFirst.mockResolvedValue(sector);
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedSector);

      const result = await tradespaceService.updateSector(sector.id, userId, updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith("sectors");
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(updates));
      expect(result).toEqual(expectedSector);
    });

    test("updateSector should throw an error if sector not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(undefined);
      const updates = { name: "Updated Name" };

      await expect(tradespaceService.updateSector(999, userId, updates)).rejects.toThrow(
        "Sector not found"
      );
    });

    test("deleteSector should remove a sector", async () => {
      const sector = {
        id: 1,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
      };

      mockDb.executeTakeFirst.mockResolvedValue(sector);
      mockDb.execute.mockResolvedValue(undefined);

      await tradespaceService.deleteSector(sector.id, userId);

      expect(mockDb.deleteFrom).toHaveBeenCalledWith("sectors");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", sector.id);
    });

    test("deleteSector should throw an error if sector not found", async () => {
      mockDb.executeTakeFirst.mockResolvedValue(undefined);

      await expect(tradespaceService.deleteSector(999, userId)).rejects.toThrow(
        "Sector not found"
      );
    });
  });

  // ==================== ORB TESTS ====================
  describe("Orb Operations", () => {
    let sectorId: number;
    let sector: any;

    beforeEach(() => {
      sectorId = 1;
      sector = {
        id: sectorId,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
      };
      mockDb.executeTakeFirst.mockResolvedValue(sector);
    });

    test("createOrb should create a new orb", async () => {
      const orbData = {
        sector_id: sectorId,
        name: "Test Orb",
        chain: "ethereum" as const,
        asset_pairs: { "ETH/USDC": 1 },
      };
      const expectedOrb = { ...orbData, id: 1, wallet_address: "0xMOCK_WALLET_ADDRESS" };

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedOrb);

      const result = await tradespaceService.createOrb(userId, orbData);

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(walletService.generateWallet).toHaveBeenCalled();
      expect(mockDb.insertInto).toHaveBeenCalledWith("orbs");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Orb",
          wallet_address: "0xMOCK_WALLET_ADDRESS",
        })
      );
      expect(result).toEqual(expectedOrb);
    });

    test("createOrb should throw error if sector not found", async () => {
      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(undefined);
      const orbData = {
        sector_id: 999,
        name: "Test Orb",
        chain: "ethereum" as const,
        asset_pairs: { "ETH/USDC": 1 },
      };

      await expect(tradespaceService.createOrb(userId, orbData)).rejects.toThrow(
        "Sector not found"
      );
    });

    test("getOrbById should retrieve a specific orb for a user", async () => {
      const orb = {
        id: 1,
        sector_id: sectorId,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        asset_pairs: "{}",
        config_json: "{}",
      };
      mockDb.executeTakeFirst.mockResolvedValue(orb);

      const result = await tradespaceService.getOrbById(orb.id, userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("orbs");
      expect(mockDb.where).toHaveBeenCalledWith("orbs.id", "=", orb.id);
      expect(mockDb.where).toHaveBeenCalledWith("sectors.user_id", "=", userId);
      expect(result).toEqual(orb);
    });

    test("getOrbsBySector should retrieve all orbs for a sector", async () => {
      const orbs = [
        {
          id: 2,
          sector_id: sectorId,
          name: "Orb 2",
          chain: "ethereum" as const,
          wallet_address: "0x124",
          asset_pairs: "{}",
          config_json: "{}",
        },
        {
          id: 1,
          sector_id: sectorId,
          name: "Orb 1",
          chain: "ethereum" as const,
          wallet_address: "0x123",
          asset_pairs: "{}",
          config_json: "{}",
        },
      ];

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.execute.mockResolvedValue(orbs);

      const result = await tradespaceService.getOrbsBySector(sectorId, userId);

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(mockDb.selectFrom).toHaveBeenCalledWith("orbs");
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.orderBy).toHaveBeenCalledWith("created_at", "desc");
      expect(result).toEqual(orbs);
    });

    test("getOrbWithThreads should retrieve an orb and its associated threads", async () => {
      const orb = {
        id: 1,
        sector_id: sectorId,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        privy_wallet_id: "privy_id_1",
        asset_pairs: {},
        config_json: {},
        context: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const threads = [
        {
          id: 1,
          orb_id: orb.id,
          type: "dex" as const,
          provider_id: "test",
          enabled: true,
          config_json: {},
        },
      ];

      vi.spyOn(tradespaceService, "getOrbById").mockResolvedValue(orb);
      mockDb.execute.mockResolvedValue(threads);

      const result = await tradespaceService.getOrbWithThreads(orb.id, userId);

      expect(tradespaceService.getOrbById).toHaveBeenCalledWith(orb.id, userId);
      expect(mockDb.selectFrom).toHaveBeenCalledWith("threads");
      expect(mockDb.where).toHaveBeenCalledWith("orb_id", "=", orb.id);
      expect(result).toEqual({ ...orb, threads });
    });

    test("updateOrb should update an existing orb", async () => {
      const orb = {
        id: 1,
        sector_id: sectorId,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        asset_pairs: "{}",
        config_json: "{}",
      };
      const updates = { name: "Updated Orb Name" };
      const expectedOrb = { ...orb, ...updates };

      mockDb.executeTakeFirst.mockResolvedValue(orb);
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedOrb);

      const result = await tradespaceService.updateOrb(orb.id, userId, updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith("orbs");
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(updates));
      expect(result).toEqual(expectedOrb);
    });

    test("deleteOrb should remove an orb", async () => {
      const orb = {
        id: 1,
        sector_id: sectorId,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        asset_pairs: "{}",
        config_json: "{}",
      };

      mockDb.executeTakeFirst.mockResolvedValue(orb);
      mockDb.execute.mockResolvedValue(undefined);

      await tradespaceService.deleteOrb(orb.id, userId);

      expect(mockDb.deleteFrom).toHaveBeenCalledWith("orbs");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", orb.id);
    });
  });

  // ==================== THREAD TESTS ====================
  describe("Thread Operations", () => {
    let orbId: number;
    let orb: any;

    beforeEach(() => {
      orbId = 1;
      orb = {
        id: orbId,
        sector_id: 1,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        asset_pairs: "{}",
        config_json: "{}",
      };
      mockDb.executeTakeFirst.mockResolvedValue(orb);
    });

    test("createThread should create a new thread", async () => {
      const threadData = {
        orb_id: orbId,
        type: "dex" as const,
        provider: "test-provider",
      };
      const expectedThread = { ...threadData, id: 1 };

      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedThread);

      const result = await tradespaceService.createThread(userId, threadData);

      expect(tradespaceService.getOrbById).toHaveBeenCalledWith(orbId, userId);
      expect(mockDb.insertInto).toHaveBeenCalledWith("threads");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          orb_id: orbId,
          type: "dex",
        })
      );
      expect(result).toEqual(expectedThread);
    });

    test("createThread should throw error if orb not found", async () => {
      vi.spyOn(tradespaceService, "getOrbById").mockResolvedValue(undefined);
      const threadData = {
        orb_id: 999,
        type: "dex" as const,
        provider: "test-provider",
      };

      await expect(tradespaceService.createThread(userId, threadData)).rejects.toThrow(
        "Orb not found"
      );
    });

    test("getThreadById should retrieve a specific thread for a user", async () => {
      const thread = {
        id: 1,
        orb_id: orbId,
        type: "dex" as const,
        provider_id: "test",
        enabled: true,
        config_json: "{}",
      };
      mockDb.executeTakeFirst.mockResolvedValue(thread);

      const result = await tradespaceService.getThreadById(thread.id, userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("threads");
      expect(mockDb.where).toHaveBeenCalledWith("threads.id", "=", thread.id);
      expect(mockDb.where).toHaveBeenCalledWith("sectors.user_id", "=", userId);
      expect(result).toEqual(thread);
    });

    test("getThreadsByOrb should retrieve all threads for an orb", async () => {
      const threads = [
        {
          id: 2,
          orb_id: orbId,
          type: "dex" as const,
          provider_id: "test1",
          enabled: true,
          config_json: "{}",
        },
        {
          id: 1,
          orb_id: orbId,
          type: "bridge" as const,
          provider_id: "test2",
          enabled: true,
          config_json: "{}",
        },
      ];

      vi.spyOn(tradespaceService, "getOrbById").mockResolvedValue(orb);
      mockDb.execute.mockResolvedValue(threads);

      const result = await tradespaceService.getThreadsByOrb(orbId, userId);

      expect(tradespaceService.getOrbById).toHaveBeenCalledWith(orbId, userId);
      expect(mockDb.selectFrom).toHaveBeenCalledWith("threads");
      expect(mockDb.where).toHaveBeenCalledWith("orb_id", "=", orbId);
      expect(mockDb.orderBy).toHaveBeenCalledWith("created_at", "desc");
      expect(result).toEqual(threads);
    });

    test("updateThread should update an existing thread", async () => {
      const thread = {
        id: 1,
        orb_id: orbId,
        type: "dex" as const,
        provider_id: "test",
        enabled: true,
        config_json: "{}",
      };
      const updates = { enabled: false, description: "New description" };
      const expectedThread = { ...thread, ...updates };

      mockDb.executeTakeFirst.mockResolvedValue(thread);
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(expectedThread);

      const result = await tradespaceService.updateThread(thread.id, userId, updates);

      expect(mockDb.updateTable).toHaveBeenCalledWith("threads");
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining(updates));
      expect(result).toEqual(expectedThread);
    });

    test("deleteThread should remove a thread", async () => {
      const thread = {
        id: 1,
        orb_id: orbId,
        type: "dex" as const,
        provider_id: "test",
        enabled: true,
        config_json: "{}",
      };

      mockDb.executeTakeFirst.mockResolvedValue(thread);
      mockDb.execute.mockResolvedValue(undefined);

      await tradespaceService.deleteThread(thread.id, userId);

      expect(mockDb.deleteFrom).toHaveBeenCalledWith("threads");
      expect(mockDb.where).toHaveBeenCalledWith("id", "=", thread.id);
    });
  });

  // ==================== POLICY TESTS ====================
  describe("Policy Operations", () => {
    let sectorId: number;
    let sector: any;

    beforeEach(() => {
      sectorId = 1;
      sector = {
        id: sectorId,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
      };
      mockDb.executeTakeFirst.mockResolvedValue(sector);
    });

    test("createSectorPolicy should create a new policy and deactivate old one", async () => {
      const policyDocument = {
        risk_management: {
          max_position_size_percent: 10,
          stop_loss_percent: 5,
        },
        trading_preferences: {
          frequency_minutes: 60,
        },
        investment_strategy: {
          strategy_type: "balanced_mix" as const,
        },
      };
      const expectedPolicy = { id: 1, sector_id: sectorId, version: 1, is_active: true };

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.executeTakeFirst.mockResolvedValueOnce({ max_version: 0 });
      mockDb.execute.mockResolvedValueOnce(undefined);
      mockDb.executeTakeFirst.mockResolvedValueOnce(expectedPolicy);
      mockDb.execute.mockResolvedValueOnce(undefined);

      const result = await tradespaceService.createSectorPolicy(
        sectorId,
        userId,
        policyDocument
      );

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(mockDb.updateTable).toHaveBeenCalledWith("sector_policies");
      expect(mockDb.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockDb.insertInto).toHaveBeenCalledWith("sector_policies");
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ version: 1, is_active: true })
      );
      expect(result).toEqual(expectedPolicy);
    });

    test("getSectorPolicy should retrieve the active policy", async () => {
      const policy = { id: 1, sector_id: sectorId, version: 1, is_active: true };
      mockDb.executeTakeFirst.mockResolvedValue(policy);

      const result = await tradespaceService.getSectorPolicy(sectorId, userId);

      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.where).toHaveBeenCalledWith("is_active", "=", true);
      expect(result).toEqual(policy);
    });

    test("getSectorPolicyByVersion should retrieve a specific policy version", async () => {
      const policy = { id: 1, sector_id: sectorId, version: 1, is_active: false };

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.executeTakeFirst.mockResolvedValue(policy);

      const result = await tradespaceService.getSectorPolicyByVersion(sectorId, userId, 1);

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.where).toHaveBeenCalledWith("version", "=", 1);
      expect(result).toEqual(policy);
    });

    test("updateSectorPolicy should update the active policy", async () => {
      const policyUpdate = { ai_critique: "New critique" };

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.execute.mockResolvedValue(undefined);

      await tradespaceService.updateSectorPolicy(sectorId, userId, policyUpdate);

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(mockDb.updateTable).toHaveBeenCalledWith("sector_policies");
      expect(mockDb.set).toHaveBeenCalledWith(policyUpdate);
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.where).toHaveBeenCalledWith("is_active", "=", true);
    });

    test("getSectorPolicyHistory should retrieve all policy versions for a sector", async () => {
      const history = [
        { id: 2, version: 2, is_active: true },
        { id: 1, version: 1, is_active: false },
      ];

      vi.spyOn(tradespaceService, "getSectorById").mockResolvedValue(sector);
      mockDb.execute.mockResolvedValue(history);

      const result = await tradespaceService.getSectorPolicyHistory(sectorId, userId);

      expect(tradespaceService.getSectorById).toHaveBeenCalledWith(sectorId, userId);
      expect(mockDb.selectFrom).toHaveBeenCalledWith("sector_policies");
      expect(mockDb.where).toHaveBeenCalledWith("sector_id", "=", sectorId);
      expect(mockDb.orderBy).toHaveBeenCalledWith("version", "desc");
      expect(result).toEqual(history);
    });

    test("activatePolicyVersion should activate a specific policy version", async () => {
      const policy = { id: 2, sector_id: sectorId, version: 2, is_active: false };
      const expectedPolicy = { ...policy, is_active: true };

      mockDb.execute.mockResolvedValueOnce(undefined);
      mockDb.execute.mockResolvedValueOnce(undefined);
      mockDb.execute.mockResolvedValueOnce(undefined);
      mockDb.executeTakeFirst.mockResolvedValue(expectedPolicy);

      const result = await tradespaceService.activatePolicyVersion(sectorId, userId, 2);

      expect(mockDb.updateTable).toHaveBeenCalledWith("sector_policies");
      expect(mockDb.set).toHaveBeenCalledWith({ is_active: false });
      expect(mockDb.set).toHaveBeenCalledWith({ is_active: true });
      expect(mockDb.updateTable).toHaveBeenCalledWith("sectors");
      expect(mockDb.set).toHaveBeenCalledWith({ active_policy_version: 2 });
      expect(result).toEqual(expectedPolicy);
    });
  });

  // ==================== COMPLEX QUERY TESTS ====================
  describe("Complex Queries", () => {
    test("getUserTradespace should return the full nested tradespace for a user", async () => {
      const user = {
        id: userId,
        email: "test@example.com",
        password_hash: "hash",
        created_at: new Date(),
        updated_at: null,
      };
      const sector = {
        id: 1,
        user_id: userId,
        name: "Test Sector",
        type: "paper_trading" as const,
        settings: null,
        created_at: new Date(),
      };
      const orb = {
        id: 1,
        sector_id: sector.id,
        name: "Test Orb",
        chain: "ethereum" as const,
        wallet_address: "0x123",
        asset_pairs: "{}",
        config_json: "{}",
      };
      const thread = {
        id: 1,
        orb_id: orb.id,
        type: "dex" as const,
        provider_id: "test",
        enabled: true,
        config_json: "{}",
      };

      mockDb.executeTakeFirst.mockResolvedValue(user);
      vi.spyOn(tradespaceService, "getUserSectors").mockResolvedValue([sector as any]);
      vi.spyOn(tradespaceService, "getOrbsBySector").mockResolvedValue([orb as any]);
      vi.spyOn(tradespaceService, "getThreadsByOrb").mockResolvedValue([thread as any]);

      const result = await tradespaceService.getUserTradespace(userId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(userId);
      expect(result!.sectors).toHaveLength(1);
      expect(result!.sectors[0].id).toBe(sector.id);
      expect(result!.sectors[0].orbs).toHaveLength(1);
      expect(result!.sectors[0].orbs[0].id).toBe(orb.id);
      expect(result!.sectors[0].orbs[0].threads).toHaveLength(1);
      expect(result!.sectors[0].orbs[0].threads[0].id).toBe(thread.id);
    });
  });
});
