import { Link, useParams } from 'react-router-dom'
import { projects, statusLabel } from '../data/projects'
import { caseStudyFor } from '../data/caseStudies'
import { profile } from '../data/profile'
import NotFoundPage from './NotFoundPage'
import '../components/Resume/Resume.css'
import '../components/Resume/Project.css'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

/** A project case study, in the CV's editorial style. */
export default function ProjectPage() {
  const { id } = useParams()
  const project = projects.find((p) => p.id === id)
  const study = id ? caseStudyFor(id) : undefined
  if (!project || !study) return <NotFoundPage />

  return (
    <div className="cv project">
      <header className="cv__header">
        <Link to="/cv#projects" className="project__back">
          ← Selected projects
        </Link>
        <h1 className="cv__name project__name">
          {project.name} <span className="cv__status">{statusLabel[project.status]}</span>
        </h1>
        <p className="cv__headline">{project.oneLiner}</p>
        <ul className="cv__contact project__links">
          {study.demo && (
            <li>
              {/* The demo is a separate static site under this one: a full page load, not a route. */}
              <a className="project__cta" href={asset(study.demo)}>
                Try the demo →
              </a>
            </li>
          )}
          {project.url && (
            <li>
              <a href={project.url} rel="noopener">
                Visit ↗
              </a>
            </li>
          )}
          {project.repo && (
            <li>
              <a href={project.repo} rel="noopener">
                Source ↗
              </a>
            </li>
          )}
        </ul>
      </header>

      <main>
        <section className="cv__section" aria-labelledby="problem">
          <h2 id="problem" className="cv__h2">
            The problem
          </h2>
          <p className="cv__prose">{study.problem}</p>
        </section>

        <section className="cv__section" aria-labelledby="built">
          <h2 id="built" className="cv__h2">
            What I built
          </h2>
          <ul className="cv__bullets project__bullets">
            {study.built.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        {study.screenshots.length > 0 && (
          <section className="cv__section" aria-labelledby="screens">
            <h2 id="screens" className="cv__h2">
              Screens
            </h2>
            <div className="project__shots">
              {study.screenshots.map((s) => (
                <figure key={s.src}>
                  <img src={asset(s.src)} alt={s.caption} loading="lazy" />
                  <figcaption>{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="cv__section" aria-labelledby="stack">
          <h2 id="stack" className="cv__h2">
            Under the hood
          </h2>
          <p className="cv__prose">{study.stack}</p>
          {project.stack.length > 0 && <p className="cv__stack">{project.stack.join(' · ')}</p>}
        </section>

        <section className="cv__section" aria-labelledby="status">
          <h2 id="status" className="cv__h2">
            Status
          </h2>
          <p className="cv__prose">{study.status}</p>
        </section>
      </main>

      <footer className="cv__footer">
        <Link to="/cv">← Back to the CV</Link>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </footer>
    </div>
  )
}
