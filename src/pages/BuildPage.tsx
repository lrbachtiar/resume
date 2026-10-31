import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { P } from '../components/Golf/game/palette'
import { drawText, textWidth } from '../components/Golf/game/font'
import { buildMap, T, TILE } from '../components/Golf/game/map'
import { drawBubble, drawFlag, drawTrophy, renderCourse, renderTilePatch } from '../components/Golf/game/tiles'
import { buildGolferFrames, buildRobotFrames, TEAM_COLORS, type Dir } from '../components/Golf/game/sprites'
import { allPins, ROBOT, TEAM } from '../components/Golf/game/layout'
import SwingMeter from '../components/Golf/SwingMeter'
import '../components/Golf/Golf.css'
import '../components/Build/Build.css'

type Draw = (c: CanvasRenderingContext2D) => void

/** A canvas drawn at game resolution and shown at an integer scale with crisp pixels. */
function Pixels({ w, h, scale, draw, label }: { w: number; h: number; scale: number; draw: Draw; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!.getContext('2d')!
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, w, h)
    draw(c)
  }, [w, h, draw])
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className="px-canvas"
      style={{ width: w * scale, height: h * scale }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

/** Cycles through frames on a timer (static when reduced motion is on). */
function useTick(ms: number, count: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % count), ms)
    return () => window.clearInterval(id)
  }, [ms, count])
  return i
}

// Built once on first visit: the real course, sprites and painters the game uses.
let assets: ReturnType<typeof buildAssets> | null = null
function buildAssets() {
  const map = buildMap()
  const layers = [renderCourse(map, 0), renderCourse(map, 1)]
  const golfer = buildGolferFrames()
  const team = TEAM_COLORS.map((s) => buildGolferFrames(s).down[0])
  const robot = buildRobotFrames()
  // A full course frame with flags and characters, for cropping scenes.
  const scene = document.createElement('canvas')
  scene.width = layers[0].width
  scene.height = layers[0].height
  const c = scene.getContext('2d')!
  c.drawImage(layers[0], 0, 0)
  for (const p of allPins()) drawFlag(c, p.at.x * TILE, p.at.y * TILE, 0, p.color)
  c.drawImage(robot[0], ROBOT.at.x * TILE, ROBOT.at.y * TILE - 2)
  TEAM.forEach((m, i) => c.drawImage(team[i], m.at.x * TILE, m.at.y * TILE - 2))
  return { scene, golfer, team, robot }
}
const getAssets = () => (assets ??= buildAssets())

const PALETTE_GROUPS: { name: string; keys: (keyof typeof P)[] }[] = [
  { name: 'Turf', keys: ['grass', 'grassDark', 'grassLight', 'fairway', 'fairwayAlt', 'green', 'greenAlt', 'teeEdge'] },
  { name: 'Water & sand', keys: ['water', 'waterDark', 'waterLight', 'foam', 'sand', 'sandDark', 'sandLight'] },
  { name: 'Trees & rock', keys: ['tree', 'treeDark', 'treeLight', 'trunk', 'rock', 'rockDark', 'rockLight', 'snow'] },
  { name: 'Built', keys: ['path', 'pathDark', 'bridge', 'bridgeDark', 'wall', 'wallShade', 'roof', 'roofDark', 'window', 'door'] },
  { name: 'Accents', keys: ['flag', 'flagDark', 'flowerRed', 'flowerYellow', 'white', 'outline'] },
]

