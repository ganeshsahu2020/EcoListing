// ui/src/types/global.d.ts

// (Optional) You can remove this line if you already have `types: ["vite/client"]` in tsconfig
/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    // --- GitHub (optional for higher API rate limits on /dev page) ---
    readonly VITE_GITHUB_TOKEN?: string;

    // --- Supabase ---
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;

    // --- Repliers keys (as you had them) ---
    readonly VITE_REPLIERS_API_KEY: string;
    readonly VITE_REPLIERS_SAMPLE_KEY: string;
    readonly VITE_REPLIERS_AKSHAJ_KEY: string;
    readonly VITE_REPLIERS_TEST_KEY: string;
    readonly VITE_REPLIERS_ALT_TEST_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // ✅ Add the window.__MARKET_API typing
  interface Window {
    __MARKET_API?: string;
  }
}

export {};
