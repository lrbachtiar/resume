/**
 * Hand-placed course layout: where every hole, hazard, post, board and character sits.
 * Coordinates are map tiles (16×16 game pixels). Career content comes from src/data.
 */
import { holes } from '../../../data/course'
import { experience } from '../../../data/experience'
import { projects } from '../../../data/projects'
import { education } from '../../../data/education'

export interface Pt {
  x: number
  y: number
}

export const MAP_W = 64
export const MAP_H = 40

export const SPAWN: Pt = { x: 6, y: 8 }
export const CLUBHOUSE = { x: 3, y: 3, w: 6, h: 4 }
export const PATIO = { x: 10, y: 3, w: 4, h: 4 }
export const TABLES: Pt[] = [
  { x: 10, y: 4 },
  { x: 12, y: 4 },
]
export const TROPHY: Pt = { x: 11, y: 6 }

export const RANGE = { x: 17, y: 2, w: 30, h: 8 }
export const RANGE_MATS: Pt[] = [
  { x: 17, y: 3 },
  { x: 17, y: 5 },
  { x: 17, y: 7 },
]
export const BALL_MACHINE: Pt = { x: 15, y: 3 }
export const BENCH: Pt = { x: 8, y: 12 }

/** Sign-board anchor (left tile; boards are 4 tiles wide), tee box (2×2, top-left) and green. */
export interface HoleSpot {
  sign: Pt
  tee?: Pt
  green?: Pt
}

export const SPOTS: Record<string, HoleSpot> = {
  'driving-range': { sign: { x: 13, y: 8 } },
  'first-tee': { sign: { x: 6, y: 11 }, tee: { x: 4, y: 12 }, green: { x: 5, y: 20 } },
  'career-fairway': { sign: { x: 11, y: 13 }, tee: { x: 12, y: 15 }, green: { x: 45, y: 16 } },
  'data-valley': { sign: { x: 55, y: 4 }, tee: { x: 52, y: 4 }, green: { x: 54, y: 20 } },
  'ml-mountain': { sign: { x: 53, y: 23 }, tee: { x: 57, y: 24 }, green: { x: 46, y: 33 } },
  'ai-innovation': { sign: { x: 40, y: 27 }, tee: { x: 42, y: 29 }, green: { x: 28, y: 30 } },
  'leadership-links': { sign: { x: 22, y: 32 }, tee: { x: 24, y: 34 }, green: { x: 9, y: 33 } },
  'project-greens': { sign: { x: 11, y: 22 }, tee: { x: 13, y: 23 } },
  'nineteenth-hole': { sign: { x: 8, y: 8 } },
}

export const SIGN_TILES = 4

/** Extra pin positions with their own flag colours (range targets, project greens). */
export interface Pin {
  at: Pt
  color: string
  radius: [number, number]
}

/** Something the golfer can walk up to and read or talk to. */
export interface Talk {
  at: Pt
  /** Tiles wide (boards) — characters and posts are 1. */
  width: number
  title: string
  text: string
  kind: 'post' | 'board' | 'robot' | 'team'
  /** Board lettering (posts show the year). */
  lines?: string[]
}

// ---------- Hole 2: a yardage post for every year a new role began ----------

const yearRoles = new Map<number, string[]>()
for (const e of experience)
  for (const r of e.roles) {
    const year = Number(r.start.slice(-4))
    const list = yearRoles.get(year) ?? []
    list.push(`${r.title}, ${e.company}`)
    yearRoles.set(year, list)
  }
const years = [...yearRoles.keys()].sort((a, b) => a - b)
const POST_ROW = 13
const POST_FROM = 17
const POST_TO = 42

export const YEAR_POSTS: Talk[] = years.map((year, i) => ({
  at: { x: Math.round(POST_FROM + ((POST_TO - POST_FROM) * i) / Math.max(1, years.length - 1)), y: POST_ROW },
  width: 1,
  kind: 'post',
  title: `YARDAGE POST · ${year}`,
  text: yearRoles.get(year)!.join('. Then: ') + '.',
  lines: [String(year)],
}))

