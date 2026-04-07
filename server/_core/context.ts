import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    // Log failed auth attempts for security monitoring.
    const hasSessionCookie = !!opts.req.cookies?.app_session_id;
    if (hasSessionCookie) {
      const clientIp = opts.req.ip || opts.req.headers["x-forwarded-for"] || "unknown";
      console.warn(
        `[Auth] Failed authentication attempt | IP: ${clientIp} | Path: ${opts.req.path} | Error: ${error instanceof Error ? error.message : "unknown"}`
      );
    }
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
