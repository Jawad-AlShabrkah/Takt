import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  areas,
  products,
  movements,
  productCategories,
  visibilityRules,
  type Area,
  type Product,
  type Movement,
  type ProductCategory,
  type VisibilityRule,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AREA QUERIES
// ============================================================================

export async function getAreas(): Promise<Area[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(areas).where(eq(areas.isActive, true));
}

export async function getAreaById(id: number): Promise<Area | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(areas).where(eq(areas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArea(data: {
  name: string;
  description?: string;
  widthX: number;
  heightY: number;
  colorCode?: string;
  maxCapacity?: number;
}): Promise<Area> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(areas).values({
    name: data.name,
    description: data.description,
    widthX: String(data.widthX),
    heightY: String(data.heightY),
    colorCode: data.colorCode || "#3B82F6",
    maxCapacity: data.maxCapacity,
    isActive: true,
  });

  const allAreas = await getAreas();
  const area = allAreas.find((a) => a.name === data.name);
  if (!area) throw new Error("Failed to create area");
  return area;
}

export async function updateArea(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    widthX: number;
    heightY: number;
    colorCode: string;
    maxCapacity: number;
  }>
): Promise<Area> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.widthX !== undefined) updateData.widthX = String(data.widthX);
  if (data.heightY !== undefined) updateData.heightY = String(data.heightY);
  if (data.colorCode !== undefined) updateData.colorCode = data.colorCode;
  if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;

  await db.update(areas).set(updateData).where(eq(areas.id, id));

  const area = await getAreaById(id);
  if (!area) throw new Error("Failed to update area");
  return area;
}

export async function deleteArea(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(areas).set({ isActive: false }).where(eq(areas.id, id));
}

// ============================================================================
// PRODUCT CATEGORY QUERIES
// ============================================================================

export async function getProductCategories(): Promise<ProductCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(productCategories).where(eq(productCategories.isActive, true));
}

export async function getProductCategoryById(id: number): Promise<ProductCategory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProductCategory(data: {
  mainCategory: "Bay" | "SPU";
  subCategory: "ELK-04" | "ELK-04C" | "ELK-3" | "ELK-14";
  widthX: number;
  heightY: number;
  description?: string;
}): Promise<ProductCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(productCategories).values({
    mainCategory: data.mainCategory,
    subCategory: data.subCategory,
    widthX: String(data.widthX),
    heightY: String(data.heightY),
    description: data.description,
    isActive: true,
  });

  const allCategories = await getProductCategories();
  const category = allCategories.find(
    (c) => c.mainCategory === data.mainCategory && c.subCategory === data.subCategory
  );
  if (!category) throw new Error("Failed to create product category");
  return category;
}

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export async function getProducts(filters?: {
  areaId?: number;
  status?: "blue" | "yellow" | "green";
}): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.areaId !== undefined) {
    conditions.push(eq(products.currentAreaId, filters.areaId));
  }
  if (filters?.status !== undefined) {
    conditions.push(eq(products.status, filters.status));
  }

  if (conditions.length > 0) {
    return db.select().from(products).where(and(...conditions));
  }

  return db.select().from(products);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductBySDNumber(sdNumber: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.sdNumber, sdNumber))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: {
  sdNumber: string;
  salesNumber?: string;
  name: string;
  categoryId: number;
  currentAreaId?: number;
  positionX?: number;
  positionY?: number;
  status?: "blue" | "yellow" | "green";
  comments?: string;
  quantity?: number;
}): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(products).values({
    sdNumber: data.sdNumber,
    salesNumber: data.salesNumber,
    name: data.name,
    categoryId: data.categoryId,
    currentAreaId: data.currentAreaId,
    positionX: data.positionX ? String(data.positionX) : null,
    positionY: data.positionY ? String(data.positionY) : null,
    status: data.status || "blue",
    comments: data.comments,
    quantity: data.quantity || 1,
  });

  const product = await getProductBySDNumber(data.sdNumber);
  if (!product) throw new Error("Failed to create product");
  return product;
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    currentAreaId: number | null;
    positionX: number;
    positionY: number;
    status: "blue" | "yellow" | "green";
    comments: string;
    quantity: number;
  }>
): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.currentAreaId !== undefined) updateData.currentAreaId = data.currentAreaId;
  if (data.positionX !== undefined) updateData.positionX = String(data.positionX);
  if (data.positionY !== undefined) updateData.positionY = String(data.positionY);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.comments !== undefined) updateData.comments = data.comments;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;

  await db.update(products).set(updateData).where(eq(products.id, id));

  const product = await getProductById(id);
  if (!product) throw new Error("Failed to update product");
  return product;
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, id));
}

