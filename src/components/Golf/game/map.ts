import { holes } from '../../../data/course'
import {
  BALL_MACHINE,
  BENCH,
  BURN,
  CLUBHOUSE,
  DATA_LAKE,
  DUNES,
  GORSE,
  ISLAND_BRIDGE,
  MAP_H,
  MAP_W,
  ML_CORNER,
  PATHS,
  PATIO,
  POT_BUNKERS,
  PROJECT_LAKE,
  PROJECT_PINS,
  RANGE,
  RANGE_MATS,
  RANGE_PINS,
  RIDGE,
  SIGN_TILES,
  SPAWN,
  SPOTS,
  STEPPING_STONES,
  STREAM,
  STREAM_BRIDGES,
  TABLES,
  TALKS,
  type Pt,
} from './layout'

export { MAP_W, MAP_H }
export const TILE = 16

export const T = {
  Grass: 0,
  Fairway: 1,
  Green: 2,
  Tee: 3,
  Sand: 4,
  Water: 5,
  Tree: 6,
  Rock: 7,
  Path: 8,
  Bridge: 9,
  House: 10,
  Flower: 11,
  Patio: 12,
  Range: 13,
  Mat: 14,
  Fence: 15,
  Slope: 16,
  Gorse: 17,
  Dune: 18,
  Stone: 19,
} as const
export type T = (typeof T)[keyof typeof T]

const BLOCKING = new Set<T>([T.Water, T.Tree, T.Rock, T.House, T.Fence, T.Gorse])

/** What reading or talking at a spot leads to. */
export type Target = { kind: 'hole'; index: number } | { kind: 'talk'; index: number }

export interface CourseMap {
  tiles: Uint8Array
  at(x: number, y: number): T
  passable(x: number, y: number): boolean
  /** Interactable footprints: every tile an object covers, with what it opens. */
  targets: { tiles: Pt[]; target: Target }[]
}

export const key = (x: number, y: number) => `${x},${y}`

