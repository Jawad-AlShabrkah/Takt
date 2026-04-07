# Deployment Guide - Takt Factory Floor Management

This guide provides step-by-step instructions for deploying the Takt application to Vercel.

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier available)
- Database provider (MySQL/TiDB or Turso)
- OAuth credentials (if using Manus OAuth)

## Step 1: Prepare Your Database

### Option A: Using Turso (Recommended for Vercel)

1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database
3. Get your connection string:
   ```
   libsql://[database-name]-[username].turso.io?authToken=[token]
   ```
4. Update `drizzle/schema.ts` to use Turso driver (if needed)

### Option B: Using MySQL/TiDB

1. Set up a MySQL-compatible database (AWS RDS, TiDB Cloud, etc.)
2. Get your connection string:
   ```
   mysql://user:password@host:port/database
   ```
3. Ensure the database is accessible from Vercel (whitelist Vercel IPs)

### Option C: Using Vercel Postgres

1. In Vercel dashboard, create a Postgres database
2. Copy the connection string
3. Update schema to use PostgreSQL driver

## Step 2: Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Find and select your GitHub repository
5. Click "Import"

### Method 2: Using Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to connect your GitHub repository.

## Step 3: Configure Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables

Add the following variables:

### Required Variables

```
DATABASE_URL=your-database-connection-string
JWT_SECRET=generate-a-secure-random-string-min-32-chars
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-oauth-open-id
```

### Optional Variables

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_ANALYTICS_ENDPOINT=your-analytics-url
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_APP_TITLE=Takt Factory Floor Management
VITE_APP_LOGO=https://your-logo-url.png
```

### Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Run Database Migrations

After deployment, you need to run migrations on the production database.

### Option 1: Using Vercel CLI

```bash
vercel env pull
pnpm db:push
```

### Option 2: Manual Migration

1. Connect to your production database
2. Run the migration SQL files from `drizzle/migrations/`
3. Or use Drizzle Kit:
   ```bash
   DATABASE_URL=your-prod-url pnpm drizzle-kit migrate
   ```

## Step 5: Seed Production Data (Optional)

If you want to pre-populate areas and categories:

```bash
DATABASE_URL=your-prod-url node scripts/seed.mjs
```

## Step 6: Verify Deployment

1. Go to your Vercel project URL
2. Test the login flow
3. Create a test product and area
4. Verify the factory floor visualization loads
5. Test drag-and-drop functionality

## Post-Deployment Configuration

### 1. Configure Custom Domain

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 2. Enable HTTPS

Vercel automatically provides HTTPS with free SSL certificates.

### 3. Set Up Monitoring

- Enable Vercel Analytics
- Configure error tracking (Sentry, etc.)
- Set up database monitoring

### 4. Configure Backups

For production database:
- Enable automated backups
- Test restore procedures
- Document backup schedule

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure all dependencies are in package.json
- Run `pnpm install` locally and commit lock file

**Error: "Database connection failed"**
- Verify DATABASE_URL is correct
- Check database is accessible from Vercel IPs
- Test connection locally first

### Runtime Errors

**OAuth login not working**
- Verify VITE_APP_ID is correct
- Check OAuth redirect URLs are configured
- Ensure OAUTH_SERVER_URL is accessible

**Products not loading**
- Check database migrations were applied
- Verify DATABASE_URL in Vercel env vars
- Check database permissions

### Performance Issues

**Slow page loads**
- Enable Vercel Edge Caching
- Optimize database queries
- Check for N+1 query problems

## Monitoring & Maintenance

### Daily Checks

- Monitor error logs in Vercel dashboard
- Check database performance
- Verify backups are running

### Weekly Tasks

- Review analytics
- Check for security updates
- Test disaster recovery

### Monthly Tasks

- Review performance metrics
- Update dependencies
- Audit access logs

## Scaling Considerations

### When to Scale Up

- Database reaching capacity limits
- API response times > 500ms
- Memory usage consistently > 80%

### Scaling Options

1. **Database**: Upgrade to larger instance or add read replicas
2. **API**: Vercel automatically scales with serverless functions
3. **Frontend**: Leverage Vercel's Edge Network for faster delivery

## Rollback Procedure

If deployment has issues:

1. Go to Vercel dashboard → Deployments
2. Find the previous working deployment
3. Click "Promote to Production"
4. Verify the application works
5. Investigate the failed deployment

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] Database has strong passwords
- [ ] HTTPS is enabled
- [ ] Database backups are configured
- [ ] Access logs are monitored
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] SQL injection prevention is in place

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io)
- [Turso Documentation](https://docs.turso.tech)

## Common Commands

```bash
# Check for TypeScript errors
pnpm check

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Generate database migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Seed database
node scripts/seed.mjs
```

## Next Steps

1. Deploy to Vercel
2. Configure custom domain
3. Set up monitoring and alerts
4. Configure backups
5. Document your deployment
6. Train team on deployment procedures
