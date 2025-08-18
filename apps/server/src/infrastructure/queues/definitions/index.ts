import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Important for BullMQ
});

export const userTradingQueue = new Queue("user-trading-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const strategyQueue = new Queue("strategy-queue", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

process.on("SIGINT", async () => {
  await userTradingQueue.close();
  await strategyQueue.close();
  connection.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await userTradingQueue.close();
  await strategyQueue.close();
  connection.quit();
  process.exit(0);
});
