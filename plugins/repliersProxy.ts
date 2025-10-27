// plugins/repliersProxy.ts
import type { Plugin } from "vite";

/**
 * Handles GET /api/repliers on the dev server and forwards to Repliers.
 * - If ?mls_id= is present -> GET /listings/:mls_id
 * - Otherwise -> GET /listings/search with passthrough query params
 */
export default function repliersProxy(): Plugin {
  return {
    name: "repliers-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (!req.url || !req.url.startsWith("/api/repliers")) return next();

          const incoming = new URL(req.url, "http://localhost");
          const mlsId = incoming.searchParams.get("mls_id");
          const base =
            process.env.REPLIERS_BASE_URL ||
            (process.env.VITE_REPLIERS_BASE_URL as string) ||
            "https://api.repliers.io";

          // Build target URL
          let target = "";
          if (mlsId) {
            // Property details by MLS
            target = `${base}/listings/${encodeURIComponent(mlsId)}`;
            // (we ignore the mls_id in outgoing query)
          } else {
            const listPath =
              (process.env.VITE_REPLIERS_LIST_PATH as string) ||
              "/listings/search";
            const qs = incoming.searchParams.toString();
            target = `${base}${listPath}${qs ? `?${qs}` : ""}`;
          }

          // Choose a server-side key if available; otherwise fall back to the Vite key
          const key =
            process.env.REPLIERS_SERVER_KEY ||
            process.env.VITE_REPLIERS_API_KEY ||
            "";

          const upstream = await fetch(target, {
            method: "GET",
            headers: {
              Authorization: key ? `Bearer ${key}` : "",
              Accept: "application/json",
            },
          });

          const body = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader(
            "content-type",
            upstream.headers.get("content-type") || "application/json"
          );
          return res.end(body);
        } catch (err: any) {
          res.statusCode = 500;
          return res.end(
            JSON.stringify({
              ok: false,
              error: "repliers-proxy-failed",
              message: err?.message || String(err),
            })
          );
        }
      });
    },
  };
}
