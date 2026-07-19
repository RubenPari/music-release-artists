import type { Context } from "hono";
import { loadReleases } from "../services/releases";
import type { AppHono } from "../types";

function readFeedParams(c: Context): {
  types?: string;
  from?: string;
  to?: string;
} {
  return {
    types: c.req.query("types"),
    from: c.req.query("from"),
    to: c.req.query("to"),
  };
}

export function registerFeedRoutes(app: AppHono): void {
  app.get("/feed/releases", async (c) => {
    const auth = c.get("user");
    const releases = await loadReleases(auth.userID, readFeedParams(c));
    return c.json({ releases });
  });

  app.get("/feed/calendar", async (c) => {
    const auth = c.get("user");
    const releases = await loadReleases(auth.userID, readFeedParams(c));
    const map = new Map<string, typeof releases>();
    for (const rel of releases) {
      const list = map.get(rel.releaseDate) || [];
      list.push(rel);
      map.set(rel.releaseDate, list);
    }
    const days = [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, releases: items }));
    return c.json({ days });
  });
}
