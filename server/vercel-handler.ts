import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import app, { runStartupTasks } from "./app";

// Run DB setup on cold start (non-blocking)
const ready = runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;

  // Vercel rewrites strip the original URL. We pass the captured path via
  // a __path query parameter in vercel.json:
  //   { "source": "/api/:path*", "destination": "/api?__path=:path*" }
  //
  // Reconstruct the real URL so Express routing works correctly.
  try {
    const parsed = new URL(req.url || "/", "http://localhost");
    const capturedPath = parsed.searchParams.get("__path");
    if (capturedPath) {
      // Remove __path from the query string before forwarding
      parsed.searchParams.delete("__path");
      const qs = parsed.searchParams.toString();
      req.url = `/api/${capturedPath}${qs ? `?${qs}` : ""}`;
    }
  } catch {
    // If URL parsing fails, leave req.url as-is
  }

  console.log("[Handler] final req.url:", req.url, "| method:", req.method);

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
