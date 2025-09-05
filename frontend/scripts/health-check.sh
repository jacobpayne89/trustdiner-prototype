#!/bin/bash
# Frontend health check script for ECS

set -e

# Check if frontend server is responding
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Frontend health check passed"
    exit 0
else
    echo "❌ Frontend health check failed (HTTP $response)"
    exit 1
fi
