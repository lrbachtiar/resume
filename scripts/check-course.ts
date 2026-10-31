/**
 * Course sanity check: every sign, board, post and character must be reachable on foot
 * from the clubhouse door. Prints an ASCII map of the layout. Run with `npm run check:course`.
 *
 * Legend: . rough  f fairway  t green  g tee  s sand  ~ water  # tree  r rock  = path  b bridge
 *         H clubhouse  * flowers  P patio  R range  m mat  F fence  / slope  % gorse  d dune  O stones
 *         Y spawn  digit/D = hole sign (first tile)  > rest of sign  @ talk target (post, board, character)
 */
import { buildMap, findPath, readingSpots, MAP_W, MAP_H, key } from '../src/components/Golf/game/map'
import { SPAWN, TALKS } from '../src/components/Golf/game/layout'
import { holes } from '../src/data/course'

const m = buildMap()
let unreachable = 0
for (const t of m.targets) {
  if (findPath(m, SPAWN, readingSpots(t.tiles))) continue
  unreachable++
  const name = t.target.kind === 'hole' ? holes[t.target.index].name : TALKS[t.target.index].title
  console.log('UNREACHABLE:', name, JSON.stringify(t.tiles[0]))
}

const glyph = '.ftgs~#r=bH*PRmF/%dO'
const objects = new Map<string, string>()
for (const t of m.targets)
  t.tiles.forEach((p, i) =>
    objects.set(key(p.x, p.y), t.target.kind === 'hole' ? (i === 0 ? holes[t.target.index].badge[0] : '>') : '@'),
  )
let out = ''
for (let y = 0; y < MAP_H; y++) {
  out += String(y).padStart(3) + ' '
  for (let x = 0; x < MAP_W; x++)
    out += x === SPAWN.x && y === SPAWN.y ? 'Y' : (objects.get(key(x, y)) ?? glyph[m.at(x, y)])
  out += '\n'
}
console.log(out)
console.log(`${m.targets.length} interactables, ${unreachable} unreachable`)
process.exit(unreachable ? 1 : 0)
