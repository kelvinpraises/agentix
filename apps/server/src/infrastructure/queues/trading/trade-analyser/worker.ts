import { Worker } from "bullmq";
import path from "path";

import { userTradingQueue } from "@/infrastructure/queues/config";

// TODO: Update the path to the processor file if necessary
const processorPath = path.join(__dirname, "processor.js");

const worker = new Worker("trade-analyser-queue", processorPath, {
  connection: userTradingQueue.opts.connection,
  concurrency: 150,
  useWorkerThreads: true,
});

worker.on("completed", (job) => {
  console.log(`[trade-analyser-queue] Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`[trade-analyser-queue] Job ${job?.id} has failed with ${err.message}`);
});
