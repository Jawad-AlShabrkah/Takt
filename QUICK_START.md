# Quick Start Guide - Takt Factory Floor Management

Get up and running with Takt in 5 minutes.

## Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL/TiDB database or Turso account

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd takt-app
pnpm install
```

## 2. Configure Database

Create `.env.local`:

```bash
# For local MySQL
DATABASE_URL=mysql://root:password@localhost:3306/takt

# Or for Turso
DATABASE_URL=libsql://[db-name]-[user].turso.io?authToken=[token]
```

## 3. Setup Database

```bash
# Generate and apply migrations
pnpm db:push

# Optional: Seed initial data
node scripts/seed.mjs
```

## 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## 5. Login & Test

1. Click "Get Started" or "Login"
2. Authenticate with your OAuth provider
3. Navigate to Dashboard or Factory Floor
4. Create an area: Areas → New Area
5. Create a product: Products → New Product
6. Drag product on Factory Floor

## Common Commands

```bash
# Type checking
pnpm check

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Format code
pnpm format

# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

## Project Structure

```
takt-app/
├── client/          # React frontend
├── server/          # Express backend + tRPC
├── drizzle/         # Database schema & migrations
├── scripts/         # Utility scripts
└── shared/          # Shared types
```

## Key Files

- `drizzle/schema.ts` - Database tables
- `server/routers.ts` - API endpoints
- `client/src/App.tsx` - Main app component
- `client/src/pages/` - Page components

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL is correct
- Ensure database is running
- Check credentials

### OAuth Login Fails
- Verify VITE_APP_ID environment variable
- Check OAuth provider configuration
- Ensure redirect URLs are whitelisted

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. Read [README.md](./README.md) for full documentation
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Support

- GitHub Issues: Report bugs
- Documentation: See README.md and ARCHITECTURE.md
- Tests: Run `pnpm test` to verify setup

Happy coding! 🚀
