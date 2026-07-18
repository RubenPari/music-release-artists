import { serve } from "@hono/node-server";
import cron from "node-cron";
import { ensureMigrated } from "../db/migrate";
import { syncAllUsers } from "../sync/engine";
import {
  processPerReleaseOutbox,
  sendDailyDigests,
} from "../notifications/outbox";
import { createApp } from "./app";

const port = Number(process.env.PORT || 4000);

async function main() {
  await ensureMigrated();
  const app = createApp();

  // Every 8 hours
  cron.schedule("0 */8 * * *", () => {
    console.log("[cron] periodic sync");
    void syncAllUsers().catch((err) => console.error("[cron] sync error", err));
  });

  // Daily digest 08:00 UTC
  cron.schedule("0 8 * * *", () => {
    console.log("[cron] daily digest");
    void sendDailyDigests().catch((err) =>
      console.error("[cron] digest error", err),
    );
  });

  // Hourly outbox drain
  cron.schedule("15 * * * *", () => {
    console.log("[cron] email outbox");
    void processPerReleaseOutbox().catch((err) =>
      console.error("[cron] outbox error", err),
    );
  });

  console.log(`API listening on http://0.0.0.0:${port}`);
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
}

main().catch((err) => {
  console.error("fatal", err);
  process.exit(1);
});
