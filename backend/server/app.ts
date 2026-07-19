import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "../lib/config";
import { AuthError, authMiddleware } from "./session";
import { registerAuthRoutes } from "./routes/auth";
import { registerFeedRoutes } from "./routes/feed";
import { registerHealthRoutes } from "./routes/health";
import { registerNotificationsRoutes } from "./routes/notifications";
import { registerProfileRoutes } from "./routes/profile";
import { registerSyncRoutes } from "./routes/sync";
import type { AppVariables } from "./types";

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(
    "*",
    cors({
      origin: config.frontendOrigin(),
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    }),
  );

  app.onError((err, c) => {
    if (err instanceof AuthError) {
      return c.json({ message: err.message, code: "unauthenticated" }, 401);
    }
    console.error(err);
    return c.json(
      {
        message: err instanceof Error ? err.message : "errore interno",
        code: "internal",
      },
      500,
    );
  });

  app.use("/sync/*", authMiddleware);
  app.use("/feed/*", authMiddleware);
  app.use("/profile", authMiddleware);
  app.use("/profile/*", authMiddleware);
  app.use("/auth/me", authMiddleware);

  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerSyncRoutes(app);
  registerFeedRoutes(app);
  registerProfileRoutes(app);
  registerNotificationsRoutes(app);

  return app;
}
