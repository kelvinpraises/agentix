import { threadService } from "@/services/system/threads/thread-service";
import { ThreadConfig } from "@/types/threads";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { ChildProcess } from "child_process";

vi.mock("@/constants/thread-registry", () => ({
  threadRegistry: [
    {
      id: "test-provider",
      source: "test-fixture://worker.js",
      type: "module",
      threadType: "dex",
      permissions: ["storage::isolated", "wallet::read"],
    },
  ],
}));

vi.mock("ky", () => ({
  default: {
    get: vi.fn((url: string) => ({
      text: async () => {
        if (url === "test-fixture://worker.js") {
          return `export default {
            async fetch(request, env, ctx) {
              const storagePing = env.storage.ping()
              const walletPing = env.wallet.ping()
              const res =  \`Test worker \n\n\${storagePing} \n\${walletPing}\`;
              return new Response(res);
            }
          };`;
        }
        throw new Error(`Unexpected URL: ${url}`);
      },
    })),
  },
}));

const createdProcesses: ChildProcess[] = [];
const createdDirs: string[] = [];

describe("Thread Service", () => {
  const orbId = 1;
  const sectorId = 1;
  const chain = "ethereum";
  const providerId = "test-provider";
  const config: ThreadConfig = { setting: "test" };

  beforeEach(() => {
    createdProcesses.length = 0;
    createdDirs.length = 0;
  });

  afterEach(async () => {
    // Kill all spawned processes
    for (const proc of createdProcesses) {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
    }

    // Clean up all created directories
    for (const dir of createdDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (e) {
        // Directory might already be cleaned up
      }
    }

    // Clean up any active threads
    await threadService.cleanupUnusedThreads();
  });

  describe("getOrServeThread", () => {
    test("should create a new worker if one does not exist", async () => {
      const result = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      expect(result.port).toBeTypeOf("number");
      expect(result.port).toBeGreaterThan(0);
    }, 10000);

    test("should reuse an existing worker if one is already active for the same config", async () => {
      const result1 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      const result2 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      expect(result1.port).toBe(result2.port);
    }, 10000);

    test("should create a new worker for a different config", async () => {
      const result1 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      const newConfig = { setting: "new" };
      const result2 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        newConfig
      );

      expect(result1.port).not.toBe(result2.port);
    }, 10000);

    test("should throw an error if provider is not found in registry", async () => {
      const invalidProviderId = "invalid-provider";

      await expect(
        threadService.getOrServeThread(orbId, sectorId, chain, invalidProviderId, config)
      ).rejects.toThrow(
        `[thread-service] Provider '${invalidProviderId}' not found in registry.`
      );
    });

    test("should handle concurrent requests for the same config without race conditions", async () => {
      const results = await Promise.all([
        threadService.getOrServeThread(orbId, sectorId, chain, providerId, config),
        threadService.getOrServeThread(orbId, sectorId, chain, providerId, config),
        threadService.getOrServeThread(orbId, sectorId, chain, providerId, config),
      ]);

      // All should return the same port (no duplicate workers)
      expect(results[0].port).toBe(results[1].port);
      expect(results[1].port).toBe(results[2].port);
    }, 10000);
  });

  describe("cleanupUnusedThreads", () => {
    test("should not terminate a recently used worker", async () => {
      const result = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      // Immediately run cleanup - worker should not be terminated
      await threadService.cleanupUnusedThreads();

      // Verify we can still access the same worker
      const result2 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );
      expect(result.port).toBe(result2.port);
    }, 10000);

    test("should terminate a stale worker and clean up its directory", async () => {
      // Mock Date.now to simulate time passing
      const startTime = Date.now();
      let currentTime = startTime;

      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      await threadService.getOrServeThread(orbId, sectorId, chain, providerId, config);
      const threadServiceDir = path.join(__dirname, "../../../src/services/system/threads");
      const tempDirPattern = path.join(threadServiceDir, "tmp");

      // Fast-forward time by 21 minutes
      currentTime = startTime + 21 * 60 * 1000;

      await threadService.cleanupUnusedThreads();

      // Verify temp directory was cleaned up
      const dirs = await fs.readdir(tempDirPattern).catch(() => []);
      expect(dirs.length).toBe(0);

      // Restore original Date.now
      vi.spyOn(Date, "now").mockRestore();
    }, 10000);

    test("should create a new worker after the old one is cleaned up", async () => {
      const startTime = Date.now();
      let currentTime = startTime;

      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      const result1 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      // Fast-forward time and cleanup
      currentTime = startTime + 21 * 60 * 1000;
      await threadService.cleanupUnusedThreads();

      // Reset time and create new worker
      currentTime = startTime + 22 * 60 * 1000;
      const result2 = await threadService.getOrServeThread(
        orbId,
        sectorId,
        chain,
        providerId,
        config
      );

      // Should get a different port since old worker was cleaned up
      expect(result2.port).not.toBe(result1.port);

      vi.spyOn(Date, "now").mockRestore();
    }, 10000);
  });
});
