#!/bin/bash

# TrustDiner Frontend Cleanup Script
# Fixes corrupted Next.js build cache and missing webpack chunks

echo "🧼 TrustDiner Frontend Cleanup & Rebuild"
echo "========================================"

# Step 1: Kill any running frontend servers
echo "✅ Step 1: Killing running servers..."
pkill -f "next dev" || true
pkill -f "node" || true
sleep 2

# Step 2: Remove all build artifacts and caches
echo "🔥 Step 2: Removing build artifacts and caches..."
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.cache
rm -f package-lock.json
rm -f .eslintcache

# Step 3: Clean install dependencies
echo "📦 Step 3: Clean installing dependencies..."
npm install

# Step 4: Build the frontend
echo "🏗️ Step 4: Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build completed successfully!"
    echo ""
    echo "🚀 To start the frontend:"
    echo "   npm run start"
    echo ""
    echo "🌐 Then visit: http://localhost:3000"
else
    echo "❌ Frontend build failed!"
    exit 1
fi
