# GitHub Setup & Deployment Guide

This guide explains how to push the Takt application to GitHub and deploy it on Vercel.

## Prerequisites

- GitHub account
- Git installed locally
- GitHub CLI (optional but recommended)
- Vercel account

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to [github.com/new](https://github.com/new)
2. Enter repository name: `takt` or `takt-app`
3. Choose visibility: **Public** (recommended for open source) or **Private**
4. Do NOT initialize with README (we already have one)
5. Click "Create repository"

### Option B: Using GitHub CLI

```bash
gh repo create takt-app --public --source=. --remote=origin --push
```

## Step 2: Initialize Git Locally

If not already a git repository:

```bash
cd /home/ubuntu/takt-app
git init
git add .
git commit -m "Initial commit: Complete Takt GIS Factory Floor Management system"
```

## Step 3: Add Remote Repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/takt-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 4: Verify Repository

1. Go to your GitHub repository URL
2. Verify all files are present
3. Check that README.md displays correctly
4. Confirm no sensitive files are exposed (check `.gitignore`)

## Step 5: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Find and select your GitHub repository
5. Configure project settings:
   - **Framework**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Option B: Using Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to connect your GitHub repository.

## Step 6: Configure Environment Variables

In Vercel dashboard:

1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add all required variables:

```
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

See [ENV_SETUP.md](./ENV_SETUP.md) for complete list.

## Step 7: Deploy

### Automatic Deployment

Once connected, Vercel automatically deploys on every push to `main`:

```bash
# Make changes locally
git add .
git commit -m "Feature: Add new functionality"
git push origin main

# Vercel automatically builds and deploys
```

### Manual Deployment

```bash
vercel deploy --prod
```

## Step 8: Verify Deployment

1. Go to your Vercel project dashboard
2. Check deployment status (should show "Ready")
3. Click the preview URL to test the application
4. Test key functionality:
   - Login flow
   - Create area
   - Create product
   - Drag product on factory floor
   - View dashboard

## Step 9: Configure Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update OAuth redirect URLs if needed

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure `pnpm-lock.yaml` is committed
- Run `pnpm install` locally first
- Commit lock file: `git add pnpm-lock.yaml && git commit -m "Update lock file"`

**Error: "Database connection failed"**
- Verify DATABASE_URL is correct in Vercel env vars
- Check database is accessible from Vercel IPs
- Test connection locally first

### Deployment Stuck

- Check Vercel build logs: Dashboard → Deployments → Click deployment → View logs
- Look for error messages
- Common issues: missing env vars, database connection, build errors

### OAuth Not Working

- Verify VITE_APP_ID is correct
- Check OAuth provider configuration
- Ensure redirect URLs include your Vercel domain
- Test locally first with dev credentials

## Continuous Deployment

### Automatic Deployments

Every push to `main` automatically triggers a deployment:

```bash
git push origin main  # Vercel builds and deploys automatically
```

### Preview Deployments

Every pull request creates a preview deployment:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR on GitHub - Vercel creates preview URL
```

## Monitoring

### View Deployment Status

```bash
vercel ls                    # List all deployments
vercel inspect [url]         # Inspect specific deployment
vercel logs [deployment-url] # View deployment logs
```

### Enable Analytics

1. In Vercel dashboard → Analytics
2. Enable Web Analytics
3. View performance metrics

## Rollback

If deployment has issues:

1. Go to Vercel dashboard → Deployments
2. Find the previous working deployment
3. Click "Promote to Production"
4. Verify the application works

## Git Workflow

### Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# ...

# Commit changes
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub
# After review, merge to main
git checkout main
git pull origin main

# Vercel automatically deploys
```

### Bug Fixes

```bash
git checkout -b fix/bug-name
# Fix the bug
git add .
git commit -m "fix: Resolve bug description"
git push origin fix/bug-name
# Create PR, review, merge
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use strong JWT_SECRET** - Generate with crypto
3. **Enable branch protection** - Require PR reviews before merge
4. **Use private repository** - If handling sensitive data
5. **Rotate secrets regularly** - Especially in production
6. **Monitor deployments** - Check logs for errors

## GitHub Settings

### Branch Protection

1. Go to repository Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date

### Secrets Management

1. Go to Settings → Secrets and variables → Actions
2. Add any secrets needed for CI/CD
3. Never commit secrets to repository

## Useful Commands

```bash
# Check git status
git status

# View commit history
git log --oneline

# View changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View remote URL
git remote -v

# Update from remote
git fetch origin
git pull origin main

# Create and switch to branch
git checkout -b feature/name

# Delete local branch
git branch -d feature/name

# Delete remote branch
git push origin --delete feature/name
```

## Next Steps

1. Push code to GitHub
2. Configure Vercel deployment
3. Set environment variables
4. Test deployment
5. Monitor application
6. Set up monitoring/alerts
7. Document deployment process
8. Train team on deployment

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Documentation](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)

## Deployment Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] OAuth configured
- [ ] Deployment successful
- [ ] Application tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Team access configured