/** Small deterministic PRNG so the course is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const row = (at: Pt, width: number): Pt[] => Array.from({ length: width }, (_, i) => ({ x: at.x + i, y: at.y }))

export function buildMap(): CourseMap {
  const tiles = new Uint8Array(MAP_W * MAP_H) // all Grass
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H
  const get = (x: number, y: number) => (inside(x, y) ? (tiles[y * MAP_W + x] as T) : T.Tree)
  const set = (x: number, y: number, t: T) => {
    if (inside(x, y)) tiles[y * MAP_W + x] = t
  }

  const ellipse = (cx: number, cy: number, rx: number, ry: number, t: T, over: T[] = [T.Grass]) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx
        const dy = (y + 0.5 - cy) / ry
        if (dx * dx + dy * dy <= 1 && over.includes(get(x, y))) set(x, y, t)
      }
  }

  const thickLine = (a: Pt, b: Pt, r: number, t: T, over: T[] = [T.Grass]) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 4)
    for (let i = 0; i <= steps; i++)
      ellipse(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps, r, r, t, over)
  }

  const rect = (r: { x: number; y: number; w: number; h: number }, t: T) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) set(x, y, t)
  }

  /** Axis-aligned cart path. Crossing water makes a bridge; it never paves features. */
  const cartPath = (pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const dx = Math.sign(x1 - x0)
      const dy = Math.sign(y1 - y0)
      for (let x = x0, y = y0; ; x += dx, y += dy) {
        const here = get(x, y)
        if (here === T.Grass || here === T.Flower || here === T.Dune) set(x, y, T.Path)
        else if (here === T.Water) set(x, y, T.Bridge)
        if (x === x1 && y === y1) break
      }
    }
  }

  const center = (p: Pt) => ({ x: p.x + 0.5, y: p.y + 0.5 })
  const teeCenter = (p: Pt) => ({ x: p.x + 1, y: p.y + 1 })

  // --- Water and rock first, so turf and paths respect them ---
  ellipse(PROJECT_LAKE.x + 0.5, PROJECT_LAKE.y + 0.5, PROJECT_LAKE.rx, PROJECT_LAKE.ry, T.Water)
  ellipse(DATA_LAKE.x + 0.5, DATA_LAKE.y + 0.5, DATA_LAKE.rx, DATA_LAKE.ry, T.Water)
  for (let i = 1; i < STREAM.length; i++) thickLine(center(STREAM[i - 1]), center(STREAM[i]), 0.55, T.Water)
  for (let y = BURN.from; y <= BURN.to; y++) set(BURN.x, y, T.Water)
  for (const r of RIDGE) ellipse(r.x + 0.5, r.y + 0.5, r.rx, r.ry, T.Rock)

  // --- Fairways ---
  const spot = (slug: string) => SPOTS[slug]
  const fairway = (from: Pt, to: Pt, r: number, t: T = T.Fairway) => thickLine(from, to, r, t)
  const h1 = spot('first-tee')
  fairway(teeCenter(h1.tee!), center(h1.green!), 2.3)
  const h2 = spot('career-fairway')
  fairway(teeCenter(h2.tee!), center(h2.green!), 1.7)
  const h3 = spot('data-valley')
  fairway(teeCenter(h3.tee!), center(h3.green!), 1.7)
  const h4 = spot('ml-mountain')
  fairway(teeCenter(h4.tee!), center(ML_CORNER), 1.7)
  fairway(center(ML_CORNER), center(h4.green!), 1.7, T.Slope)
  const h5 = spot('ai-innovation')
  fairway(teeCenter(h5.tee!), center(h5.green!), 1.8)
  const h6 = spot('leadership-links')
  fairway(teeCenter(h6.tee!), center(h6.green!), 1.6)
  const h7 = spot('project-greens')
  const spineEnd = { x: 26, y: 24.5 }
  const fork = { x: 18.5, y: 24.5 }
  fairway(teeCenter(h7.tee!), spineEnd, 1.5)
  fairway(fork, center(PROJECT_PINS[1].at), 1.2)
  fairway(fork, center(PROJECT_PINS[2].at), 1.2)
  fairway({ x: 35.5, y: 23.5 }, center(PROJECT_PINS[3].at), 1.3)

  // --- Greens, targets and tee boxes ---
  for (const h of holes) {
    const g = SPOTS[h.slug].green
    if (g) ellipse(g.x + 0.5, g.y + 0.5, 2.6, 2.1, T.Green, [T.Grass, T.Fairway, T.Slope])
  }
  for (const p of [...PROJECT_PINS, ...RANGE_PINS])
    ellipse(p.at.x + 0.5, p.at.y + 0.5, p.radius[0], p.radius[1], T.Green, [T.Grass, T.Fairway, T.Water])
  for (const h of holes) {
    const t = SPOTS[h.slug].tee
    if (t) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(t.x + dx, t.y + dy, T.Tee)
  }
  for (const b of [...ISLAND_BRIDGE, ...STREAM_BRIDGES]) if (get(b.x, b.y) === T.Water) set(b.x, b.y, T.Bridge)

  // --- Bunkers ---
  const bunkers: [number, number, number, number][] = [
    [27, 19.4, 1.5, 0.8], // hole 2: career pivots
    [35, 19.2, 1.4, 0.8],
    [42.4, 19, 1.2, 0.7],
    [52, 17.5, 1.2, 0.8], // hole 3
    [44, 35.6, 1.3, 0.7], // hole 4
    [7.8, 22.6, 1.2, 0.7], // hole 1 (one gentle trap)
  ]
  for (const [cx, cy, rx, ry] of bunkers) ellipse(cx, cy, rx, ry, T.Sand, [T.Grass, T.Fairway])
  for (const [cx, cy, r] of POT_BUNKERS) ellipse(cx, cy, r, r, T.Sand, [T.Grass, T.Fairway])

  // --- Links: dunes, gorse, stepping stones across the burn ---
  for (const [from, to, y] of DUNES) for (let x = from; x <= to; x++) if (get(x, y) === T.Grass) set(x, y, T.Dune)
  for (const g of GORSE) set(g.x, g.y, T.Gorse)
  for (const s of STEPPING_STONES) set(s.x, s.y, T.Stone)

  // --- Clubhouse, patio, driving range ---
  rect(CLUBHOUSE, T.House)
  rect(PATIO, T.Patio)
  for (const x of [3, 4, 8]) set(x, 7, T.Flower)
  for (const p of [
    { x: 8, y: 14 },
    { x: 8, y: 15 },
    { x: 9, y: 14 },
    { x: 9, y: 15 },
    { x: 2, y: 15 },
    { x: 2, y: 16 },
    { x: 2, y: 17 },
  ])
    if (get(p.x, p.y) === T.Grass) set(p.x, p.y, T.Flower)

  for (let y = RANGE.y; y < RANGE.y + RANGE.h; y++)
    for (let x = RANGE.x; x < RANGE.x + RANGE.w; x++) if (get(x, y) === T.Grass) set(x, y, T.Range)
  for (const m of RANGE_MATS) {
    set(m.x, m.y, T.Mat)
    set(m.x + 1, m.y, T.Mat)
  }
  for (let x = RANGE.x; x <= RANGE.x + RANGE.w; x++) set(x, RANGE.y + RANGE.h, T.Fence)
  for (let y = RANGE.y; y <= RANGE.y + RANGE.h; y++) set(RANGE.x + RANGE.w, y, T.Fence)

  for (const p of PATHS) cartPath(p)

  // --- Out-of-bounds tree line ---
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) if (x < 2 || y < 2 || x >= MAP_W - 2 || y >= MAP_H - 2) set(x, y, T.Tree)

  // --- Objects: signs, boards, posts, characters, furniture ---
  const targets: CourseMap['targets'] = []
  holes.forEach((h, index) =>
    targets.push({ tiles: row(SPOTS[h.slug].sign, SIGN_TILES), target: { kind: 'hole', index } }),
  )
  TALKS.forEach((t, index) => targets.push({ tiles: row(t.at, t.width), target: { kind: 'talk', index } }))
  const solid = new Set<string>()
  for (const t of targets) for (const p of t.tiles) solid.add(key(p.x, p.y))
  for (const p of [...TABLES, BALL_MACHINE, BENCH]) solid.add(key(p.x, p.y))
  // Objects sit on grass: un-pave anything a sign or board covers.
  for (const k of solid) {
    const [x, y] = k.split(',').map(Number)
    if (get(x, y) === T.Path) set(x, y, T.Grass)
  }

  // --- Scatter trees on open grass, keeping a clear ring around every feature ---
  const isOpen = (t: T) => t === T.Grass || t === T.Tree || t === T.Water || t === T.Rock
  const protectedTile = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!isOpen(get(x + dx, y + dy))) return true
        if (solid.has(key(x + dx, y + dy))) return true
        if (x + dx === SPAWN.x && y + dy === SPAWN.y) return true
      }
    return false
  }
  const rand = mulberry32(19)
  for (let y = 2; y < MAP_H - 2; y++)
    for (let x = 2; x < MAP_W - 2; x++)
      if (get(x, y) === T.Grass && !protectedTile(x, y) && rand() < 0.3) set(x, y, T.Tree)

  return {
    tiles,
    targets,
    at: get,
    passable: (x, y) => inside(x, y) && !BLOCKING.has(get(x, y)) && !solid.has(key(x, y)),
  }
}

