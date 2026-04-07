import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  getProducts,
  getProductById,
  getProductBySDNumber,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductCategoryById,
  createProductCategory,
  createMovement,
  getProductMovements,
  getRecentMovements,
  getAreaOccupancy,
  getProductStatusDistribution,
  getVisibilityRuleByRole,
  getUserById,
} from "./db";

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/** Strip HTML tags and dangerous characters from user input to prevent XSS */
function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, "") // strip angle brackets (HTML tags)
    .replace(/javascript:/gi, "") // strip javascript: URIs
    .replace(/on\w+\s*=/gi, "") // strip inline event handlers (onclick=, etc.)
    .trim();
}

/** Zod transform that sanitizes a string value */
const sanitizedString = (schema: z.ZodString) =>
  schema.transform((val) => sanitize(val));

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AreaSchema = z.object({
  name: sanitizedString(z.string().min(1, "Area name is required")),
  description: z.string().optional().transform((val) => val ? sanitize(val) : val),
  widthX: z.number().positive("Width must be positive"),
  heightY: z.number().positive("Height must be positive"),
  colorCode: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code").optional(),
  maxCapacity: z.number().positive().optional(),
});

const ProductSchema = z.object({
  sdNumber: sanitizedString(z.string().min(1, "SD Number is required")),
  salesNumber: z.string().optional().transform((val) => val ? sanitize(val) : val),
  name: sanitizedString(z.string().min(1, "Product name is required")),
  categoryId: z.number().positive("Valid category is required"),
  currentAreaId: z.number().positive().optional().nullable(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  status: z.enum(["blue", "yellow", "green"]).optional(),
  comments: z.string().optional().transform((val) => val ? sanitize(val) : val),
  quantity: z.number().positive().optional(),
});

const ProductCategorySchema = z.object({
  mainCategory: z.enum(["Bay", "SPU"]),
  subCategory: z.enum(["ELK-04", "ELK-04C", "ELK-3", "ELK-14"]),
  widthX: z.number().positive("Width must be positive"),
  heightY: z.number().positive("Height must be positive"),
  description: z.string().optional().transform((val) => val ? sanitize(val) : val),
});

// ============================================================================
// AREAS ROUTER
// ============================================================================

const areasRouter = router({
  list: publicProcedure.query(async () => {
    return getAreas();
  }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const area = await getAreaById(input);
    if (!area) throw new Error("Area not found");
    return area;
  }),

  create: adminProcedure
    .input(AreaSchema)
    .mutation(async ({ input, ctx }) => {
      const area = await createArea(input);

      await createMovement({
        productId: 0,
        userId: ctx.user.id,
        movementType: "created",
        notes: `Area created: ${area.name}`,
      });

      return area;
    }),

  update: adminProcedure
    .input(z.object({ id: z.number(), data: AreaSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      const area = await updateArea(input.id, input.data);

      await createMovement({
        productId: 0,
        userId: ctx.user.id,
        movementType: "created",
        notes: `Area updated: ${area.name}`,
      });

      return area;
    }),

  delete: adminProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      await deleteArea(input);

      await createMovement({
        productId: 0,
        userId: ctx.user.id,
        movementType: "created",
        notes: `Area deleted: ID ${input}`,
      });

      return { success: true };
    }),
});

// ============================================================================
// PRODUCT CATEGORIES ROUTER
// ============================================================================

const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return getProductCategories();
  }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const category = await getProductCategoryById(input);
    if (!category) throw new Error("Category not found");
    return category;
  }),

  create: adminProcedure
    .input(ProductCategorySchema)
    .mutation(async ({ input }) => {
      return createProductCategory(input);
    }),
});

// ============================================================================
// PRODUCTS ROUTER
// ============================================================================

const productsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        areaId: z.number().optional(),
        status: z.enum(["blue", "yellow", "green"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let products = await getProducts(input);

      // Apply visibility filtering based on user role
      if (ctx.user.role === "external") {
        products = products.map((p) => ({
          ...p,
          sdNumber: "***",
          salesNumber: "***",
          comments: null,
        }));
      }

      return products;
    }),

  getById: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const product = await getProductById(input);
    if (!product) throw new Error("Product not found");

    if (ctx.user.role === "external") {
      return {
        ...product,
        sdNumber: "***",
        salesNumber: "***",
        comments: null,
      };
    }

    return product;
  }),

  getBySDNumber: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const product = await getProductBySDNumber(input);
      if (!product) throw new Error("Product not found");

      if (ctx.user.role === "external") {
        return {
          ...product,
          sdNumber: "***",
          salesNumber: "***",
          comments: null,
        };
      }

      return product;
    }),

  create: protectedProcedure
    .input(ProductSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins and users can create products
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot create products");
      }

      const createData = {
        ...input,
        currentAreaId: input.currentAreaId || undefined,
        positionX: input.positionX || undefined,
        positionY: input.positionY || undefined,
      };

      const product = await createProduct(createData);

      // Log movement
      if (ctx.user.id) {
        await createMovement({
          productId: product.id,
          userId: ctx.user.id,
          toAreaId: product.currentAreaId || undefined,
          toPositionX: product.positionX ? Number(product.positionX) : undefined,
          toPositionY: product.positionY ? Number(product.positionY) : undefined,
          movementType: "created",
          notes: `Product created: ${product.name}`,
        });
      }

      return product;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: ProductSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins and users can update products
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot update products");
      }

      const oldProduct = await getProductById(input.id);
      if (!oldProduct) throw new Error("Product not found");

      const updateData: Partial<{
        name: string;
        currentAreaId: number | null;
        positionX: number;
        positionY: number;
        status: "blue" | "yellow" | "green";
        comments: string;
        quantity: number;
      }> = {};

      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.currentAreaId !== undefined) updateData.currentAreaId = input.data.currentAreaId ?? null;
      if (input.data.positionX !== undefined) updateData.positionX = input.data.positionX ?? 0;
      if (input.data.positionY !== undefined) updateData.positionY = input.data.positionY ?? 0;
      if (input.data.status !== undefined) updateData.status = input.data.status;
      if (input.data.comments !== undefined) updateData.comments = input.data.comments;
      if (input.data.quantity !== undefined) updateData.quantity = input.data.quantity;

      const product = await updateProduct(input.id, updateData);

      // Log movement if position changed
      if (ctx.user.id) {
        const movementType =
          oldProduct.currentAreaId !== product.currentAreaId
            ? "between_areas"
            : "within_area";

        await createMovement({
          productId: product.id,
          userId: ctx.user.id,
          fromAreaId: oldProduct.currentAreaId || undefined,
          toAreaId: product.currentAreaId || undefined,
          fromPositionX: oldProduct.positionX ? Number(oldProduct.positionX) : undefined,
          fromPositionY: oldProduct.positionY ? Number(oldProduct.positionY) : undefined,
          toPositionX: product.positionX ? Number(product.positionX) : undefined,
          toPositionY: product.positionY ? Number(product.positionY) : undefined,
          movementType,
          notes: `Product updated: ${product.name}`,
        });
      }

      return product;
    }),

  delete: adminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await deleteProduct(input);

      return { success: true };
    }),

  move: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        toAreaId: z.number().optional().nullable(),
        positionX: z.number(),
        positionY: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins and users can move products
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot move products");
      }

      const oldProduct = await getProductById(input.productId);
      if (!oldProduct) throw new Error("Product not found");

      const updateData: Partial<{
        name: string;
        currentAreaId: number | null;
        positionX: number;
        positionY: number;
        status: "blue" | "yellow" | "green";
        comments: string;
        quantity: number;
      }> = {
        currentAreaId: input.toAreaId || null,
        positionX: input.positionX,
        positionY: input.positionY,
      };

      const product = await updateProduct(input.productId, updateData);

      // Log movement
      if (ctx.user.id) {
        const movementType =
          oldProduct.currentAreaId !== product.currentAreaId
            ? "between_areas"
            : "within_area";

        await createMovement({
          productId: product.id,
          userId: ctx.user.id,
          fromAreaId: oldProduct.currentAreaId || undefined,
          toAreaId: product.currentAreaId || undefined,
          fromPositionX: oldProduct.positionX ? Number(oldProduct.positionX) : undefined,
          fromPositionY: oldProduct.positionY ? Number(oldProduct.positionY) : undefined,
          toPositionX: input.positionX,
          toPositionY: input.positionY,
          movementType,
          notes: `Product moved`,
        });
      }

      return product;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        status: z.enum(["blue", "yellow", "green"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins and users can update status
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot update product status");
      }

      const product = await updateProduct(input.productId, {
        status: input.status,
      });

      // Log status change
      if (ctx.user.id) {
        await createMovement({
          productId: product.id,
          userId: ctx.user.id,
          movementType: "status_change",
          notes: `Status changed to ${input.status}`,
        });
      }

      return product;
    }),
});

// ============================================================================
// MOVEMENTS ROUTER
// ============================================================================

const movementsRouter = router({
  getProductHistory: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot view movement history");
      }

      return getProductMovements(input);
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role === "external") {
        throw new Error("Unauthorized: External users cannot view movement history");
      }

      return getRecentMovements(input.limit || 50);
    }),
});

// ============================================================================
// ANALYTICS ROUTER
// ============================================================================

const analyticsRouter = router({
  getOccupancy: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "external") {
      throw new Error("Unauthorized: External users cannot view analytics");
    }

    return getAreaOccupancy();
  }),

  getStatusDistribution: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "external") {
      throw new Error("Unauthorized: External users cannot view analytics");
    }

    return getProductStatusDistribution();
  }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  areas: areasRouter,
  categories: categoriesRouter,
  products: productsRouter,
  movements: movementsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
