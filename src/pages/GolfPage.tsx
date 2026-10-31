import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { holes } from '../data/course'
import { profile } from '../data/profile'
import CourseGame from '../components/Golf/CourseGame'
import HoleCard from '../components/Golf/HoleCard'
import { loadCollected, saveCollected } from '../components/Golf/progress'
import '../components/Golf/Golf.css'

export default function GolfPage() {
  const [collected, setCollected] = useState(loadCollected)
  const [card, setCard] = useState<number | null>(null)

  const openCard = useCallback((i: number) => {
    setCard(i)
    setCollected((prev) => {
      if (prev.has(i)) return prev
      const next = new Set(prev).add(i)
      saveCollected(next)
      return next
    })
  }, [])
  const closeCard = useCallback(() => setCard(null), [])

  return (
    <div className="course">
      <a className="skip-link" href="#scorecard">
        Skip to the scorecard
      </a>
      <header className="course__header">
        <Link to="/" className="course__brand">
          ◀ THE 19TH HOLE
        </Link>
        <h1 className="course__title">PLAY THE COURSE</h1>
        <p className="course__lede">
          {profile.name} · {profile.headline}. Walk the course and read each hole’s sign to collect
          its card. Or skip the golf and use the scorecard below.
        </p>
      </header>

      <main>
        <CourseGame collected={collected} cardOpen={card !== null} onOpenCard={openCard} />

        <section id="scorecard" className="scorecard retro-window" aria-labelledby="scorecard-title">
          <div className="scorecard__head">
            <h2 id="scorecard-title">SCORECARD</h2>
            <p>
              {collected.size}/{holes.length} CARDS
            </p>
          </div>
          <ol className="scorecard__list">
            {holes.map((h, i) => (
              <li key={h.slug}>
                <button type="button" className="scorecard__row" onClick={() => openCard(i)}>
                  <span className="scorecard__num">{h.badge.padStart(2, '0')}</span>
                  <span className="scorecard__main">
                    <span className="scorecard__name">{h.name}</span>
                    <span className="scorecard__teaser">{h.teaser}</span>
                  </span>
                  <span className="scorecard__topic">{h.topic}</span>
                  <span className="scorecard__par">{h.par ? `PAR ${h.par}` : h.kind === 'range' ? 'PRACTICE' : 'CLUBHOUSE'}</span>
                  <span className={collected.has(i) ? 'scorecard__stamp scorecard__stamp--on' : 'scorecard__stamp'}>
                    {collected.has(i) ? '★' : '·'}
                    <span className="visually-hidden">{collected.has(i) ? ' collected' : ' not yet collected'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="course__fallback">
            In a hurry? <Link to="/cv">Read the CV instead</Link>. Same career, no golf.
          </p>
          <p className="course__fallback course__fallback--build">
            Curious how it’s made? <Link to="/build">Behind the build: sprites, tiles and type →</Link>
          </p>
        </section>
      </main>

      {card !== null && (
        <HoleCard hole={holes[card]} roundComplete={collected.size === holes.length} onClose={closeCard} />
      )}
    </div>
  )
}
