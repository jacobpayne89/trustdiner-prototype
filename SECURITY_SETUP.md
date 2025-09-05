# 🔒 Security Setup for TrustDiner Deployment

## ⚠️ IMPORTANT: Set Environment Variables in Vercel

The deployment uses placeholder values for security. You MUST set these in Vercel Dashboard:

### 1. Go to Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your `trustdiner-prototype` project
3. Go to **Settings** → **Environment Variables**

### 2. Add These Environment Variables

**Required Variables:**
```
GOOGLE_MAPS_API_KEY = [Your actual Google Maps API key]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = [Same Google Maps API key]
JWT_SECRET = [Generate a secure random string]
```

**Optional (already set):**
```
NODE_ENV = production
PROTOTYPE_MODE = true
PORT = 3001
AWS_REGION = eu-west-2
PROTOTYPE_BANNER = true
PROTOTYPE_MESSAGE = This is a prototype version with sample data for demonstration purposes.
NEXT_PUBLIC_API_BASE_URL = (leave empty)
```

### 3. Generate Secure JWT Secret

Use one of these methods to generate a secure JWT secret:

**Option A - Online Generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated string

**Option B - Command Line:**
```bash
openssl rand -base64 32
```

**Option C - Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

### 4. Google Maps API Key Setup

If you don't have a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API**
4. Create credentials → **API Key**
5. **Restrict the API key** to your domain:
   - Application restrictions: **HTTP referrers**
   - Website restrictions: `https://trustdiner-prototype.vercel.app/*`

### 5. Redeploy

After setting environment variables in Vercel:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 🛡️ Security Best Practices Applied

✅ **API keys removed from code**
✅ **Environment variables used instead**  
✅ **Placeholder values in repository**
✅ **Secure JWT secret generation**
✅ **Google Maps API key restrictions**

---

**The app will not work until you set the environment variables in Vercel Dashboard!**
