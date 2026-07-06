/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SQUARE_APP_ID: string;
  readonly VITE_SQUARE_LOCATION_ID: string;
  readonly VITE_SQUARE_ENV: "sandbox" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
