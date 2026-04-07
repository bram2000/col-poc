# Catalogue of Life search (POC)

React app that queries **[ChecklistBank](https://api.checklistbank.org)** (`nameusage/search`) for species by English vernacular or scientific name. No local species list — results are live from the API.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Build: `npm run build`, preview: `npm run preview`.

Optional: copy `.env.example` to `.env` and set `VITE_COL_DATASET` (e.g. `COL2023` for a pinned annual snapshot, or keep default `3LR`).