// ---------- Hole 7: one green per project; the flagship sits on an island ----------

const PROJECT_FLAGS: Record<string, string> = {
  fairwayplan: '#e8402c',
  beanmarkd: '#8b5a2b',
  ferry: '#3a78e0',
  'manufacturing-optimiser': '#8a4ae0',
}
const PROJECT_SPOTS: Record<string, { green: Pt; board: Pt; label: string }> = {
  fairwayplan: { green: { x: 31, y: 24 }, board: { x: 24, y: 21 }, label: 'FAIRWAYPLAN' },
  beanmarkd: { green: { x: 20, y: 20 }, board: { x: 15, y: 20 }, label: 'BEANMARKD' },
  ferry: { green: { x: 20, y: 28 }, board: { x: 14, y: 28 }, label: 'FERRY' },
  'manufacturing-optimiser': { green: { x: 39, y: 22 }, board: { x: 41, y: 22 }, label: 'OPTIMISER' },
}
export const PROJECT_LAKE = { x: 31, y: 24, rx: 4.2, ry: 2.6 }
export const ISLAND_BRIDGE: Pt[] = [
  { x: 27, y: 24 },
  { x: 28, y: 24 },
  { x: 29, y: 24 },
]

const boardWidth = (lines: string[]) => Math.ceil((Math.max(...lines.map((l) => l.length)) * 5 + 5) / 16)

export const PROJECT_PINS: Pin[] = projects.map((p) => ({
  at: PROJECT_SPOTS[p.id].green,
  color: PROJECT_FLAGS[p.id],
  radius: p.id === 'fairwayplan' ? [1.8, 1.3] : [1.8, 1.4],
}))

export const PROJECT_BOARDS: Talk[] = projects.map((p) => {
  const lines = [PROJECT_SPOTS[p.id].label]
  return {
    at: PROJECT_SPOTS[p.id].board,
    width: boardWidth(lines),
    kind: 'board',
    title: p.name.toUpperCase(),
    text: `${p.oneLiner} ${p.description}`,
    lines,
  }
})

// ---------- Driving range: one target per qualification, further out for each ----------

const RANGE_TARGETS: {
  green: Pt
  board: Pt
  radius: [number, number]
  label: string
  /** Optional board lettering and dialog in place of "LABEL / year". */
  lines?: string[]
  title?: string
  text?: string
}[] = [
  { green: { x: 25, y: 5 }, board: { x: 23, y: 7 }, radius: [1.9, 1.6], label: 'BACHELOR' },
  { green: { x: 33, y: 4 }, board: { x: 32, y: 6 }, radius: [2.1, 1.6], label: 'MASTERS' },
  {
    green: { x: 41, y: 6 },
    board: { x: 40, y: 9 },
    radius: [2.3, 1.7],
    label: 'RESEARCH',
    // The doctorate wasn't finished. In golf terms: laid up short of the green.
    lines: ['PHD 2019', 'LAID UP'],
    title: 'PHD · LAID UP',
    text: 'Doctoral research, Engineering Science, University of Auckland, 2013–2019. Laid up short of the green: the research made it into print (Neural Computation, IEEE EMBS); the thesis didn’t make the final putt.',
  },
]
// education is listed newest first; the shortest target is the first degree.
const quals = [...education].reverse()

export const RANGE_PINS: Pin[] = RANGE_TARGETS.map((t) => ({ at: t.green, color: '#f8d030', radius: t.radius }))

export const RANGE_BOARDS: Talk[] = RANGE_TARGETS.map((t, i) => {
  const q = quals[i]
  const lines = t.lines ?? [t.label, q.end]
  return {
    at: t.board,
    width: boardWidth(lines),
    kind: 'board',
    title: t.title ?? `${t.label} · ${q.end}`,
    text: t.text ?? `${q.title}, ${q.institution}. ${q.notes.join(' ')}`,
    lines,
  }
})

// ---------- Hole 3: the pipeline stream and the data lake ----------

