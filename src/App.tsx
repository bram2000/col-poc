import { useEffect, useRef, useState } from 'react'
import { searchSpecies, type SearchHit } from './lib/checklistbank'

const DEBOUNCE_MS = 280

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')

  const [results, setResults] = useState<SearchHit[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [combinedFromRelatedTerms, setCombinedFromRelatedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(input.trim())
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [input])

  useEffect(() => {
    if (!debounced) return

    const ac = new AbortController()

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          results: next,
          total: t,
          combinedFromRelatedTerms: merged,
        } = await searchSpecies(debounced, {
          signal: ac.signal,
          limit: 50,
        })
        if (ac.signal.aborted) return
        setResults(next)
        setTotal(t)
        setCombinedFromRelatedTerms(merged)
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setResults([])
        setTotal(null)
        setCombinedFromRelatedTerms(false)
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()

    return () => ac.abort()
  }, [debounced])

  const hasQuery = debounced.length > 0
  const displayResults = hasQuery ? results : []
  const displayTotal = hasQuery ? total : null
  const displayError = hasQuery ? error : null
  const showLoading = hasQuery && loading
  const noMatches =
    hasQuery && !showLoading && !displayError && displayResults.length === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Catalogue of Life search
        </h1>
        <p className="mt-2 text-pretty text-zinc-600 dark:text-zinc-400">
          Live species lookup via{' '}
          <a
            className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
            href="https://api.checklistbank.org"
            target="_blank"
            rel="noreferrer"
          >
            ChecklistBank
          </a>{' '}
          (vernacular + scientific names, rank species). Colloquial words like
          &ldquo;cow&rdquo; are expanded (e.g. cattle) when COL uses different
          English labels.
        </p>
      </header>

      <label className="block">
        <span className="sr-only">Search species</span>
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. dog, elephant, Panthera leo…"
          aria-label="Search Catalogue of Life species by common or scientific name"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400/30 transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
        />
      </label>

      {!hasQuery && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Type an English common name or a Latin species/genus — results load from
          the API.
        </p>
      )}

      {showLoading && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Searching…
        </p>
      )}

      {displayError && (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {displayError}
        </p>
      )}

      {hasQuery && !showLoading && !displayError && displayTotal !== null && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {displayTotal} match{displayTotal === 1 ? '' : 'es'}
          {displayResults.length < displayTotal
            ? ` (showing first ${displayResults.length})`
            : ''}
          {combinedFromRelatedTerms
            ? ' — merged with related search terms for common-name coverage'
            : ''}
        </p>
      )}

      <ul
        className="mt-8 space-y-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {noMatches ? (
          <li className="rounded-xl border border-dashed border-zinc-200 bg-zinc-100/80 px-4 py-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
            No species hits for &ldquo;{debounced}&rdquo;. Try a different word
            or spelling.
          </li>
        ) : (
          displayResults.map((hit) => (
            <li
              key={hit.id}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                className="font-serif text-lg italic text-zinc-900 dark:text-zinc-50"
                lang="la"
              >
                {hit.scientificName}
                {hit.authorship ? (
                  <span className="not-italic text-zinc-600 dark:text-zinc-400">
                    {' '}
                    {hit.authorship}
                  </span>
                ) : null}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {hit.genus ? (
                  <>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {hit.genus}
                    </span>
                    {hit.family ? (
                      <>
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {' '}
                          ·{' '}
                        </span>
                        {hit.family}
                      </>
                    ) : null}
                  </>
                ) : hit.family ? (
                  hit.family
                ) : (
                  <span className="text-zinc-400">Classification not loaded</span>
                )}
              </span>
              {hit.englishNames.length > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  English: {hit.englishNames.join(', ')}
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
