import { buildMap, findPath, readingSpots, T, TILE, MAP_W, MAP_H, type CourseMap, type Target } from './map'
import { drawBubble, drawFlag, drawTrophy, renderCourse } from './tiles'
import { buildCartFrames, buildGolferFrames, buildRobotFrames, TEAM_COLORS, type Dir } from './sprites'
import { allPins, ROBOT, SPAWN, TEAM, TROPHY, type Pt } from './layout'
import { P } from './palette'

/** Milliseconds per tile for each way of getting around. */
const SPEED = {
  walk: 130,
  run: 72, // after holding a direction for a few steps, or with Shift
  stroll: 95, // short click-to-walk trips
  cart: 45, // long trips ride the golf cart
}
const RUN_AFTER_STEPS = 3
const CART_MIN_TILES = 10
const DIRS: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const KEYMAP: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

export interface EngineEvents {
  /** The sign, board or character within reach, or null. */
  onNear(target: Target | null): void
  /** The golfer read or talked to something (A button, or walked up after a tap). */
  onInteract(target: Target): void
}

export interface Engine {
  resize(viewW: number, viewH: number): void
  setPaused(paused: boolean): void
  setTrophy(show: boolean): void
  /** Hole cards collected, for gold pins on the minimap. */
  setCollected(holes: Set<number>): void
  /** Draw a live minimap into this canvas each frame (null to detach). */
  attachMinimap(canvas: HTMLCanvasElement | null, pxPerTile: number): void
  hold(dir: Dir, down: boolean): void
  pressA(): void
  /** Walk to a hole's sign and read it. */
  goToHole(hole: number): void
  /** Draw the whole course at 1× into a canvas (for the map overview). Returns the golfer's tile. */
  drawOverview(target: HTMLCanvasElement): Pt
  destroy(): void
}

/** One flat colour per tile type for the minimap. */
const MINI: Record<number, string> = {
  [T.Grass]: P.grass,
  [T.Fairway]: P.fairway,
  [T.Slope]: P.fairway,
  [T.Green]: P.greenAlt,
  [T.Tee]: P.fairwayAlt,
  [T.Sand]: P.sand,
  [T.Water]: P.water,
  [T.Stone]: P.rock,
  [T.Bridge]: P.bridge,
  [T.Tree]: P.treeDark,
  [T.Gorse]: '#2f6a2a',
  [T.Rock]: P.rock,
  [T.Path]: P.path,
  [T.House]: P.roof,
  [T.Flower]: P.grass,
  [T.Patio]: '#d9cba8',
  [T.Range]: '#62b444',
  [T.Mat]: '#2f6b3a',
  [T.Fence]: '#e0e0d8',
  [T.Dune]: '#c9c477',
}

const sameTarget = (a: Target | null, b: Target | null) => a?.kind === b?.kind && a?.index === b?.index

