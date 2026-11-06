/**
 * Founder portrait cutout pipeline.
 * Step 1: ask the edit model to place the man on a flat chroma-green
 *         background (photo is B&W, so green is contamination-free).
 * Step 2: chroma-key the green out with PIL (separate script) to get
 *         a transparent subject layer for the 3D depth card.
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

async function main() {
  const src = "/home/z/my-project/upload/pasted_image_1793876301348.png";
  const out = "/home/z/my-project/scripts/founder_green.png";

  const b64 = fs.readFileSync(src).toString("base64");
  const dataUrl = `data:image/png;base64,${b64}`;

  const zai = await ZAI.create();
  const response = await zai.images.generations.edit({
    prompt:
      "Isolate the man in this black and white portrait photograph. Remove the entire gray studio background completely and replace it with a completely flat, uniform, pure bright chroma green background (#00FF00) edge to edge, no gradients, no vignette, no shadows cast on the green. Keep the man pixel-identical: same face, same pose adjusting his shirt cuff, same dark suit, white shirt, dotted tie, pocket square, wristwatch, rings, same studio lighting and black and white tones. Do not crop or alter the man in any way.",
    images: [{ url: dataUrl }],
    size: "768x1344",
  });

  const imageBase64 = response.data[0].base64;
  fs.writeFileSync(out, Buffer.from(imageBase64, "base64"));
  console.log("saved", out, fs.statSync(out).size, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
