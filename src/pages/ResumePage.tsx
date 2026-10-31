import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { experience } from '../data/experience'
import { Link } from 'react-router-dom'
import { projects, statusLabel } from '../data/projects'
import { caseStudyFor } from '../data/caseStudies'
import { skills } from '../data/skills'
import { education } from '../data/education'
import '../components/Resume/Resume.css'

const pdfHref = `${import.meta.env.BASE_URL}LuqmanBachtiar.pdf`

export default function ResumePage() {
  const main = experience.filter((e) => !e.earlier)
  const earlier = experience.filter((e) => e.earlier)

  // Show the slim pinned bar once the full header has scrolled out of view.
  const headerRef = useRef<HTMLElement>(null)
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="cv">
      <a className="skip-link" href="#experience">
        Skip to experience
      </a>
      <div className={`cv-bar${pinned ? ' cv-bar--shown' : ''}`} aria-hidden={!pinned}>
        <div className="cv-bar__inner">
          <p className="cv-bar__who">
            <strong>{profile.name}</strong>
            <span className="cv-bar__headline">{profile.headline}</span>
          </p>
          <nav className="cv-bar__nav" aria-label="CV sections">
            <a href="#experience" tabIndex={pinned ? 0 : -1}>Experience</a>
            <a href="#projects" tabIndex={pinned ? 0 : -1}>Projects</a>
            <a href="#skills" tabIndex={pinned ? 0 : -1}>Skills</a>
            <a href="#education" tabIndex={pinned ? 0 : -1}>Education</a>
          </nav>
          <div className="cv-bar__actions">
            <a className="cv-bar__email" href={`mailto:${profile.email}`} tabIndex={pinned ? 0 : -1}>
              {profile.email}
            </a>
            <a className="cv-bar__pdf" href={pdfHref} download tabIndex={pinned ? 0 : -1}>
              Download PDF
            </a>
          </div>
        </div>
      </div>
      <header className="cv__header" ref={headerRef}>
        <Link to="/" className="cv__home">
          ← The 19th Hole
        </Link>
        <h1 className="cv__name">{profile.name}</h1>
        <p className="cv__headline">{profile.headline}</p>
        <p className="cv__role">
          {profile.currentRole}, {profile.currentCompany}
        </p>
        <ul className="cv__contact">
          <li>{profile.location}</li>
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
            <a href={pdfHref} download>
              Download PDF
            </a>
          </li>
        </ul>
      </header>

      <main>
        <section className="cv__section" aria-labelledby="summary">
          <h2 id="summary" className="cv__h2">
            Summary
          </h2>
          <div className="cv__prose">
            {profile.summary.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <p className="cv__muted">{profile.workRights}</p>
          </div>
        </section>

        <section className="cv__section" aria-labelledby="experience">
          <h2 id="experience" className="cv__h2">
            Experience
          </h2>
          <ol className="cv__list">
            {main.map((e) => (
              <li key={e.id} className="cv__entry">
                <h3 className="cv__org">
                  {e.company} <span className="cv__muted">· {e.location}</span>
                </h3>
                {e.roles.map((r) => (
                  <div key={r.title} className="cv__role-block">
                    <p className="cv__role-line">
                      <span>{r.title}</span>
                      <span className="cv__dates">
                        {r.start} – {r.end}
                      </span>
                    </p>
                    <ul className="cv__bullets">
                      {r.highlights.map((h) => (
                        <li key={h.text}>{h.text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </li>
            ))}
          </ol>
          <h3 className="cv__subhead">Earlier career</h3>
          <ul className="cv__compact">
            {earlier.flatMap((e) =>
              e.roles.map((r) => (
                <li key={e.id + r.title}>
                  <span>
                    {r.title}, {e.company}
                  </span>
                  <span className="cv__dates">
                    {r.start} – {r.end}
                  </span>
                </li>
              )),
            )}
          </ul>
        </section>

        <section className="cv__section" aria-labelledby="projects">
          <h2 id="projects" className="cv__h2">
            Selected projects
          </h2>
          <ul className="cv__list">
            {projects.map((p) => (
              <li key={p.id} className="cv__entry">
                <h3 className="cv__org">
                  <Link to={`/projects/${p.id}`}>{p.name}</Link> <span className="cv__status">{statusLabel[p.status]}</span>
                </h3>
                <p>{p.oneLiner}</p>
                <p className="cv__muted">{p.description}</p>
                {p.stack.length > 0 && <p className="cv__stack">{p.stack.join(' · ')}</p>}
                <ul className="cv__project-links">
                  <li>
                    <Link to={`/projects/${p.id}`}>Case study →</Link>
                  </li>
                  {caseStudyFor(p.id)?.demo && (
                    <li>
                      <a href={`${import.meta.env.BASE_URL}${caseStudyFor(p.id)!.demo}`}>Try the demo</a>
                    </li>
                  )}
                  {p.url && (
                    <li>
                      <a href={p.url} rel="noopener">
                        Visit ↗
                      </a>
                    </li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="cv__section" aria-labelledby="skills">
          <h2 id="skills" className="cv__h2">
            Skills
          </h2>
          <dl className="cv__skills">
            {skills.map((g) => (
              <div key={g.label}>
                <dt>{g.label}</dt>
                <dd>{g.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="cv__section" aria-labelledby="education">
          <h2 id="education" className="cv__h2">
            Education
          </h2>
          <ul className="cv__list">
            {education.map((q) => (
              <li key={q.title} className="cv__entry">
                <p className="cv__role-line">
                  <span className="cv__org">{q.title}</span>
                  <span className="cv__dates">{q.start ? `${q.start} – ${q.end}` : q.end}</span>
                </p>
                <p className="cv__muted">{q.institution}</p>
                <ul className="cv__bullets">
                  {q.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="cv__footer">
        <a href={pdfHref} download>
          Download the PDF résumé
        </a>
      </footer>
    </div>
  )
}