export const STREAM: Pt[] = [
  { x: 61, y: 8 },
  { x: 48, y: 8 },
  { x: 48, y: 12 },
  { x: 60, y: 12 },
  { x: 60, y: 17 },
]
/** Footbridges where the fairway crosses the pipeline. */
export const STREAM_BRIDGES: Pt[] = [
  { x: 53, y: 8 },
  { x: 54, y: 8 },
  { x: 53, y: 12 },
  { x: 54, y: 12 },
]
export const DATA_LAKE = { x: 59, y: 19, rx: 2.1, ry: 2.6 }

// ---------- Hole 4: the dogleg around the mountain ----------

export const ML_CORNER: Pt = { x: 56, y: 31 }
export const RIDGE = [
  { x: 60.5, y: 32, rx: 1.9, ry: 6 },
  { x: 52.5, y: 27.5, rx: 2, ry: 1.8 },
]

// ---------- Hole 5: bunkers wired up like a neural network ----------

export const NEURAL_LAYERS: Pt[][] = [
  [
    { x: 38, y: 29.3 },
    { x: 38, y: 31.7 },
  ],
  [
    { x: 34.6, y: 28.6 },
    { x: 34.6, y: 30.5 },
    { x: 34.6, y: 32.4 },
  ],
  [
    { x: 31.2, y: 29.3 },
    { x: 31.2, y: 31.7 },
  ],
]

// ---------- Hole 6: links features ----------

export const BURN = { x: 17, from: 29, to: 37 }
export const STEPPING_STONES: Pt[] = [
  { x: 17, y: 33 },
  { x: 17, y: 34 },
  { x: 17, y: 35 },
]
export const POT_BUNKERS: [number, number, number][] = [
  [20.5, 33.6, 0.75],
  [13.5, 35.2, 0.7],
  [27.5, 35.6, 0.6],
]
export const GORSE: Pt[] = [
  { x: 12, y: 31 },
  { x: 13, y: 31 },
  { x: 20, y: 31 },
  { x: 21, y: 31 },
  { x: 7, y: 36 },
  { x: 14, y: 37 },
]
export const DUNES: [number, number, number][] = [
  [6, 16, 37],
  [19, 26, 37],
]

// ---------- Characters ----------

export const ROBOT: Talk = {
  at: { x: 44, y: 30 },
  width: 1,
  kind: 'robot',
  title: 'ROBO-CADDIE',
  text: 'BEEP BOOP. Robo-caddie online. I have modelled ten thousand swings and recommend aiming between the tee markers. For the real AI story, read the sign.',
}

export const TEAM: Talk[] = [
  { x: 27, y: 37 },
  { x: 28, y: 37 },
  { x: 29, y: 37 },
].map((at, i) => ({
  at,
  width: 1,
  kind: 'team' as const,
  title: 'THE TEAM',
  text: [
    'We are the team. Good leaders carry the bag sometimes too.',
    'He hired us, mentored us, then let us run with it.',
    'Read the sign by the tee for how this team was built.',
  ][i],
}))

export const TALKS: Talk[] = [...YEAR_POSTS, ...PROJECT_BOARDS, ...RANGE_BOARDS, ROBOT, ...TEAM]

/** Pins to draw flags on: every hole's green plus range targets and project greens. */
export function allPins(): Pin[] {
  const holePins: Pin[] = holes
    .map((h) => SPOTS[h.slug].green)
    .filter((g): g is Pt => !!g)
    .map((at) => ({ at, color: '#e8402c', radius: [2.6, 2.1] }))
  return [...holePins, ...RANGE_PINS, ...PROJECT_PINS]
}

/** Cart paths: a ring road around the course, plus spurs. */
export const PATHS: [number, number][][] = [
  [
    [6, 7],
    [6, 9],
    [16, 9],
  ],
  [
    [10, 9],
    [10, 36],
    [50, 36],
    [50, 3],
    [51, 3],
  ],
  [
    [10, 11],
    [50, 11],
  ],
]
