import { holes } from '../../../data/course'
import { P } from './palette'
import { drawText, textWidth } from './font'
import { MAP_H, MAP_W, T, TILE, type CourseMap } from './map'
import { BALL_MACHINE, BENCH, CLUBHOUSE, NEURAL_LAYERS, SPOTS, TABLES, TALKS, type Pt } from './layout'

type Ctx = CanvasRenderingContext2D

/** Stable per-tile noise so decoration never flickers between renders. */
const hash = (x: number, y: number, salt = 0) => {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

const px = (c: Ctx, color: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = color
  c.fillRect(x, y, w, h)
}

function disc(c: Ctx, cx: number, cy: number, r: number, fill: string, rim?: string) {
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++)
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) {
      const d = Math.hypot(x, y)
      if (d <= r) px(c, rim && d > r - 1 ? rim : fill, Math.round(cx + x), Math.round(cy + y))
    }
}

function grass(c: Ctx, x: number, y: number, ox: number, oy: number, base: string = P.grass) {
  px(c, base, ox, oy, TILE, TILE)
  const h = hash(x, y)
  for (let k = 0; k < 3; k++) {
    const tx = (h >>> (k * 8)) & 15
    const ty = (h >>> (k * 8 + 4)) & 15
    if (tx > 13 || ty < 2) continue
    px(c, P.grassDark, ox + tx, oy + ty)
    px(c, P.grassDark, ox + tx + 2, oy + ty)
    px(c, P.grassDark, ox + tx + 1, oy + ty - 1)
    px(c, P.grassLight, ox + tx + 1, oy + ty - 2)
  }
}

function edgeLines(
  c: Ctx,
  map: CourseMap,
  x: number,
  y: number,
  ox: number,
  oy: number,
  same: (t: T) => boolean,
  color: string,
  w = 1,
) {
  if (!same(map.at(x, y - 1))) px(c, color, ox, oy, TILE, w)
  if (!same(map.at(x, y + 1))) px(c, color, ox, oy + TILE - w, TILE, w)
  if (!same(map.at(x - 1, y))) px(c, color, ox, oy, w, TILE)
  if (!same(map.at(x + 1, y))) px(c, color, ox + TILE - w, oy, w, TILE)
}

const MOWN = new Set<T>([T.Fairway, T.Green, T.Tee, T.Slope])
const WATERY = new Set<T>([T.Water, T.Bridge, T.Stone])

/** Mown turf: striped fill, a darker outline against rough, and rounded outer corners. */
function mown(
  c: Ctx,
  map: CourseMap,
  x: number,
  y: number,
  ox: number,
  oy: number,
  light: string,
  dark: string,
  stripe: number,
  edge: string,
  same: (t: T) => boolean,
) {
  for (let i = 0; i < TILE; i += stripe) px(c, ((ox + i) / stripe) % 2 ? light : dark, ox + i, oy, stripe, TILE)
  edgeLines(c, map, x, y, ox, oy, same, edge)
  const corner = (cx: number, cy: number, sx: number, sy: number) => {
    for (let r = 0; r < 3; r++) {
      const w = 3 - r
      px(c, P.grass, sx > 0 ? ox + cx : ox + cx - w + 1, oy + cy + r * sy, w, 1)
      px(c, edge, sx > 0 ? ox + cx + w : ox + cx - w, oy + cy + r * sy, 1, 1)
    }
    px(c, edge, ox + cx, oy + cy + 3 * sy, 1, 1)
  }
  const up = same(map.at(x, y - 1))
  const down = same(map.at(x, y + 1))
  const left = same(map.at(x - 1, y))
  const right = same(map.at(x + 1, y))
  if (!up && !left) corner(0, 0, 1, 1)
  if (!up && !right) corner(TILE - 1, 0, -1, 1)
  if (!down && !left) corner(0, TILE - 1, 1, -1)
  if (!down && !right) corner(TILE - 1, TILE - 1, -1, -1)
}

