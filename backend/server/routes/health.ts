import { queryOne } from "../../db/db";
import type { AppHono } from "../types";

export function registerHealthRoutes(app: AppHono): void {
  app.get("/health", (c) => c.json({ ok: true }));
  app.get("/health/live", (c) => c.json({ ok: true }));
  app.get("/health/ready", async (c) => {
    await queryOne<{ ready: number }>("SELECT 1 AS ready");
    return c.json({ ok: true, database: "ready" });
  });
}
