import { serve } from "@hono/node-server";
import cron from "node-cron";
import { closePool } from "../db/db";
import { config } from "../lib/config";
import { syncAllUsers } from "../sync/engine";
import {
  processPerReleaseOutbox,
  sendDailyDigests,
} from "../notifications/outbox";
import { createApp } from "./app";

const port = Number(process.env.PORT || 4000);

async function main() {
  const app = createApp();
  const activeJobs = new Set<Promise<void>>();

  const runJob = (name: string, operation: () => Promise<unknown>) => {
    let job: Promise<void>;
    job = operation()
      .then(() => undefined)
      .catch((error) => console.error(`[cron] ${name} error`, error))
      .finally(() => activeJobs.delete(job));
    activeJobs.add(job);
  };

  // Every 8 hours
  const syncTask = cron.schedule("0 */8 * * *", () => {
    console.log("[cron] periodic sync");
    runJob("sync", syncAllUsers);
  });
  const tasks = [syncTask];

  if (config.emailEnabled()) {
    // Daily digest 08:00 UTC
    const digestTask = cron.schedule("0 8 * * *", () => {
      console.log("[cron] daily digest");
      runJob("digest", sendDailyDigests);
    });

    // Hourly outbox drain
    const outboxTask = cron.schedule("15 * * * *", () => {
      console.log("[cron] email outbox");
      runJob("outbox", processPerReleaseOutbox);
    });
    tasks.push(digestTask, outboxTask);
  } else {
    console.log("[cron] email disabled; skipping digest and outbox jobs");
  }

  console.log(`API listening on http://0.0.0.0:${port}`);
  const server = serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    for (const task of tasks) task.stop();

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await Promise.allSettled(activeJobs);
    await closePool();
  };

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void shutdown(signal)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("graceful shutdown failed", error);
          process.exit(1);
        });
    });
  }
}

main().catch((err) => {
  console.error("fatal", err);
  process.exit(1);
});
