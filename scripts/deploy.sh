#!/bin/bash
# deploy.sh — rebuild + restart the production server. Run after code changes.
set -e
cd /home/z/my-project
echo "▶ building..."
if ! bun run build > build.log 2>&1; then
  echo "✗ build failed:"; tail -25 build.log; exit 1
fi
echo "✓ build ok"
echo "▶ restarting..."
pkill -f "standalone/server.js" 2>/dev/null || true
sleep 1
bash scripts/ensure-server.sh
