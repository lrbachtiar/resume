import type { Topic } from './types'

export type HoleContent =
  | { kind: 'profile' }
  | { kind: 'education' }
  | { kind: 'experience' }
  | { kind: 'topic'; topic: Topic; skillGroups: string[] }
  | { kind: 'projects' }
  | { kind: 'contact' }

/**
 * A place on the course that holds a card of career content. Where it sits on the
 * map lives in components/Golf/game/layout.ts; this file is content only.
 */
export interface Hole {
  slug: string
  kind: 'range' | 'hole' | 'clubhouse'
  /** Short label on signs and the scorecard: "1"–"7", "DR", "19". */
  badge: string
  name: string
  par?: number
  topic: string
  /** One or two words for the sign board, at most 9 characters per line. */
  board: string[]
  teaser: string
  content: HoleContent
}

export const holes: Hole[] = [
  {
    slug: 'driving-range',
    kind: 'range',
    badge: 'DR',
    name: 'The Driving Range',
    topic: 'Education',
    board: ['EDUCATION'],
    teaser: 'Every good round starts with practice. Degrees, research and publications.',
    content: { kind: 'education' },
  },
  {
    slug: 'first-tee',
    kind: 'hole',
    badge: '1',
    name: 'The First Tee',
    par: 3,
    topic: 'About me',
    board: ['ABOUT', 'ME'],
    teaser: 'Who I am and how I work.',
    content: { kind: 'profile' },
  },
  {
    slug: 'career-fairway',
    kind: 'hole',
    badge: '2',
    name: 'Career Fairway',
    par: 5,
    topic: 'Career history',
    board: ['CAREER', 'HISTORY'],
    teaser: 'A long par 5. Each yardage post marks a year in my career.',
    content: { kind: 'experience' },
  },
  {
    slug: 'data-valley',
    kind: 'hole',
    badge: '3',
    name: 'Data Valley',
    par: 4,
    topic: 'Data engineering',
    board: ['DATA', 'PIPELINES'],
    teaser: 'Mind the pipeline: it crosses the fairway twice on its way to the data lake.',
    content: { kind: 'topic', topic: 'data', skillGroups: ['Data engineering', 'Data platforms', 'Cloud'] },
  },
  {
    slug: 'ml-mountain',
    kind: 'hole',
    badge: '4',
    name: 'ML Mountain',
    par: 4,
    topic: 'Machine learning',
    board: ['MACHINE', 'LEARNING'],
    teaser: 'A dogleg down the terraces. Gradient descent, but for golf.',
    content: { kind: 'topic', topic: 'ml', skillGroups: ['AI & machine learning', 'Languages', 'Visualisation'] },
  },
  {
    slug: 'ai-innovation',
    kind: 'hole',
    badge: '5',
    name: 'AI Innovation',
    par: 4,
    topic: 'Applied AI',
    board: ['APPLIED', 'AI'],
    teaser: 'The bunkers form a neural network. The caddie is a robot.',
    content: { kind: 'topic', topic: 'ai', skillGroups: ['AI & machine learning'] },
  },
  {
    slug: 'leadership-links',
    kind: 'hole',
    badge: '6',
    name: 'Leadership Links',
    par: 4,
    topic: 'Leadership',
    board: ['LEADING', 'TEAMS'],
    teaser: 'A links hole with pot bunkers and gorse. Cross the burn together.',
    content: { kind: 'topic', topic: 'leadership', skillGroups: ['Leadership', 'Ways of working'] },
  },
  {
    slug: 'project-greens',
    kind: 'hole',
    badge: '7',
    name: 'Project Greens',
    par: 5,
    topic: 'Selected projects',
    board: ['MY', 'PROJECTS'],
    teaser: 'One hole, four greens: one per project. The flagship is on the island.',
    content: { kind: 'projects' },
  },
  {
    slug: 'nineteenth-hole',
    kind: 'clubhouse',
    badge: '19',
    name: 'The 19th Hole',
    topic: 'Contact',
    board: ['CONTACT'],
    teaser: 'Pull up a chair at the clubhouse. Let’s talk.',
    content: { kind: 'contact' },
  },
]

/** Display label, e.g. "HOLE 3", "DRIVING RANGE", "19TH HOLE". */
export function holeLabel(h: Hole) {
  if (h.kind === 'range') return 'DRIVING RANGE'
  if (h.kind === 'clubhouse') return '19TH HOLE'
  return `HOLE ${h.badge}`
}

export const playableHoles = holes.filter((h) => h.kind === 'hole').length
