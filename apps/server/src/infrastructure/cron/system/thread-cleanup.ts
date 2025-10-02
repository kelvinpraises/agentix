import cron from "node-cron";

import { threadService } from "@/services/system/threads/thread-service";

const threadCleanup = {
  start() {
    cron.schedule("*/5 * * * *", () => {
      console.log("[thread-cleanup-cron] Triggering scheduled cleanup of thread MCPs...");
      threadService.cleanupUnusedThreads().catch((err) => {
        console.error("[thread-cleanup-cron] Error during scheduled thread cleanup:", err);
      });
    });
  },
};

export default threadCleanup;
