/* delete-test-user.ts — QA cleanup: remove the temporary nav-check user. */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  /* attempts/tests reference the user — clear dependants first */
  const user = await db.user.findUnique({
    where: { email: "qa-nav-check@themindcode.test" },
  });
  if (!user) {
    console.log("already gone");
    await db.$disconnect();
    return;
  }
  await db.testAttempt.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
  console.log("deleted", user.email);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
