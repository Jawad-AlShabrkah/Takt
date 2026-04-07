import { drizzle } from "drizzle-orm/mysql2";
import {
  areas,
  productCategories,
  visibilityRules,
} from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Seed areas
    console.log("📍 Creating factory areas...");
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
    ]);

    // Seed product categories
    console.log("📦 Creating product categories...");
    await db.insert(productCategories).values([
      {
        mainCategory: "Bay",
        subCategory: "ELK-04",
        widthX: "5",
        heightY: "4",
        description: "Bay ELK-04 product",
        isActive: true,
      },
      {
        mainCategory: "Bay",
        subCategory: "ELK-04C",
        widthX: "5",
        heightY: "4",
        description: "Bay ELK-04C product",
        isActive: true,
      },
      {
        mainCategory: "Bay",
        subCategory: "ELK-3",
        widthX: "6",
        heightY: "5",
        description: "Bay ELK-3 product",
        isActive: true,
      },
      {
        mainCategory: "Bay",
        subCategory: "ELK-14",
        widthX: "7",
        heightY: "6",
        description: "Bay ELK-14 product",
        isActive: true,
      },
      {
        mainCategory: "SPU",
        subCategory: "ELK-04",
        widthX: "4",
        heightY: "3",
        description: "SPU ELK-04 product",
        isActive: true,
      },
      {
        mainCategory: "SPU",
        subCategory: "ELK-04C",
        widthX: "4",
        heightY: "3",
        description: "SPU ELK-04C product",
        isActive: true,
      },
      {
        mainCategory: "SPU",
        subCategory: "ELK-3",
        widthX: "5",
        heightY: "4",
        description: "SPU ELK-3 product",
        isActive: true,
      },
      {
        mainCategory: "SPU",
        subCategory: "ELK-14",
        widthX: "6",
        heightY: "5",
        description: "SPU ELK-14 product",
        isActive: true,
      },
    ]);

    // Seed visibility rules
    console.log("🔐 Creating visibility rules...");
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

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
