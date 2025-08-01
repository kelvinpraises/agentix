import { Worker } from "bullmq";
import path from "path";

import { userTradingQueue } from "@/config/queue-config";

const processorPath = path.join(__dirname, "user-trading-processor.js");

const worker = new Worker("user-trading-queue", processorPath, {
  connection: userTradingQueue.opts.connection,
  concurrency: 150,
  useWorkerThreads: true,
});

worker.on("completed", (job) => {
  console.log(`[user-trading-queue] Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`[user-trading-queue] Job ${job?.id} has failed with ${err.message}`);
});
