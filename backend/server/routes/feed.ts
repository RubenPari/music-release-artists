import { requireUser } from "../session";
import { loadReleases } from "../services/releases";
import type { AppHono } from "../types";

export function registerFeedRoutes(app: AppHono): void {
  app.get("/feed/releases", async (c) => {
    const auth = await requireUser(c);
    const releases = await loadReleases(auth.userID, {
      types: c.req.query("types"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
    return c.json({ releases });
  });

  app.get("/feed/calendar", async (c) => {
    const auth = await requireUser(c);
    const releases = await loadReleases(auth.userID, {
      types: c.req.query("types"),
      from: c.req.query("from"),
      to: c.req.query("to"),
    });
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
