import { useEffect, useRef } from 'react'
import { holeLabel, holes } from '../../data/course'
import type { Engine } from './game/engine'
import { MAP_H, MAP_W, SIGN_TILES, SPOTS } from './game/layout'

interface Props {
  engine: Engine
  collected: Set<number>
  onGo(hole: number): void
  onClose(): void
}

/** Full-course overview at 1×: every hole, with pins you can pick to walk there. */
export default function CourseMap({ engine, collected, onGo, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const youRef = useRef<HTMLSpanElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const you = engine.drawOverview(canvasRef.current!)
    if (youRef.current) {
      youRef.current.style.left = `${((you.x + 0.5) / MAP_W) * 100}%`
      youRef.current.style.top = `${(you.y / MAP_H) * 100}%`
    }
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button')
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Listen from the next tick: the keypress that opened the map (M) is still bubbling
    // up to document right now, and would otherwise close it again immediately.
    const id = window.setTimeout(() => document.addEventListener('keydown', onKey))
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus({ preventScroll: true })
    }
  }, [engine, onClose])

  return (
    <div className="card-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="course-map retro-window" role="dialog" aria-modal="true" aria-labelledby="map-title">
        <header className="course-map__head">
          <h2 id="map-title">COURSE MAP</h2>
          <p>Pick a hole to walk there.</p>
          <button ref={closeRef} type="button" className="card__close" onClick={onClose} aria-label="Close map">
            ✕
          </button>
        </header>
        <div className="course-map__body">
          <div className="course-map__frame">
            <canvas ref={canvasRef} className="course-map__canvas" aria-hidden="true" />
            <span ref={youRef} className="course-map__you" aria-hidden="true">
              YOU
            </span>
            {holes.map((h, i) => {
              const s = SPOTS[h.slug].sign
              return (
                <button
                  key={h.slug}
                  type="button"
                  className={collected.has(i) ? 'course-map__pin course-map__pin--done' : 'course-map__pin'}
                  style={{
                    left: `${((s.x + SIGN_TILES / 2) / MAP_W) * 100}%`,
                    top: `${((s.y - 0.4) / MAP_H) * 100}%`,
                  }}
                  onClick={() => onGo(i)}
                  aria-label={`${holeLabel(h)}: ${h.name}, ${h.topic}${collected.has(i) ? ', collected' : ''}`}
                >
                  {h.badge}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
