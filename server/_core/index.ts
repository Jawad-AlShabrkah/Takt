import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { sql } from "drizzle-orm";
import { getDb, getUserByEmail, upsertUser } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Create all database tables if they don't exist yet.
 * This runs on every server start so no manual migration step is needed.
 */
async function ensureDatabaseSchema() {
  const db = await getDb();
  if (!db) {
    console.warn("[Setup] No DATABASE_URL configured — skipping schema setup");
    return;
  }

  const statements = [
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

  try {
    for (const stmt of statements) {
      await db.execute(sql.raw(stmt));
    }
    console.log("[Setup] Database schema verified");
  } catch (err) {
    console.error("[Setup] Schema setup failed:", err);
  }
}

/**
 * On first boot: if ADMIN_EMAIL + ADMIN_PASSWORD env vars are set and no
 * account exists yet for that email, create the admin user automatically.
 * This removes the need to run any terminal commands after deployment.
 */
async function maybeCreateAdminUser() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) return;

  try {
    const existing = await getUserByEmail(email);
    if (existing) return; // already exists, nothing to do

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
  } catch (err) {
    // Non-fatal — DB might not be ready yet or user already exists
    console.warn("[Setup] Could not create admin user:", err);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for correct client IP behind reverse proxies (Vercel, etc.)
  app.set("trust proxy", 1);

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : undefined;
  app.use(
    cors({
      origin: allowedOrigins || true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Security headers via helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
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

  // Global rate limiter: 100 requests per minute per IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use(globalLimiter);

  // Stricter rate limiter for auth endpoints: 10 requests per minute per IP
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later." },
  });
  app.use("/api/oauth", authLimiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Auto-setup: create tables + admin user on first boot (no terminal needed)
  await ensureDatabaseSchema();
  await maybeCreateAdminUser();

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
