import type { Hono } from "hono";

export type AppVariables = { userId: string };
export type AppHono = Hono<{ Variables: AppVariables }>;
