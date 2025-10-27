/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_REPLIERS_API_KEY: string;
  readonly VITE_REPLIERS_SAMPLE_KEY: string;
  readonly VITE_REPLIERS_AKSHAJ_KEY: string;
  readonly VITE_REPLIERS_TEST_KEY: string;
  readonly VITE_REPLIERS_ALT_TEST_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
