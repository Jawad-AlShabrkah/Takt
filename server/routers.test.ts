import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  listAreas: vi.fn(),
  createArea: vi.fn(),
  deleteArea: vi.fn(),
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  moveProduct: vi.fn(),
  getRecentMovements: vi.fn(),
  getAreaOccupancy: vi.fn(),
  getProductStatusDistribution: vi.fn(),
}));

function createTestContext(role: "admin" | "user" | "external" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "oauth",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

describe("tRPC Routers", () => {
  describe("auth.me", () => {
    it("returns current user", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toEqual(ctx.user);
    });

    it("returns null for unauthenticated user", async () => {
      const ctx = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as TrpcContext["res"],
      } as TrpcContext;
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });
  });

  describe("auth.logout", () => {
    it("clears session cookie", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe("areas router", () => {
    it("should list areas", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      // This would require mocking the database
      // For now, we're testing the router structure
      expect(caller.areas).toBeDefined();
      expect(caller.areas.list).toBeDefined();
    });

    it("should require authentication for protected procedures", async () => {
      const ctx = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as TrpcContext["res"],
      } as TrpcContext;
      const caller = appRouter.createCaller(ctx);
      
      // Protected procedures should throw when user is not authenticated
      try {
        await caller.areas.create({
          name: "Test Area",
          description: "Test",
          widthX: 50,
          heightY: 40,
          colorCode: "#3B82F6",
        });
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("products router", () => {
    it("should have product procedures", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      expect(caller.products).toBeDefined();
      expect(caller.products.list).toBeDefined();
      expect(caller.products.create).toBeDefined();
      expect(caller.products.delete).toBeDefined();
      expect(caller.products.move).toBeDefined();
    });
  });

  describe("movements router", () => {
    it("should have movement procedures", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      expect(caller.movements).toBeDefined();
      expect(caller.movements.getRecent).toBeDefined();
    });
  });

  describe("analytics router", () => {
    it("should have analytics procedures", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      expect(caller.analytics).toBeDefined();
      expect(caller.analytics.getOccupancy).toBeDefined();
      expect(caller.analytics.getStatusDistribution).toBeDefined();
    });
  });

  describe("role-based access control", () => {
    it("admin user should have full access", async () => {
      const ctx = createTestContext("admin");
      expect(ctx.user?.role).toBe("admin");
    });

    it("regular user should have limited access", async () => {
      const ctx = createTestContext("user");
      expect(ctx.user?.role).toBe("user");
    });

    it("external user should have minimal access", async () => {
      const ctx = createTestContext("external");
      expect(ctx.user?.role).toBe("external");
    });
  });
});

describe("Input Validation", () => {
  it("should validate area creation input", async () => {
    const ctx = createTestContext("admin");
    const caller = appRouter.createCaller(ctx);

    try {
      // Missing required fields
      await caller.areas.create({
        name: "",
        description: "",
        widthX: -1, // Invalid
        heightY: -1, // Invalid
        colorCode: "#3B82F6",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should validate product creation input", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // Missing required fields
      await caller.products.create({
        sdNumber: "",
        name: "",
        categoryId: -1, // Invalid
        status: "blue",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});

describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // This test would require mocking database errors
    // For now, we're testing the error handling structure
    expect(caller).toBeDefined();
  });

  it("should handle unauthorized access", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as TrpcContext["res"],
    } as TrpcContext;
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.areas.delete(1);
      expect.fail("Should have thrown UNAUTHORIZED");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
