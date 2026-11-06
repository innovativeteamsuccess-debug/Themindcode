// prepare-logo.ts — build web assets from the uploaded brand logo.
// 1. public/logo.png       — full logo, untouched (400×400, transparent)
// 2. public/logo-mark.png  — square emblem crop (shield) for navbar/favicon
// 3. src/app/icon.png      — favicon (Next.js app icon convention)
const sharp = require("sharp");
const path = "/home/z/my-project/upload/White_Elegant_Minimalistic_Background_Twitter_Profile_Picture-removebg-preview.png";

(async () => {
  const img = sharp(path);
  const { width, height } = await img.metadata();
  console.log("source:", width, height);

  // Full logo, resized copy for web
  await sharp(path).resize(400, 400).png().toFile("/home/z/my-project/public/logo.png");

  // Emblem crop — full shield + book base, clear of wordmark text
  const crop = { left: 107, top: 114, width: 186, height: 186 };
  await sharp(path).extract(crop).png().toFile("/home/z/my-project/public/logo-mark.png");

  // Favicon: emblem, 180×180
  await sharp(path).extract(crop).resize(180, 180).png().toFile("/home/z/my-project/src/app/icon.png");

  // Contact sheet to inspect the crop result
  await sharp(path).extract(crop).resize(300, 300, { fit: "contain", background: { r: 24, g: 26, b: 34, alpha: 1 } })
    .flatten({ background: { r: 24, g: 26, b: 34 } })
    .png().toFile("/tmp/crop-check-dark.png");
  await sharp(path).extract(crop).resize(300, 300, { fit: "contain", background: { r: 250, g: 248, b: 244, alpha: 1 } })
    .flatten({ background: { r: 250, g: 248, b: 244 } })
    .png().toFile("/tmp/crop-check-light.png");
  console.log("done");
})();
