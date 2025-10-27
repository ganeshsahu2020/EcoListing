// scripts/make-pmtiles-raster.ts
// Node 18+
// Dev-only: fetch a small grid of OSM PNG tiles and pack into a PMTiles raster.
// Respect OSM tile usage policy: keep the area tiny and zooms limited.

import fs from "node:fs/promises";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(cpExec);

const OUT_DIR = "public/tiles";
const XYZ_DIR = path.join(OUT_DIR, "city_xyz"); // temp folder
const OUT_PM = path.join(OUT_DIR, "city_raster.pmtiles");

// City center (Kansas City). Override via env: CENTER_LAT, CENTER_LON
const CENTER = {
  lat: Number(process.env.CENTER_LAT ?? 39.0997),
  lon: Number(process.env.CENTER_LON ?? -94.5786),
};

// Zooms and radius (env overrides: ZOOMS, RADIUS)
const ZOOMS = (process.env.ZOOMS ?? "9,10,11,12")
  .split(",")
  .map((z) => Number(z.trim()))
  .filter((z) => Number.isFinite(z));
const RADIUS = Number(process.env.RADIUS ?? 2); // 2 => ~5x5 tiles per zoom

function lon2tile(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}
function lat2tile(lat: number, z: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, z)
  );
}

async function fetchTile(z: number, x: number, y: number): Promise<void> {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const dest = path.join(XYZ_DIR, String(z), String(x));
  await fs.mkdir(dest, { recursive: true });
  const file = path.join(dest, `${y}.png`);
  if (await exists(file)) return;
  const res = await fetch(url, { headers: { "User-Agent": "EcoListing Dev (offline seed)" } as any });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(file, buf);
  console.log(`saved ${z}/${x}/${y}.png`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  await fs.mkdir(XYZ_DIR, { recursive: true });

  for (const z of ZOOMS) {
    const cx = lon2tile(CENTER.lon, z);
    const cy = lat2tile(CENTER.lat, z);
    const x0 = cx - RADIUS;
    const x1 = cx + RADIUS;
    const y0 = cy - RADIUS;
    const y1 = cy + RADIUS;

    const jobs: Promise<void>[] = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        jobs.push(fetchTile(z, x, y).catch((e) => console.warn("skip tile", z, x, y, (e as Error).message)));
      }
    }
    await Promise.all(jobs);
  }

  console.log("Converting folder → PMTiles…");
  await fs.mkdir(OUT_DIR, { recursive: true });

  const cmd = `npx pmtiles convert "${XYZ_DIR}" "${OUT_PM}" --tile-type=png`;
  await exec(cmd);

  console.log(`Done: ${OUT_PM}`);
  // Optional cleanup:
  // await fs.rm(XYZ_DIR, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
