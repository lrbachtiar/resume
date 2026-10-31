import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { profile } from '../../data/profile'
import { projects } from '../../data/projects'

const titles: Record<string, string> = {
  '/': `${profile.name} · ${profile.headline}`,
  '/course': `Play the course · ${profile.name}`,
  '/cv': `CV · ${profile.name}`,
  '/build': `Behind the build · ${profile.name}`,
}

/** Scroll to top and update the document title on navigation. */
export default function RouteEffects() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Direct visits arrive as /cv/ (GitHub Pages adds the slash for folder pages).
    const path = pathname.replace(/\/+$/, '') || '/'
    const project = path.startsWith('/projects/') && projects.find((p) => `/projects/${p.id}` === path)
    document.title = project ? `${project.name} · ${profile.name}` : (titles[path] ?? `Lost ball · ${profile.name}`)
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
