import { Worker } from "bullmq";
import path from "path";

import { strategyQueue } from "@/config/queue-config";

const processorPath = path.join(__dirname, "strategy-processor.js");

const worker = new Worker("strategy-queue", processorPath, {
  connection: strategyQueue.opts.connection,
  concurrency: 150,
  useWorkerThreads: true,
});

worker.on("completed", (job) => {
  console.log(`[strategy-queue] Job ${job.id} has completed.`);
});

worker.on("failed", (job, err) => {
  if (job) {
    console.error(
      `[strategy-queue] Job ${job.id} (${job.name}) failed with error: ${err.message}`,
      { stack: err.stack, data: job.data }
    );
  } else {
    console.error(`[strategy-queue] An unknown job failed with error: ${err.message}`, {
      stack: err.stack,
    });
  }
});
