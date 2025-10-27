const sharp = require("sharp");
const { writeFileSync } = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "public", "ecolisting-wordmark-light.svg"); // or .png
const out = path.join(__dirname, "..", "public");

(async () => {
  const sizes = [16, 32, 48, 180, 192, 512];

  await Promise.all(
    sizes.map(async (s) => {
      const name =
        s === 180 ? "apple-touch-icon.png"
        : s === 192 ? "android-chrome-192x192.png"
        : s === 512 ? "android-chrome-512x512.png"
        : `favicon-${s}x${s}.png`;
      const buf = await sharp(src).resize(s, s).png().toBuffer();
      writeFileSync(path.join(out, name), buf);
      return buf;
    })
  );

  // .ico (simple 48px is fine for most)
  await sharp(src).resize(48, 48).toFile(path.join(out, "favicon.ico"));

  console.log("? Favicon assets created in /public");
})();