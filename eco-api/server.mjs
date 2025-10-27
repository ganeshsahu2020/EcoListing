// eco-api/server.mjs
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildRows(months) {
  const m = Math.max(1, Math.min(120, Number(months) || 12));
  const today = new Date();

  return Array.from({ length: m }, (_, k) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (m - 1 - k), 1);
    const base = 1_000_000;
    const price = Math.round(
      base * (1 + 0.02 * Math.sin((2 * Math.PI * (d.getMonth() + 1)) / 12))
    );
    return {
      date: monthKey(d),
      avgPrice: price,
      daysOnMarket: 24 + (k % 10),
      activeListings: 120 + ((k * 7) % 50),
      newListings: 70 + ((k * 5) % 25),
      pricePerSqft: Math.round(price / 1200)
    };
  });
}

function handler(req, res) {
  const { region = "", type = "", months = "12", from = "", to = "" } = req.query;
  const rows = buildRows(months);
  res.json({ rows, meta: { region, type, from, to } });
}

// Serve on BOTH paths so proxy/no-proxy work
app.get("/api/market-series", handler);
app.get("/market-series", handler);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Eco API running on http://localhost:${PORT}`);
  console.log(`→ GET /api/market-series?months=12`);
  console.log(`→ GET /market-series?months=12`);
});
