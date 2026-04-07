import type { VercelRequest, VercelResponse } from "@vercel/node";
import app, { runStartupTasks } from "../server/app";

// Run DB setup + admin creation on cold start
const startupPromise = runStartupTasks();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await startupPromise;
  app(req as any, res as any);
}
