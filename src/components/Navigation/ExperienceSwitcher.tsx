import { Link, NavLink, useLocation } from 'react-router-dom'
import './ExperienceSwitcher.css'

/** Persistent toggle between the two experiences, hidden on the landing page. */
export default function ExperienceSwitcher() {
  const pathname = useLocation().pathname.replace(/\/+$/, '') || '/'
  const isProject = pathname.startsWith('/projects/')
  if (pathname !== '/course' && pathname !== '/cv' && pathname !== '/build' && !isProject) return null

  const theme = pathname === '/cv' || isProject ? 'cv' : 'course'

  return (
    <nav className={`switcher switcher--${theme}`} aria-label="Switch experience">
      <Link to="/" className="switcher__home" aria-label="Back to the start">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M5 14V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 2.5l7 2.75L6 8z" fill="currentColor" />
        </svg>
      </Link>
      <NavLink to="/course" className="switcher__opt">
        Course
      </NavLink>
      <NavLink to="/cv" className="switcher__opt">
        CV
      </NavLink>
    </nav>
  )
}