function tree(c: Ctx, x: number, y: number, ox: number, oy: number) {
  grass(c, x, y, ox, oy)
  for (let i = 0; i < 12; i++) px(c, P.shadow, ox + 4 + i, oy + 13 + (i > 1 && i < 10 ? 1 : 0), 1, 2)
  px(c, P.trunk, ox + 7, oy + 11, 2, 4)
  const small = hash(x, y, 7) % 3 === 0
  const cx = 7.5
  const cy = small ? 7.5 : 6.5
  const r = small ? 5.6 : 6.6
  for (let py = 0; py < 14; py++)
    for (let pxl = 0; pxl < 16; pxl++) {
      const d = Math.hypot(pxl - cx, py - cy)
      if (d > r + 0.9) continue
      let col: string = P.tree
      if (d > r) col = P.treeDark
      else if (pxl - cx + (py - cy) < -4.5) col = P.treeLight
      else if (pxl - cx + (py - cy) > 3.5) col = P.treeDark
      px(c, col, ox + pxl, oy + py)
    }
  const h = hash(x, y, 3)
  px(c, P.treeLight, ox + 4 + (h & 3), oy + 4 + ((h >> 2) & 3), 2, 1)
  px(c, P.treeDark, ox + 8 + ((h >> 4) & 3), oy + 8 + ((h >> 6) & 1), 1, 1)
}

function gorse(c: Ctx, x: number, y: number, ox: number, oy: number) {
  grass(c, x, y, ox, oy)
  px(c, P.shadow, ox + 3, oy + 13, 11, 2)
  for (let py = 3; py < 15; py++)
    for (let pxl = 1; pxl < 15; pxl++) {
      const d = Math.hypot((pxl - 7.5) / 6.5, (py - 9) / 5.5)
      if (d > 1) continue
      px(c, d > 0.85 ? P.treeDark : (pxl + py) % 3 ? '#2f6a2a' : '#3f8236', ox + pxl, oy + py)
    }
  const h = hash(x, y, 9)
  for (let k = 0; k < 7; k++) px(c, P.flowerYellow, ox + 3 + ((h >>> (k * 4)) % 10), oy + 5 + ((h >>> (k * 3)) % 8))
}

function rock(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  grass(c, x, y, ox, oy)
  for (let py = 0; py < 16; py++)
    for (let pxl = 0; pxl < 16; pxl++) {
      const dx = (pxl - 7.5) / 7.6
      const dy = (py - 8.5) / 7
      const d = dx * dx + dy * dy
      if (d > 1) continue
      let col: string = P.rock
      if (d > 0.8) col = P.rockDark
      else if (dx + dy < -0.6) col = P.rockLight
      else if (dx + dy > 0.6) col = P.rockDark
      px(c, col, ox + pxl, oy + py)
    }
  px(c, P.rockDark, ox + 9, oy + 6, 1, 3)
  px(c, P.rockDark, ox + 10, oy + 9, 1, 2)
  if (map.at(x, y - 1) !== T.Rock) {
    for (let i = 0; i < 8; i++) px(c, P.snow, ox + 4 + i, oy + 2 + (i % 3 === 0 ? 1 : 0), 1, i % 2 ? 3 : 2)
  }
}

function water(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number, frame: number) {
  px(c, P.water, ox, oy, TILE, TILE)
  const h = hash(x, y)
  const shift = frame ? 3 : 0
  px(c, P.waterLight, ox + ((h & 7) + shift) % 12, oy + 4, 4, 1)
  px(c, P.waterLight, ox + (((h >> 3) & 7) + 6 - shift) % 12, oy + 11, 3, 1)
  px(c, P.waterDark, ox + ((h >> 6) & 7), oy + 8, 3, 1)
  edgeLines(c, map, x, y, ox, oy, (t) => WATERY.has(t), P.foam, 2)
}

function stones(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number, frame: number) {
  water(c, map, x, y, ox, oy, frame)
  disc(c, ox + 5, oy + 6, 3.6, P.rock, P.rockDark)
  disc(c, ox + 11, oy + 11, 3.2, P.rock, P.rockDark)
  px(c, P.rockLight, ox + 4, oy + 4, 2, 1)
  px(c, P.rockLight, ox + 10, oy + 9, 2, 1)
}

function sand(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  px(c, P.sand, ox, oy, TILE, TILE)
  const h = hash(x, y)
  for (let k = 0; k < 5; k++) px(c, P.sandDark, ox + ((h >>> (k * 6)) & 15), oy + ((h >>> (k * 6 + 3)) & 15))
  px(c, P.sandLight, ox + ((h >> 2) & 15), oy + ((h >> 9) & 15), 2, 1)
  edgeLines(c, map, x, y, ox, oy, (t) => t === T.Sand, P.sandDark)
}

