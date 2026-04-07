import type { IncomingMessage, ServerResponse } from "http";
import app, { runStartupTasks } from "./app";

// Fire DB setup in the background — NEVER block requests on it.
// Previously `await ready` held every request hostage while TiDB cold-started
// (up to 8s), causing Vercel to kill the function and return an empty body.
let _startupFired = false;
function fireStartup() {
  if (_startupFired) return;
  _startupFired = true;
  runStartupTasks().catch((err) => {
    console.error("[Startup]", err);
    _startupFired = false; // allow retry on next request
  });
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  fireStartup();

  // --- Reconstruct the original tRPC URL --------------------------------
  // vercel.json rewrites /api/trpc/:path* → /api?__trpc=:path*
  // We read __trpc from the query string and rebuild the full path so that
  // Express can match the /api/trpc middleware.
  try {
    if (req.url) {
      const qmark = req.url.indexOf("?");
      const qs = qmark === -1 ? "" : req.url.slice(qmark + 1);
      const params = new URLSearchParams(qs);
      const trpcPath = params.get("__trpc");
      if (trpcPath) {
        params.delete("__trpc");
        const remaining = params.toString();
        req.url = `/api/trpc/${trpcPath}${remaining ? `?${remaining}` : ""}`;
      }
    }
  } catch {
    // leave req.url as-is
  }

  console.log("[Handler]", req.method, req.url);

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