/** Shortest 4-way path from start to any goal tile (excluding start). */
export function findPath(map: CourseMap, start: Pt, goals: Pt[]): Pt[] | null {
  const goalSet = new Set(goals.filter((g) => map.passable(g.x, g.y)).map((g) => key(g.x, g.y)))
  if (goalSet.size === 0) return null
  if (goalSet.has(key(start.x, start.y))) return []
  const prev = new Map<string, string>()
  const queue: Pt[] = [start]
  prev.set(key(start.x, start.y), '')
  while (queue.length) {
    const cur = queue.shift()!
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      const k = key(nx, ny)
      if (prev.has(k) || !map.passable(nx, ny)) continue
      prev.set(k, key(cur.x, cur.y))
      if (goalSet.has(k)) {
        const out: Pt[] = []
        for (let c = k; c && c !== key(start.x, start.y); c = prev.get(c)!) {
          const [x, y] = c.split(',').map(Number)
          out.unshift({ x, y })
        }
        return out
      }
      queue.push({ x: nx, y: ny })
    }
  }
  return null
}

/** Passable tiles around an object's footprint, where the golfer can read or talk to it. */
export function readingSpots(tiles: Pt[]): Pt[] {
  const own = new Set(tiles.map((p) => key(p.x, p.y)))
  const out: Pt[] = []
  for (const p of tiles)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const q = { x: p.x + dx, y: p.y + dy }
        if (!own.has(key(q.x, q.y))) out.push(q)
      }
  return out
}
