# Takt Architecture Documentation

## System Overview

Takt is a full-stack factory floor management system built with a modern web stack. It provides real-time visualization and control of GIS (Gas Insulated Switchgear) products across factory areas.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pages: Home, Dashboard, FactoryFloor, Products, Areas   │  │
│  │ Components: Navigation, Cards, Forms, Canvas            │  │
│  │ State: React Query (tRPC), React Context                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ tRPC
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Express + tRPC)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routers: areas, products, movements, analytics, auth    │  │
│  │ Middleware: Auth, CORS, Error Handling                  │  │
│  │ Context: User, Database Connection                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌─────────────────────────────────────────────────────────────────┐
│                    Database (MySQL/TiDB)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tables: users, areas, products, movements, categories   │  │
│  │ ORM: Drizzle with type-safe queries                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom design tokens
- **State Management**: React Query (via tRPC)
- **Routing**: Wouter (lightweight router)
- **UI Components**: shadcn/ui
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4
- **API**: tRPC 11 (type-safe RPC)
- **ORM**: Drizzle ORM
- **Authentication**: OAuth (Manus)
- **Validation**: Zod

### Database
- **Primary**: MySQL/TiDB
- **Alternative**: Turso (libSQL)
- **Migrations**: Drizzle Kit

### Deployment
- **Platform**: Vercel
- **CI/CD**: GitHub Actions (optional)
- **Package Manager**: pnpm

## Data Model

### Core Entities

#### User
```typescript
{
  id: number (PK)
  openId: string (unique, OAuth ID)
  name: string
  email: string
  role: 'admin' | 'user' | 'external'
  createdAt: timestamp
  updatedAt: timestamp
  lastSignedIn: timestamp
}
```

