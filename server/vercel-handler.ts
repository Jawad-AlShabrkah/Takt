import type { IncomingMessage, ServerResponse } from "http";
import app, { runStartupTasks } from "./app";

// Run DB setup on cold start (non-blocking)
const ready = runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ready;
  } catch {
    // startup already logged, continue
  }

  // --- URL reconstruction ---------------------------------------------------
  // Vercel rewrites route all /api/* requests to this single function, but
  // the rewrite can strip the original path. We need Express to see the real
  // URL (e.g. /api/trpc/auth.login) so the tRPC middleware matches.
  //
  // Strategy: try multiple sources for the original URL.

  const rawUrl = req.url || "/";
  let finalUrl = rawUrl;

  // 1. Check __trpc query parameter (our vercel.json passes the tRPC procedure path)
  const qIdx = rawUrl.indexOf("?");
  if (qIdx !== -1) {
    const params = new URLSearchParams(rawUrl.slice(qIdx + 1));
    const capturedPath = params.get("__trpc");
    if (capturedPath) {
      params.delete("__trpc");
      const remaining = params.toString();
      finalUrl = `/api/trpc/${capturedPath}${remaining ? `?${remaining}` : ""}`;
    }
  }

  // 2. If URL still looks like just /api or /, check Vercel headers
  if (finalUrl === "/" || finalUrl === "/api" || finalUrl === "/api/") {
    // x-matched-path contains the source pattern; x-invoke-path has the real path
    const invokedPath =
      (req.headers["x-invoke-path"] as string) ||
      (req.headers["x-original-url"] as string) ||
      (req.headers["x-forwarded-uri"] as string);
    if (invokedPath && invokedPath.startsWith("/api/")) {
      finalUrl = invokedPath;
    }
  }

  req.url = finalUrl;
  console.log("[Handler] method:", req.method, "url:", req.url);

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    app(req as any, res as any);
  });
}
