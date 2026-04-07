# Takt API Reference

Complete documentation of all tRPC endpoints available in the Takt application.

## Overview

All API endpoints are implemented as tRPC procedures under `/api/trpc`. The API uses type-safe RPC with automatic client generation from server definitions.

## Authentication

### Public Procedures

No authentication required. Available to all users.

### Protected Procedures

Requires authentication. User must be logged in.

### Admin Procedures

Requires admin role. Only administrators can access.

## Areas API

### areas.list

Get all active factory areas.

**Type**: Public Query

**Parameters**: None

**Response**:
```typescript
Array<{
  id: number;
  name: string;
  description: string;
  widthX: number;
  heightY: number;
  colorCode: string;
  maxCapacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Example**:
```typescript
const areas = await trpc.areas.list.useQuery();
```

### areas.getById

Get a specific area by ID.

**Type**: Public Query

**Parameters**:
- `id: number` - Area ID

**Response**:
```typescript
{
  id: number;
  name: string;
  description: string;
  widthX: number;
  heightY: number;
  colorCode: string;
  maxCapacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} | null
```

**Example**:
```typescript
const area = await trpc.areas.getById.useQuery({ id: 1 });
```

### areas.create

Create a new factory area.

**Type**: Protected Mutation (Admin)

**Parameters**:
```typescript
{
  name: string;              // Required, min 1 char
  description: string;       // Required, min 1 char
  widthX: number;           // Required, > 0
  heightY: number;          // Required, > 0
  colorCode: string;        // Required, hex color
  maxCapacity?: number;     // Optional, > 0
}
```

**Response**:
```typescript
{
  id: number;
  name: string;
  description: string;
  widthX: number;
  heightY: number;
  colorCode: string;
  maxCapacity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```typescript
const newArea = await trpc.areas.create.useMutation({
  name: "Production Zone A",
  description: "Main assembly line",
  widthX: 100,
  heightY: 50,
  colorCode: "#3B82F6",
  maxCapacity: 50
});
```

### areas.update

Update an existing area.

**Type**: Protected Mutation (Admin)

**Parameters**:
```typescript
{
  id: number;
  data: {
    name?: string;
    description?: string;
    widthX?: number;
    heightY?: number;
    colorCode?: string;
    maxCapacity?: number | null;
    isActive?: boolean;
  }
}
```

**Response**: Updated area object

**Example**:
```typescript
const updated = await trpc.areas.update.useMutation({
  id: 1,
  data: {
    name: "Updated Zone A",
    maxCapacity: 75
  }
});
```

### areas.delete

Delete an area.

**Type**: Protected Mutation (Admin)

**Parameters**:
- `id: number` - Area ID

**Response**:
```typescript
{ success: boolean }
```

**Example**:
```typescript
await trpc.areas.delete.useMutation({ id: 1 });
```

## Products API

### products.list

Get products with optional filters.

**Type**: Public Query

**Parameters**:
```typescript
{
  areaId?: number;
  status?: 'blue' | 'yellow' | 'green';
  categoryId?: number;
  limit?: number;
  offset?: number;
}
```

**Response**:
```typescript
Array<{
  id: number;
  sdNumber: string;
  salesNumber: string | null;
  name: string;
  categoryId: number;
  status: 'blue' | 'yellow' | 'green';
  comments: string | null;
  quantity: number;
  currentAreaId: number | null;
  positionX: number | null;
  positionY: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

**Example**:
```typescript
const products = await trpc.products.list.useQuery({
  areaId: 1,
  status: 'blue'
});
```

### products.getById

Get a specific product.

**Type**: Public Query

**Parameters**:
- `id: number` - Product ID

**Response**: Product object or null

**Example**:
```typescript
const product = await trpc.products.getById.useQuery({ id: 1 });
```

### products.getBySDNumber

Get product by SD Number.

**Type**: Public Query

**Parameters**:
- `sdNumber: string` - Product SD Number

**Response**: Product object or null

**Example**:
```typescript
const product = await trpc.products.getBySDNumber.useQuery({
  sdNumber: "SD-2024-001"
});
```

### products.create

Create a new product.

**Type**: Protected Mutation

**Parameters**:
```typescript
{
  sdNumber: string;        // Required, unique
  name: string;            // Required
  categoryId: number;      // Required
  status: 'blue' | 'yellow' | 'green';  // Required
  salesNumber?: string;
  comments?: string;
  quantity?: number;
  currentAreaId?: number;
  positionX?: number;
  positionY?: number;
}
```

**Response**: Created product object

**Example**:
```typescript
const product = await trpc.products.create.useMutation({
  sdNumber: "SD-2024-001",
  name: "GIS Bay Unit",
  categoryId: 1,
  status: "blue",
  quantity: 1,
  currentAreaId: 1
});
```

### products.update

Update a product.

**Type**: Protected Mutation

**Parameters**:
```typescript
{
  id: number;
  data: {
    name?: string;
    status?: 'blue' | 'yellow' | 'green';
    comments?: string;
    quantity?: number;
    // ... other fields
  }
}
```

**Response**: Updated product object

**Example**:
```typescript
const updated = await trpc.products.update.useMutation({
  id: 1,
  data: {
    status: "yellow",
    comments: "In quality check"
  }
});
```

### products.delete

Delete a product.

**Type**: Protected Mutation (Admin)

**Parameters**:
- `id: number` - Product ID

**Response**:
```typescript
{ success: boolean }
```

**Example**:
```typescript
await trpc.products.delete.useMutation({ id: 1 });
```

### products.move

Move a product to a new position/area.

**Type**: Protected Mutation

**Parameters**:
```typescript
{
  productId: number;
  newAreaId: number;
  newPositionX: number;
  newPositionY: number;
  notes?: string;
}
```

**Response**:
```typescript
{
  product: Product;
  movement: Movement;
}
```

**Example**:
```typescript
const result = await trpc.products.move.useMutation({
  productId: 1,
  newAreaId: 2,
  newPositionX: 25,
  newPositionY: 30,
  notes: "Moved to storage"
});
```

### products.updateStatus

Update product status.

**Type**: Protected Mutation

**Parameters**:
```typescript
{
  id: number;
  status: 'blue' | 'yellow' | 'green';
}
```

**Response**: Updated product object

**Example**:
```typescript
const updated = await trpc.products.updateStatus.useMutation({
  id: 1,
  status: "green"
});
```

## Movements API

### movements.getProductHistory

Get movement history for a product.

**Type**: Public Query

**Parameters**:
- `productId: number` - Product ID

**Response**:
```typescript
Array<{
  id: number;
  productId: number;
  fromAreaId: number | null;
  toAreaId: number | null;
  fromPositionX: number | null;
  fromPositionY: number | null;
  toPositionX: number | null;
  toPositionY: number | null;
  userId: number;
  notes: string | null;
  createdAt: Date;
}>
```

**Example**:
```typescript
const history = await trpc.movements.getProductHistory.useQuery({
  productId: 1
});
```

### movements.getRecent

Get recent movements.

**Type**: Public Query

**Parameters**:
```typescript
{
  limit?: number;  // Default: 20
  offset?: number; // Default: 0
}
```

**Response**: Array of movement objects

**Example**:
```typescript
const recent = await trpc.movements.getRecent.useQuery({
  limit: 10
});
```

## Analytics API

### analytics.getOccupancy

Get area occupancy metrics.

**Type**: Public Query

**Parameters**: None

**Response**:
```typescript
Array<{
  areaId: number;
  areaName: string;
  totalCapacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  productCount: number;
}>
```

**Example**:
```typescript
const occupancy = await trpc.analytics.getOccupancy.useQuery();
```

### analytics.getStatusDistribution

Get product status distribution.

**Type**: Public Query

**Parameters**: None

**Response**:
```typescript
{
  blue: number;
  yellow: number;
  green: number;
  total: number;
}
```

**Example**:
```typescript
const distribution = await trpc.analytics.getStatusDistribution.useQuery();
```

## Authentication API

### auth.me

Get current user information.

**Type**: Public Query

**Parameters**: None

**Response**:
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'user' | 'external';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | null
```

**Example**:
```typescript
const user = await trpc.auth.me.useQuery();
```

### auth.logout

Logout current user.

**Type**: Public Mutation

**Parameters**: None

**Response**:
```typescript
{ success: boolean }
```

**Example**:
```typescript
await trpc.auth.logout.useMutation();
```

## Error Handling

All API endpoints return standardized error responses:

```typescript
{
  code: string;  // UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR
  message: string;
  data?: any;
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | User not authenticated or insufficient permissions |
| FORBIDDEN | 403 | User authenticated but lacks required role |
| BAD_REQUEST | 400 | Invalid input or validation error |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists or constraint violation |
| INTERNAL_SERVER_ERROR | 500 | Server error |

**Example Error Handling**:
```typescript
try {
  await trpc.areas.create.useMutation({
    name: "",  // Invalid: empty string
    // ...
  });
} catch (error) {
  if (error.code === 'BAD_REQUEST') {
    console.error('Validation error:', error.message);
  }
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production deployments.

## Pagination

List endpoints support pagination:

```typescript
{
  limit?: number;   // Items per page (default: 20, max: 100)
  offset?: number;  // Starting position (default: 0)
}
```

## Filtering

Query endpoints support various filters. See individual endpoint documentation for available filters.

## Sorting

Sorting is not yet implemented. Consider adding for future versions.

## Versioning

API versioning is not currently implemented. All endpoints are considered v1.

## Examples

### Create Area and Add Product

```typescript
// Create area
const area = await trpc.areas.create.useMutation({
  name: "Production Line A",
  description: "Main assembly",
  widthX: 100,
  heightY: 50,
  colorCode: "#3B82F6"
});

// Create product in area
const product = await trpc.products.create.useMutation({
  sdNumber: "SD-2024-001",
  name: "GIS Unit",
  categoryId: 1,
  status: "blue",
  currentAreaId: area.id,
  positionX: 10,
  positionY: 10
});

// Move product
await trpc.products.move.useMutation({
  productId: product.id,
  newAreaId: area.id,
  newPositionX: 50,
  newPositionY: 30
});
```

### Get Dashboard Metrics

```typescript
// Get occupancy
const occupancy = await trpc.analytics.getOccupancy.useQuery();

// Get status distribution
const distribution = await trpc.analytics.getStatusDistribution.useQuery();

// Get recent movements
const recent = await trpc.movements.getRecent.useQuery({ limit: 10 });
```

## Support

For API issues or questions:
- Check [README.md](./README.md) for overview
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review test files for usage examples
