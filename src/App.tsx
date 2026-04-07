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
          Animal name lookup
        </h1>
        <p className="mt-2 text-pretty text-zinc-600 dark:text-zinc-400">
          Type a common name — matches include fuzzy spelling and aliases.
        </p>
      </header>

      <label className="block">
        <span className="sr-only">Search animals</span>
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. elephant, dog, elphant…"
          aria-label="Search animals by common name"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400/30 transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
        />
      </label>

      {!hasQuery && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Showing all names — start typing to filter.
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
              className="flex flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {animal.name}
              </span>
              {animal.aliases.length > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Also: {animal.aliases.join(', ')}
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
