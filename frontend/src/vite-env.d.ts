/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Base URL of the public school website (SchoolPortal). Used for "View School Website". Example: https://portal.example.com */
  readonly VITE_PUBLIC_WEBSITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
