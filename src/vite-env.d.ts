/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ChecklistBank dataset key, e.g. `3LR` (latest monthly COL) or `COL2023` */
  readonly VITE_COL_DATASET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
