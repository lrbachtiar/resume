import { useEffect, useRef } from 'react'
import { holeLabel, type Hole } from '../../data/course'
import HoleBody from './HoleBody'
import SwingMeter from './SwingMeter'

interface Props {
  hole: Hole
  roundComplete: boolean
  onClose(): void
}

/** Modal hole card: the professional content for one hole, in a retro window. */
export default function HoleCard({ hole, roundComplete, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button')
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
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="card-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="card retro-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-title"
      >
        <header className="card__head">
          <p className="card__hole">
            {holeLabel(hole)}
            {hole.par ? ` · PAR ${hole.par}` : ''}
          </p>
          <h2 id="card-title" className="card__title">
            {hole.name}
          </h2>
          <p className="card__topic">{hole.topic}</p>
          <button ref={closeRef} type="button" className="card__close" onClick={onClose} aria-label="Close card">
            ✕
          </button>
        </header>
        <div className="card__body">
          <HoleBody hole={hole} roundComplete={roundComplete} />
        </div>
        {hole.kind !== 'clubhouse' && (
          <footer className="card__foot">
            <p className="card__foot-label">{hole.par ? 'Tee off? (optional)' : 'Hit a practice ball? (optional)'}</p>
            <SwingMeter par={hole.par ?? 4} />
          </footer>
        )}
      </div>
    </div>
  )
}
