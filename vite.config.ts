// ui/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import postcssConfig from "./postcss.config";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  appType: "spa",
  plugins: [
    react(),
    tsconfigPaths(),

    // Serve *.pmtiles from /public as binary with Range support (206)
    {
      name: "pmtiles-serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || "/";
          const pathname = (() => {
            try {
              return new URL(rawUrl, "http://local").pathname;
            } catch {
              return rawUrl.split("?")[0] || "/";
            }
          })();

          if (!pathname.endsWith(".pmtiles")) return next();

          const publicRoot = path.resolve(server.config.root, "public");
          const rel = pathname.replace(/^\//, ""); // e.g. tiles/city.pmtiles
          const filePath = path.resolve(publicRoot, rel);

          // prevent ../ traversal
          const safe = filePath
            .toLowerCase()
            .startsWith(publicRoot.toLowerCase() + path.sep);
          if (!safe) return next();

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          const stat = fs.statSync(filePath);
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Accept-Ranges", "bytes");

          if (req.method === "HEAD") {
            res.setHeader("Content-Length", String(stat.size));
            res.statusCode = 200;
            res.end();
            return;
          }

          const range = req.headers.range;
          if (range) {
            const m = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (m) {
              const start = m[1] ? parseInt(m[1], 10) : 0;
              const end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
              if (start <= end && end < stat.size) {
                res.statusCode = 206;
                res.setHeader(
                  "Content-Range",
                  `bytes ${start}-${end}/${stat.size}`
                );
                res.setHeader("Content-Length", String(end - start + 1));
                fs.createReadStream(filePath, { start, end }).pipe(res);
                return;
              }
            }
            res.statusCode = 416;
            res.setHeader("Content-Range", `bytes */${stat.size}`);
            res.end();
            return;
          }

          res.setHeader("Content-Length", String(stat.size));
          fs.createReadStream(filePath).pipe(res);
        });
      },
    },
  ],

  css: { postcss: postcssConfig },

  server: {
    port: 5181,
    strictPort: true,
    proxy: {
      // UI calls http://localhost:5181/api/... and Vite forwards to http://localhost:4000/api/...
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true,
        // IMPORTANT: keep the /api prefix – do NOT rewrite
        configure: (proxy) => {
          proxy.on("error", (err) => console.log("[proxy:/api] error", err));
          proxy.on("proxyReq", (_proxyReq, req) =>
            console.log("[proxy:/api] →", req.method, req.url)
          );
          proxy.on("proxyRes", (proxyRes, req) =>
            console.log("[proxy:/api] ←", proxyRes.statusCode, req.url)
          );
        },
      },

      // (optional) Supabase functions local dev
      "/functions/v1": {
        target: "http://127.0.0.1:54321",
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },

  // also enable the same proxy when running `vite preview`
  preview: {
    port: 5181,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true,
        // keep /api prefix here too
      },
    },
  },
});
