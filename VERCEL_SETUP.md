# 🚀 Vercel Deployment Setup Guide

This guide will help you deploy your React e-commerce application to Vercel and configure the CI/CD pipeline.

## Prerequisites

- GitHub repository pushed successfully ✅
- Vercel account (free tier works)
- GitHub Actions workflow already configured ✅

---

## Step 1: Create Vercel Account & Install CLI

### Create Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" for easiest integration
4. Authorize Vercel to access your GitHub account

### Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
```

---

## Step 2: Create New Vercel Project

### Option A: Using Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"

2. **Import Git Repository**
   - Select your GitHub account
   - Find and select `React-Shop-FB-VERCEL` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add all your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_value
   VITE_FIREBASE_AUTH_DOMAIN=your_value
   VITE_FIREBASE_PROJECT_ID=your_value
   VITE_FIREBASE_STORAGE_BUCKET=your_value
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_value
   VITE_FIREBASE_APP_ID=your_value
   VITE_FIREBASE_MEASUREMENT_ID=your_value
   ```
   
   Copy these from your local `.env` file!

5. **Deploy**
   - Click "Deploy"
   - Wait for initial deployment to complete (~2-3 minutes)
   - You'll get a live URL like: `https://your-project.vercel.app`

### Option B: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Navigate to your project
cd "k:/React-Shop-FB GITHUB"

# Link to new or existing project
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID

# Deploy to production
vercel --prod
```

---

## Step 3: Get Vercel Token for GitHub Actions

Your GitHub Actions workflow needs a Vercel token to deploy automatically.

### Get Your Vercel Token

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/account/tokens](https://vercel.com/account/tokens)

2. **Create New Token**
   - Click "Create Token"
   - **Token Name:** `GitHub Actions CI/CD`
   - **Scope:** Select your account/team
   - **Expiration:** Choose duration (recommend: No Expiration for CI/CD)
   - Click "Create Token"

3. **Copy Token**
   - ⚠️ **IMPORTANT:** Copy the token immediately - you won't see it again!
   - Format: `vercel_token_xxxxxxxxxxxxxxxxxxxxx`

---

## Step 4: Add Vercel Token to GitHub Secrets

### Add GitHub Secret

1. **Go to Your GitHub Repository**
   - Visit: `https://github.com/growthwithcoding/React-Shop-FB-VERCEL`

2. **Navigate to Settings**
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"

3. **Add New Repository Secret**
   - Click "New repository secret"
   - **Name:** `VERCEL_TOKEN`
   - **Value:** Paste the token you copied from Vercel
   - Click "Add secret"

### Optional: Add Codecov Token

If you want code coverage reporting:

1. **Get Codecov Token**
   - Go to [codecov.io](https://codecov.io)
   - Sign in with GitHub
   - Add your repository
   - Copy the upload token

2. **Add to GitHub Secrets**
   - **Name:** `CODECOV_TOKEN`
   - **Value:** Your Codecov token
   - Click "Add secret"

---

## Step 5: Verify Automated Deployment

### Trigger GitHub Actions

1. **Make a Small Change**
   ```bash
   # In your local repository
   echo "# Vercel Deployment Active" >> README.md
   git add README.md
   git commit -m "docs: Add Vercel deployment note"
   git push origin main
   ```

2. **Watch GitHub Actions**
   - Go to your repository
   - Click "Actions" tab
   - Watch the workflow run
   - Should see:
     - ✅ Build and Test (runs on Node 18.x and 20.x)
     - ✅ Deploy to Vercel (after tests pass)

3. **Check Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click your project
   - View deployment logs
   - Get your live URL

---

## Step 6: Update README with Live URL

Once deployed, update your README:

```bash
# Get your live URL from Vercel dashboard
# It will look like: https://react-shop-fb-vercel.vercel.app
```

Then update README.md:
```markdown
## 🚀 Live Demo

**🌐 Live Application:** https://your-project.vercel.app

> Try the demo with different user roles!
```

Commit and push:
```bash
git add README.md
git commit -m "docs: Add live Vercel URL"
git push origin main
```

---

## Troubleshooting

### Build Fails on Vercel

**Problem:** Build fails with "Module not found" errors

**Solution:**
1. Check that all dependencies are in `package.json`
2. Verify `package-lock.json` is committed
3. Try rebuilding: `vercel --prod --force`

### Environment Variables Not Working

**Problem:** App can't connect to Firebase

**Solution:**
1. Verify all `VITE_` prefixed variables are set in Vercel
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

### GitHub Actions Deployment Fails

**Problem:** "Error: Vercel token is invalid"

**Solution:**
1. Verify `VERCEL_TOKEN` secret is added correctly
2. Token should start with `vercel_token_`
3. Recreate token if expired
4. Check token has correct scope/permissions

### Tests Failing in CI

**Problem:** Tests pass locally but fail in GitHub Actions

**Solution:**
1. Check Node version compatibility (18.x and 20.x)
2. Verify test dependencies are in `package.json`
3. Run `npm run test:ci` locally to debug
4. Check for environment-specific issues

---

## Configuration Files

### vercel.json (Optional)

Create `vercel.json` in project root for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### .vercelignore (Optional)

Create `.vercelignore` to exclude files from deployment:

```
node_modules
.git
.env
.env.*
coverage
*.test.js
*.test.jsx
__tests__
.github
seeding
```

---

## Success Checklist

- ✅ Vercel account created
- ✅ Project imported from GitHub
- ✅ Environment variables configured
- ✅ Initial deployment successful
- ✅ Vercel token created
- ✅ `VERCEL_TOKEN` added to GitHub Secrets
- ✅ GitHub Actions workflow runs successfully
- ✅ Automated deployment working
- ✅ Live URL accessible
- ✅ README updated with live URL

---

## Next Steps

1. **Custom Domain** (Optional)
   - Buy domain from provider
   - Add to Vercel project settings
   - Configure DNS records

2. **Performance Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking
   - Monitor Core Web Vitals

3. **Preview Deployments**
   - Every PR gets automatic preview URL
   - Test changes before merging
   - Share previews with team

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **GitHub Actions:** https://docs.github.com/en/actions
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html

---

**Congratulations! Your app is now deployed with automated CI/CD! 🎉**
