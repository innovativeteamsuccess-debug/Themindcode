/* make-test-session.ts — QA helper: create a temporary test user in the
   real DB and mint a genuine signed session cookie (same HMAC flow as
   /api/auth/google/callback) so the navbar's signed-in state can be
   verified end-to-end. Prints "id<TAB>cookie". Cleanup: delete-test-user.ts */
import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: "qa-nav-check@themindcode.test" },
    update: { name: "Nav Check Student" },
    create: {
      email: "qa-nav-check@themindcode.test",
      name: "Nav Check Student",
      googleId: "qa-nav-check",
    },
  });

  const payload = Buffer.from(
    JSON.stringify({ uid: user.id, exp: Date.now() + 60 * 60 * 1000 })
  ).toString("base64url");
  const sig = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(payload)
    .digest("base64url");

  console.log(`${user.id}\t${payload}.${sig}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
