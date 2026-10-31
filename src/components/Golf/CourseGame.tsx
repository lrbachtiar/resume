import { useCallback, useEffect, useRef, useState } from 'react'
import { holeLabel, holes } from '../../data/course'
import { createEngine, type Engine } from './game/engine'
import type { Dir } from './game/sprites'
import { TILE, type Target } from './game/map'
import { TALKS } from './game/layout'
import CourseMap from './CourseMap'

interface Props {
  collected: Set<number>
  /** True while a hole card is open over the game. */
  cardOpen: boolean
  onOpenCard(hole: number): void
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Integer 2× pixels; as many tiles as fit the width. */
function layoutFor(width: number) {
  const scale = 2
  const cols = Math.max(9, Math.min(32, Math.floor(width / (TILE * scale))))
  const rows = width >= 900 ? 18 : 11
  return { scale, cols, rows }
}

/** What the dialog box says for a post, board or character. Hole signs open their card instead. */
function dialogFor(index: number) {
  const t = TALKS[index]
  return { name: t.title, text: t.text }
}

export default function CourseGame({ collected, cardOpen, onOpenCard }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const miniRef = useRef<HTMLCanvasElement>(null)
  // The engine is created once; read the latest card opener through a ref.
  const openCardRef = useRef(onOpenCard)
  openCardRef.current = onOpenCard
  const engineRef = useRef<Engine | null>(null)
  const [size, setSize] = useState({ scale: 2, cols: 20, rows: 12 })
  const [near, setNear] = useState<Target | null>(null)
  /** Index into TALKS of the character, post or board being read. */
  const [dialog, setDialog] = useState<number | null>(null)
  const [typed, setTyped] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  /** Return focus to the canvas after a dialog, card or map closes, only if it came from the canvas. */
  const refocusRef = useRef(false)
  const canvasFocused = () => document.activeElement === canvasRef.current

  useEffect(() => {
    const engine = createEngine(
      canvasRef.current!,
      {
        onNear: setNear,
        onInteract: (t) => {
          refocusRef.current = canvasFocused()
          if (t.kind === 'hole') {
            openCardRef.current(t.index)
            return
          }
          setTyped(0)
          setDialog(t.index)
        },
      },
      reducedMotion(),
    )
    engineRef.current = engine
    return () => engine.destroy()
  }, [])

  useEffect(() => {
    engineRef.current?.setTrophy(collected.size === holes.length)
    engineRef.current?.setCollected(collected)
  }, [collected])

  // Minimap: 3 px per tile on desktop, 2 on narrow screens.
  const miniPx = size.rows >= 18 ? 3 : 2
  useEffect(() => {
    engineRef.current?.attachMinimap(miniRef.current, miniPx)
    return () => engineRef.current?.attachMinimap(null, miniPx)
  }, [miniPx])

  useEffect(() => {
    const el = wrapRef.current!
    const ro = new ResizeObserver(([entry]) => {
      const next = layoutFor(entry.contentRect.width)
      setSize(next)
      engineRef.current?.resize(next.cols, next.rows)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const busy = dialog !== null || cardOpen || mapOpen
  useEffect(() => {
    engineRef.current?.setPaused(busy)
    if (!busy && refocusRef.current) {
      refocusRef.current = false
      canvasRef.current?.focus({ preventScroll: true })
    }
  }, [busy])

  const box = dialog !== null ? dialogFor(dialog) : null
  const text = box?.text ?? ''

  // Typewriter for the dialog box.
  useEffect(() => {
    if (dialog === null) return
    if (reducedMotion()) {
      setTyped(text.length)
      return
    }
    if (typed >= text.length) return
    const id = window.setTimeout(() => setTyped((t) => t + 1), 18)
    return () => window.clearTimeout(id)
  }, [dialog, typed, text.length])

  const advance = useCallback(() => {
    if (dialog === null) return
    if (typed < text.length) {
      setTyped(text.length)
      return
    }
    setDialog(null)
  }, [dialog, typed, text.length])

  const dismiss = useCallback(() => setDialog(null), [])

  useEffect(() => {
    if (dialog === null) return
    const onKey = (e: KeyboardEvent) => {
      // Only keys aimed at the game: leave the scorecard, map and page alone.
      if (e.repeat || !(e.target instanceof Node) || !wrapRef.current?.contains(e.target)) return
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        advance()
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        dismiss()
      }
    }
    // Listen from the next tick so the keypress that opened the dialog doesn't also skip it.
    const id = window.setTimeout(() => window.addEventListener('keydown', onKey))
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [dialog, advance, dismiss])

  const onCanvasKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'm' || e.key === 'M') && dialog === null && !e.repeat) {
      e.preventDefault()
      refocusRef.current = true
      setMapOpen(true)
    }
  }

  const closeMap = useCallback(() => setMapOpen(false), [])
  const goFromMap = useCallback((i: number) => {
    setMapOpen(false)
    engineRef.current?.setPaused(false)
    engineRef.current?.goToHole(i)
  }, [])

  const pressA = () => (dialog !== null ? advance() : engineRef.current?.pressA())
  const pressB = () => dismiss()
  const pad = (dir: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      engineRef.current?.hold(dir, true)
    },
    onPointerUp: () => engineRef.current?.hold(dir, false),
    onPointerLeave: () => engineRef.current?.hold(dir, false),
    onPointerCancel: () => engineRef.current?.hold(dir, false),
  })

