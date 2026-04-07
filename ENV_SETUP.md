# Environment Variables Setup Guide

This document lists all environment variables required for the Takt application.

## Database Configuration

### DATABASE_URL (Required)

Connection string for your database.

**For MySQL/TiDB:**
```
mysql://username:password@host:port/database_name
```

**For Turso (libSQL):**
```
libsql://[database-name]-[username].turso.io?authToken=[token]
```

**For PostgreSQL (Vercel Postgres):**
```
postgresql://user:password@host:port/database
```

## Authentication & Security

### JWT_SECRET (Required)

Secret key for signing JWT tokens. Must be at least 32 characters.

Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

## OAuth Configuration

### VITE_APP_ID (Required)

Your OAuth application ID from the provider (e.g., Manus).

### OAUTH_SERVER_URL (Required)

Base URL of the OAuth server.

Example:
```
https://api.manus.im
```

### VITE_OAUTH_PORTAL_URL (Required)

OAuth login portal URL for redirecting users.

Example:
```
https://portal.manus.im
```

## Owner Information

### OWNER_NAME (Required)

Name of the application owner.

Example:
```
John Doe
```

### OWNER_OPEN_ID (Required)

OAuth ID of the application owner.

Example:
```
user_12345
```

## Built-in APIs (Optional)

### BUILT_IN_FORGE_API_URL

URL for built-in Forge API services.

Example:
```
https://api.manus.im
```

### BUILT_IN_FORGE_API_KEY

API key for server-side Forge API access.

### VITE_FRONTEND_FORGE_API_URL

URL for frontend Forge API access.

Example:
```
https://api.manus.im
```

### VITE_FRONTEND_FORGE_API_KEY

API key for frontend Forge API access.

## Analytics (Optional)

### VITE_ANALYTICS_ENDPOINT

Analytics service endpoint.

Example:
```
https://analytics.example.com
```

### VITE_ANALYTICS_WEBSITE_ID

Website ID for analytics tracking.

Example:
```
website_12345
```

## Application Configuration

### VITE_APP_TITLE

Application title displayed in the browser and UI.

Example:
```
Takt Factory Floor Management
```

### VITE_APP_LOGO

URL to the application logo.

Example:
```
https://cdn.example.com/logo.png
```

## Node Environment

### NODE_ENV

Environment mode. Set to `production` for production deployments.

Example:
```
production
```

## Local Development Setup

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=mysql://root:password@localhost:3306/takt

# Security
JWT_SECRET=your-secure-random-string-here-min-32-chars

# OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Owner
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Optional
VITE_APP_TITLE=Takt Factory Floor Management
```

## Production Deployment (Vercel)

Set these variables in your Vercel project settings:

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable with its production value
3. Select which environments (Production, Preview, Development) the variable applies to
4. Deploy

### Recommended Production Values

```
DATABASE_URL=<your-production-database-url>
JWT_SECRET=<generate-a-new-secure-random-string>
VITE_APP_ID=<your-production-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_NAME=<your-name>
OWNER_OPEN_ID=<your-open-id>
NODE_ENV=production
```

## Verifying Environment Variables

### Local Development

Check that your `.env.local` file is loaded:

```bash
pnpm dev
# Look for console output confirming database connection
```

### Production (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify all variables are set correctly

## Common Issues

### "DATABASE_URL is not set"

**Solution:** Ensure DATABASE_URL is defined in your `.env.local` or Vercel environment variables.

### "JWT_SECRET is too short"

**Solution:** Generate a new secret with at least 32 characters:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "OAuth login not working"

**Solution:** Verify these variables are correct:
- VITE_APP_ID
- OAUTH_SERVER_URL
- VITE_OAUTH_PORTAL_URL

### "Cannot connect to database"

**Solution:** Check DATABASE_URL format and ensure:
- Database is running
- Credentials are correct
- Network access is allowed (for cloud databases)

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with crypto, at least 32 chars
3. **Rotate secrets regularly** - Especially in production
4. **Use different secrets per environment** - Dev, staging, production
5. **Limit API key permissions** - Use read-only keys where possible
6. **Monitor API usage** - Watch for unusual activity

## Environment-Specific Configuration

### Development
- Use local MySQL/TiDB instance
- Use test OAuth credentials
- Enable verbose logging

### Staging
- Use staging database
- Use staging OAuth credentials
- Enable error tracking

### Production
- Use production database with backups
- Use production OAuth credentials
- Disable debug logging
- Enable monitoring and alerts

## Updating Environment Variables

### Local Development

1. Edit `.env.local`
2. Restart dev server: `pnpm dev`

### Production (Vercel)

1. Go to Vercel dashboard
2. Update variable in **Settings** → **Environment Variables**
3. Redeploy or wait for next deployment

## References

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Node.js Environment Variables](https://nodejs.org/en/docs/guides/nodejs-env-var-intro/)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
