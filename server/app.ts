import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { sql } from "drizzle-orm";
import { getDb, getUserByEmail, upsertUser } from "./db";

// ---------------------------------------------------------------------------
// Express app (shared between local dev and Vercel serverless)
// ---------------------------------------------------------------------------

const app = express();

app.set("trust proxy", 1);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : undefined;
app.use(
  cors({
    origin: allowedOrigins || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);
app.use(
  "/api/trpc/auth.login",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
  })
);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check (useful for debugging Vercel routing)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// tRPC API — mount on /api/trpc (primary)
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});
app.use("/api/trpc", trpcMiddleware);

// Catch-all: log unmatched requests for debugging, return proper JSON error
app.use((req, res) => {
  console.warn("[Express] No route matched:", req.method, req.url);
  res.status(404).json({ error: "Not found", path: req.url });
});

// ---------------------------------------------------------------------------
// Runtime database setup (runs once on cold start)
// ---------------------------------------------------------------------------

let _setupDone = false;

export async function runStartupTasks() {
  if (_setupDone) return;
  _setupDone = true;

  // 1. Create tables if they don't exist
  const db = await getDb();
  if (db) {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        openId varchar(64) NOT NULL UNIQUE,
        name text,
        email varchar(320),
        passwordHash varchar(255),
        loginMethod varchar(64),
        role enum('user','admin','external') NOT NULL DEFAULT 'user',
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastSignedIn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS areas (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        name varchar(255) NOT NULL,
        description text,
        widthX decimal(10,2) NOT NULL,
        heightY decimal(10,2) NOT NULL,
        colorCode varchar(7) NOT NULL DEFAULT '#3B82F6',
        maxCapacity int,
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS movements (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        productId int NOT NULL,
        userId int NOT NULL,
        fromAreaId int,
        toAreaId int,
        fromPositionX decimal(10,2),
        fromPositionY decimal(10,2),
        toPositionX decimal(10,2),
        toPositionY decimal(10,2),
        movementType enum('within_area','between_areas','created','status_change') NOT NULL,
        notes text,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS product_categories (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        mainCategory enum('Bay','SPU') NOT NULL,
        subCategory enum('ELK-04','ELK-04C','ELK-3','ELK-14') NOT NULL,
        widthX decimal(10,2) NOT NULL,
        heightY decimal(10,2) NOT NULL,
        description text,
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        sdNumber varchar(100) NOT NULL UNIQUE,
        salesNumber varchar(100),
        name varchar(255) NOT NULL,
        categoryId int NOT NULL,
        currentAreaId int,
        positionX decimal(10,2),
        positionY decimal(10,2),
        status enum('blue','yellow','green') NOT NULL DEFAULT 'blue',
        comments text,
        quantity int NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS visibility_rules (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        role enum('user','admin','external') NOT NULL,
        visibleFields text NOT NULL,
        canEdit boolean NOT NULL DEFAULT false,
        canDelete boolean NOT NULL DEFAULT false,
        canViewHistory boolean NOT NULL DEFAULT false,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
    ];

    // Run all CREATE TABLE statements in parallel to reduce cold-start time
    await Promise.all(
      tables.map((stmt) =>
        db.execute(sql.raw(stmt)).catch((err) => {
          console.error("[Setup] Table creation failed:", err);
        })
      )
    );
    console.log("[Setup] Database schema verified");
  }

  // 2. Create admin user if env vars are set
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    try {
      const existing = await getUserByEmail(email);
      if (!existing) {
        const passwordHash = await sdk.hashPassword(password);
        await upsertUser({
          openId: email,
          email,
          name: "Admin",
          passwordHash,
          loginMethod: "password",
          role: "admin",
          lastSignedIn: new Date(),
        });
        console.log(`[Setup] Admin user created: ${email}`);
      }
    } catch (err) {
      console.warn("[Setup] Could not create admin user:", err);
    }
  }
}

export default app;
