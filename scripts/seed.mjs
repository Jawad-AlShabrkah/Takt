import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import {
  users,
  areas,
  productCategories,
  visibilityRules,
} from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database...");

  try {
    // -------------------------------------------------------------------------
    // Admin user (required to log in)
    // Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running.
    // -------------------------------------------------------------------------
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error(
        "ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set as environment variables.\n" +
        "Example:\n" +
        "  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword node scripts/seed.mjs"
      );
      process.exit(1);
    }

    if (adminPassword.length < 8) {
      console.error("ERROR: ADMIN_PASSWORD must be at least 8 characters.");
      process.exit(1);
    }

    console.log(`Creating admin user: ${adminEmail}`);
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values({
      openId: adminEmail,
      email: adminEmail,
      name: "Admin",
      passwordHash,
      loginMethod: "password",
      role: "admin",
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({
      set: { passwordHash, role: "admin", lastSignedIn: new Date() },
    });

    // -------------------------------------------------------------------------
    // Factory areas
    // -------------------------------------------------------------------------
    console.log("Creating factory areas...");
    await db.insert(areas).values([
      {
        name: "Takt 10",
        description: "Production area for Bay products - Takt 10",
        widthX: "50",
        heightY: "40",
        colorCode: "#3B82F6",
        maxCapacity: 20,
        isActive: true,
      },
      {
        name: "Takt 11",
        description: "Production area for SPU products - Takt 11",
        widthX: "50",
        heightY: "40",
        colorCode: "#8B5CF6",
        maxCapacity: 20,
        isActive: true,
      },
      {
        name: "Quality Control",
        description: "Quality inspection area",
        widthX: "30",
        heightY: "30",
        colorCode: "#F59E0B",
        maxCapacity: 15,
        isActive: true,
      },
      {
        name: "Storage",
        description: "Finished goods storage",
        widthX: "60",
        heightY: "50",
        colorCode: "#10B981",
        maxCapacity: 50,
        isActive: true,
      },
      {
        name: "Shipping",
        description: "Shipping and logistics area",
        widthX: "40",
        heightY: "35",
        colorCode: "#EF4444",
        maxCapacity: 25,
        isActive: true,
      },
    ]).onDuplicateKeyUpdate({ set: { isActive: true } });

    // -------------------------------------------------------------------------
    // Product categories
    // -------------------------------------------------------------------------
    console.log("Creating product categories...");
    await db.insert(productCategories).values([
      { mainCategory: "Bay",  subCategory: "ELK-04",  widthX: "5", heightY: "4", description: "Bay ELK-04 product",  isActive: true },
      { mainCategory: "Bay",  subCategory: "ELK-04C", widthX: "5", heightY: "4", description: "Bay ELK-04C product", isActive: true },
      { mainCategory: "Bay",  subCategory: "ELK-3",   widthX: "6", heightY: "5", description: "Bay ELK-3 product",   isActive: true },
      { mainCategory: "Bay",  subCategory: "ELK-14",  widthX: "7", heightY: "6", description: "Bay ELK-14 product",  isActive: true },
      { mainCategory: "SPU",  subCategory: "ELK-04",  widthX: "4", heightY: "3", description: "SPU ELK-04 product",  isActive: true },
      { mainCategory: "SPU",  subCategory: "ELK-04C", widthX: "4", heightY: "3", description: "SPU ELK-04C product", isActive: true },
      { mainCategory: "SPU",  subCategory: "ELK-3",   widthX: "5", heightY: "4", description: "SPU ELK-3 product",   isActive: true },
      { mainCategory: "SPU",  subCategory: "ELK-14",  widthX: "6", heightY: "5", description: "SPU ELK-14 product",  isActive: true },
    ]);

    // -------------------------------------------------------------------------
    // Visibility rules
    // -------------------------------------------------------------------------
    console.log("Creating visibility rules...");
    await db.insert(visibilityRules).values([
      {
        role: "admin",
        visibleFields: "id,sdNumber,salesNumber,name,status,comments,quantity,currentAreaId,positionX,positionY",
        canEdit: true,
        canDelete: true,
        canViewHistory: true,
      },
      {
        role: "user",
        visibleFields: "id,sdNumber,salesNumber,name,status,comments,quantity,currentAreaId,positionX,positionY",
        canEdit: true,
        canDelete: false,
        canViewHistory: true,
      },
      {
        role: "external",
        visibleFields: "id,name,status,currentAreaId,positionX,positionY",
        canEdit: false,
        canDelete: false,
        canViewHistory: false,
      },
    ]);

    console.log("Database seeded successfully!");
    console.log(`\nYou can now log in with:`);
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: (the ADMIN_PASSWORD you set)\n`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
