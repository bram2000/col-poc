const API_BASE = 'https://api.checklistbank.org'

/**
 * COL vernacular coverage often uses formal English ("domesticated cattle") rather
 * than colloquial one-word names ("cow"). Substring search for `cow` therefore
 * hits "Sea Cow", "cow tick", etc., but not Bos taurus. We add extra terms that
 * map to the same intent and merge results (synonym terms are searched first so
 * good hits surface before noisy substring matches).
 */
const SYNONYM_EXPANSIONS: Readonly<Record<string, readonly string[]>> = {
  cow: ['cattle'],
  pig: ['swine'],
  hog: ['swine'],
}

export type SearchHit = {
  id: string
  scientificName: string
  authorship: string | undefined
  genus: string | undefined
  family: string | undefined
  /** English vernacular names from COL when present */
  englishNames: string[]
  label: string
}

type Classification = {
  rank: string
  name: string
}

type Vernacular = {
  name: string
  language: string
}

type NameUsageRow = {
  id: string
  classification?: Classification[]
  usage?: {
    label?: string
    name?: {
      scientificName?: string
      authorship?: string
      genus?: string
      rank?: string
    }
  }
  vernacularNames?: Vernacular[]
}

type SearchResponse = {
  result?: NameUsageRow[]
  total?: number
}

function pickFamily(classification: Classification[] | undefined): string | undefined {
  return classification?.find((c) => c.rank === 'family')?.name
}

function englishVernaculars(names: Vernacular[] | undefined): string[] {
  if (!names?.length) return []
  const eng = names.filter((v) => v.language === 'eng' || v.language === 'en')
  return [...new Set(eng.map((v) => v.name).filter(Boolean))]
}

function mapRow(row: NameUsageRow): SearchHit {
  const u = row.usage
  const n = u?.name
  const scientificName = n?.scientificName ?? u?.label ?? 'Unknown'
  const authorship = n?.authorship
  return {
    id: row.id,
    scientificName,
    authorship,
    genus: n?.genus,
    family: pickFamily(row.classification),
    englishNames: englishVernaculars(row.vernacularNames),
    label: u?.label ?? scientificName,
  }
}

/** Synonym terms first, then the literal user query; deduped. */
function orderedSearchTerms(userQuery: string): string[] {
  const q = userQuery.trim()
  if (!q) return []
  const extra = SYNONYM_EXPANSIONS[q.toLowerCase()] ?? []
  return [...new Set([...extra, q])]
}

async function fetchNameUsagePage(
  datasetKey: string,
  q: string,
  limit: number,
  signal: AbortSignal | undefined,
): Promise<SearchResponse> {
  const url = new URL(`${API_BASE}/dataset/${encodeURIComponent(datasetKey)}/nameusage/search`)
  url.searchParams.set('q', q)
  url.searchParams.append('content', 'VERNACULAR_NAME')
  url.searchParams.append('content', 'SCIENTIFIC_NAME')
  url.searchParams.set('rank', 'species')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `ChecklistBank request failed (${res.status}): ${text.slice(0, 200)}`,
    )
  }
  return (await res.json()) as SearchResponse
}

export async function searchSpecies(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<{
  results: SearchHit[]
  total: number
  /** True when extra terms (e.g. cattle for cow) were merged in */
  combinedFromRelatedTerms: boolean
}> {
  const q = query.trim()
  if (!q) {
    return { results: [], total: 0, combinedFromRelatedTerms: false }
  }

  const datasetKey = import.meta.env.VITE_COL_DATASET ?? '3LR'
  const maxResults = opts?.limit ?? 50
  const terms = orderedSearchTerms(q)
  const combinedFromRelatedTerms = terms.length > 1

  const perTermLimit =
    terms.length > 1 ? Math.max(15, Math.ceil(maxResults / terms.length)) : maxResults

  const pages = await Promise.all(
    terms.map((term) =>
      fetchNameUsagePage(datasetKey, term, perTermLimit, opts?.signal),
    ),
  )

  const seen = new Set<string>()
  const merged: NameUsageRow[] = []

  for (let i = 0; i < terms.length; i++) {
    const rows = pages[i]?.result ?? []
    for (const row of rows) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      merged.push(row)
      if (merged.length >= maxResults) break
    }
    if (merged.length >= maxResults) break
  }

  const primaryPageTotal = pages[terms.length - 1]?.total ?? merged.length

  return {
    results: merged.map(mapRow),
    total: combinedFromRelatedTerms ? merged.length : primaryPageTotal,
    combinedFromRelatedTerms,
  }
}