function dune(c: Ctx, x: number, y: number, ox: number, oy: number) {
  px(c, '#c9c477', ox, oy, TILE, TILE)
  px(c, '#e0d898', ox, oy + 5, TILE, 1)
  px(c, '#a8a65a', ox, oy + 11, TILE, 1)
  const h = hash(x, y, 4)
  for (let k = 0; k < 3; k++) {
    const tx = 2 + ((h >>> (k * 5)) % 11)
    px(c, '#6f8a3a', ox + tx, oy + 7 + k, 1, 3)
    px(c, '#6f8a3a', ox + tx + 1, oy + 6 + k, 1, 2)
  }
}

function path(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  px(c, P.path, ox, oy, TILE, TILE)
  const h = hash(x, y)
  for (let k = 0; k < 3; k++) px(c, P.pathDark, ox + 2 + ((h >>> (k * 7)) % 12), oy + 2 + ((h >>> (k * 7 + 3)) % 12), 2, 1)
  edgeLines(c, map, x, y, ox, oy, (t) => t === T.Path || t === T.Bridge || t === T.House || t === T.Patio, P.pathDark)
}

function bridge(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  water(c, map, x, y, ox, oy, 0)
  const across = WATERY.has(map.at(x, y - 1)) && WATERY.has(map.at(x, y + 1))
  if (across) {
    // Runs east–west: planks are vertical, rails top and bottom.
    px(c, P.bridge, ox, oy + 2, TILE, 12)
    for (let i = 0; i < 4; i++) px(c, P.bridgeDark, ox + i * 4 + 3, oy + 2, 1, 12)
    px(c, P.bridgeDark, ox, oy + 1, TILE, 2)
    px(c, P.bridgeDark, ox, oy + 13, TILE, 2)
  } else {
    px(c, P.bridge, ox + 2, oy, 12, TILE)
    for (let i = 0; i < 4; i++) px(c, P.bridgeDark, ox + 2, oy + i * 4 + 3, 12, 1)
    px(c, P.bridgeDark, ox + 1, oy, 2, TILE)
    px(c, P.bridgeDark, ox + 13, oy, 2, TILE)
  }
}

function flowers(c: Ctx, x: number, y: number, ox: number, oy: number) {
  grass(c, x, y, ox, oy)
  const h = hash(x, y, 5)
  const spots: [number, number, string][] = [
    [3 + (h & 3), 4, P.flowerRed],
    [10 + ((h >> 2) & 3), 6, P.flowerYellow],
    [5 + ((h >> 4) & 3), 11, P.white],
    [11, 12 + ((h >> 6) & 1), P.flowerRed],
  ]
  for (const [fx, fy, col] of spots) {
    px(c, col, ox + fx - 1, oy + fy, 3, 1)
    px(c, col, ox + fx, oy + fy - 1, 1, 3)
    px(c, P.flowerYellow, ox + fx, oy + fy)
  }
}

function patio(c: Ctx, x: number, y: number, ox: number, oy: number) {
  px(c, '#d9cba8', ox, oy, TILE, TILE)
  const off = y % 2 ? 4 : 0
  px(c, '#b9a984', ox, oy + 7, TILE, 1)
  px(c, '#b9a984', ox, oy + 15, TILE, 1)
  px(c, '#b9a984', ox + ((off + 6) % 16), oy, 1, 7)
  px(c, '#b9a984', ox + ((off + 12) % 16), oy + 8, 1, 7)
  if (hash(x, y) % 4 === 0) px(c, '#e8dcbc', ox + 3, oy + 3, 2, 1)
}

function range(c: Ctx, x: number, y: number, ox: number, oy: number) {
  // Range turf: alternating yardage bands with scattered practice balls.
  grass(c, x, y, ox, oy, Math.floor(x / 4) % 2 ? '#62b444' : P.grass)
  const h = hash(x, y, 11)
  if (h % 3 === 0) {
    const bx = ox + 2 + ((h >>> 4) % 12)
    const by = oy + 2 + ((h >>> 9) % 12)
    px(c, P.shadow, bx, by + 1, 2, 1)
    px(c, P.white, bx, by, 2, 1)
  }
}

