import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
// VALIDATION SCHEMAS
// ============================================================================

const AreaSchema = z.object({
  name: z.string().min(1, "Area name is required"),
  description: z.string().optional(),
  widthX: z.number().positive("Width must be positive"),
  heightY: z.number().positive("Height must be positive"),
  colorCode: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color code").optional(),
  maxCapacity: z.number().positive().optional(),
});

const ProductSchema = z.object({
  sdNumber: z.string().min(1, "SD Number is required"),
  salesNumber: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  categoryId: z.number().positive("Valid category is required"),
  currentAreaId: z.number().positive().optional().nullable(),
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  status: z.enum(["blue", "yellow", "green"]).optional(),
  comments: z.string().optional(),
  quantity: z.number().positive().optional(),
});

const ProductCategorySchema = z.object({
  mainCategory: z.enum(["Bay", "SPU"]),
  subCategory: z.enum(["ELK-04", "ELK-04C", "ELK-3", "ELK-14"]),
  widthX: z.number().positive("Width must be positive"),
  heightY: z.number().positive("Height must be positive"),
  description: z.string().optional(),
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

  create: protectedProcedure
    .input(AreaSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can create areas
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create areas");
      }

      const area = await createArea(input);

      // Log movement
      if (ctx.user.id) {
        await createMovement({
          productId: 0,
          userId: ctx.user.id,
          movementType: "created",
          notes: `Area created: ${area.name}`,
        });
      }

      return area;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: AreaSchema.partial() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can update areas
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update areas");
      }

      const area = await updateArea(input.id, input.data);

      // Log movement
      if (ctx.user.id) {
        await createMovement({
          productId: 0,
          userId: ctx.user.id,
          movementType: "created",
          notes: `Area updated: ${area.name}`,
        });
      }

      return area;
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete areas
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete areas");
      }

      await deleteArea(input);

      // Log movement
      if (ctx.user.id) {
        await createMovement({
          productId: 0,
          userId: ctx.user.id,
          movementType: "created",
          notes: `Area deleted: ID ${input}`,
        });
      }

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

  create: protectedProcedure
    .input(ProductCategorySchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can create categories
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create categories");
      }

      return createProductCategory(input);
    }),
});

// ============================================================================
// PRODUCTS ROUTER
// ============================================================================

const productsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        areaId: z.number().optional(),
        status: z.enum(["blue", "yellow", "green"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let products = await getProducts(input);

      // Apply visibility filtering based on user role
      if (ctx.user?.role === "external") {
        // External users can only see products, not metadata
        products = products.map((p) => ({
          ...p,
          sdNumber: "***",
          salesNumber: "***",
          comments: null,
        }));
      }

      return products;
    }),

  getById: publicProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const product = await getProductById(input);
    if (!product) throw new Error("Product not found");

    // Apply visibility filtering
    if (ctx.user?.role === "external") {
      return {
        ...product,
        sdNumber: "***",
        salesNumber: "***",
        comments: null,
      };
    }

    return product;
  }),

  getBySDNumber: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const product = await getProductBySDNumber(input);
      if (!product) throw new Error("Product not found");

      // Apply visibility filtering
      if (ctx.user?.role === "external") {
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

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete products
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete products");
      }

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
  getProductHistory: publicProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      const movements = await getProductMovements(input);

      // External users cannot see movement history
      if (ctx.user?.role === "external") {
        throw new Error("Unauthorized: External users cannot view movement history");
      }

      return movements;
    }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      // External users cannot see movement history
      if (ctx.user?.role === "external") {
        throw new Error("Unauthorized: External users cannot view movement history");
      }

      return getRecentMovements(input.limit || 50);
    }),
});

// ============================================================================
// ANALYTICS ROUTER
// ============================================================================

const analyticsRouter = router({
  getOccupancy: publicProcedure.query(async ({ ctx }) => {
    // External users cannot see analytics
    if (ctx.user?.role === "external") {
      throw new Error("Unauthorized: External users cannot view analytics");
    }

    return getAreaOccupancy();
  }),

  getStatusDistribution: publicProcedure.query(async ({ ctx }) => {
    // External users cannot see analytics
    if (ctx.user?.role === "external") {
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