#### Area
```typescript
{
  id: number (PK)
  name: string
  description: string
  widthX: decimal (grid units)
  heightY: decimal (grid units)
  colorCode: string (hex color)
  maxCapacity: number (optional)
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Product
```typescript
{
  id: number (PK)
  sdNumber: string (unique, identifier)
  salesNumber: string (optional)
  name: string
  categoryId: number (FK)
  status: 'blue' | 'yellow' | 'green'
  comments: string
  quantity: number
  currentAreaId: number (FK, nullable)
  positionX: decimal (nullable, grid coordinates)
  positionY: decimal (nullable, grid coordinates)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Movement
```typescript
{
  id: number (PK)
  productId: number (FK)
  fromAreaId: number (FK, nullable)
  toAreaId: number (FK, nullable)
  fromPositionX: decimal (nullable)
  fromPositionY: decimal (nullable)
  toPositionX: decimal (nullable)
  toPositionY: decimal (nullable)
  userId: number (FK)
  notes: string
  createdAt: timestamp
}
```

#### ProductCategory
```typescript
{
  id: number (PK)
  mainCategory: string ('Bay' | 'SPU')
  subCategory: string ('ELK-04', 'ELK-04C', etc.)
  widthX: decimal (default dimensions)
  heightY: decimal (default dimensions)
  description: string
  isActive: boolean
}
```

#### VisibilityRule
```typescript
{
  id: number (PK)
  role: 'admin' | 'user' | 'external'
  visibleFields: string (comma-separated field names)
  canEdit: boolean
  canDelete: boolean
  canViewHistory: boolean
}
```

## API Architecture

### tRPC Routers

All API routes are implemented as tRPC procedures under `/api/trpc`:

#### areas Router
- `list()` - Get all active areas
- `getById(id)` - Get area by ID
- `create(data)` - Create new area (admin)
- `update(id, data)` - Update area (admin)
- `delete(id)` - Delete area (admin)

#### products Router
- `list(filters)` - Get products with optional filters
- `getById(id)` - Get product by ID
- `getBySDNumber(sdNumber)` - Get product by SD Number
- `create(data)` - Create new product
- `update(id, data)` - Update product
- `delete(id)` - Delete product (admin)
- `move(data)` - Move product to new position/area
- `updateStatus(id, status)` - Change product status

#### movements Router
- `getProductHistory(productId)` - Get movement history
- `getRecent(limit)` - Get recent movements

#### analytics Router
- `getOccupancy()` - Get area occupancy metrics
- `getStatusDistribution()` - Get product status counts

#### auth Router
- `me()` - Get current user
- `logout()` - Clear session

## Frontend Architecture

### Page Structure

```
App.tsx (Main router)
├── Home (Landing/Welcome)
├── Dashboard (Metrics & Analytics)
├── FactoryFloor (2D Canvas Visualization)
├── ProductManagement (CRUD Interface)
├── AreaManagement (Zone Management)
└── NotFound (404)
```

### Component Hierarchy

```
Navigation (Header)
├── Logo
├── Nav Items
└── User Menu

Page Components
├── Header
├── Filters/Controls
├── Main Content
│   ├── Cards
│   ├── Tables
│   ├── Forms
│   └── Charts
└── Modals/Dialogs
```

### State Management

- **Server State**: React Query (via tRPC hooks)
- **UI State**: React useState
- **Theme State**: React Context (ThemeProvider)
- **Auth State**: useAuth hook

## Backend Architecture

### Request Flow

```
Client Request
    ↓
Vite Dev Server / Vercel Function
    ↓
Express Middleware
├── CORS
├── Body Parser
└── Error Handler
    ↓
tRPC Router
├── Input Validation (Zod)
├── Auth Check (protectedProcedure)
├── Role Check (if needed)
└── Database Query
    ↓
Drizzle ORM
    ↓
Database
    ↓
Response (SuperJSON serialization)
```

### Authentication Flow

```
1. User clicks "Login"
2. Redirect to OAuth provider
3. User authenticates
4. OAuth callback to /api/oauth/callback
5. Create/update user in database
6. Set session cookie
7. Redirect to dashboard
```

### Authorization

- **Public Procedures**: No auth required
- **Protected Procedures**: User must be logged in
- **Admin Procedures**: User must have admin role
- **Role-Based Filtering**: Data filtered based on user role

## Database Schema Design

### Relationships

```
User (1) ──→ (N) Movement
Area (1) ──→ (N) Product
Area (1) ──→ (N) Movement
Product (1) ──→ (N) Movement
ProductCategory (1) ──→ (N) Product
VisibilityRule (1) ──→ (N) User (implicit via role)
```

### Indexes

- `users.openId` (unique)
- `products.sdNumber` (unique)
- `products.currentAreaId`
- `movements.productId`
- `movements.createdAt`

## Deployment Architecture

### Vercel Deployment

```
GitHub Repository
    ↓
Vercel Build
├── Install dependencies
├── Build frontend (Vite)
├── Build backend (esbuild)
└── Generate output
    ↓
Vercel Deployment
├── Static assets → CDN
├── API functions → Serverless
└── Environment variables → Runtime
    ↓
Production URL
```

### Environment Configuration

```
Development
├── Local database
├── Hot reload (Vite)
└── Debug logging

Production
├── Cloud database (MySQL/TiDB/Turso)
├── Optimized builds
└── Error tracking
```

## Security Architecture

### Authentication
- OAuth integration (Manus)
- Session cookies (JWT)
- HTTPS only

### Authorization
- Role-based access control (RBAC)
- Procedure-level checks
- Data-level filtering

### Data Protection
- Sensitive fields hidden based on role
- SQL injection prevention (Drizzle ORM)
- CORS configuration
- Rate limiting (optional)

## Performance Optimization

### Frontend
- Code splitting (Vite)
- React Query caching
- Lazy loading of components
- Canvas optimization for large datasets

### Backend
- Database query optimization
- Connection pooling
- Response caching
- Efficient data serialization (SuperJSON)

### Database
- Indexed queries
- Query optimization
- Connection limits

## Scalability Considerations

### Horizontal Scaling
- Stateless API (Vercel serverless)
- Database replication
- CDN for static assets

### Vertical Scaling
- Database instance upgrade
- Increased memory/CPU
- Connection pool tuning

### Caching Strategy
- Browser caching (static assets)
- Query result caching
- Database query caching

## Monitoring & Observability

### Logging
- Server logs (Express)
- Client logs (Browser console)
- Database query logs

### Metrics
- API response times
- Database query performance
- Error rates
- User activity

### Alerts
- Deployment failures
- Database connection issues
- High error rates
- Performance degradation

## Development Workflow

### Local Development
```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server
pnpm check        # Type check
pnpm test         # Run tests
```

### Database Changes
```bash
# Update schema
# ↓
pnpm drizzle-kit generate  # Generate migration
# ↓
# Review migration SQL
# ↓
pnpm drizzle-kit migrate   # Apply migration
```

### Feature Development
```bash
1. Update database schema (if needed)
2. Add database helpers (server/db.ts)
3. Create API routes (server/routers.ts)
4. Build UI components (client/src/pages/)
5. Write tests (server/*.test.ts)
6. Test locally
7. Commit and push
```

## Future Enhancements

- Real-time updates (WebSocket)
- Advanced analytics
- Mobile app
- Batch operations
- Workflow automation
- Integration APIs
- Custom reports