function mat(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  grass(c, x, y, ox, oy)
  px(c, '#1e4a2a', ox, oy + 2, TILE, 12)
  px(c, '#2f6b3a', ox + (map.at(x - 1, y) === T.Mat ? 0 : 1), oy + 3, 15, 10)
  if (map.at(x + 1, y) === T.Mat) {
    // Basket of balls on the back of the mat.
    px(c, P.trunk, ox + 3, oy + 6, 8, 6)
    px(c, P.bridgeDark, ox + 3, oy + 11, 8, 1)
    for (let i = 0; i < 3; i++) px(c, P.white, ox + 4 + i * 2, oy + 5, 2, 2)
  } else {
    px(c, P.white, ox + 7, oy + 9, 1, 2)
    px(c, P.white, ox + 6, oy + 7, 3, 2)
  }
}

function fence(c: Ctx, map: CourseMap, x: number, y: number, ox: number, oy: number) {
  range(c, x, y, ox, oy)
  if (map.at(x - 1, y) !== T.Fence && map.at(x, y - 1) === T.Fence) {
    for (let i = 0; i < 16; i += 3) px(c, '#e0e0d8', ox + 6, oy + i, 4, 1)
    px(c, '#5a5a64', ox + 7, oy, 2, TILE)
  } else {
    for (let i = 0; i < 16; i += 3) px(c, '#e0e0d8', ox + i, oy + 6, 1, 6)
    px(c, '#e0e0d8', ox, oy + 6, TILE, 1)
    px(c, '#5a5a64', ox + 7, oy + 2, 2, 12)
  }
}

function paintTile(c: Ctx, map: CourseMap, x: number, y: number, frame: number) {
  const ox = x * TILE
  const oy = y * TILE
  switch (map.at(x, y)) {
    case T.Grass:
    case T.House:
      return grass(c, x, y, ox, oy)
    case T.Fairway:
      return mown(c, map, x, y, ox, oy, P.fairway, P.fairwayAlt, 8, P.teeEdge, (t) => MOWN.has(t))
    case T.Slope:
      mown(c, map, x, y, ox, oy, P.fairway, P.fairwayAlt, 8, P.teeEdge, (t) => MOWN.has(t))
      // Terraces stepping down the mountain.
      for (const ty of [3, 9]) {
        px(c, '#5f9e45', ox + 1, oy + ty, TILE - 2, 1)
        px(c, '#b5e692', ox + 1, oy + ty + 1, TILE - 2, 1)
      }
      return
    case T.Green:
      return mown(c, map, x, y, ox, oy, P.green, P.greenAlt, 4, P.fairway, (t) => t === T.Green)
    case T.Tee:
      return mown(c, map, x, y, ox, oy, P.fairwayAlt, P.green, 16, P.teeEdge, (t) => t === T.Tee)
    case T.Sand:
      return sand(c, map, x, y, ox, oy)
    case T.Water:
      return water(c, map, x, y, ox, oy, frame)
    case T.Stone:
      return stones(c, map, x, y, ox, oy, frame)
    case T.Tree:
      return tree(c, x, y, ox, oy)
    case T.Gorse:
      return gorse(c, x, y, ox, oy)
    case T.Rock:
      return rock(c, map, x, y, ox, oy)
    case T.Path:
      return path(c, map, x, y, ox, oy)
    case T.Bridge:
      return bridge(c, map, x, y, ox, oy)
    case T.Flower:
      return flowers(c, x, y, ox, oy)
    case T.Patio:
      return patio(c, x, y, ox, oy)
    case T.Range:
      return range(c, x, y, ox, oy)
    case T.Mat:
      return mat(c, map, x, y, ox, oy)
    case T.Fence:
      return fence(c, map, x, y, ox, oy)
    case T.Dune:
      return dune(c, x, y, ox, oy)
  }
}

