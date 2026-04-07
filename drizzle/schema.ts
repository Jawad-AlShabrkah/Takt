import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "external"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Factory areas (zones) such as Takt 10, Takt 11, etc.
 * Each area has fixed physical dimensions and can contain products.
 */
export const areas = mysqlTable(
  "areas",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    // Physical dimensions in arbitrary units (e.g., meters or grid units)
    widthX: decimal("widthX", { precision: 10, scale: 2 }).notNull(),
    heightY: decimal("heightY", { precision: 10, scale: 2 }).notNull(),
    // Color coding for visual distinction
    colorCode: varchar("colorCode", { length: 7 }).default("#3B82F6").notNull(),
    // Capacity tracking
    maxCapacity: int("maxCapacity"),
    // Soft delete support
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIdx: index("areas_name_idx").on(table.name),
    activeIdx: index("areas_active_idx").on(table.isActive),
  })
);

export type Area = typeof areas.$inferSelect;
export type InsertArea = typeof areas.$inferInsert;

/**
 * Product categories: Bay and SPU
 * Each category has subcategories with defined dimensions.
 */
export const productCategories = mysqlTable(
  "product_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    mainCategory: mysqlEnum("mainCategory", ["Bay", "SPU"]).notNull(),
    subCategory: mysqlEnum("subCategory", ["ELK-04", "ELK-04C", "ELK-3", "ELK-14"]).notNull(),
    // Dimensions of products in this category
    widthX: decimal("widthX", { precision: 10, scale: 2 }).notNull(),
    heightY: decimal("heightY", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("categories_main_idx").on(table.mainCategory),
    subcategoryIdx: index("categories_sub_idx").on(table.subCategory),
  })
);

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * Products: GIS end products with status tracking
 * Each product has metadata, current position, and status.
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    // Product identification
    sdNumber: varchar("sdNumber", { length: 100 }).notNull().unique(),
    salesNumber: varchar("salesNumber", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    // Category reference
    categoryId: int("categoryId").notNull(),
    // Current location and position
    currentAreaId: int("currentAreaId"),
    // Position within the area (X, Y coordinates)
    positionX: decimal("positionX", { precision: 10, scale: 2 }),
    positionY: decimal("positionY", { precision: 10, scale: 2 }),
    // Status: blue (finished), yellow (pending issues), green (ready for shipping)
    status: mysqlEnum("status", ["blue", "yellow", "green"]).default("blue").notNull(),
    // Metadata
    comments: text("comments"),
    quantity: int("quantity").default(1).notNull(),
    // Audit fields
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sdNumberIdx: index("products_sd_idx").on(table.sdNumber),
    areaIdx: index("products_area_idx").on(table.currentAreaId),
    statusIdx: index("products_status_idx").on(table.status),
    categoryIdx: index("products_category_idx").on(table.categoryId),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Movement history: audit trail of all product movements
 * Captures timestamps, user attribution, and area transitions.
 */
export const movements = mysqlTable(
  "movements",
  {
    id: int("id").autoincrement().primaryKey(),
    // Product being moved
    productId: int("productId").notNull(),
    // User performing the movement
    userId: int("userId").notNull(),
    // Source and destination areas
    fromAreaId: int("fromAreaId"),
    toAreaId: int("toAreaId"),
    // Position change
    fromPositionX: decimal("fromPositionX", { precision: 10, scale: 2 }),
    fromPositionY: decimal("fromPositionY", { precision: 10, scale: 2 }),
    toPositionX: decimal("toPositionX", { precision: 10, scale: 2 }),
    toPositionY: decimal("toPositionY", { precision: 10, scale: 2 }),
    // Movement metadata
    movementType: mysqlEnum("movementType", [
      "within_area",
      "between_areas",
      "created",
      "status_change",
    ]).notNull(),
    notes: text("notes"),
    // Timestamp
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index("movements_product_idx").on(table.productId),
    userIdx: index("movements_user_idx").on(table.userId),
    createdIdx: index("movements_created_idx").on(table.createdAt),
  })
);

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = typeof movements.$inferInsert;

/**
 * Role-based visibility configuration
 * Defines which fields are visible in each role/mode.
 */
export const visibilityRules = mysqlTable("visibility_rules", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["user", "admin", "external"]).notNull(),
  // Fields visible to this role (comma-separated)
  visibleFields: text("visibleFields").notNull(),
  // Whether this role can edit
  canEdit: boolean("canEdit").default(false).notNull(),
  // Whether this role can delete
  canDelete: boolean("canDelete").default(false).notNull(),
  // Whether this role can see movement history
  canViewHistory: boolean("canViewHistory").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisibilityRule = typeof visibilityRules.$inferSelect;
export type InsertVisibilityRule = typeof visibilityRules.$inferInsert;
