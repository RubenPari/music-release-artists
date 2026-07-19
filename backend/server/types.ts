import type { Hono } from "hono";
import type { SessionUser } from "./session";

export type AppVariables = { user: SessionUser };
export type AppHono = Hono<{ Variables: AppVariables }>;
