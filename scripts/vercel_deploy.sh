#!/usr/bin/env bash
# vercel_deploy.sh — link project, sync env vars from .env, deploy to prod.
# Token lives in /tmp/vt (0600), never printed, never committed.
set -euo pipefail
cd /home/z/my-project
export PATH="/home/z/.npm-global/bin:$PATH"
T="$(cat /tmp/vt)"

echo "== link project =="
vercel link --yes --project themindcode --token="$T" 2>&1 | tail -2

echo "== sync env vars (values never echoed) =="
python3 - <<'PY' > /tmp/env_pairs.txt
keys = ["DATABASE_URL","AUTH_SECRET","NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY","NEXT_PUBLIC_CLERK_SIGN_IN_URL","NEXT_PUBLIC_CLERK_SIGN_UP_URL"]
for line in open("/home/z/my-project/.env"):
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line: continue
    k, v = line.split("=", 1)
    if k in keys and v:
        print(k + "\t" + v)
PY
while IFS=$'\t' read -r k v; do
  vercel env rm "$k" production --yes --token="$T" >/dev/null 2>&1 || true
  printf '%s' "$v" | vercel env add "$k" production --token="$T" >/dev/null 2>&1 && echo "  set: $k"
done < /tmp/env_pairs.txt
rm -f /tmp/env_pairs.txt

echo "== deploy to production =="
vercel deploy --prod --yes --token="$T" 2>&1 | tail -25