const TILES: { t: T; name: string; note: string }[] = [
  { t: T.Grass, name: 'Rough', note: 'Seeded tufts, never the same twice' },
  { t: T.Fairway, name: 'Fairway', note: '8px mowing stripes, rounded edges' },
  { t: T.Green, name: 'Green', note: '4px stripes, finer cut' },
  { t: T.Tee, name: 'Tee box', note: 'Markers face the green' },
  { t: T.Slope, name: 'Slope', note: 'Terraces on ML Mountain' },
  { t: T.Sand, name: 'Bunker', note: 'Speckled, rimmed' },
  { t: T.Water, name: 'Water', note: 'Two-frame shimmer, foam edge' },
  { t: T.Bridge, name: 'Bridge', note: 'Planks follow the crossing' },
  { t: T.Stone, name: 'Stepping stones', note: 'Crossing the burn' },
  { t: T.Path, name: 'Cart path', note: 'Pebbled, edged' },
  { t: T.Tree, name: 'Tree', note: 'Lit from the top-left' },
  { t: T.Gorse, name: 'Gorse', note: 'Links hazard, blocks the way' },
  { t: T.Dune, name: 'Dune', note: 'Marram grass tufts' },
  { t: T.Rock, name: 'Rock', note: 'Snow caps on the peaks' },
  { t: T.Flower, name: 'Flower bed', note: 'By the clubhouse and hole 1' },
  { t: T.Patio, name: 'Patio', note: 'Staggered flagstones' },
  { t: T.Range, name: 'Range turf', note: 'Yardage bands and stray balls' },
  { t: T.Mat, name: 'Hitting mat', note: 'Basket and teed-up ball' },
  { t: T.Fence, name: 'Range net', note: 'Posts and netting' },
]

const SCENES: { name: string; note: string; x: number; y: number; w: number; h: number }[] = [
  { name: 'Clubhouse & patio', note: 'The 19th hole: contact. A trophy appears here once every card is collected.', x: 2, y: 1, w: 15, h: 9 },
  { name: 'Driving range', note: 'Education. One target per qualification, further out for each.', x: 16, y: 1, w: 32, h: 10 },
  { name: 'Hole 2: Career history', note: 'A yardage post for every year a new role began, read straight from the experience data.', x: 10, y: 11, w: 36, h: 9 },
  { name: 'Hole 3: Data pipelines', note: 'The pipeline crosses the fairway twice on its way to the data lake.', x: 46, y: 1, w: 17, h: 22 },
  { name: 'Hole 5: Applied AI', note: 'Bunkers wired like a neural network, and a robot caddie on the tee.', x: 25, y: 25, w: 22, h: 10 },
  { name: 'Hole 6: Leading teams', note: 'Links golf: pot bunkers, gorse, dunes, stepping stones across the burn, and the team.', x: 4, y: 29, w: 28, h: 10 },
  { name: 'Hole 7: Projects', note: 'One hole, four greens. The flagship is on the island.', x: 12, y: 18, w: 34, h: 12 },
  { name: 'Hole 4: Machine learning', note: 'A dogleg around the ridge, terraced like gradient descent.', x: 44, y: 21, w: 19, h: 18 },
]

const GLYPHS = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', "0123456789.-'&/"]

function WalkCycle({ dir }: { dir: Dir }) {
  const i = useTick(160, 4)
  const frame = getAssets().golfer[dir][i]
  return <Pixels w={16} h={16} scale={5} draw={(c) => c.drawImage(frame, 0, 0)} label={`Golfer walking ${dir}`} />
}

function Robot() {
  const i = useTick(500, 2)
  const frame = getAssets().robot[i]
  return <Pixels w={16} h={16} scale={5} draw={(c) => c.drawImage(frame, 0, 0)} label="Robo-caddie" />
}

function Water() {
  const i = useTick(650, 2)
  return <Pixels w={80} h={80} scale={2} draw={(c) => c.drawImage(renderTilePatch(T.Water, i), 0, 0)} label="Water animation" />
}

function Flag({ color }: { color: string }) {
  const i = useTick(260, 2)
  return <Pixels w={24} h={28} scale={4} draw={(c) => drawFlag(c, 4, 14, i, color)} label="Pin flag" />
}

