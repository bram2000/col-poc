import Fuse from 'fuse.js'
import animalsData from '../data/animals.json'

export type Animal = {
  name: string
  aliases: string[]
  family: string
  genus: string
  species: string
}

const animals: Animal[] = animalsData

const fuse = new Fuse(animals, {
  keys: [
    'name',
    'aliases',
    { name: 'family', weight: 0.35 },
    { name: 'genus', weight: 0.45 },
    { name: 'species', weight: 0.55 },
  ],
  threshold: 0.45,
  ignoreLocation: true,
})

export function searchAnimals(query: string): Animal[] {
  const q = query.trim()
  if (!q) {
    return [...animals].sort((a, b) => a.species.localeCompare(b.species))
  }
  return fuse.search(q).map((r) => r.item)
}