function clubhouse(c: Ctx) {
  const x = CLUBHOUSE.x * TILE
  const y = CLUBHOUSE.y * TILE
  const w = CLUBHOUSE.w * TILE
  const h = CLUBHOUSE.h * TILE
  px(c, P.shadow, x + 4, y + h, w - 2, 4)
  px(c, P.outline, x + 2, y + 26, w - 4, h - 26)
  px(c, P.wall, x + 3, y + 27, w - 6, h - 28)
  px(c, P.wallShade, x + 3, y + h - 6, w - 6, 5)
  px(c, P.outline, x, y + 2, w, 28)
  px(c, P.roof, x + 1, y + 3, w - 2, 26)
  for (let r = 0; r < 6; r++) {
    px(c, P.roofDark, x + 1, y + 7 + r * 4, w - 2, 1)
    for (let s = (r % 2) * 4; s < w - 2; s += 8) px(c, P.roofDark, x + 1 + s, y + 3 + r * 4, 1, 4)
  }
  px(c, P.roofDark, x + 1, y + 27, w - 2, 2)
  px(c, P.outline, x + w - 22, y - 6, 10, 10)
  px(c, P.wallShade, x + w - 21, y - 5, 8, 8)
  for (const wx of [x + 10, x + w - 26]) {
    px(c, P.outline, wx - 1, y + 35, 18, 14)
    px(c, P.window, wx, y + 36, 16, 12)
    px(c, P.windowLight, wx + 1, y + 37, 6, 4)
    px(c, P.outline, wx + 7, y + 36, 2, 12)
  }
  const dx = x + 2 * TILE + 8
  px(c, P.outline, dx - 1, y + 39, 18, h - 39)
  px(c, P.door, dx, y + 40, 16, h - 40)
  px(c, P.flagDark, dx + 12, y + 50, 2, 2)
  px(c, P.outline, dx - 3, y + 29, 22, 9)
  px(c, P.white, dx - 2, y + 30, 20, 7)
  drawText(c, '19', dx + 4, y + 30, P.outline)
}

function table(c: Ctx, p: Pt) {
  const ox = p.x * TILE
  const oy = p.y * TILE
  px(c, P.shadow, ox + 2, oy + 13, 13, 2)
  // Chairs either side, round table, then a striped umbrella overhead.
  px(c, P.bridgeDark, ox, oy + 9, 3, 5)
  px(c, P.bridgeDark, ox + 13, oy + 9, 3, 5)
  disc(c, ox + 8, oy + 10, 4, P.white, P.wallShade)
  px(c, P.outline, ox + 7, oy - 2, 2, 12)
  for (let i = 0; i < 7; i++) {
    const w = 2 + i * 2
    px(c, i % 2 ? P.white : P.flag, ox + 8 - w / 2, oy - 8 + i, w, 1)
  }
  px(c, P.flagDark, ox + 1, oy - 1, 14, 1)
}

function ballMachine(c: Ctx, p: Pt) {
  const ox = p.x * TILE
  const oy = p.y * TILE
  px(c, P.shadow, ox + 3, oy + 14, 12, 2)
  px(c, P.outline, ox + 2, oy - 2, 12, 17)
  px(c, '#9aa0a8', ox + 3, oy - 1, 10, 15)
  px(c, P.flag, ox + 3, oy - 1, 10, 4)
  px(c, P.outline, ox + 6, oy + 6, 4, 3)
  px(c, P.white, ox + 7, oy + 10, 2, 2)
}

function bench(c: Ctx, p: Pt) {
  const ox = p.x * TILE
  const oy = p.y * TILE
  px(c, P.shadow, ox + 1, oy + 13, 14, 2)
  px(c, P.bridgeDark, ox + 1, oy + 4, 14, 3)
  px(c, P.bridge, ox + 1, oy + 8, 14, 3)
  px(c, P.outline, ox + 2, oy + 11, 2, 3)
  px(c, P.outline, ox + 12, oy + 11, 2, 3)
}

/** Wooden board with a cream face; optional badge on the left (hole number). */
function board(c: Ctx, ox: number, oy: number, w: number, lines: string[], badge?: string) {
  const h = lines.length > 1 ? 19 : 15
  const top = oy + 13 - h - 2
  px(c, P.shadow, ox + 3, oy + 14, w - 6, 2)
  for (const postX of badge || w > 32 ? [ox + 6, ox + w - 9] : [ox + w / 2 - 1]) {
    px(c, P.outline, postX, top + h - 1, 3, oy + 15 - (top + h - 1))
    px(c, P.bridge, postX + 1, top + h - 1, 1, oy + 14 - (top + h - 1))
  }
  px(c, P.outline, ox, top, w, h)
  px(c, P.bridge, ox + 1, top + 1, w - 2, h - 2)
  px(c, P.wall, ox + 2, top + 2, w - 4, h - 4)
  let textLeft = ox + 2
  if (badge) {
    px(c, '#2f5a24', ox + 2, top + 2, 13, h - 4)
    drawText(c, badge, ox + 2 + Math.round((13 - textWidth(badge)) / 2), top + Math.round((h - 6) / 2), P.white)
    textLeft = ox + 17
  }
  const areaW = ox + w - 2 - textLeft
  lines.forEach((line, i) => {
    const ty = lines.length > 1 ? top + 3 + i * 7 : top + Math.round((h - 6) / 2)
    drawText(c, line, textLeft + Math.max(0, Math.round((areaW - textWidth(line)) / 2)), ty, P.outline)
  })
}

