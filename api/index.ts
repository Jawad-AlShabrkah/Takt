import app, { runStartupTasks } from "../server/app";

// Run DB setup on cold start (non-blocking, errors are caught internally)
runStartupTasks().catch((err) => {
  console.error("[Startup] Failed:", err);
});

// Vercel's @vercel/node natively supports Express apps as default exports
export default app;
