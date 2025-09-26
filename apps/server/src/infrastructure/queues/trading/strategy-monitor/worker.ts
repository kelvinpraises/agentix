import { Worker } from "bullmq";
import path from "path";

import { strategyQueue } from "@/infrastructure/queues/config";

// TODO: Update the path to the processor file if necessary
const processorPath = path.join(__dirname, "processor.js");

const worker = new Worker("strategy-monitor-queue", processorPath, {
  connection: strategyQueue.opts.connection,
  concurrency: 150,
  useWorkerThreads: true,
});

worker.on("completed", (job) => {
  console.log(`[strategy-monitor-queue] Job ${job.id} has completed.`);
});

worker.on("failed", (job, err) => {
  if (job) {
    console.error(
      `[strategy-monitor-queue] Job ${job.id} (${job.name}) failed with error: ${err.message}`,
      { stack: err.stack, data: job.data }
    );
  } else {
    console.error(
      `[strategy-monitor-queue] An unknown job failed with error: ${err.message}`,
      {
        stack: err.stack,
      }
    );
  }
});
