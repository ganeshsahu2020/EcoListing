import os, sqlite3
from pathlib import Path

root = r".\public\tiles\city_xyz"   # z/x/y.png structure
out  = r".\public\tiles\city_raster.mbtiles"

# remove old file if present
try: os.remove(out)
except FileNotFoundError: pass

Path(os.path.dirname(out)).mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(out)
cur = conn.cursor()
cur.executescript("""
PRAGMA synchronous=OFF;
PRAGMA journal_mode=MEMORY;
CREATE TABLE IF NOT EXISTS tiles (
  zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB
);
CREATE UNIQUE INDEX IF NOT EXISTS tile_index on tiles (zoom_level, tile_column, tile_row);
CREATE TABLE IF NOT EXISTS metadata (name TEXT, value TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS name on metadata (name);
""")

zs = []
for zname in os.listdir(root):
    if not zname.isdigit(): 
        continue
    z = int(zname); zs.append(z)
    zdir = os.path.join(root, zname)
    for xname in os.listdir(zdir):
        if not xname.isdigit(): 
            continue
        x = int(xname)
        xdir = os.path.join(zdir, xname)
        for fname in os.listdir(xdir):
            if not fname.endswith(".png"): 
                continue
            try:
                y = int(os.path.splitext(fname)[0])
            except:
                continue
            with open(os.path.join(xdir, fname), "rb") as f:
                data = f.read()
            # MBTiles uses TMS Y
            tms_y = (1<<z) - 1 - y
            cur.execute(
              "INSERT OR REPLACE INTO tiles (zoom_level, tile_column, tile_row, tile_data) VALUES (?,?,?,?)",
              (z, x, tms_y, sqlite3.Binary(data))
            )

minz = min(zs) if zs else 0
maxz = max(zs) if zs else 0
meta = {
  "name":"city_raster","format":"png","type":"baselayer","version":"1.1",
  "minzoom":str(minz),"maxzoom":str(maxz),
  "bounds":"-180,-85,180,85","center":"0,0,1",
  "description":"Local raster packed to MBTiles"
}
for k,v in meta.items():
    cur.execute("INSERT OR REPLACE INTO metadata (name,value) VALUES (?,?)",(k,v))

conn.commit(); conn.close()
print(f"Wrote {out} minzoom={minz} maxzoom={maxz}")
