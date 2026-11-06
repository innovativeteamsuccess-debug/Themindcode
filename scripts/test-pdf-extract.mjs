/* Verify pdf-parse v2 extracts real text — same import path as the
   builder route. Run: node scripts/test-pdf-extract.mjs <pdf> */
import { PDFParse } from "pdf-parse";
import { readFileSync } from "fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/test-pdf-extract.mjs <pdf>");
  process.exit(1);
}
const parser = new PDFParse({ data: new Uint8Array(readFileSync(file)) });
try {
  const out = await parser.getText();
  const text = (out.text ?? "").replace(/\s+/g, " ").trim();
  console.log("CHARS:", text.length);
  console.log("SAMPLE:", text.slice(0, 220));
} finally {
  await parser.destroy();
}
