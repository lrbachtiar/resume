/** The golfer: an original 16×16 sprite drawn from pixel strings. */

const COLORS: Record<string, string> = {
  o: '#202020', // outline
  c: '#2f7d4a', // cap
  s: '#f0b080', // skin
  h: '#483018', // hair
  w: '#f8f8f0', // polo
  p: '#384060', // trousers
  b: '#f0f0f0', // shoes
}

const mirrorHalf = (rows: string[]) => rows.map((r) => r + [...r].reverse().join(''))

const DOWN_TOP = mirrorHalf([
  '........',
  '......oo',
  '.....occ',
  '....occc',
  '...ooooo',
  '...ohsss',
  '...ososs',
  '...ossss',
  '....osss',
  '...owwww',
  '..owwwww',
  '..oswwww',
])

const UP_TOP = mirrorHalf([
  '........',
  '......oo',
  '.....occ',
  '....occc',
  '...occcc',
  '...ohhhh',
  '...ohhhh',
  '...ohhhh',
  '....osss',
  '...owwww',
  '..owwwww',
  '..oswwww',
])

const SIDE_TOP = [
  '................',
  '......oooo......',
  '.....occcco.....',
  '....occccccoo...',
  '....ocoooooooo..',
  '....ohhsssso....',
  '....ohsssoso....',
  '....ohsssssso...',
  '.....osssso.....',
  '.....owwwwo.....',
  '....owwwwwwo....',
  '....owwsswwo....',
]

const FRONT_LEGS = {
  stand: ['...oppppppppo...', '...opppoopppo...', '...oppo..oppo...', '...obbo..obbo...'],
  stepA: ['...oppppppppo...', '...opppoopppo...', '...obbo..oppo...', '....oo...obbo...'],
  stepB: ['...oppppppppo...', '...opppoopppo...', '...oppo..obbo...', '...obbo...oo....'],
}

const SIDE_LEGS = {
  stand: ['.....oppppo.....', '.....oppppo.....', '.....oppppo.....', '.....obbbbbo....'],
  stepA: ['.....oppppo.....', '....opppoppo....', '...oppo..oppo...', '...obbo...obbo..'],
  stepB: ['.....oppppo.....', '.....oppppo.....', '.....oppppo.....', '.....obbbbbo....'],
}

export type Dir = 'down' | 'up' | 'left' | 'right'

function toCanvas(rows: string[], flip = false, colors: Record<string, string> = COLORS): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const c = canvas.getContext('2d')!
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = colors[ch]
      if (!color) return
      c.fillStyle = color
      c.fillRect(flip ? 15 - x : x, y, 1, 1)
    }),
  )
  return canvas
}

/** Pre-rendered frames: [stand, stepA, stand, stepB] per direction. Colours can be swapped for other golfers. */
export function buildGolferFrames(swap: Partial<Record<string, string>> = {}): Record<Dir, HTMLCanvasElement[]> {
  const colors = { ...COLORS, ...swap } as Record<string, string>
  const front = (top: string[]) =>
    [FRONT_LEGS.stand, FRONT_LEGS.stepA, FRONT_LEGS.stand, FRONT_LEGS.stepB].map((legs) =>
      toCanvas([...top, ...legs], false, colors),
    )
  const side = (flip: boolean) =>
    [SIDE_LEGS.stand, SIDE_LEGS.stepA, SIDE_LEGS.stepB, SIDE_LEGS.stepA].map((legs) =>
      toCanvas([...SIDE_TOP, ...legs], flip, colors),
    )
  return { down: front(DOWN_TOP), up: front(UP_TOP), right: side(false), left: side(true) }
}


/** Team golfers on the Leadership hole: same build, their own caps and shirts. */
export const TEAM_COLORS: Partial<Record<string, string>>[] = [
  { c: '#e8402c', w: '#f8d030', h: '#202020' },
  { c: '#3a78e0', w: '#f8f8f0', h: '#a0522d', p: '#6b4420' },
  { c: '#8a4ae0', w: '#e8a0c0', h: '#f0d080' },
]

const ROBOT_COLORS: Record<string, string> = {
  o: '#202020',
  w: '#d8dde4', // head plate
  e: '#48d8f0', // eyes
  g: '#5a5a64', // grille and joints
  m: '#a8b0bc', // body
  y: '#f8d030', // chest light
  r: '#e8402c', // antenna light
}

const ROBOT = [
  '................',
  '.......oo.......',
  '.......rr.......',
  '....oooooooo....',
  '...owwwwwwwwo...',
  '...oweewweewo...',
  '...owwwwwwwwo...',
  '...owwggggwwo...',
  '....oooooooo....',
  '......oggo......',
  '...ommmmmmmmo...',
  '..ommmmyymmmmo..',
  '..omommmmmmomo..',
  '...ommmmmmmmo...',
  '...oggo..oggo...',
  '...oooo..oooo...',
]

/** Robo-caddie: two frames, antenna light on and off. */
export function buildRobotFrames(): HTMLCanvasElement[] {
  return [toCanvas(ROBOT, false, ROBOT_COLORS), toCanvas(ROBOT, false, { ...ROBOT_COLORS, r: '#6a1a10' })]
}

const CART_COLORS: Record<string, string> = {
  o: '#202020',
  w: '#f4ecd2', // canopy
  c: '#2f7d4a', // canopy stripe
  g: '#9fd0f0', // windscreen
  b: '#303030', // wheels
  k: '#c8402c', // golf bag
  s: '#d8d8d8', // club heads
}

/** Golf cart seen from above, facing right (windscreen at the front). */
const CART_RIGHT = [
  '................',
  '................',
  '...bb......bb...',
  '..ooooooooooooo.',
  '.sowwwwwwwwwwgo.',
  'kkowwwwwwwwwwgo.',
  'kkoccccccccccgo.',
  'kkoccccccccccgo.',
  'kkowwwwwwwwwwgo.',
  '.sowwwwwwwwwwgo.',
  '..ooooooooooooo.',
  '...bb......bb...',
  '................',
  '................',
  '................',
  '................',
]

const rotateCW = (rows: string[]) => rows.map((_, y) => rows.map((r) => r[y]).reverse().join(''))
const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(''))

/** The golf cart in all four directions, for long trips. */
export function buildCartFrames(): Record<Dir, HTMLCanvasElement> {
  const down = rotateCW(CART_RIGHT)
  return {
    right: toCanvas(CART_RIGHT, false, CART_COLORS),
    left: toCanvas(mirror(CART_RIGHT), false, CART_COLORS),
    down: toCanvas(down, false, CART_COLORS),
    up: toCanvas(rotateCW(rotateCW(down)), false, CART_COLORS),
  }
}
