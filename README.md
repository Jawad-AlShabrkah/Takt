# Takt - GIS Factory Floor Management System

A production-ready web application for visualizing and managing GIS (Gas Insulated Switchgear) products across factory floor areas. Built with Next.js, React, Tailwind CSS, and Drizzle ORM.

## Features

- **Interactive 2D Factory Floor Visualization**: Real-time canvas-based visualization of factory areas and products
- **Drag-and-Drop Product Movement**: Intuitive interface for moving products between areas with real-time updates
- **Product Management**: Create, edit, and delete products with metadata tracking (SD Number, Sales Number, status, comments)
- **Area Management**: Configure factory zones with custom dimensions, colors, and capacity limits
- **Dashboard Analytics**: View occupancy metrics, product status distribution, and recent activity
- **Role-Based Access Control**: Internal mode (full visibility) and external mode (limited visibility for partners)
- **Movement Audit Trail**: Complete history of all product movements with timestamps and user attribution
- **Responsive Design**: Mobile-friendly interface optimized for tablets and desktops

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, TypeScript
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL/TiDB with Drizzle ORM
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL/TiDB database (or Turso for libSQL)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd takt-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URL and other configuration values.

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Seed initial data (optional)**
   ```bash
   node scripts/seed.mjs
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
takt-app/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts
│   │   ├── lib/              # Utilities and tRPC client
│   │   └── index.css         # Global styles with Tailwind
│   └── public/               # Static assets
├── server/                    # Backend Express server
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database query helpers
│   └── _core/                # Framework-level code
├── drizzle/                  # Database schema and migrations
│   ├── schema.ts             # Table definitions
│   └── migrations/           # SQL migration files
├── scripts/                  # Utility scripts
│   └── seed.mjs              # Database seeding script
├── shared/                   # Shared types and constants
└── package.json              # Project dependencies
```

## Database Schema

### Tables

- **users**: User accounts with OAuth integration
- **areas**: Factory floor zones/areas with dimensions and capacity
- **products**: GIS products with status tracking
- **product_categories**: Product types and dimensions
- **movements**: Audit trail of all product movements
- **visibility_rules**: Role-based data visibility configuration

## API Endpoints

All API routes are implemented as tRPC procedures under `/api/trpc`:

### Areas
- `areas.list` - Get all active areas
- `areas.getById` - Get area by ID
- `areas.create` - Create new area (admin only)
- `areas.update` - Update area (admin only)
- `areas.delete` - Delete area (admin only)

### Products
- `products.list` - Get products with optional filters
- `products.getById` - Get product by ID
- `products.getBySDNumber` - Get product by SD Number
- `products.create` - Create new product
- `products.update` - Update product
- `products.delete` - Delete product (admin only)
- `products.move` - Move product to new position/area
- `products.updateStatus` - Change product status

### Analytics
- `analytics.getOccupancy` - Get area occupancy metrics
- `analytics.getStatusDistribution` - Get product status counts

### Movements
- `movements.getProductHistory` - Get movement history for a product
- `movements.getRecent` - Get recent movements

## Authentication

The application uses OAuth for authentication (Manus OAuth by default). Users must log in to access the application. The authentication flow is handled automatically by the framework.

### User Roles

- **admin**: Full access to all features including area and product management
- **user**: Can create and move products, view all data
- **external**: Limited visibility - can only see product positions and status, not metadata

## Role-Based Visibility

The application implements two visibility modes:

### Internal Mode (admin/user)
- Full access to all product metadata
- Can see SD Numbers, Sales Numbers, and comments
- Can view movement history and audit trails
- Can manage areas and products

### External Mode (external role)
- Limited to product positions and status colors
- Confidential fields (SD Number, Sales Numbers, comments) are hidden
- Cannot access movement history
- Cannot modify any data

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import the GitHub repository
   - Configure environment variables in Vercel dashboard
   - Deploy

3. **Configure Database**
   - Ensure DATABASE_URL is set in Vercel environment
   - Run migrations: `pnpm db:push`

### Environment Variables for Production

Set these in your Vercel project settings:

- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Secure random string (min 32 characters)
- `VITE_APP_ID`: OAuth application ID
- `OAUTH_SERVER_URL`: OAuth server URL
- `OWNER_NAME`: Application owner name
- `OWNER_OPEN_ID`: Owner's OAuth ID
- Other API keys and configuration values

## Development Guidelines

### Adding New Features

1. **Update Database Schema**
   - Edit `drizzle/schema.ts`
   - Run `pnpm drizzle-kit generate`
   - Review generated migration
   - Run `pnpm drizzle-kit migrate`

2. **Add Database Helpers**
   - Implement query functions in `server/db.ts`

3. **Create API Routes**
   - Add procedures to `server/routers.ts`
   - Use tRPC for type-safe API definitions

4. **Build UI Components**
   - Create components in `client/src/components/`
   - Use shadcn/ui components for consistency
   - Call tRPC procedures from React components

### Code Style

- Use TypeScript for type safety
- Follow Tailwind CSS utility-first approach
- Use shadcn/ui components for UI elements
- Keep components focused and reusable

## Testing

Run tests with:
```bash
pnpm test
```

Tests are located in `server/*.test.ts` files using Vitest.

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database credentials
- Ensure database is accessible from your network

### OAuth Login Issues
- Verify VITE_APP_ID is correct
- Check OAUTH_SERVER_URL is accessible
- Ensure redirect URLs are configured in OAuth provider

### Build Errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf .next dist`
- Run type check: `pnpm check`

## Performance Optimization

- Factory floor canvas rendering is optimized for large numbers of products
- Database queries use indexes for fast lookups
- API responses use caching where appropriate
- Frontend uses React Query for efficient data fetching

## Security

- All API routes require authentication except public procedures
- Role-based access control prevents unauthorized access
- Sensitive data is filtered based on user role
- Passwords and secrets are never logged or exposed

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new functionality
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

## Deployment Checklist

- [ ] Database configured and migrations applied
- [ ] Environment variables set in production
- [ ] OAuth provider configured
- [ ] SSL/HTTPS enabled
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
