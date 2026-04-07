import { useEffect, useMemo, useRef, useState } from 'react'
import { searchAnimals } from './lib/searchAnimals'

const DEBOUNCE_MS = 180

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(input.trim())
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [input])

  const results = useMemo(() => searchAnimals(debounced), [debounced])

  const hasQuery = debounced.length > 0
  const noMatches = hasQuery && results.length === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Animal taxonomy lookup
        </h1>
        <p className="mt-2 text-pretty text-zinc-600 dark:text-zinc-400">
          Search by common name, alias, or Latin family / genus / species. Results
          show the binomial and classification.
        </p>
      </header>

      <label className="block">
        <span className="sr-only">Search animals</span>
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. elephant, Canis, Felidae, elphant…"
          aria-label="Search by common name or Latin taxonomy"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400/30 transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
        />
      </label>

      {!hasQuery && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Showing all species (Latin A–Z) — start typing to filter.
        </p>
      )}

      <ul
        className="mt-8 space-y-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {noMatches ? (
          <li className="rounded-xl border border-dashed border-zinc-200 bg-zinc-100/80 px-4 py-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
            No matches for &ldquo;{debounced}&rdquo;. Try another spelling or a
            shorter fragment.
          </li>
        ) : (
          results.map((animal) => (
            <li
              key={animal.name}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                className="font-serif text-lg italic text-zinc-900 dark:text-zinc-50"
                lang="la"
              >
                {animal.species}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {animal.genus}
                </span>
                <span className="text-zinc-400 dark:text-zinc-500"> · </span>
                {animal.family}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Common: {animal.name}
                {animal.aliases.length > 0
                  ? ` (${animal.aliases.join(', ')})`
                  : ''}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
