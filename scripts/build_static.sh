#!/usr/bin/env bash
# build_static.sh — produce a GoDaddy-ready static bundle (out/)
# Moves server-only pieces aside, runs `next build` with STATIC_EXPORT=1,
# restores everything, zips the result into download/.
set -euo pipefail
cd /home/z/my-project

restore() {
  [ -d /tmp/api_hidden ]    && mv /tmp/api_hidden src/app/api
  [ -d /tmp/zone_hidden ]   && mv /tmp/zone_hidden "src/app/(site)/zone"
  [ -d /tmp/auth_hidden/sign-in ] && mv /tmp/auth_hidden/sign-in "src/app/(site)/sign-in"
  [ -d /tmp/auth_hidden/sign-up ] && mv /tmp/auth_hidden/sign-up "src/app/(site)/sign-up"
  return 0
}
trap restore EXIT

echo "== hiding server-only routes =="
rm -rf /tmp/api_hidden /tmp/zone_hidden /tmp/auth_hidden
mv src/app/api /tmp/api_hidden
mv "src/app/(site)/zone" /tmp/zone_hidden
# Clerk optional catch-alls cannot be enumerated for export, and auth
# needs a server anyway — excluded from the static bundle.
mkdir -p /tmp/auth_hidden
mv "src/app/(site)/sign-in" /tmp/auth_hidden/
mv "src/app/(site)/sign-up" /tmp/auth_hidden/

echo "== building static export =="
rm -rf out .next-export
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 bun x next build 2>&1 | tail -30

restore
trap - EXIT

echo "== result =="
du -sh out
find out -name "*.html" | head -20