  const hud =
    near === null
      ? 'THE 19TH HOLE G.C.'
      : near.kind === 'hole'
        ? `${holeLabel(holes[near.index])} · ${holes[near.index].topic.toUpperCase()}`
        : TALKS[near.index].title
  const width = size.cols * TILE * size.scale
  const height = size.rows * TILE * size.scale

  return (
    <div ref={wrapRef} className="game">
      <div className="game__frame" style={{ width }}>
        <div className="hud">
          <span className="hud__hole" aria-hidden="true">
            {hud}
          </span>
          <span className="hud__cards">
            <span aria-hidden="true">CARDS</span>
            <span className="hud__pips" aria-hidden="true">
              {holes.map((h, i) => (
                <span key={h.slug} className={collected.has(i) ? 'hud__pip hud__pip--on' : 'hud__pip'} />
              ))}
            </span>
            <span aria-hidden="true">
              {collected.size}/{holes.length}
            </span>
            <button type="button" className="hud__map" onClick={() => setMapOpen(true)} disabled={dialog !== null}>
              MAP
            </button>
          </span>
        </div>

        <div className="game__screen" style={{ height }}>
          <canvas
            ref={canvasRef}
            className="game__canvas"
            style={{ width, height }}
            tabIndex={0}
            onKeyDown={onCanvasKey}
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}
            role="application"
            aria-roledescription="game"
            aria-label="Golf course game. Use the arrow keys to walk, Enter to read a sign or talk, and M for the course map. Every hole is also listed in the scorecard below."
          />
          {!hasFocus && !busy && (
            <p className="game__start" aria-hidden="true">
              ▶ CLICK TO PLAY
            </p>
          )}
          <button
            type="button"
            className={box ? 'minimap minimap--hidden' : 'minimap'}
            onClick={() => {
              refocusRef.current = true
              setMapOpen(true)
            }}
            aria-label="Open the course map"
            tabIndex={-1}
          >
            <canvas ref={miniRef} className="minimap__canvas" aria-hidden="true" />
          </button>
          {box && (
            <div className="dialog" role="dialog" aria-live="polite" aria-label={box.name} onClick={advance}>
              <p className="dialog__name">{box.name}</p>
              <p className="dialog__text">
                {text.slice(0, typed)}
                <span className="visually-hidden">{text.slice(typed)}</span>
              </p>
              <div className="dialog__actions">
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    advance()
                  }}
                >
                  A: OK
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="game__hint" aria-hidden="true">
          <span>ARROWS / WASD: MOVE · HOLD OR SHIFT: RUN</span>
          <span>ENTER: READ / TALK</span>
          <span>M: MAP</span>
          <span className="game__hint-mouse">CLICK OR MAP: TRAVEL</span>
          <span className="game__hint-touch">TAP OR MAP: TRAVEL · HOLD: RUN · A: READ</span>
        </p>

        <div className="pad" aria-hidden="true">
          <div className="pad__dpad">
            <button type="button" tabIndex={-1} className="pad__btn pad__up" {...pad('up')}>
              ▲
            </button>
            <button type="button" tabIndex={-1} className="pad__btn pad__left" {...pad('left')}>
              ◀
            </button>
            <button type="button" tabIndex={-1} className="pad__btn pad__right" {...pad('right')}>
              ▶
            </button>
            <button type="button" tabIndex={-1} className="pad__btn pad__down" {...pad('down')}>
              ▼
            </button>
          </div>
          <div className="pad__ab">
            <button type="button" tabIndex={-1} className="pad__round pad__b" onClick={pressB}>
              B
            </button>
            <button type="button" tabIndex={-1} className="pad__round pad__a" onClick={pressA}>
              A
            </button>
          </div>
        </div>
      </div>

      {mapOpen && engineRef.current && (
        <CourseMap engine={engineRef.current} collected={collected} onGo={goFromMap} onClose={closeMap} />
      )}
    </div>
  )
}
