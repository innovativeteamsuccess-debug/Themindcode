#!/bin/bash
# ensure-server.sh — keep the PRODUCTION server serving on :3000.
# Called by the keepalive cron every 5 minutes and after every deploy.
cd /home/z/my-project

code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 5 2>/dev/null)
if [ "$code" = "200" ]; then
  echo "server: 200 (production)"
  exit 0
fi

# Port busy with a stale/hung process → clear it before starting.
pkill -f "standalone/server.js" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1

if [ -f .next/BUILD_ID ]; then
  # Production: standalone Next server (bun auto-loads .env from project root).
  rm -f server.log
  setsid nohup env HOSTNAME=0.0.0.0 PORT=3000 bun run start > server.log 2>&1 < /dev/null &
  disown
  mode="production"
else
  # Fallback: no build yet → dev server.
  rm -f dev.log
  setsid nohup bun run dev > dev.log 2>&1 < /dev/null &
  disown
  mode="dev"
fi

for i in $(seq 1 45); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 5 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 2
done
echo "server: $code ($mode)"
[ "$code" = "200" ]
