import type { IncomingMessage, ServerResponse } from "http";
import app, { runStartupTasks } from "./app";

// Kick off DB setup immediately on cold start — but DON'T block requests on it.
// Vercel functions timeout at 10s (hobby) / 60s (pro). A slow TiDB cold-start
// used to block `await ready`, causing the function to be killed → empty body.
let _startupRan = false;
function ensureStartup() {
  if (_startupRan) return;
  _startupRan = true;
  runStartupTasks().catch((err) => {
    console.error("[Startup] Failed:", err);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Fire startup in background — don't wait for it.
  ensureStartup();

  console.log("[Handler] method:", req.method, "url:", req.url);

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
