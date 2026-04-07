import type { IncomingMessage, ServerResponse } from "http";
import app, { runStartupTasks } from "./app";

// Run DB setup on cold start (non-blocking)
const ready = runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;
  // Let Express handle the request/response cycle
  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
