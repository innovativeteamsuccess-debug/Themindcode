#!/bin/bash
# test-teach-e2e.sh — create a Clerk test session and run the teaching
# engine end-to-end (server-side). Secrets stay inside this process.
set -e
cd /home/z/my-project
SK=$(grep '^CLERK_SECRET_KEY=' .env | cut -d= -f2)

echo "▶ creating Clerk test user…"
USER_RES=$(curl -s -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer $SK" \
  -H "Content-Type: application/json" \
  -d '{"email_address":["tmc.e2e.learner@mindcode-test.dev"],"password":"Tmc-E2E-Lesson-2026!","first_name":"E2E","last_name":"Learner"}')
USER_ID=$(echo "$USER_RES" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('id') or '')" 2>/dev/null || true)
if [ -z "$USER_ID" ]; then
  # user may already exist from a previous run → look them up
  USER_ID=$(curl -s "https://api.clerk.com/v1/users?email_address=tmc.e2e.learner@mindcode-test.dev" \
    -H "Authorization: Bearer $SK" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if d else '')")
fi
if [ -z "$USER_ID" ]; then echo "✗ could not create/find user"; echo "$USER_RES" | head -c 300; exit 1; fi
echo "  user: $USER_ID"

echo "▶ creating session…"
SESS=$(curl -s -X POST https://api.clerk.com/v1/sessions \
  -H "Authorization: Bearer $SK" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\"}")
SESSION_ID=$(echo "$SESS" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('id') or '')")
if [ -z "$SESSION_ID" ]; then echo "✗ no session"; echo "$SESS" | head -c 300; exit 1; fi

echo "▶ minting session token…"
TOK=$(curl -s -X POST "https://api.clerk.com/v1/sessions/$SESSION_ID/tokens" \
  -H "Authorization: Bearer $SK")
JWT=$(echo "$TOK" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('jwt') or '')")
if [ -z "$JWT" ]; then echo "✗ no jwt"; echo "$SESS" | head -c 300; exit 1; fi
echo "  session ok (jwt ${#JWT} chars)"

echo "▶ running the teaching engine (plan mode)…"
curl -s -X POST http://localhost:3000/api/studio/teach \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$JWT" \
  --max-time 180 \
  -d '{"mode":"plan","config":{"topic":"Ohm s Law and Electricity","curriculum":"CBSE","klass":10,"subject":"Physics","personality":"friendly","examMode":false,"voice":true},"student":{"understanding":55,"pace":0,"struggles":[],"wins":[],"answered":0,"correct":0}}' \
  -o /tmp/teach-plan.json
echo -n "  http body bytes: "; wc -c < /tmp/teach-plan.json
python3 - <<'PY'
import json
d = json.load(open('/tmp/teach-plan.json'))
if not d.get('ok'):
    print("✗ ENGINE ERROR:", json.dumps(d)[:300]); raise SystemExit(1)
plan = d['plan']
steps = plan['steps']
print(f"✓ plan ok — title: {plan['title']!r}, steps: {len(steps)}")
kinds = {}
for s in steps:
    kinds[s['phase']] = kinds.get(s['phase'], 0) + 1
    for a in s['actions']:
        pass
acts = [a['a'] for s in steps for a in s['actions']]
from collections import Counter
print("  phases:", dict(kinds))
print("  actions:", dict(Counter(acts)))
q = [s for s in steps if s.get('question')]
print(f"  question steps: {len(q)}", ("— " + q[0]['question']['text'][:80]) if q else "")
print("  sample say:", steps[0]['say'][:110])
PY
echo "$JWT" > /tmp/tmc-e2e-jwt.txt
echo "$USER_ID" > /tmp/tmc-e2e-userid.txt
echo "done (jwt saved to /tmp/tmc-e2e-jwt.txt)"
