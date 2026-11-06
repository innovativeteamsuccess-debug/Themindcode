/**
 * Hydration regression test for the Mind Core Universe page.
 *
 * Reproduces the reported bug condition: a user with
 * prefers-reduced-motion: reduce, where framer-motion's useReducedMotion
 * read matchMedia synchronously and reveal.tsx used to render a different
 * tree on the client (shifting every Radix useId).
 *
 * Runs the page twice (default + reduced motion), collects console
 * messages and page errors, and fails if anything hydration-related
 * (or any error) appears.
 */
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");

function isProblematic(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    t.includes("hydrat") ||
    t.includes("didn't match") ||
    t.includes("did not match") ||
    t.includes("mismatch") ||
    t.includes("error") ||
    t.includes("failed to") ||
    t.includes("uncaught")
  );
}

async function runCase(label, options) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  const problems = [];

  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if ((type === "error" || type === "warning") && isProblematic(text)) {
      problems.push(`[console.${type}] ${text.slice(0, 2400)}`);
    }
  });
  page.on("pageerror", (err) => problems.push(`[pageerror] ${String(err).slice(0, 400)}`));

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // let hydration + post-hydration renders settle

  // confirm the emulation actually applied
  const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // sanity: FAQ rows exist with static IDs
  const faqTriggers = await page.evaluate(() => document.querySelectorAll("[id^='faq-trigger-']").length);
  const faqPanels = await page.evaluate(() => document.querySelectorAll("[id^='faq-panel-']").length);
  // radix-generated ids should NOT be present in the FAQ area
  const radixInFaq = await page.evaluate(() => document.querySelectorAll("[id^='radix-']").length);
  // founder figure present
  const founderImg = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img[src='/founder-figure.png']")];
    return imgs.length;
  });

  console.log(`\n=== ${label} ===`);
  console.log(`prefers-reduced-motion: ${reduced}`);
  console.log(`FAQ triggers/panels: ${faqTriggers}/${faqPanels} (expect 4/4)`);
  console.log(`radix-* ids on page: ${radixInFaq}`);
  console.log(`founder figure imgs: ${founderImg} (expect 2: figure + shadow)`);

  if (problems.length) {
    console.log(`PROBLEMS (${problems.length}):`);
    problems.slice(0, 10).forEach((p) => console.log("  " + p));
  } else {
    console.log("PROBLEMS: none ✅");
  }
  await browser.close();
  return problems.length;
}

(async () => {
  let bad = 0;
  bad += await runCase("DEFAULT (motion ok)", {});
  bad += await runCase("REDUCED MOTION (bug reproduction condition)", { reducedMotion: "reduce" });
  console.log("\n==============================");
  console.log(bad === 0 ? "ALL CASES CLEAN ✅" : `${bad} CASE(S) WITH PROBLEMS ❌`);
  process.exit(bad === 0 ? 0 : 1);
})();