/** Yardage post: a short stake with a plaque showing the year. */
function post(c: Ctx, p: Pt, label: string) {
  const ox = p.x * TILE
  const oy = p.y * TILE
  const w = textWidth(label) + 6
  const left = ox + 8 - Math.round(w / 2)
  px(c, P.shadow, ox + 5, oy + 14, 7, 2)
  px(c, P.outline, ox + 7, oy + 6, 3, 9)
  px(c, P.white, ox + 8, oy + 6, 1, 8)
  px(c, P.outline, left, oy - 4, w, 11)
  px(c, P.white, left + 1, oy - 3, w - 2, 9)
  px(c, P.flag, left + 1, oy - 3, w - 2, 1)
  drawText(c, label, left + 3, oy - 1, P.outline)
}

/** Hole 5's bunkers, joined up like a neural network. */
function neuralNet(c: Ctx) {
  const pt = (p: Pt) => ({ x: p.x * TILE, y: p.y * TILE })
  for (let l = 1; l < NEURAL_LAYERS.length; l++)
    for (const a of NEURAL_LAYERS[l - 1])
      for (const b of NEURAL_LAYERS[l]) {
        const pa = pt(a)
        const pb = pt(b)
        const steps = Math.ceil(Math.hypot(pb.x - pa.x, pb.y - pa.y))
        for (let i = 0; i <= steps; i++)
          px(c, P.sandDark, Math.round(pa.x + ((pb.x - pa.x) * i) / steps), Math.round(pa.y + ((pb.y - pa.y) * i) / steps), 2, 2)
      }
  for (const layer of NEURAL_LAYERS)
    for (const n of layer) {
      const p = pt(n)
      disc(c, p.x, p.y + 1, 6, P.shadow)
      disc(c, p.x, p.y, 6, P.sand, P.sandDark)
      px(c, P.sandLight, p.x - 3, p.y - 3, 2, 1)
    }
}

/**
 * Tee markers sit on the front edge of the 2×2 tee box, square to the line of play,
 * so the golfer aims straight between them at the green.
 */
function teeMarkers(c: Ctx, tee: Pt, green: Pt) {
  const cx = (tee.x + 1) * TILE
  const cy = (tee.y + 1) * TILE
  const dx = (green.x + 0.5) * TILE - cx
  const dy = (green.y + 0.5) * TILE - cy
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  for (const side of [-1, 1]) {
    const mx = Math.round(cx + ux * 9 - uy * 8 * side)
    const my = Math.round(cy + uy * 9 + ux * 8 * side)
    px(c, P.shadow, mx - 1, my + 2, 4, 1)
    px(c, P.outline, mx - 2, my - 2, 4, 4)
    px(c, P.flag, mx - 1, my - 1, 2, 2)
  }
}

/** Where each tee aims: its own green, or down the spine toward the project greens. */
const aimFor = (slug: string): Pt | undefined =>
  SPOTS[slug].green ?? (slug === 'project-greens' ? { x: 26, y: 24 } : undefined)

