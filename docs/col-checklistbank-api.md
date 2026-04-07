# COL / ChecklistBank API — summary & findings

## What it is

The **Catalogue of Life** exposes data through the **ChecklistBank (CLB) API** at **`https://api.checklistbank.org`**. The page `https://www.catalogueoflife.org/tools/api` points at the same stack; full usage patterns are documented in the [backend API guide](https://github.com/CatalogueOfLife/backend/blob/master/API.md) and [OpenAPI](https://api.checklistbank.org/openapi).

## Core concepts

| Concept | Meaning |
|--------|---------|
| **Dataset** | A checklist; almost everything is scoped by `datasetKey`. |
| **COL** | Project dataset **`3`**. Prefer **releases**, not the live project, for stable behaviour. |
| **Name usage** | A name in context — accepted **taxon** or **synonym**. |
| **Names vs taxa** | API distinguishes bare names, accepted names, and synonyms. |

## Dataset keys to use

- **`COL{YEAR}`** — e.g. `COL2023`: annual snapshot, long-lived.
- **`3LR`** — latest **monthly** release of COL (convenient; content changes over time).
- **`3`** — living project; identifiers and content can move.

## Endpoints relevant to common name → Latin species

### 1. Search name usages (including vernacular)

`GET /dataset/{key}/nameusage/search`

- **`q`** — query string.
- **`content`** — `SCIENTIFIC_NAME`, `AUTHORSHIP`, **`VERNACULAR_NAME`** (can combine). For English common names, include **`VERNACULAR_NAME`**.
- **`type`** — `exact`, `whole_words` (default), `prefix`, **`fuzzy`**. For precision, prefer **`exact`** or **`whole_words`**; use **`fuzzy`** only for typos.
- **`rank`** — e.g. **`species`** to avoid genus/family hits when you want a species.

### 2. Vernacular search

`GET /dataset/{key}/vernacular?q=...`

- **`language`** — e.g. `eng` to restrict locale.
- Finds vernacular strings in the dataset; follow through to the linked taxon / accepted scientific name.

### 3. Taxon detail (validation / display)

- `GET /dataset/{key}/taxon/{id}/info`
- `GET /dataset/{key}/taxon/{id}/vernacular`

Useful **after** you have an ID: synonyms, classification, vernaculars listed for that taxon.

### 4. Name matching

`GET /dataset/{key}/match/nameusage?q=...`

- Optimised for **scientific** names; supports **`kingdom`**, **`authorship`**, etc. for homonyms.
- Secondary for your pipeline unless the user types Latin or you post-process.

## Auth

- Most read endpoints are **anonymous**.
- Writes, private datasets, and some jobs (e.g. bulk match) need a **GBIF** account / BasicAuth or JWT.

## Findings for the task (common animal name → Latin species)

| Finding | Detail |
|--------|--------|
| **Right tool** | **`nameusage/search` with `content=VERNACULAR_NAME`** and/or **`/vernacular`** are the right entry points for “cow”, “dog”, etc. |
| **Precision** | Use **`rank=species`**, **`language=eng`** (where supported), and stricter **`type`** (`exact` / `whole_words`) to reduce noise. |
| **Ambiguity** | Common names are not unique; COL may return **multiple** candidates. You still need ranking, user choice, or extra constraints (e.g. domestic vs wild). |
| **Coverage** | Vernacular coverage **varies by taxon**; not every informal English word is present or unambiguous. |
| **Stability** | Pin a **`COL{YEAR}`** (or accept **`3LR`** drift) so behaviour is reproducible. |

## Suggested flow (conceptual)

1. Query **`nameusage/search`** with **`q`**, **`content=VERNACULAR_NAME`**, **`rank=species`**, tight **`type`**, and optional **`language`**.
2. Or use **`/vernacular`** with **`language=eng`**, then resolve to accepted scientific name from the response.
3. If multiple hits, disambiguate (UI, classification hints, or scientific-name match on a shortlist).
4. Optionally confirm via **`taxon/.../info`** for accepted name and synonyms.

## References

- [CatalogueOfLife/backend `API.md`](https://github.com/CatalogueOfLife/backend/blob/master/API.md)
- [OpenAPI](https://api.checklistbank.org/openapi)
- [COL tools / API](https://www.catalogueoflife.org/tools/api)