export default function BuildPage() {
  const a = getAssets()
  const dirs: Dir[] = ['down', 'up', 'left', 'right']

  return (
    <div className="course build">
      <header className="course__header">
        <Link to="/course" className="course__brand">
          ◀ BACK TO THE COURSE
        </Link>
        <h1 className="course__title">BEHIND THE BUILD</h1>
        <p className="course__lede">
          Every pixel on the course is drawn in code, with no image files: a 16×16 tile grid, a
          limited palette and three typefaces. This page renders the real game assets.
        </p>
      </header>

      <main className="build__main">
        <section className="build__section retro-window" aria-labelledby="b-palette">
          <h2 id="b-palette" className="build__h2">
            01 · PALETTE
          </h2>
          <p className="build__lede">A deliberately small set. Every colour on the canvas comes from here.</p>
          {PALETTE_GROUPS.map((g) => (
            <div key={g.name} className="build__group">
              <h3 className="build__h3">{g.name}</h3>
              <ul className="swatches">
                {g.keys.map((k) => (
                  <li key={k} className="swatch">
                    <span className="swatch__chip" style={{ background: P[k] }} />
                    <span className="swatch__name">{k}</span>
                    <span className="swatch__hex">{P[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="build__section retro-window" aria-labelledby="b-type">
          <h2 id="b-type" className="build__h2">
            02 · TYPOGRAPHY
          </h2>
          <p className="build__lede">Three faces, each with one job.</p>

          <div className="type-row">
            <div className="type-row__meta">
              <h3 className="build__h3">Press Start 2P</h3>
              <p>Titles, HUD, buttons. Short strings only.</p>
            </div>
            <div className="type-row__samples">
              {[40, 22, 14, 10, 8].map((s) => (
                <p key={s} style={{ fontFamily: 'var(--px-font)', fontSize: s, lineHeight: 1.4 }}>
                  <span className="type-size">{s}px</span> PLAY THE COURSE
                </p>
              ))}
            </div>
          </div>

          <div className="type-row">
            <div className="type-row__meta">
              <h3 className="build__h3">VT323</h3>
              <p>Body text in dialogs and hole cards. Readable at length.</p>
            </div>
            <div className="type-row__samples">
              {[26, 22, 20].map((s) => (
                <p key={s} style={{ fontFamily: 'var(--vt-font)', fontSize: s, lineHeight: 1.15 }}>
                  <span className="type-size">{s}px</span> Mind the pipeline: it crosses the fairway twice.
                </p>
              ))}
            </div>
          </div>

          <div className="type-row">
            <div className="type-row__meta">
              <h3 className="build__h3">In-world 4×6</h3>
              <p>A custom bitmap alphabet for signs, boards and posts, drawn pixel by pixel on the canvas. Shown at 4×.</p>
            </div>
            <div className="type-row__samples">
              <Pixels
                w={textWidth(GLYPHS[2]) + 8}
                h={GLYPHS.length * 9 + 5}
                scale={4}
                label="Pixel font glyph sheet"
                draw={(c) => {
                  c.fillStyle = P.wall
                  c.fillRect(0, 0, 200, 200)
                  GLYPHS.forEach((row, i) => drawText(c, row, 4, 4 + i * 9, P.outline))
                }}
              />
            </div>
          </div>
        </section>

        <section className="build__section retro-window" aria-labelledby="b-sprites">
          <h2 id="b-sprites" className="build__h2">
            03 · SPRITES
          </h2>
          <p className="build__lede">16×16 pixel strings with a 1px outline. Shown at 5×.</p>

          <h3 className="build__h3">The golfer: walk cycle</h3>
          <ul className="sprite-grid">
            {dirs.map((d) => (
              <li key={d}>
                <WalkCycle dir={d} />
                <span>{d}</span>
              </li>
            ))}
          </ul>

          <h3 className="build__h3">Frames (stand, step, stand, step)</h3>
          <ul className="sprite-grid sprite-grid--frames">
            {dirs.flatMap((d) =>
              a.golfer[d].map((f, i) => (
                <li key={d + i}>
                  <Pixels w={16} h={16} scale={3} draw={(c) => c.drawImage(f, 0, 0)} />
                  <span>
                    {d} {i + 1}
                  </span>
                </li>
              )),
            )}
          </ul>

          <h3 className="build__h3">Cast</h3>
          <ul className="sprite-grid">
            <li>
              <Robot />
              <span>Robo-caddie</span>
            </li>
            {a.team.map((f, i) => (
              <li key={i}>
                <Pixels w={16} h={16} scale={5} draw={(c) => c.drawImage(f, 0, 0)} label={`Teammate ${i + 1}`} />
                <span>Teammate {i + 1}</span>
              </li>
            ))}
            <li>
              <Pixels w={16} h={22} scale={5} draw={(c) => drawTrophy(c, 0, 6, 1)} label="Trophy" />
              <span>Trophy</span>
            </li>
            <li>
              <Pixels w={16} h={20} scale={5} draw={(c) => drawBubble(c, 0, 18)} label="Interaction bubble" />
              <span>"!" bubble</span>
            </li>
          </ul>

          <h3 className="build__h3">Pin flags</h3>
          <ul className="sprite-grid">
            {[
              ['Holes', P.flag],
              ['Range', '#f8d030'],
              ['FairwayPlan', '#e8402c'],
              ['Beanmarkd', '#8b5a2b'],
              ['Ferry', '#3a78e0'],
              ['Optimiser', '#8a4ae0'],
            ].map(([n, col]) => (
              <li key={n}>
                <Flag color={col} />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="build__section retro-window" aria-labelledby="b-tiles">
          <h2 id="b-tiles" className="build__h2">
            04 · TILES
          </h2>
          <p className="build__lede">
            Each swatch is painted by the game’s own tile code, with rough around it so edges and corners show. Shown at 2×.
          </p>
          <ul className="tile-grid">
            {TILES.map((tile) => (
              <li key={tile.name}>
                {tile.t === T.Water ? (
                  <Water />
                ) : (
                  <Pixels w={80} h={80} scale={2} draw={(c) => c.drawImage(renderTilePatch(tile.t), 0, 0)} />
                )}
                <strong>{tile.name}</strong>
                <span>{tile.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="build__section retro-window" aria-labelledby="b-scenes">
          <h2 id="b-scenes" className="build__h2">
            05 · HOLE DESIGN
          </h2>
          <p className="build__lede">Each hole’s layout tells its topic’s story. Crops of the real course, at 1×.</p>
          <ul className="scene-grid">
            {SCENES.map((s) => (
              <li key={s.name}>
                <div className="scene-frame">
                  <Pixels
                    w={s.w * TILE}
                    h={s.h * TILE}
                    scale={1}
                    label={s.name}
                    draw={(c) => c.drawImage(a.scene, s.x * TILE, s.y * TILE, s.w * TILE, s.h * TILE, 0, 0, s.w * TILE, s.h * TILE)}
                  />
                </div>
                <strong>{s.name}</strong>
                <span>{s.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="build__section retro-window" aria-labelledby="b-ui">
          <h2 id="b-ui" className="build__h2">
            06 · INTERFACE
          </h2>
          <p className="build__lede">HTML on top of the canvas, so text stays sharp, selectable and accessible.</p>

          <h3 className="build__h3">Buttons</h3>
          <div className="ui-row">
            <button type="button" className="pixel-btn">
              A: Open card
            </button>
            <button type="button" className="pixel-btn pixel-btn--ghost">
              B: Not now
            </button>
            <span className="choice__cta-demo">▶ PRESS START</span>
          </div>

          <h3 className="build__h3">Dialog box</h3>
          <div className="ui-demo">
            <div className="dialog dialog--static">
              <p className="dialog__name">HOLE 3 · DATA VALLEY</p>
              <p className="dialog__text">Mind the pipeline: it crosses the fairway twice on its way to the data lake.</p>
            </div>
          </div>

          <h3 className="build__h3">HUD</h3>
          <div className="ui-demo ui-demo--dark">
            <div className="hud">
              <span className="hud__hole">HOLE 5 · APPLIED AI</span>
              <span className="hud__cards">
                CARDS
                <span className="hud__pips">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} className={i < 4 ? 'hud__pip hud__pip--on' : 'hud__pip'} />
                  ))}
                </span>
                4/9
                <span className="hud__map">MAP</span>
              </span>
            </div>
          </div>

          <h3 className="build__h3">Swing meter (try it)</h3>
          <div className="ui-demo ui-demo--card">
            <SwingMeter par={4} />
          </div>
        </section>
      </main>
    </div>
  )
}
