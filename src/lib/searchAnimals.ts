import Fuse from 'fuse.js'
import animalsData from '../data/animals.json'

export type Animal = {
  name: string
  aliases: string[]
}

const animals: Animal[] = animalsData

const fuse = new Fuse(animals, {
  keys: ['name', 'aliases'],
  threshold: 0.45,
  ignoreLocation: true,
})

export function searchAnimals(query: string): Animal[] {
  const q = query.trim()
  if (!q) {
    return [...animals].sort((a, b) => a.name.localeCompare(b.name))
  }
  return fuse.search(q).map((r) => r.item)
}