// ============================================================================
// MOVEMENT QUERIES
// ============================================================================

export async function createMovement(data: {
  productId: number;
  userId: number;
  fromAreaId?: number;
  toAreaId?: number;
  fromPositionX?: number;
  fromPositionY?: number;
  toPositionX?: number;
  toPositionY?: number;
  movementType: "within_area" | "between_areas" | "created" | "status_change";
  notes?: string;
}): Promise<Movement> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(movements).values({
    productId: data.productId,
    userId: data.userId,
    fromAreaId: data.fromAreaId,
    toAreaId: data.toAreaId,
    fromPositionX: data.fromPositionX ? String(data.fromPositionX) : null,
    fromPositionY: data.fromPositionY ? String(data.fromPositionY) : null,
    toPositionX: data.toPositionX ? String(data.toPositionX) : null,
    toPositionY: data.toPositionY ? String(data.toPositionY) : null,
    movementType: data.movementType,
    notes: data.notes,
  });

  const recentMovements = await getRecentMovements(1);
  const movement = recentMovements[0];
  if (!movement) throw new Error("Failed to create movement");
  return movement;
}

export async function getMovementById(id: number): Promise<Movement | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(movements).where(eq(movements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductMovements(
  productId: number,
  limit: number = 50
): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(movements)
    .where(eq(movements.productId, productId))
    .orderBy(desc(movements.createdAt))
    .limit(limit);
}

export async function getRecentMovements(limit: number = 50): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(movements).orderBy(desc(movements.createdAt)).limit(limit);
}

// ============================================================================
// VISIBILITY RULES QUERIES
// ============================================================================

export async function getVisibilityRuleByRole(role: "user" | "admin" | "external"): Promise<VisibilityRule | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(visibilityRules)
    .where(eq(visibilityRules.role, role))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVisibilityRule(data: {
  role: "user" | "admin" | "external";
  visibleFields: string[];
  canEdit?: boolean;
  canDelete?: boolean;
  canViewHistory?: boolean;
}): Promise<VisibilityRule> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(visibilityRules).values({
    role: data.role,
    visibleFields: data.visibleFields.join(","),
    canEdit: data.canEdit || false,
    canDelete: data.canDelete || false,
    canViewHistory: data.canViewHistory || false,
  });

  const rule = await getVisibilityRuleByRole(data.role);
  if (!rule) throw new Error("Failed to create visibility rule");
  return rule;
}

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export async function getAreaOccupancy(): Promise<
  Array<{ areaId: number; areaName: string; productCount: number; capacity: number | null }>
> {
  const db = await getDb();
  if (!db) return [];

  // Get occupancy by counting products in each area
  const occupancy = await Promise.all(
    (await getAreas()).map(async (area) => {
      const prods = await getProducts({ areaId: area.id });
      return {
        areaId: area.id,
        areaName: area.name,
        productCount: prods.length,
        capacity: area.maxCapacity ? Number(area.maxCapacity) : null,
      };
    })
  );

  return occupancy;
}

export async function getProductStatusDistribution(): Promise<
  Array<{ status: "blue" | "yellow" | "green"; count: number }>
> {
  const db = await getDb();
  if (!db) return [];

  const allProducts = await getProducts();
  const distribution = [
    { status: "blue" as const, count: allProducts.filter((p) => p.status === "blue").length },
    { status: "yellow" as const, count: allProducts.filter((p) => p.status === "yellow").length },
    { status: "green" as const, count: allProducts.filter((p) => p.status === "green").length },
  ];

  return distribution;
}
