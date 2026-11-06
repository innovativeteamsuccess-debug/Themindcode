/* E2E seed + session mint — writes REAL rows into SQLite and prints a
   valid signed session cookie (same HMAC scheme as src/lib/auth.ts).
   Used only to verify the golden path in the sandbox browser. */
const { PrismaClient } = require("@prisma/client");
const { createHmac } = require("crypto");
const fs = require("fs");

const env = fs.readFileSync("/home/z/my-project/.env", "utf8");
const SECRET = env.match(/AUTH_SECRET=(\S+)/)[1];

const db = new PrismaClient();

function createSessionToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + 30 * 24 * 3600 * 1000 })
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
}

(async () => {
  const user = await db.user.upsert({
    where: { email: "e2e.student@themindcode.in" },
    update: {},
    create: {
      email: "e2e.student@themindcode.in",
      name: "E2E Student",
      googleId: "e2e-verify",
    },
  });

  const questions = [
    {
      q: "SI unit of electric current?",
      options: ["Volt", "Ampere", "Ohm", "Watt"],
      answerIndex: 1,
      explanation: "Current is measured in amperes (A).",
    },
    {
      q: "Which mirror is used in vehicle rear-view mirrors?",
      options: ["Concave", "Convex", "Plane", "Cylindrical"],
      answerIndex: 1,
      explanation: "Convex mirrors give a wider, erect field of view.",
    },
    {
      q: "Light travels fastest in…",
      options: ["Water", "Glass", "Vacuum", "Diamond"],
      answerIndex: 2,
      explanation: "Speed of light is maximum in vacuum (~3×10⁸ m/s).",
    },
  ];

  const test = await db.test.create({
    data: {
      title: "Light — Reflection & Refraction (E2E verify)",
      subject: "Physics",
      cls: 10,
      minutes: 15,
      source: "pdf",
      sourceName: "light-question-bank.pdf",
      questions: JSON.stringify(questions),
      published: true,
    },
  });

  console.log(
    JSON.stringify({
      userId: user.id,
      testId: test.id,
      cookie: createSessionToken(user.id),
    })
  );
  await db.$disconnect();
})().catch((e) => {
  console.error("SEED_ERR", e.message);
  process.exit(1);
});
