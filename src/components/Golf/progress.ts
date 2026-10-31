import { holes } from '../../data/course'

/** Per-visitor course progress, kept in browser storage as a convenience only. */
const STORAGE_KEY = 'course:v2:collected'

export function loadCollected(): Set<number> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    if (!Array.isArray(raw)) return new Set()
    return new Set(raw.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < holes.length))
  } catch {
    return new Set()
  }
}

export function saveCollected(collected: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected]))
  } catch {
    // Storage blocked: the round just won't be remembered.
  }
}
