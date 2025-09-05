# 🚀 TrustDiner Full-Stack Deployment Instructions

## Step 1: Create New GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"New Repository"**
3. Name: `trustdiner-fullstack`
4. Make it **Public** (required for free Vercel)
5. **Don't** initialize with README
6. Click **"Create Repository"**

## Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
git remote add origin https://github.com/jacobpayne89/trustdiner-fullstack.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. **Import** your `trustdiner-fullstack` repository
4. Vercel will auto-detect Next.js and the `vercel.json` configuration
5. Click **"Deploy"**

## What You'll Get

**Complete TrustDiner Web Application:**
- 🗺️ **Interactive Google Maps** with restaurant markers
- 🏪 **Restaurant Cards** with detailed allergen information
- 🔍 **Search & Filter** by allergens, ratings, location
- 📱 **Mobile Responsive** design
- ✅ **5 Sample Restaurants** with real data
- 🚀 **Professional UI** ready for stakeholder demos

**Live URLs (after deployment):**
- **Main App**: `https://trustdiner-fullstack.vercel.app/`
- **API Health**: `https://trustdiner-fullstack.vercel.app/health`
- **API Data**: `https://trustdiner-fullstack.vercel.app/api/establishments`

## Optional: Custom Domain

After deployment, add `trustdiner.com`:
1. **Project Settings** → **Domains**
2. Add: `trustdiner.com`
3. **In Porkbun DNS**: Point to Vercel

---

**This will give you the COMPLETE TrustDiner web application, not just the API!**
