import { Link } from 'react-router-dom'
import CoursePreview from '../components/Landing/CoursePreview'
import { loadCollected } from '../components/Golf/progress'
import { profile } from '../data/profile'
import { holes, playableHoles } from '../data/course'
import '../components/Landing/Landing.css'

const cvSections = ['Experience', 'Selected projects', 'Skills', 'Education']

export default function LandingPage() {
  const cards = loadCollected().size

  return (
    <div className="landing">
      <header className="landing__intro">
        <div className="landing__lockup">
          <p className="mono-label landing__eyebrow">The 19th Hole</p>
          <h1 className="landing__title">Every career has a story.</h1>
          <p className="landing__ask">How would you like to explore mine?</p>
        </div>
        <div className="landing__who">
          <p className="landing__name">{profile.name}</p>
          <p className="landing__headline">{profile.headline}</p>
          <p className="mono-label landing__where">{profile.location}</p>
        </div>
      </header>

      <main className="landing__choices">
        <Link to="/course" className="choice choice--course">
          <div className="choice__body">
            <p className="choice__meta">Option 01 · Interactive</p>
            <h2 className="choice__title">Play the course</h2>
            <p className="choice__desc">
              A retro golf world built from my career. Walk the course, read each hole’s sign and
              collect its card: experience, projects and leadership.
            </p>
            <p className="choice__stats">
              {playableHoles} holes · driving range · no game required
            </p>
            <span className="choice__cta">
              <span aria-hidden="true">▶</span> Press start
            </span>
          </div>
          <div className="choice__screen">
            <p className="choice__hud" aria-hidden="true">
              <span>The 19th Hole G.C.</span>
              <span>
                Cards {cards}/{holes.length}
              </span>
            </p>
            <CoursePreview />
          </div>
        </Link>

        <Link to="/cv" className="choice choice--cv">
          <div className="choice__body">
            <p className="mono-label choice__meta">Option 02 · Conventional</p>
            <h2 className="choice__title">Read the CV</h2>
            <p className="choice__desc">
              A clean, single-page résumé: everything that matters in thirty seconds, with a PDF to
              download.
            </p>
            <ol className="choice__toc" aria-hidden="true">
              {cvSections.map((s, i) => (
                <li key={s}>
                  <span className="choice__toc-num">{String(i + 1).padStart(2, '0')}</span>
                  {s}
                </li>
              ))}
            </ol>
            <span className="choice__cta">
              Open the CV <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      </main>

      <footer className="landing__footer">
        <p>Two ways to explore. One career. Your choice.</p>
        <ul className="landing__links">
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          {profile.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} rel="noopener">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link to="/build">Behind the build</Link>
          </li>
          <li>
            <a href={`${import.meta.env.BASE_URL}LuqmanBachtiar.pdf`} download>
              PDF résumé
            </a>
          </li>
        </ul>
      </footer>
    </div>
  )
}
