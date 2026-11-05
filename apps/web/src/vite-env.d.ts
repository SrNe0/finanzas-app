/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Si tiene valor, la web muestra el aviso de demo pública. Solo se define al compilar la demo. */
  readonly VITE_DEMO_BANNER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