export function createEngine(canvas: HTMLCanvasElement, events: EngineEvents, reducedMotion: boolean): Engine {
  const ctx = canvas.getContext('2d')!
  const map: CourseMap = buildMap()
  const layers = [renderCourse(map, 0), renderCourse(map, 1)]
  const frames = buildGolferFrames()
  const cart = buildCartFrames()
  const robot = buildRobotFrames()
  const team = TEAM_COLORS.map((swap) => buildGolferFrames(swap).down[0])
  const pins = allPins()

  let viewW = 20
  let viewH = 12
  let paused = false
  let trophy = false
  let raf = 0
  let last = performance.now()
  let clock = 0
  let camX = 0
  let camY = 0
  let collected = new Set<number>()
  let mini: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; base: HTMLCanvasElement; px: number } | null = null
  const signTiles = map.targets.filter((t) => t.target.kind === 'hole').map((t) => ({ index: t.target.index, at: t.tiles[0] }))

  const player = {
    tile: { ...SPAWN },
    from: { ...SPAWN },
    t: 1,
    dir: 'down' as Dir,
    stepCount: 0,
    stepMs: SPEED.walk,
    /** Consecutive steps taken while a direction is held (for run-on-hold). */
    heldSteps: 0,
    riding: false,
  }
  let shift = false
  const held: Dir[] = []
  let route: Pt[] = []
  let interactOnArrival: Target | null = null
  let near: Target | null = null

  /** Closest interactable whose footprint is within one tile (diagonals included). */
  const nearest = (): Target | null => {
    let best: Target | null = null
    let bestD = Infinity
    for (const t of map.targets)
      for (const p of t.tiles) {
        const dx = Math.abs(p.x - player.tile.x)
        const dy = Math.abs(p.y - player.tile.y)
        if (dx > 1 || dy > 1) continue
        if (dx + dy < bestD) {
          bestD = dx + dy
          best = t.target
        }
      }
    return best
  }

  const updateNear = () => {
    const n = nearest()
    if (!sameTarget(n, near)) {
      near = n
      events.onNear(n)
    }
  }

  const footprint = (target: Target) => map.targets.find((t) => sameTarget(t.target, target))!.tiles

  const face = (target: Target) => {
    const dist = (p: Pt) => Math.abs(p.x - player.tile.x) + Math.abs(p.y - player.tile.y)
    const best = footprint(target).reduce((a, b) => (dist(b) < dist(a) ? b : a))
    const dx = best.x - player.tile.x
    const dy = best.y - player.tile.y
    player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
  }

  const interact = (target: Target) => {
    face(target)
    events.onInteract(target)
  }

  const tryStep = (dir: Dir, ms: number) => {
    player.dir = dir
    const nx = player.tile.x + DIRS[dir].x
    const ny = player.tile.y + DIRS[dir].y
    if (!map.passable(nx, ny)) return false
    player.from = { ...player.tile }
    player.tile = { x: nx, y: ny }
    player.t = 0
    player.stepMs = ms
    player.stepCount++
    return true
  }

  /** Start following a route: long trips ride the cart, short ones are a brisk walk. */
  const follow = (path: Pt[], then: Target | null) => {
    route = path
    interactOnArrival = then
    player.riding = path.length > CART_MIN_TILES
  }

  const walkTo = (target: Target) => {
    const p = findPath(map, player.tile, readingSpots(footprint(target)))
    if (p !== null) follow(p, target)
  }

  const update = (dt: number) => {
    clock += dt
    if (paused) return
    if (player.t < 1) {
      player.t = Math.min(1, player.t + dt / player.stepMs)
      if (player.t < 1) return
      updateNear()
    }
    const dir = held[held.length - 1]
    if (dir) {
      // Steering by hand hops out of the cart and cancels any route.
      route = []
      interactOnArrival = null
      player.riding = false
      const running = shift || player.heldSteps >= RUN_AFTER_STEPS
      if (tryStep(dir, running ? SPEED.run : SPEED.walk)) player.heldSteps++
      return
    }
    player.heldSteps = 0
    const next = route.shift()
    if (next) {
      const dx = next.x - player.tile.x
      const dy = next.y - player.tile.y
      const stepDir = (Object.keys(DIRS) as Dir[]).find((d) => DIRS[d].x === dx && DIRS[d].y === dy)
      if (!stepDir || !tryStep(stepDir, player.riding ? SPEED.cart : SPEED.stroll)) route = []
      return
    }
    player.riding = false
    if (interactOnArrival !== null) {
      const target = interactOnArrival
      interactOnArrival = null
      interact(target)
    }
  }

  /** Characters, trophy and golfer, sorted by row so nearer sprites overlap farther ones. */
  const drawSprites = (
    c: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    golfer: Pt,
    golferFrame: HTMLCanvasElement,
  ) => {
    const blink = reducedMotion ? 0 : Math.floor(clock / 500) % 2
    const shadow = (x: number, y: number) => {
      c.fillStyle = P.shadow
      c.fillRect(x + 4, y + 14, 8, 2)
      c.fillRect(x + 3, y + 15, 10, 1)
    }
    const sprites: { y: number; draw: () => void }[] = [
      {
        y: ROBOT.at.y,
        draw: () => {
          const x = ROBOT.at.x * TILE - ox
          const y = ROBOT.at.y * TILE - oy
          shadow(x, y)
          c.drawImage(robot[blink], x, y - 2 - blink)
        },
      },
      ...TEAM.map((m, i) => ({
        y: m.at.y,
        draw: () => {
          const x = m.at.x * TILE - ox
          const y = m.at.y * TILE - oy
          // Idle chatter: each teammate bobs on a different beat.
          const bob = reducedMotion ? 0 : Math.floor(clock / 420 + i) % 3 === 0 ? 1 : 0
          shadow(x, y)
          c.drawImage(team[i], x, y - 2 - bob)
        },
      })),
      {
        y: golfer.y / TILE + 0.1,
        draw: () => {
          shadow(golfer.x - ox, golfer.y - oy)
          c.drawImage(golferFrame, golfer.x - ox, golfer.y - oy - 2)
        },
      },
    ]
    if (trophy)
      sprites.push({ y: TROPHY.y, draw: () => drawTrophy(c, TROPHY.x * TILE - ox, TROPHY.y * TILE - oy, blink) })
    sprites.sort((a, b) => a.y - b.y).forEach((s) => s.draw())
  }

  const drawFlags = (c: CanvasRenderingContext2D, ox: number, oy: number, frame: number) => {
    for (const p of pins) drawFlag(c, p.at.x * TILE - ox, p.at.y * TILE - oy, frame, p.color)
  }

  const render = () => {
    const vw = viewW * TILE
    const vh = viewH * TILE
    const ease = player.t
    const gx = Math.round((player.from.x + (player.tile.x - player.from.x) * ease) * TILE)
    const gy = Math.round((player.from.y + (player.tile.y - player.from.y) * ease) * TILE)
    camX = Math.round(Math.max(0, Math.min(MAP_W * TILE - vw, gx + TILE / 2 - vw / 2)))
    camY = Math.round(Math.max(0, Math.min(MAP_H * TILE - vh, gy + TILE / 2 - vh / 2)))

    const waveFrame = reducedMotion ? 0 : Math.floor(clock / 650) % 2
    ctx.drawImage(layers[waveFrame], camX, camY, vw, vh, 0, 0, vw, vh)
    drawFlags(ctx, camX, camY, reducedMotion ? 0 : Math.floor(clock / 260) % 2)

    // Alternate feet on each step; stand still between steps. On long trips, the cart.
    const frameIdx = player.t < 1 ? (player.stepCount % 2 ? 1 : 3) : 0
    drawSprites(ctx, camX, camY, { x: gx, y: gy }, player.riding ? cart[player.dir] : frames[player.dir][frameIdx])

    if (near !== null && !paused && player.t >= 1) drawBubble(ctx, gx - camX, gy - camY - 2)
    if (mini) drawMinimap(gx / TILE, gy / TILE)
  }

  /** Whole course in miniature: what's on screen, where the golfer is, which cards are collected. */
  const drawMinimap = (gx: number, gy: number) => {
    const { ctx: m, base, px: k } = mini!
    m.drawImage(base, 0, 0)
    for (const s of signTiles) {
      m.fillStyle = P.outline
      m.fillRect(s.at.x * k + 1, s.at.y * k - k, k * 2 + 2, k + 2)
      m.fillStyle = collected.has(s.index) ? '#f8d030' : P.white
      m.fillRect(s.at.x * k + 2, s.at.y * k - k + 1, k * 2, k)
    }
    m.strokeStyle = P.white
    m.lineWidth = 1
    m.strokeRect(
      Math.round((camX / TILE) * k) + 0.5,
      Math.round((camY / TILE) * k) + 0.5,
      Math.round(viewW * k) - 1,
      Math.round(viewH * k) - 1,
    )
    if (reducedMotion || Math.floor(clock / 400) % 2 === 0) {
      const x = Math.round(gx * k)
      const y = Math.round(gy * k)
      m.fillStyle = P.outline
      m.fillRect(x - 1, y - 1, k + 2, k + 2)
      m.fillStyle = P.flag
      m.fillRect(x, y, k, k)
    }
  }

  const buildMinimapBase = (k: number) => {
    const base = document.createElement('canvas')
    base.width = MAP_W * k
    base.height = MAP_H * k
    const b = base.getContext('2d')!
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        b.fillStyle = MINI[map.at(x, y)] ?? P.grass
        b.fillRect(x * k, y * k, k, k)
      }
    return base
  }

  const loop = (now: number) => {
    // rAF timestamps can predate our first performance.now(); never let the clock run backwards.
    const dt = Math.max(0, Math.min(50, now - last))
    last = now
    update(dt)
    render()
    raf = requestAnimationFrame(loop)
  }

  const isA = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z'

  const onKeyDown = (e: KeyboardEvent) => {
    shift = e.shiftKey
    const dir = KEYMAP[e.key]
    if (dir) {
      e.preventDefault()
      if (!held.includes(dir)) held.push(dir)
    } else if (isA(e)) {
      e.preventDefault()
      if (!e.repeat) engine.pressA()
    }
  }
  const onKeyUp = (e: KeyboardEvent) => {
    shift = e.shiftKey
    const dir = KEYMAP[e.key]
    if (dir) {
      const i = held.indexOf(dir)
      if (i >= 0) held.splice(i, 1)
    }
  }
  const onBlur = () => {
    held.length = 0
    shift = false
  }

  const onPointerDown = (e: PointerEvent) => {
    if (paused) return
    const rect = canvas.getBoundingClientRect()
    const scale = rect.width / canvas.width
    const tx = Math.floor(((e.clientX - rect.left) / scale + camX) / TILE)
    const ty = Math.floor(((e.clientY - rect.top) / scale + camY) / TILE)
    const hit = map.targets.find((t) => t.tiles.some((p) => p.x === tx && p.y === ty))
    const onGolfer = tx === player.tile.x && (ty === player.tile.y || ty === player.tile.y - 1)
    if (onGolfer && player.t >= 1) {
      const n = nearest()
      if (n !== null) interact(n)
    } else if (hit) walkTo(hit.target)
    else {
      const p = findPath(map, player.tile, [{ x: tx, y: ty }])
      if (p) follow(p, null)
    }
  }

  canvas.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('blur', onBlur)
  canvas.addEventListener('pointerdown', onPointerDown)

  const engine: Engine = {
    resize(w, h) {
      viewW = w
      viewH = h
      canvas.width = w * TILE
      canvas.height = h * TILE
      ctx.imageSmoothingEnabled = false
      render() // resizing clears the canvas; repaint without waiting for a frame
    },
    setPaused(p) {
      paused = p
      held.length = 0
      if (p) {
        route = []
        interactOnArrival = null
        player.riding = false
      }
    },
    setTrophy(show) {
      trophy = show
    },
    setCollected(set) {
      collected = new Set(set)
    },
    attachMinimap(target, k) {
      if (!target) {
        mini = null
        return
      }
      target.width = MAP_W * k
      target.height = MAP_H * k
      mini = { canvas: target, ctx: target.getContext('2d')!, base: buildMinimapBase(k), px: k }
      render()
    },
    hold(dir, down) {
      const i = held.indexOf(dir)
      if (down && i < 0) held.push(dir)
      if (!down && i >= 0) held.splice(i, 1)
    },
    pressA() {
      if (paused || player.t < 1) return
      const n = nearest()
      if (n !== null) interact(n)
    },
    goToHole(hole) {
      walkTo({ kind: 'hole', index: hole })
    },
    drawOverview(target) {
      target.width = MAP_W * TILE
      target.height = MAP_H * TILE
      const c = target.getContext('2d')!
      c.imageSmoothingEnabled = false
      c.drawImage(layers[0], 0, 0)
      drawFlags(c, 0, 0, 0)
      drawSprites(c, 0, 0, { x: player.tile.x * TILE, y: player.tile.y * TILE }, frames.down[0])
      return { ...player.tile }
    },
    destroy() {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onPointerDown)
    },
  }

  engine.resize(viewW, viewH)
  updateNear()
  raf = requestAnimationFrame(loop)
  return engine
}
