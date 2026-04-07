const API_BASE = 'https://api.checklistbank.org'

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

export async function searchSpecies(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<{ results: SearchHit[]; total: number }> {
  const q = query.trim()
  if (!q) {
    return { results: [], total: 0 }
  }

  const datasetKey = import.meta.env.VITE_COL_DATASET ?? '3LR'
  const limit = opts?.limit ?? 50

  const url = new URL(`${API_BASE}/dataset/${encodeURIComponent(datasetKey)}/nameusage/search`)
  url.searchParams.set('q', q)
  url.searchParams.append('content', 'VERNACULAR_NAME')
  url.searchParams.append('content', 'SCIENTIFIC_NAME')
  url.searchParams.set('rank', 'species')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url, { signal: opts?.signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `ChecklistBank request failed (${res.status}): ${text.slice(0, 200)}`,
    )
  }

  const data = (await res.json()) as SearchResponse
  const rows = data.result ?? []
  return {
    results: rows.map(mapRow),
    total: data.total ?? rows.length,
  }
}
