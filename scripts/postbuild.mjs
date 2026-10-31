/**
 * After `vite build`: give every route its own index.html so GitHub Pages serves
 * /cv, /course and /build with HTTP 200 (and route-specific titles for link previews).
 * 404.html remains as the fallback for anything else.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SITE = 'https://lrbachtiar.github.io/resume/'
const html = readFileSync('dist/index.html', 'utf8')

const routes = {
  cv: {
    title: 'CV · Luqman Bachtiar · Data Engineering & AI',
    description:
      'Data Engineering Manager in Auckland. Experience, selected projects, skills and education, with a downloadable PDF.',
  },
  course: {
    title: 'Play the course · Luqman Bachtiar',
    description: 'A retro pixel-art golf course built from my career. Walk the course, read the signs, collect the cards.',
  },
  'projects/fairwayplan': {
    title: 'FairwayPlan · Luqman Bachtiar',
    description: 'Case study: an optimiser that plans multi-day golf trips around New Zealand. Try the demo.',
  },
  'projects/beanmarkd': {
    title: 'Beanmarkd · Luqman Bachtiar',
    description: 'Case study: a social app for specialty coffee, built around freshness. Try the demo.',
  },
  'projects/ferry': {
    title: 'Ferry · Luqman Bachtiar',
    description: 'Case study: realistic, privacy-safe patient data for testing healthcare systems.',
  },
  'projects/manufacturing-optimiser': {
    title: 'Manufacturing optimiser · Luqman Bachtiar',
    description: 'Case study: matching a meat processor’s production to seasonal demand, explained in plain language.',
  },
  build: {
    title: 'Behind the build · Luqman Bachtiar',
    description: 'How the golf course is made: palette, typography, sprites and tiles, rendered from the real game code.',
  },
}

const swap = (source, pattern, value) => {
  if (!pattern.test(source)) throw new Error(`postbuild: ${pattern} not found in index.html`)
  return source.replace(pattern, value)
}

for (const [route, meta] of Object.entries(routes)) {
  const url = `${SITE}${route}`
  let page = html
  page = swap(page, /<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
  page = swap(page, /(<meta name="description" content=")[^"]*(")/, `$1${meta.description}$2`)
  page = swap(page, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  page = swap(page, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  page = swap(page, /(<meta property="og:title" content=")[^"]*(")/, `$1${meta.title}$2`)
  page = swap(page, /(<meta property="og:description" content=")[^"]*(")/, `$1${meta.description}$2`)
  mkdirSync(`dist/${route}`, { recursive: true })
  writeFileSync(`dist/${route}/index.html`, page)
}

copyFileSync('dist/index.html', 'dist/404.html')
console.log(`postbuild: wrote ${Object.keys(routes).map((r) => `${r}/index.html`).join(', ')} and 404.html`)
