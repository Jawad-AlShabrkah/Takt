import type { IncomingMessage, ServerResponse } from "http";
import app, { runStartupTasks } from "./app";

// Run DB setup on cold start (non-blocking)
const ready = runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;

  // Debug: log the incoming URL so we can diagnose routing issues
  console.log("[Handler] req.url:", req.url, "| method:", req.method);

  // Vercel rewrites route all /api/* requests to this function.
  // req.url should already contain the original path (e.g. /api/trpc/auth.login).
  // If Vercel strips it (rare), try common recovery headers.
  if (req.url === "/" || req.url === "/api" || req.url === "/api/") {
    const recovered =
      (req.headers["x-matched-path"] as string) ||
      (req.headers["x-forwarded-uri"] as string) ||
      (req.headers["x-original-url"] as string);
    if (recovered && recovered !== req.url) {
      console.log("[Handler] Recovered URL from headers:", recovered);
      req.url = recovered;
    }
  }

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
