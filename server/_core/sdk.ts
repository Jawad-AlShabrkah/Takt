import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 12;

export type SessionPayload = {
  openId: string;
  name: string;
};

class SDKServer {
  // -------------------------------------------------------------------------
  // Password helpers
  // -------------------------------------------------------------------------

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // -------------------------------------------------------------------------
  // JWT session helpers
  // -------------------------------------------------------------------------

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    return new SignJWT({ openId, name: options.name ?? "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) return null;

    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const openId = payload["openId"];
      const name = payload["name"];

      if (typeof openId !== "string" || openId.length === 0) return null;
      return { openId, name: typeof name === "string" ? name : "" };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Request authentication
  // -------------------------------------------------------------------------

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid or missing session");
    }

    const user = await db.getUserByOpenId(session.openId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update last sign-in timestamp (fire and forget)
    db.upsertUser({ openId: user.openId, lastSignedIn: new Date() }).catch(() => {});

    return user;
  }
}

export const sdk = new SDKServer();
