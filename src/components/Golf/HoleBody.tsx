import { Link } from 'react-router-dom'
import type { Hole } from '../../data/course'
import { profile } from '../../data/profile'
import { experience } from '../../data/experience'
import { projects, statusLabel } from '../../data/projects'
import { caseStudyFor } from '../../data/caseStudies'
import { skills } from '../../data/skills'
import { education } from '../../data/education'

const pdfHref = `${import.meta.env.BASE_URL}LuqmanBachtiar.pdf`

/** Hole-card content, rendered from the shared career data. */
export default function HoleBody({ hole, roundComplete }: { hole: Hole; roundComplete: boolean }) {
  const c = hole.content
  switch (c.kind) {
    case 'profile':
      return (
        <>
          <p className="card__lead">
            {profile.currentRole}, {profile.currentCompany}.
          </p>
          {profile.summary.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="card__muted">
            {profile.location} · {profile.workRights}
          </p>
          <p className="card__muted">Degrees and research are down at the driving range.</p>
        </>
      )

    case 'education':
      return (
        <>
          <ul className="card__projects">
            {education.map((q) => (
              <li key={q.title}>
                <p className="card__project-head">
                  <strong>{q.title}</strong>
                  <span className="card__badge">{q.start ? `${q.start}–${q.end}` : q.end}</span>
                </p>
                <p className="card__muted">
                  {q.institution}, {q.location}
                </p>
                <ul className="card__list">
                  {q.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )

    case 'experience':
      return (
        <>
          <ol className="card__timeline">
            {experience
              .filter((e) => !e.earlier)
              .flatMap((e) =>
                e.roles.map((r) => (
                  <li key={e.id + r.title}>
                    <span className="card__date">
                      {r.start} – {r.end}
                    </span>
                    <strong>{e.company}</strong>
                    <span>{r.title}</span>
                  </li>
                )),
              )}
          </ol>
          <p className="card__muted">
            Earlier:{' '}
            {experience
              .filter((e) => e.earlier)
              .map((e) => e.company)
              .join(', ')}
            .
          </p>
          <p>
            <Link to="/cv#experience">Read every role in full on the CV →</Link>
          </p>
        </>
      )

    case 'topic': {
      const items = experience.flatMap((e) =>
        e.roles.flatMap((r) =>
          r.highlights
            .filter((h) => h.topics.includes(c.topic))
            .map((h) => ({ h, where: `${e.company} · ${r.start.slice(-4)}` })),
        ),
      )
      return (
        <>
          <ul className="card__list card__list--highlights">
            {items.map(({ h, where }) => (
              <li key={h.text}>
                {h.text} <span className="card__where">{where}</span>
              </li>
            ))}
          </ul>
          {skills
            .filter((g) => c.skillGroups.includes(g.label))
            .map((g) => (
              <div key={g.label} className="card__skills">
                <h3 className="card__h3">{g.label}</h3>
                <ul className="card__chips">
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
        </>
      )
    }

    case 'projects':
      return (
        <ul className="card__projects">
          {projects.map((p) => (
            <li key={p.id}>
              <p className="card__project-head">
                <strong>{p.name}</strong>
                <span className="card__badge">{statusLabel[p.status]}</span>
              </p>
              <p>{p.oneLiner}</p>
              <p className="card__muted">{p.description}</p>
              {p.stack.length > 0 && <p className="card__stack">{p.stack.join(' · ')}</p>}
              <p className="card__links">
                <Link to={`/projects/${p.id}`}>Case study →</Link>
                {caseStudyFor(p.id)?.demo && (
                  <a href={`${import.meta.env.BASE_URL}${caseStudyFor(p.id)!.demo}`}>Try the demo</a>
                )}
                {p.url && (
                  <a href={p.url} rel="noopener" target="_blank">
                    Visit ↗
                  </a>
                )}
                {p.repo && (
                  <a href={p.repo} rel="noopener" target="_blank">
                    Source ↗
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )

    case 'contact':
      return (
        <>
          {roundComplete && (
            <p className="card__trophy" role="status">
              ★ ROUND COMPLETE ★ All cards collected, and the trophy is on the patio. Thanks for playing the full round.
              The first drink is on me.
            </p>
          )}
          <p>
            I’m always happy to talk about data platforms, applied AI, or building and leading
            engineering teams.
          </p>
          <ul className="card__contact">
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            {profile.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} rel="noopener" target="_blank">
                  {l.label} ↗
                </a>
              </li>
            ))}
            <li>
              <a href={pdfHref} download>
                Download the PDF résumé
              </a>
            </li>
          </ul>
        </>
      )
  }
}
