// scripts/make-favicon.js
import sharp from "sharp";
import { writeFileSync } from "fs";

const src = "public/ecolisting-wordmark-light.svg"; // or .png
const out = "public";

const sizes = [16, 32, 48, 180, 192, 512];

await Promise.all(
  sizes.map(async (s) => {
    const name =
      s === 180 ? "apple-touch-icon.png"
      : s === 192 ? "android-chrome-192x192.png"
      : s === 512 ? "android-chrome-512x512.png"
      : `favicon-${s}x${s}.png`;
    const buf = await sharp(src).resize(s, s).png().toBuffer();
    writeFileSync(`${out}/${name}`, buf);
    return buf;
  })
);

// Build .ico with 16/32/48
const ico16 = await sharp(`${out}/favicon-16x16.png`).raw().toBuffer({ resolveWithObject: true });
const ico32 = await sharp(`${out}/favicon-32x32.png`).raw().toBuffer({ resolveWithObject: true });
const ico48 = await sharp(`${out}/favicon-48x48.png`).raw().toBuffer({ resolveWithObject: true });

// simplest: let sharp do it directly if your version supports .ico:
await sharp(src).resize(48, 48).toFile(`${out}/favicon.ico`);
console.log("Favicon assets created.");