/** Pre-render the static course for one water animation frame. */
export function renderCourse(map: CourseMap, frame: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = MAP_W * TILE
  canvas.height = MAP_H * TILE
  const c = canvas.getContext('2d')!
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) paintTile(c, map, x, y, frame)
  neuralNet(c)
  clubhouse(c)
  for (const t of TABLES) table(c, t)
  ballMachine(c, BALL_MACHINE)
  bench(c, BENCH)
  for (const h of holes) {
    const s = SPOTS[h.slug]
    if (s.green) px(c, P.cup, s.green.x * TILE + 5, s.green.y * TILE + 11, 6, 2)
    const aim = aimFor(h.slug)
    if (s.tee && aim) teeMarkers(c, s.tee, aim)
  }
  // Boards and posts are drawn top to bottom so nearer ones overlap those behind.
  const objects: { y: number; draw: () => void }[] = []
  for (const h of holes) {
    const s = SPOTS[h.slug].sign
    objects.push({ y: s.y, draw: () => board(c, s.x * TILE, s.y * TILE, 64, h.board, h.badge) })
  }
  for (const t of TALKS) {
    if (t.kind === 'post') objects.push({ y: t.at.y, draw: () => post(c, t.at, t.lines![0]) })
    if (t.kind === 'board')
      objects.push({ y: t.at.y, draw: () => board(c, t.at.x * TILE, t.at.y * TILE, t.width * TILE, t.lines!) })
  }
  objects.sort((a, b) => a.y - b.y).forEach((o) => o.draw())
  return canvas
}

/** Animated pin flag, drawn each frame over the cup. */
export function drawFlag(c: Ctx, x: number, y: number, frame: number, color: string = P.flag) {
  const ox = x + 7
  const oy = y - 10
  px(c, P.shadow, ox + 1, y + 12, 6, 1)
  px(c, P.white, ox, oy, 1, 22)
  const wave = frame ? [0, 1, 1, 0, 0] : [0, 0, 1, 1, 0]
  for (let i = 0; i < 5; i++) {
    const len = 7 - Math.abs(2 - i) * 2
    px(c, color, ox + 1, oy + i + wave[i], len, 1)
  }
  px(c, color, ox + 1, oy, 7, 3)
  px(c, 'rgba(0, 0, 0, 0.25)', ox + 1, oy + 3, 5, 1)
}

/** "!" speech bubble above the golfer. */
export function drawBubble(c: Ctx, x: number, y: number) {
  px(c, P.outline, x + 3, y - 15, 10, 11)
  px(c, P.white, x + 4, y - 14, 8, 9)
  px(c, P.outline, x + 7, y - 4, 2, 2)
  px(c, P.flag, x + 7, y - 13, 2, 5)
  px(c, P.flag, x + 7, y - 7, 2, 1)
}

/** Gold trophy on a plinth, shown on the patio once every card is collected. */
export function drawTrophy(c: Ctx, x: number, y: number, frame: number) {
  px(c, P.shadow, x + 3, y + 14, 11, 2)
  px(c, P.outline, x + 3, y + 10, 10, 5)
  px(c, P.trunk, x + 4, y + 11, 8, 3)
  px(c, P.outline, x + 2, y - 4, 12, 9)
  px(c, '#f8d030', x + 3, y - 3, 10, 7)
  px(c, '#fff4a0', x + 4, y - 3, 2, 5)
  px(c, '#c89a10', x + 10, y - 3, 2, 7)
  px(c, P.outline, x, y - 3, 2, 4)
  px(c, P.outline, x + 14, y - 3, 2, 4)
  px(c, P.outline, x + 6, y + 5, 4, 5)
  px(c, '#f8d030', x + 7, y + 5, 2, 5)
  if (frame) {
    px(c, P.white, x + 13, y - 7, 1, 3)
    px(c, P.white, x + 12, y - 6, 3, 1)
  }
}

/**
 * A 5×5 swatch of one tile type (3×3 in the middle, rough around it) painted by the real
 * tile painters, so edges and corners show. Used by the Behind the Build page.
 */
export function renderTilePatch(type: T, frame = 0): HTMLCanvasElement {
  const N = 5
  const at = (x: number, y: number): T => {
    if (x < 0 || y < 0 || x >= N || y >= N) return T.Grass
    const inner = x >= 1 && x <= 3 && y >= 1 && y <= 3
    if (type === T.Bridge || type === T.Stone) return inner ? (x === 2 ? type : T.Water) : T.Grass
    if (type === T.Mat) return y === 2 && (x === 1 || x === 2) ? T.Mat : T.Grass
    return inner ? type : T.Grass
  }
  const mini: CourseMap = { tiles: new Uint8Array(0), at, passable: () => true, targets: [] }
  const canvas = document.createElement('canvas')
  canvas.width = N * TILE
  canvas.height = N * TILE
  const c = canvas.getContext('2d')!
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) paintTile(c, mini, x, y, frame)
  return canvas
}
