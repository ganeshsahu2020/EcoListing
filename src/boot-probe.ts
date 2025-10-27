// src/boot-probe.ts
export function installGlobalDebug() {
  if ((window as any).__DEBUG_INSTALLED__) return;
  (window as any).__DEBUG_INSTALLED__ = true;

  const log = (...a: any[]) => console.log("[eco:debug]", ...a);

  // helpers
  (window as any).goto = (p: string) => {
    location.hash = "#" + p.replace(/^#?\/?/, "/");
    log("goto", p, "→", location.href);
  };
  (window as any).where = () => log("at", location.href);

  // outline toggle via ?debug=1
  const url = new URL(location.href);
  if (url.searchParams.get("debug") === "1") {
    const el = document.createElement("style");
    el.id = "outline-debug";
    el.textContent = `
      * { outline: 1px solid rgba(0,0,0,.05); }
      *:hover { outline-color: rgba(34,197,94,.6) !important; }
      [data-probe] { position: fixed !important; inset: auto auto 8px 8px !important; z-index: 999999; }
    `;
    document.head.appendChild(el);
    log("outline debug enabled");
  }

  window.addEventListener("hashchange", () => log("hashchange", location.hash));
  window.addEventListener("DOMContentLoaded", () => log("dom ready"));
  log("installed", location.href);
}
