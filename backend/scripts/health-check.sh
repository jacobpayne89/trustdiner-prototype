#!/bin/bash
# Backend health check script for ECS

set -e

# Check if backend server is responding
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Backend health check passed"
    exit 0
else
    echo "❌ Backend health check failed (HTTP $response)"
    exit 1
fi