import app, { runStartupTasks } from "./app";

// Run DB setup on cold start (non-blocking)
runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

// Vercel's @vercel/node handles Express apps as default exports
export default app;
